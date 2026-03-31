import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Plus, Trash2, RefreshCw, Zap } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  courseRepository,
  levelRepository,
  sectionRepository,
} from "@/repositories";
import type {
  Course,
  Level,
  Section,
  SectionType,
  LearningPlanContent,
  CheatSheetContent,
  ResourcesContent,
  QuizConfigContent,
  QuizQuestion,
} from "@/repositories/types";
import Modal from "@/components/Modal";

// ─── Section type meta ────────────────────────────────────────────────────────
const SECTION_META: Record<
  SectionType,
  { label: string; emoji: string; desc: string }
> = {
  "learning-plan": {
    label: "Learning Plan",
    emoji: "📚",
    desc: "Rencana belajar 20 jam, 10 sesi",
  },
  "cheat-sheet": {
    label: "Cheat Sheet",
    emoji: "📄",
    desc: "Ringkasan konsep utama + tips",
  },
  resources: {
    label: "Resources",
    emoji: "🔍",
    desc: "5 sumber belajar terkurasi",
  },
  "quiz-config": {
    label: "Quiz",
    emoji: "🧪",
    desc: "Generate quiz segar, tidak disimpan",
  },
};

const ALL_SECTION_TYPES: SectionType[] = [
  "learning-plan",
  "cheat-sheet",
  "resources",
  "quiz-config",
];

// ─── Content renderers ────────────────────────────────────────────────────────
function LearningPlanView({ content }: { content: LearningPlanContent }) {
  return (
    <div className="space-y-3">
      {content.sesi.map((s) => (
        <div
          key={s.nomor}
          className="border border-[#e4e4e7] rounded-xl p-4 bg-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-semibold text-[#71717a] bg-[#fafafa] px-2 py-0.5 rounded">
              Sesi {s.nomor}
            </span>
            <span className="text-xs text-[#71717a]">
              {s.durasi_menit} menit
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-900 mb-1">
            {s.kegiatan}
          </p>
          <p className="text-xs text-[#52525b] mb-1">
            <span className="font-medium">Resource:</span> {s.resource}
          </p>
          <p className="text-xs text-[#52525b]">
            <span className="font-medium">Review:</span> {s.review}
          </p>
        </div>
      ))}
    </div>
  );
}

