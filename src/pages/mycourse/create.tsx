import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Plus,
  Send,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { courseRepository, levelRepository } from "@/repositories";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GeneratedStructure } from "@/pages/api/courses/generateStructure";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LevelItem {
  id: string; // local uuid only — not a Firestore ID yet
  name: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ─── Sortable level row ───────────────────────────────────────────────────────
function SortableLevelRow({
  item,
  onRename,
  onDelete,
}: {
  item: LevelItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(item.id, trimmed);
    else setDraft(item.name);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white border border-[#e4e4e7] rounded-xl px-3 py-2.5 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-[#a1a1aa] hover:text-[#71717a] cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Seret untuk mengurutkan"
      >
        <GripVertical size={15} />
      </button>

      {/* Name (editable inline) */}
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 text-sm text-zinc-900 bg-transparent outline-none border-b border-indigo-200"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(item.name);
              setEditing(false);
            }
          }}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm text-zinc-900 cursor-text"
          onClick={() => {
            setEditing(true);
            setTimeout(() => inputRef.current?.select(), 0);
          }}
          title="Klik untuk edit"
        >
          {item.name}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 text-[#71717a] hover:text-red-500 transition-all flex-shrink-0"
        aria-label="Hapus level"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({
  n,
  active,
  done,
}: {
  n: number;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
        done
          ? "bg-indigo-600 text-white"
          : active
            ? "bg-indigo-600 text-white"
            : "bg-[#f4f4f5] text-[#71717a]"
      }`}
    >
      {done ? "✓" : n}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function CreateCoursePage() {
  const router = useRouter();

  // Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // Step 2 — structure
  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [newLevelName, setNewLevelName] = useState("");
  const [reasoning, setReasoning] = useState("");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Saving
  const [saving, setSaving] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setDisplayName(u.displayName ?? u.email ?? "Anonymous");
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/courses/generateStructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = (await res.json()) as GeneratedStructure & {
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Gagal generate");
      applyStructure(data);
      setStep(2);
      setMessages([
        {
          role: "ai",
          text: `Saya sarankan struktur di atas berdasarkan topik "${topic}". ${data.reasoning} Mau ada yang diubah?`,
        },
      ]);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenerating(false);
    }
  };

  function applyStructure(s: GeneratedStructure) {
    setTitle(s.title);
    setDescription(s.description);
    setReasoning(s.reasoning ?? "");
    setLevels(
      s.levels.map((name, i) => ({ id: `lvl-${Date.now()}-${i}`, name })),
    );
  }

  const handleChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setChatLoading(true);
    try {
      const current: GeneratedStructure = {
        title,
        description,
        levels: levels.map((l) => l.name),
        reasoning,
      };
      const res = await fetch("/api/courses/refineStructure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, feedback: text }),
      });
      const data = (await res.json()) as {
        structure: GeneratedStructure;
        reply: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Error");
      applyStructure(data.structure);
      setMessages((m) => [...m, { role: "ai", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Maaf, terjadi kesalahan. Coba lagi.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLevels((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addLevel = () => {
    const name = newLevelName.trim();
    if (!name) return;
    setLevels((prev) => [...prev, { id: `lvl-${Date.now()}`, name }]);
    setNewLevelName("");
  };

  const handleSave = async () => {
    if (!userId || !title.trim() || levels.length === 0) return;
    setSaving(true);
    try {
      const courseId = await courseRepository.create({
        title: title.trim(),
        description: description.trim(),
        creatorId: userId,
        creatorName: displayName,
      });
      await Promise.all(
        levels.map((lvl, idx) =>
          levelRepository.create({
            courseId,
            name: lvl.name,
            order: idx,
          }),
        ),
      );
      // Update levelCount sesuai jumlah level yang dibuat
      await Promise.all(
        levels.map(() => courseRepository.incrementLevelCount(courseId)),
      );
      router.push(`/courses/${courseId}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  // ─── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="h-8 w-48 bg-[#fafafa] rounded animate-pulse mx-auto" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-[#71717a] mb-4">
          Kamu harus login untuk membuat course.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Masuk ke Explore
        </Link>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#e4e4e7]">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-xs text-[#71717a] hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={13} />
            Explore
          </Link>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div className="w-8 h-px bg-[#e4e4e7]" />
            <StepDot n={2} active={step === 2} done={false} />
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>
      </div>

      {/* ── Step 1: Topic input ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="max-w-xl mx-auto px-6 py-16">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Buat Course Baru
            </h1>
            <p className="text-sm text-[#71717a]">
              Ceritakan topik yang ingin kamu ajarkan — AI akan menyusun
              struktur course untuk kamu.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#52525b] uppercase tracking-wide mb-2">
                Mau belajar atau ngajarin apa?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Bahasa Inggris, Astronomi, Web Design, Anatomi Manusia…"
                className="w-full px-4 py-3 text-sm border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#37352f]/10 focus:border-indigo-200 placeholder:text-[#a1a1aa]"
                autoFocus
                disabled={generating}
              />
            </div>

            {genError && <p className="text-xs text-red-500">{genError}</p>}

            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || generating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              {generating ? (
                <>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                  AI sedang membuat struktur…
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Generate Struktur Course
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="mt-8">
            <p className="text-xs text-[#71717a] mb-3">Contoh topik:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Bahasa Inggris",
                "Machine Learning",
                "Desain UI/UX",
                "Gitar Akustik",
                "Memasak Italia",
                "Astronomi",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  className="px-3 py-1.5 text-xs border border-[#e4e4e7] rounded-full text-[#52525b] hover:border-indigo-200 hover:bg-[#fafafa] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Review & edit ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="mb-6">
            <p className="text-xs text-[#71717a] uppercase tracking-wide mb-1">
              Langkah 2 dari 2
            </p>
            <h2 className="text-xl font-bold text-zinc-900">
              Tinjau &amp; Sesuaikan Struktur
            </h2>
            <p className="text-sm text-[#71717a] mt-1">
              Edit judul, deskripsi, dan urutan level sesuai kebutuhanmu. Atau
              gunakan chat untuk minta AI mengubahnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
            {/* ── Structure editor ── */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wide mb-1.5">
                  Judul Course
                </label>
                {editingTitle ? (
                  <input
                    className="w-full px-3 py-2 text-base font-semibold text-zinc-900 border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setEditingTitle(false)
                    }
                    autoFocus
                  />
                ) : (
                  <p
                    className="px-3 py-2 text-base font-semibold text-zinc-900 border border-transparent hover:border-[#e4e4e7] rounded-xl cursor-text transition-colors"
                    onClick={() => setEditingTitle(true)}
                    title="Klik untuk edit"
                  >
                    {title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wide mb-1.5">
                  Deskripsi
                </label>
                {editingDesc ? (
                  <textarea
                    className="w-full px-3 py-2 text-sm text-zinc-900 border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setEditingDesc(false)}
                    rows={3}
                    autoFocus
                  />
                ) : (
                  <p
                    className="px-3 py-2 text-sm text-[#52525b] leading-relaxed border border-transparent hover:border-[#e4e4e7] rounded-xl cursor-text transition-colors"
                    onClick={() => setEditingDesc(true)}
                    title="Klik untuk edit"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Levels */}
              <div>
                <label className="block text-xs font-medium text-[#71717a] uppercase tracking-wide mb-2">
                  Learning Ladder ({levels.length} level)
                </label>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={levels.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {levels.map((lvl) => (
                        <SortableLevelRow
                          key={lvl.id}
                          item={lvl}
                          onRename={(id, name) =>
                            setLevels((prev) =>
                              prev.map((l) =>
                                l.id === id ? { ...l, name } : l,
                              ),
                            )
                          }
                          onDelete={(id) =>
                            setLevels((prev) => prev.filter((l) => l.id !== id))
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add level */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newLevelName}
                    onChange={(e) => setNewLevelName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLevel()}
                    placeholder="+ Tambah level baru"
                    className="flex-1 px-3 py-2 text-sm border border-dashed border-[#d4d4d1] rounded-xl focus:outline-none focus:border-[#71717a] placeholder:text-[#a1a1aa]"
                  />
                  <button
                    onClick={addLevel}
                    disabled={!newLevelName.trim()}
                    className="px-3 py-2 text-xs border border-[#e4e4e7] rounded-xl text-zinc-900 hover:bg-[#fafafa] transition-colors disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || levels.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 mt-2"
              >
                {saving ? (
                  "Menyimpan ke Firestore…"
                ) : (
                  <>
                    Simpan &amp; Lanjut →
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* ── Chat panel ── */}
            <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden flex flex-col h-[480px] md:h-[520px]">
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-[#e4e4e7] bg-[#fafafa]">
                <p className="text-xs font-semibold text-zinc-900">
                  💬 Diskusi dengan AI
                </p>
                <p className="text-[10px] text-[#71717a]">
                  Minta perubahan dalam bahasa natural
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-[#f4f4f5] text-zinc-900 rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#f4f4f5] px-3 py-2 rounded-xl rounded-bl-sm">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-[#71717a] rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[#e4e4e7] p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleChat()
                    }
                    placeholder="Contoh: pisah level Menengah jadi 2 bagian"
                    className="flex-1 px-3 py-2 text-xs border border-[#e4e4e7] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 placeholder:text-[#a1a1aa]"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleChat}
                    disabled={!chatInput.trim() || chatLoading}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                  >
                    <Send size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-[#a1a1aa] mt-1.5 text-center">
                  Enter untuk kirim — AI akan update struktur di sebelah kiri
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
