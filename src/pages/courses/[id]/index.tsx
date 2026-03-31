import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Pencil,
  Check,
  X,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  courseRepository,
  levelRepository,
  sectionRepository,
  subscriptionRepository,
} from "@/repositories";
import type {
  Course,
  Level,
  Section,
  SectionType,
  LearningPlanContent,
  CheatSheetContent,
  ResourcesContent,
  QuizQuestion,
} from "@/repositories/types";
import Modal from "@/components/Modal";

// ─── Section meta ─────────────────────────────────────────────────────────────
const SECTION_META: Record<
  SectionType,
  { label: string; emoji: string; desc: string }
> = {
  "learning-plan": {
    label: "Learning Plan",
    emoji: "📚",
    desc: "Rencana belajar terstruktur",
  },
  "cheat-sheet": {
    label: "Cheat Sheet",
    emoji: "📄",
    desc: "Ringkasan konsep kunci",
  },
  resources: {
    label: "Resources",
    emoji: "🔍",
    desc: "Sumber belajar terkurasi",
  },
  "quiz-config": {
    label: "Quiz",
    emoji: "🧪",
    desc: "Uji pemahamanmu — fresh setiap kali",
  },
};

const ALL_SECTION_TYPES: SectionType[] = [
  "learning-plan",
  "cheat-sheet",
  "resources",
  "quiz-config",
];

// ─── Content viewers ──────────────────────────────────────────────────────────
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