function CheatSheetView({ content }: { content: CheatSheetContent }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#fafafa] rounded-xl p-4">
        <p className="text-sm text-zinc-900 leading-relaxed">
          {content.ringkasan}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wide mb-2">
          Konsep Utama
        </p>
        <div className="space-y-2">
          {content.konsep.map((k, i) => (
            <div
              key={i}
              className="border border-[#e4e4e7] rounded-xl p-3 bg-white"
            >
              <p className="text-sm font-semibold text-zinc-900">{k.nama}</p>
              <p className="text-xs text-[#52525b] mt-0.5">{k.penjelasan}</p>
              {k.contoh && (
                <p className="text-xs text-[#71717a] mt-1 italic">
                  Contoh: {k.contoh}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      {content.tips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wide mb-2">
            Tips
          </p>
          <ul className="space-y-1">
            {content.tips.map((t, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-900">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.kesalahanUmum.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wide mb-2">
            Kesalahan Umum
          </p>
          <ul className="space-y-1">
            {content.kesalahanUmum.map((k, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-900">
                <span className="text-red-400 flex-shrink-0">✗</span>
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResourcesView({ content }: { content: ResourcesContent }) {
  return (
    <div className="space-y-2">
      {content.resources.map((r, i) => (
        <div
          key={i}
          className="border border-[#e4e4e7] rounded-xl p-4 bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{r.nama}</p>
              <span className="inline-block text-[10px] bg-[#fafafa] text-[#71717a] px-1.5 py-0.5 rounded mt-0.5">
                {r.jenis}
              </span>
              <p className="text-xs text-[#52525b] mt-1">{r.alasan}</p>
            </div>
            {r.link && (
              <a
                href={r.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex-shrink-0"
              >
                Buka →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Quiz Engine (in-page, fresh) ────────────────────────────────────────────
type QuizState = "idle" | "loading" | "playing" | "done";

function QuizEngine({
  courseTitle,
  levelName,
}: {
  courseTitle: string;
  levelName: string;
}) {
  const [state, setState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");

  const startQuiz = async () => {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/courses/generateQuiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseTitle, levelName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQuestions(data.questions);
      setCurrent(0);
      setSelected({});
      setRevealed(false);
      setState("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal generate quiz");
      setState("idle");
    }
  };

  const reset = () => {
    setState("idle");
    setQuestions([]);
    setSelected({});
    setRevealed(false);
    setCurrent(0);
  };

  if (state === "idle") {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-[#71717a] mb-4">
          Quiz di-generate fresh setiap kali — tidak disimpan.
        </p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={startQuiz}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Zap size={14} />
          Generate &amp; Mulai Quiz
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="text-center py-10">
        <div className="flex justify-center gap-1 mb-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-[#71717a] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-[#71717a]">Generating soal...</p>
      </div>
    );
  }

  if (state === "done") {
    const correct = questions.filter(
      (q) => selected[q.nomor] === q.jawaban,
    ).length;
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div>
        <div className="border border-[#e4e4e7] rounded-xl p-6 text-center mb-6">
          <p className="text-4xl font-bold text-zinc-900 mb-1">{pct}%</p>
          <p className="text-sm text-[#71717a]">
            {correct} dari {questions.length} benar
          </p>
          <button
            onClick={reset}
            className="mt-4 px-4 py-1.5 text-sm border border-[#e4e4e7] rounded-lg text-zinc-900 hover:bg-[#fafafa] transition-colors"
          >
            Ulangi
          </button>
        </div>
        <div className="space-y-3">
          {questions.map((q) => {
            const isRight = selected[q.nomor] === q.jawaban;
            return (
              <div
                key={q.nomor}
                className={`border rounded-xl p-4 ${
                  isRight
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p className="text-xs font-medium mb-2 text-zinc-900">
                  {isRight ? "✓" : "✗"} {q.nomor}. {q.pertanyaan}
                </p>
                {q.pilihan.map((p) => {
                  const l = p[0];
                  return (
                    <div
                      key={l}
                      className={`text-xs px-2 py-1 rounded ${
                        l === q.jawaban
                          ? "bg-green-100 text-green-700 font-medium"
                          : l === selected[q.nomor]
                            ? "bg-red-100 text-red-600 line-through"
                            : "text-[#52525b]"
                      }`}
                    >
                      {p}
                    </div>
                  );
                })}
                <p className="text-xs text-[#52525b] mt-2 italic">
                  💡 {q.penjelasan}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // state === "playing"
  const q = questions[current];
  const userAnswer = selected[q.nomor];
  const isLast = current === questions.length - 1;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-[#71717a] mb-2">
        <span>
          Soal {current + 1} / {questions.length}
        </span>
        <button
          onClick={reset}
          className="hover:text-zinc-900 transition-colors"
        >
          Batalkan
        </button>
      </div>
      <div className="h-1 bg-[#e4e4e7] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>
      <p className="text-sm font-medium text-zinc-900 mb-4 leading-relaxed">
        {q.nomor}. {q.pertanyaan}
      </p>
      <div className="space-y-2 mb-4">
        {q.pilihan.map((p) => {
          const l = p[0];
          const isSelected = userAnswer === l;
          const isCorrect = revealed && l === q.jawaban;
          const isWrong = revealed && isSelected && l !== q.jawaban;
          return (
            <button
              key={l}
              onClick={() =>
                !revealed && setSelected((s) => ({ ...s, [q.nomor]: l }))
              }
              disabled={revealed}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                isCorrect
                  ? "border-green-400 bg-green-50 text-green-700 font-medium"
                  : isWrong
                    ? "border-red-300 bg-red-50 text-red-600 line-through"
                    : isSelected
                      ? "border-indigo-600 bg-indigo-50 text-zinc-900 font-medium"
                      : "border-[#e4e4e7] text-zinc-900 hover:border-indigo-200 hover:bg-[#fafafa]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="bg-[#fafafa] rounded-xl px-3 py-2.5 mb-4 text-xs text-[#52525b]">
          💡 {q.penjelasan}
        </div>
      )}
      <div className="flex gap-2">
        {userAnswer && !revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-2 text-xs border border-[#e4e4e7] rounded-lg text-zinc-900 hover:bg-[#fafafa] transition-colors"
          >
            Lihat Jawaban
          </button>
        )}
        {(revealed || userAnswer) && (
          <button
            onClick={() => {
              if (isLast) {
                setState("done");
              } else {
                setCurrent((c) => c + 1);
                setRevealed(false);
              }
            }}
            className="flex-1 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isLast ? "Lihat Hasil" : "Soal Berikutnya →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LevelPage() {
  const router = useRouter();
  const { id: courseId, levelId } = router.query as {
    id: string;
    levelId: string;
  };

  const [course, setCourse] = useState<Course | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Creator: section management
  const [generating, setGenerating] = useState<string | null>(null); // sectionId
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedType, setSelectedType] =
    useState<SectionType>("learning-plan");
  const [addingSection, setAddingSection] = useState(false);
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

  // Expanded sections
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  const loadData = useCallback(async () => {
    if (!courseId || !levelId) return;
    const [c, l, ss] = await Promise.all([
      courseRepository.getById(courseId),
      levelRepository.getById(courseId, levelId),
      sectionRepository.getAllByLevelId(courseId, levelId),
    ]);
    if (!c || !l) {
      setNotFound(true);
      return;
    }
    setCourse(c);
    setLevel(l);
    setSections(ss);
  }, [courseId, levelId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCreator = !!userId && course?.creatorId === userId;

  const availableTypes = ALL_SECTION_TYPES.filter(
    (t) => !sections.some((s) => s.type === t),
  );

  const handleGenerate = async (section: Section) => {
    if (!course || !level) return;
    setGenerating(section.id);
    try {
      const res = await fetch("/api/courses/generateSection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: section.courseId,
          levelId: section.levelId,
          sectionId: section.id,
          type: section.type,
          courseTitle: course.title,
          levelName: level.name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === section.id
              ? { ...s, content: data.content, generatedAt: new Date() }
              : s,
          ),
        );
        setExpanded((prev) => new Set([...prev, section.id]));
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleAddSection = async () => {
    if (!courseId || !levelId) return;
    setAddingSection(true);
    const sectionId = await sectionRepository.create({
      courseId,
      levelId,
      type: selectedType,
    });
    setSections((prev) => [
      ...prev,
      {
        id: sectionId,
        courseId,
        levelId,
        type: selectedType,
        content: null,
        generatedAt: null,
      },
    ]);
    setShowAddSection(false);
    setAddingSection(false);
  };

  const handleDeleteSection = async () => {
    if (!deleteSection || !courseId || !levelId) return;
    setDeletingSection(true);
    await sectionRepository.delete(courseId, levelId, deleteSection.id);
    setSections((prev) => prev.filter((s) => s.id !== deleteSection.id));
    setDeleteSection(null);
    setDeletingSection(false);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#71717a]">Level tidak ditemukan.</p>
      </div>
    );
  }

  if (!course || !level) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#fafafa] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-10">
      {/* Breadcrumb */}
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-zinc-900 transition-colors mb-2"
      >
        <ArrowLeft size={13} />
        {course.title}
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{level.name}</h1>
          <p className="text-xs text-[#71717a] mt-0.5">{course.title}</p>
        </div>
        {isCreator && availableTypes.length > 0 && (
          <button
            onClick={() => {
              setSelectedType(availableTypes[0]);
              setShowAddSection(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e4e4e7] rounded-md text-zinc-900 hover:bg-[#fafafa] transition-colors flex-shrink-0"
          >
            <Plus size={12} />
            Tambah Section
          </button>
        )}
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#e4e4e7] rounded-xl">
          <p className="text-sm text-[#71717a]">
            {isCreator
              ? "Belum ada section. Tambah section untuk mulai generate konten."
              : "Belum ada konten di level ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const meta = SECTION_META[section.type];
            const isExpanded = expanded.has(section.id);
            const isGenerating = generating === section.id;
            const hasContent = !!section.content;

            return (
              <div
                key={section.id}
                className="border border-[#e4e4e7] rounded-xl overflow-hidden"
              >
                {/* Section header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-[#fafafa] transition-colors"
                  onClick={() => {
                    if (hasContent || section.type === "quiz-config") {
                      toggleExpand(section.id);
                    }
                  }}
                >
                  <span className="text-base">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-[#71717a]">{meta.desc}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCreator && (
                      <>
                        {section.type !== "quiz-config" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerate(section);
                            }}
                            disabled={isGenerating}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-40"
                            title={hasContent ? "Regenerate" : "Generate"}
                          >
                            {isGenerating ? (
                              <RefreshCw size={10} className="animate-spin" />
                            ) : (
                              <Zap size={10} />
                            )}
                            {isGenerating
                              ? "..."
                              : hasContent
                                ? "Regenerate"
                                : "Generate"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSection(section);
                          }}
                          className="p-1 text-[#71717a] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          aria-label="Hapus section"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                    {!isCreator &&
                      !hasContent &&
                      section.type !== "quiz-config" && (
                        <span className="text-[10px] text-[#71717a] bg-[#fafafa] px-2 py-0.5 rounded">
                          Belum digenerate
                        </span>
                      )}
                    {(hasContent || section.type === "quiz-config") && (
                      <span className="text-[#71717a] text-xs">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Section content */}
                {isExpanded && (
                  <div className="border-t border-[#e4e4e7] px-4 py-4 bg-[#fafafa]">
                    {section.type === "quiz-config" ? (
                      <QuizEngine
                        courseTitle={course.title}
                        levelName={level.name}
                      />
                    ) : hasContent ? (
                      <>
                        {section.type === "learning-plan" && (
                          <LearningPlanView
                            content={section.content as LearningPlanContent}
                          />
                        )}
                        {section.type === "cheat-sheet" && (
                          <CheatSheetView
                            content={section.content as CheatSheetContent}
                          />
                        )}
                        {section.type === "resources" && (
                          <ResourcesView
                            content={section.content as ResourcesContent}
                          />
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-[#71717a] text-center py-4">
                        Konten belum digenerate.
                        {isCreator && " Klik Generate di atas."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Section */}
      {showAddSection && (
        <Modal isOpen={showAddSection} onClose={() => setShowAddSection(false)}>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Tambah Section
          </h2>
          <div className="space-y-2 mb-4">
            {availableTypes.map((t) => {
              const meta = SECTION_META[t];
              return (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                    selectedType === t
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-[#e4e4e7] hover:bg-[#fafafa]"
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {meta.label}
                    </p>
                    <p className="text-xs text-[#71717a]">{meta.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleAddSection}
            disabled={addingSection}
            className="w-full py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {addingSection ? "Menambahkan..." : "Tambah Section"}
          </button>
        </Modal>
      )}

      {/* Modal: Delete Section */}
      {deleteSection && (
        <Modal isOpen={!!deleteSection} onClose={() => setDeleteSection(null)}>
          <h2 className="text-base font-semibold text-zinc-900 mb-2">
            Hapus Section?
          </h2>
          <p className="text-sm text-[#71717a] mb-6">
            Section <strong>{SECTION_META[deleteSection.type].label}</strong>{" "}
            dan kontennya akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteSection(null)}
              disabled={deletingSection}
              className="px-3 py-1.5 text-sm border border-[#e4e4e7] rounded-md text-zinc-900 hover:bg-[#fafafa] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteSection}
              disabled={deletingSection}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deletingSection ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