// ─── Quiz Engine ──────────────────────────────────────────────────────────────
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
      <div className="text-center py-8">
        <p className="text-sm text-[#71717a] mb-4">
          Soal di-generate AI setiap kali — tidak disimpan, selalu segar.
        </p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={startQuiz}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Zap size={14} />
          Buat &amp; Mulai Kuis
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center gap-1 mb-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 bg-[#71717a] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-[#71717a]">AI sedang membuat soal...</p>
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
        <div className="border border-[#e4e4e7] rounded-2xl p-8 text-center mb-6 bg-white">
          <p className="text-5xl font-bold text-zinc-900 mb-1">{pct}%</p>
          <p className="text-sm text-[#71717a] mb-4">
            {correct} dari {questions.length} benar
          </p>
          <button
            onClick={reset}
            className="px-4 py-1.5 text-sm border border-[#e4e4e7] rounded-lg text-zinc-900 hover:bg-[#fafafa] transition-colors"
          >
            Coba Lagi
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

  // playing
  const q = questions[current];
  const userAnswer = selected[q.nomor];
  const isLast = current === questions.length - 1;

  return (
    <div>
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
      <div className="h-1.5 bg-[#e4e4e7] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
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
              className={`w-full text-left px-4 py-3 rounded-xl border text-xs transition-all ${
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-[#52525b]">
          💡 {q.penjelasan}
        </div>
      )}
      <div className="flex gap-2">
        {userAnswer && !revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-2.5 text-xs border border-[#e4e4e7] rounded-xl text-zinc-900 hover:bg-[#fafafa] transition-colors"
          >
            Lihat Jawaban
          </button>
        )}
        {(revealed || userAnswer) && (
          <button
            onClick={() => {
              if (isLast) setState("done");
              else {
                setCurrent((c) => c + 1);
                setRevealed(false);
              }
            }}
            className="flex-1 py-2.5 text-xs bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {isLast ? "Lihat Hasil →" : "Soal Berikutnya →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section accordion card ───────────────────────────────────────────────────
function SectionCard({
  section,
  course,
  level,
  isCreator,
  generating,
  onGenerate,
  onDelete,
}: {
  section: Section;
  course: Course;
  level: Level;
  isCreator: boolean;
  generating: string | null;
  onGenerate: (section: Section) => void;
  onDelete: (section: Section) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = SECTION_META[section.type];
  const hasContent = !!section.content;
  const isGenerating = generating === section.id;

  return (
    <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
        onClick={() => {
          if (hasContent || section.type === "quiz-config") {
            setExpanded((v) => !v);
          }
        }}
      >
        <span className="text-xl">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{meta.label}</p>
          <p className="text-[11px] text-[#71717a]">{meta.desc}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isCreator && (
            <>
              {section.type !== "quiz-config" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerate(section);
                  }}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
                  title={hasContent ? "Buat Ulang" : "Buat Konten"}
                >
                  {isGenerating ? (
                    <RefreshCw size={10} className="animate-spin" />
                  ) : (
                    <Zap size={10} />
                  )}
                  {isGenerating
                    ? "..."
                    : hasContent
                      ? "Buat Ulang"
                      : "Buat Konten"}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(section);
                }}
                className="p-1.5 text-[#71717a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Hapus section"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}

          {(hasContent || section.type === "quiz-config") && (
            <span className="text-[#71717a]">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </span>
          )}

          {!hasContent && section.type !== "quiz-config" && !isCreator && (
            <span className="text-[10px] text-[#71717a] bg-[#fafafa] px-2 py-0.5 rounded-full">
              Belum tersedia
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-[#e4e4e7] px-5 py-5 bg-[#fafafa]">
          {section.type === "quiz-config" ? (
            <QuizEngine courseTitle={course.title} levelName={level.name} />
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
                <ResourcesView content={section.content as ResourcesContent} />
              )}
            </>
          ) : (
            <p className="text-xs text-[#71717a] text-center py-4">
              Konten belum dibuat. {isCreator && 'Klik "Buat Konten" di atas.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [course, setCourse] = useState<Course | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [sectionsMap, setSectionsMap] = useState<Record<string, Section[]>>({});
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // level management
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevelName, setNewLevelName] = useState("");
  const [addingLevel, setAddingLevel] = useState(false);
  const [editLevelId, setEditLevelId] = useState<string | null>(null);
  const [editLevelName, setEditLevelName] = useState("");
  const [deleteLevel, setDeleteLevel] = useState<Level | null>(null);
  const [deletingLevel, setDeletingLevel] = useState(false);

  // course edit
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);

  // section management
  const [generating, setGenerating] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [selectedType, setSelectedType] =
    useState<SectionType>("learning-plan");
  const [addingSection, setAddingSection] = useState(false);
  const [deleteSection, setDeleteSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState(false);

  const isCreator = !!userId && course?.creatorId === userId;
  const activeLevel = levels.find((l) => l.id === activeLevelId) ?? null;
  const sections = activeLevelId ? (sectionsMap[activeLevelId] ?? []) : [];
  const availableTypes = ALL_SECTION_TYPES.filter(
    (t) => !sections.some((s) => s.type === t),
  );

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      courseRepository.getById(id),
      levelRepository.getAllByCourseId(id),
    ]).then(([c, ls]) => {
      if (!c) {
        setNotFound(true);
        return;
      }
      setCourse(c);
      setLevels(ls);
      if (ls.length > 0) setActiveLevelId(ls[0].id);
    });
  }, [id]);

  useEffect(() => {
    if (!userId || !id) return;
    subscriptionRepository
      .isSubscribed(userId, id)
      .then(setIsSubscribed)
      .catch(() => setIsSubscribed(false));
  }, [userId, id]);

  const loadSections = useCallback(
    async (levelId: string) => {
      if (!id) return;
      setSectionsLoading(true);
      const ss = await sectionRepository.getAllByLevelId(id, levelId);
      setSectionsMap((prev) => ({ ...prev, [levelId]: ss }));
      setSectionsLoading(false);
    },
    [id],
  );

  useEffect(() => {
    if (!activeLevelId || sectionsMap[activeLevelId]) return;
    loadSections(activeLevelId);
  }, [activeLevelId, sectionsMap, loadSections]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!userId || !id || !course) return;
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await subscriptionRepository.unsubscribe(userId, id);
        await courseRepository.decrementSubscribers(id);
        setIsSubscribed(false);
        setCourse((c) =>
          c ? { ...c, subscriberCount: Math.max(0, c.subscriberCount - 1) } : c,
        );
      } else {
        await subscriptionRepository.subscribe(userId, id);
        await courseRepository.incrementSubscribers(id);
        setIsSubscribed(true);
        setCourse((c) =>
          c ? { ...c, subscriberCount: c.subscriberCount + 1 } : c,
        );
      }
    } finally {
      setSubLoading(false);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim() || !id) return;
    setAddingLevel(true);
    const levelId = await levelRepository.create({
      courseId: id,
      name: newLevelName.trim(),
      order: levels.length,
    });
    await courseRepository.incrementLevelCount(id);
    const newLevel: Level = {
      id: levelId,
      courseId: id,
      name: newLevelName.trim(),
      order: levels.length,
    };
    setLevels((prev) => [...prev, newLevel]);
    setCourse((c) => (c ? { ...c, levelCount: c.levelCount + 1 } : c));
    setSectionsMap((prev) => ({ ...prev, [levelId]: [] }));
    setActiveLevelId(levelId);
    setNewLevelName("");
    setShowAddLevel(false);
    setAddingLevel(false);
  };

  const handleSaveLevel = async (levelId: string) => {
    if (!editLevelName.trim() || !id) return;
    await levelRepository.update(id, levelId, { name: editLevelName.trim() });
    setLevels((prev) =>
      prev.map((l) =>
        l.id === levelId ? { ...l, name: editLevelName.trim() } : l,
      ),
    );
    setEditLevelId(null);
  };

  const handleDeleteLevel = async () => {
    if (!deleteLevel || !id) return;
    setDeletingLevel(true);
    await levelRepository.delete(id, deleteLevel.id);
    await courseRepository.decrementLevelCount(id);
    const remaining = levels.filter((l) => l.id !== deleteLevel.id);
    setLevels(remaining);
    setCourse((c) =>
      c ? { ...c, levelCount: Math.max(0, c.levelCount - 1) } : c,
    );
    setSectionsMap((prev) => {
      const next = { ...prev };
      delete next[deleteLevel.id];
      return next;
    });
    setActiveLevelId(remaining[0]?.id ?? null);
    setDeleteLevel(null);
    setDeletingLevel(false);
  };

  const handleSaveCourse = async () => {
    if (!id) return;
    setSavingCourse(true);
    await courseRepository.update(id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setCourse((c) =>
      c ? { ...c, title: editTitle.trim(), description: editDesc.trim() } : c,
    );
    setShowEditCourse(false);
    setSavingCourse(false);
  };

  const handleGenerate = async (section: Section) => {
    if (!course || !activeLevel || !activeLevelId) return;
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
          levelName: activeLevel.name,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSectionsMap((prev) => ({
          ...prev,
          [activeLevelId]: (prev[activeLevelId] ?? []).map((s) =>
            s.id === section.id
              ? { ...s, content: data.content, generatedAt: new Date() }
              : s,
          ),
        }));
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleAddSection = async () => {
    if (!id || !activeLevelId) return;
    setAddingSection(true);
    const sectionId = await sectionRepository.create({
      courseId: id,
      levelId: activeLevelId,
      type: selectedType,
    });
    const newSection: Section = {
      id: sectionId,
      courseId: id,
      levelId: activeLevelId,
      type: selectedType,
      content: null,
      generatedAt: null,
    };
    setSectionsMap((prev) => ({
      ...prev,
      [activeLevelId]: [...(prev[activeLevelId] ?? []), newSection],
    }));
    setShowAddSection(false);
    setAddingSection(false);
  };

  const handleDeleteSection = async () => {
    if (!deleteSection || !id || !activeLevelId) return;
    setDeletingSection(true);
    await sectionRepository.delete(id, activeLevelId, deleteSection.id);
    setSectionsMap((prev) => ({
      ...prev,
      [activeLevelId]: (prev[activeLevelId] ?? []).filter(
        (s) => s.id !== deleteSection.id,
      ),
    }));
    setDeleteSection(null);
    setDeletingSection(false);
  };

  // ─── Render guards ────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm text-[#71717a]">Course tidak ditemukan.</p>
        <Link
          href="/explore"
          className="text-sm text-zinc-900 underline mt-2 inline-block"
        >
          Kembali ke Explore
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div>
        {/* Skeleton hero */}
        <div className="h-44 bg-gradient-to-br from-slate-100 to-indigo-100 animate-pulse" />
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
          <div className="h-8 w-64 bg-[#fafafa] rounded animate-pulse" />
          <div className="h-4 w-96 bg-[#fafafa] rounded animate-pulse" />
          <div className="mt-8 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 w-24 bg-[#fafafa] rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-100 border-b border-[#e4e4e7]">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-6">
          {/* Back link */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-zinc-900 transition-colors mb-5"
          >
            <ArrowLeft size={13} />
            Explore
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight">
                  {course.title}
                </h1>
                {isCreator && (
                  <button
                    onClick={() => {
                      setEditTitle(course.title);
                      setEditDesc(course.description);
                      setShowEditCourse(true);
                    }}
                    className="mt-1 p-1.5 rounded-md text-[#71717a] hover:text-zinc-900 hover:bg-white/60 transition-colors flex-shrink-0"
                    aria-label="Edit course"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {/* Creator row */}
              <div className="flex items-center gap-2 mt-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-zinc-900 flex-shrink-0">
                  {course.creatorName[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-[#52525b]">
                  {course.creatorName}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[#52525b] leading-relaxed max-w-xl">
                {course.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-[#71717a]">
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {course.subscriberCount} pengikut
                </span>
                <span>{course.levelCount} level</span>
              </div>
            </div>

            {/* Right: subscribe / creator badge */}
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              {userId && !isCreator && (
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className={`px-5 py-2 text-sm font-medium rounded-xl border transition-colors disabled:opacity-40 ${
                    isSubscribed
                      ? "bg-white border-[#e4e4e7] text-[#52525b] hover:border-red-200 hover:text-red-500"
                      : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {subLoading ? "..." : isSubscribed ? "✓ Diikuti" : "+ Ikuti"}
                </button>
              )}
              {isCreator && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-[#e4e4e7] rounded-xl text-xs text-[#52525b]">
                  ✏️ Pembuat
                </span>
              )}
              {!userId && (
                <span className="text-xs text-[#71717a]">
                  Login untuk mengikuti kursus
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab bar (level tabs) ── */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
            {levels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-0.5 flex-shrink-0"
              >
                {editLevelId === level.id ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      type="text"
                      value={editLevelName}
                      onChange={(e) => setEditLevelName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveLevel(level.id);
                        if (e.key === "Escape") setEditLevelId(null);
                      }}
                      className="w-28 px-2 py-0.5 text-xs border border-[#e4e4e7] rounded-md focus:outline-none bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveLevel(level.id)}
                      className="p-0.5 text-green-600"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setEditLevelId(null)}
                      className="p-0.5 text-[#71717a]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveLevelId(level.id)}
                    className={`group relative flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${
                      activeLevelId === level.id
                        ? "text-zinc-900 font-semibold"
                        : "text-[#71717a] hover:text-[#52525b]"
                    }`}
                  >
                    {level.name}
                    {/* Active underline */}
                    {activeLevelId === level.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                    {isCreator && (
                      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditLevelId(level.id);
                            setEditLevelName(level.name);
                          }}
                          className="p-0.5 rounded text-[#71717a] hover:text-zinc-900"
                        >
                          <Pencil size={10} />
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteLevel(level);
                          }}
                          className="p-0.5 rounded text-[#71717a] hover:text-red-500"
                        >
                          <Trash2 size={10} />
                        </span>
                      </span>
                    )}
                  </button>
                )}
              </div>
            ))}

            {isCreator && (
              <button
                onClick={() => setShowAddLevel(true)}
                className="flex items-center gap-1 px-3 py-3 text-xs text-[#71717a] hover:text-zinc-900 transition-colors flex-shrink-0"
              >
                <Plus size={12} />
                Tambah Level
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {levels.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#e4e4e7] rounded-2xl">
            <p className="text-sm text-[#71717a]">
              {isCreator
                ? 'Belum ada level. Klik "+ Tambah Level" di atas untuk mulai.'
                : "Course ini belum memiliki konten."}
            </p>
          </div>
        ) : !activeLevel ? null : (
          <>
            {/* Section header row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  {activeLevel.name}
                </h2>
                <p className="text-xs text-[#71717a] mt-0.5">
                  {sections.length} section tersedia
                </p>
              </div>
              {isCreator && availableTypes.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedType(availableTypes[0]);
                    setShowAddSection(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e4e4e7] rounded-xl text-zinc-900 hover:bg-[#fafafa] transition-colors"
                >
                  <Plus size={12} />
                  Tambah Section
                </button>
              )}
            </div>

            {/* Sections */}
            {sectionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-[#fafafa] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#e4e4e7] rounded-2xl">
                <p className="text-sm text-[#71717a]">
                  {isCreator
                    ? "Belum ada section. Tambah section untuk mulai generate konten."
                    : "Belum ada konten di level ini."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    course={course}
                    level={activeLevel}
                    isCreator={isCreator}
                    generating={generating}
                    onGenerate={handleGenerate}
                    onDelete={setDeleteSection}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}

      {/* Add Level */}
      {showAddLevel && (
        <Modal isOpen onClose={() => setShowAddLevel(false)}>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Tambah Level Baru
          </h2>
          <input
            type="text"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddLevel()}
            placeholder="Nama level (misal: Pemula, A1, Modul 1)"
            className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 mb-3"
            autoFocus
          />
          <button
            onClick={handleAddLevel}
            disabled={addingLevel || !newLevelName.trim()}
            className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {addingLevel ? "Menambahkan..." : "Tambah"}
          </button>
        </Modal>
      )}

      {/* Delete Level */}
      {deleteLevel && (
        <Modal isOpen onClose={() => setDeleteLevel(null)}>
          <h2 className="text-base font-semibold text-zinc-900 mb-2">
            Hapus Level?
          </h2>
          <p className="text-sm text-[#71717a] mb-6">
            Level <strong>{deleteLevel.name}</strong> dan semua kontennya akan
            dihapus permanen.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteLevel(null)}
              disabled={deletingLevel}
              className="px-3 py-1.5 text-sm border border-[#e4e4e7] rounded-xl text-zinc-900 hover:bg-[#fafafa] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteLevel}
              disabled={deletingLevel}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deletingLevel ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Course */}
      {showEditCourse && (
        <Modal isOpen onClose={() => setShowEditCourse(false)}>
          <h2 className="text-base font-semibold text-zinc-900 mb-4">
            Edit Course
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Judul course"
              className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Deskripsi course"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 resize-none"
            />
            <button
              onClick={handleSaveCourse}
              disabled={savingCourse || !editTitle.trim()}
              className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              {savingCourse ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Section */}
      {showAddSection && (
        <Modal isOpen onClose={() => setShowAddSection(false)}>
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
            className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {addingSection ? "Menambahkan..." : "Tambah Section"}
          </button>
        </Modal>
      )}

      {/* Delete Section */}
      {deleteSection && (
        <Modal isOpen onClose={() => setDeleteSection(null)}>
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
              className="px-3 py-1.5 text-sm border border-[#e4e4e7] rounded-xl text-zinc-900 hover:bg-[#fafafa] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteSection}
              disabled={deletingSection}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deletingSection ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
