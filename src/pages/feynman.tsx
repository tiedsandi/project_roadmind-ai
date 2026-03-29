import { useEffect, useRef, useState } from "react";

import { ArrowUp, RotateCcw } from "lucide-react";
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

type SessionState = "setup" | "chat";

const STARTER_PROMPTS = [
  "Coba jelaskan topik ini dengan kata-katamu sendiri",
  "Bayangkan kamu menjelaskan ke adikmu yang berusia 10 tahun",
  "Mulai dari konsep paling dasar yang kamu tahu",
];

export default function FeynmanPage() {
  const [sessionState, setSessionState] = useState<SessionState>("setup");
  const [topik, setTopik] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = () => {
    if (!topik.trim()) return;
    const starter =
      STARTER_PROMPTS[Math.floor(Math.random() * STARTER_PROMPTS.length)];
    setMessages([
      {
        role: "model",
        text: `Halo! Kita akan menjelajahi **${topik}** bersama menggunakan teknik Feynman.\n\n${starter} tentang **${topik}** — tidak perlu sempurna, mulai saja! 😊`,
      },
    ]);
    setSessionState("chat");
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessage: ChatMessage = { role: "user", text: trimmed };
    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/feynmanChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik,
          history: messages, // kirim history sebelum pesan baru
          userMessage: trimmed,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...updatedHistory, { role: "model", text: data.reply }]);
      }
    } catch {
      setMessages([
        ...updatedHistory,
        {
          role: "model",
          text: "Maaf, terjadi kesalahan. Coba kirim ulang.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const resetSession = () => {
    setSessionState("setup");
    setTopik("");
    setMessages([]);
    setInput("");
  };

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (sessionState === "setup") {
    return (
      <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
        <h1 className="text-3xl font-bold text-[#37352f] mb-1">Feynman Loop</h1>
        <p className="text-sm text-[#9b9a97] mb-10">
          Jelaskan konsep dengan kata-katamu sendiri, dan AI akan
          mengidentifikasi celah pemahamanmu.
        </p>

        {/* Cara kerja */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            {
              step: "1",
              label: "Jelaskan",
              desc: "Dengan kata-katamu sendiri",
            },
            {
              step: "2",
              label: "Identifikasi",
              desc: "Temukan celah yang kabur",
            },
            { step: "3", label: "Perdalam", desc: "Isi dengan pemahaman baru" },
          ].map((s) => (
            <div
              key={s.step}
              className="text-center p-3 border border-[#e9e9e7] rounded-xl"
            >
              <p className="text-lg font-bold text-[#37352f] mb-0.5">
                {s.step}
              </p>
              <p className="text-xs font-medium text-[#37352f]">{s.label}</p>
              <p className="text-[10px] text-[#9b9a97] mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#9b9a97] uppercase tracking-wide">
              Topik yang ingin dipelajari
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startSession()}
              placeholder="Misal: Rekursi dalam pemrograman"
              className="mt-1 w-full px-3 py-2 text-sm border border-[#e9e9e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/40"
              autoFocus
            />
          </div>
          <button
            onClick={startSession}
            disabled={!topik.trim()}
            className="w-full py-2.5 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors disabled:opacity-40"
          >
            Mulai Sesi
          </button>
        </div>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 md:px-16 py-3 border-b border-[#e9e9e7] flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[#37352f]">{topik}</h2>
          <p className="text-xs text-[#9b9a97]">Feynman Loop</p>
        </div>
        <button
          onClick={resetSession}
          className="flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors"
        >
          <RotateCcw size={12} />
          Topik baru
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-16 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "model" && (
              <div className="w-6 h-6 rounded-full bg-[#37352f] flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-0.5">
                F
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#37352f] text-white rounded-br-md"
                  : "bg-[#f7f7f5] text-[#37352f] rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-[#37352f] flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-0.5">
              F
            </div>
            <div className="bg-[#f7f7f5] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#9b9a97] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-[#9b9a97] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-[#9b9a97] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[#e9e9e7] px-4 md:px-16 py-4 max-w-3xl mx-auto w-full">
        <div className="flex items-end gap-2 border border-[#e9e9e7] rounded-xl px-3 py-2 hover:border-[#37352f]/30 focus-within:border-[#37352f]/40 focus-within:ring-1 focus-within:ring-[#37352f]/10 transition-all bg-white">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Jelaskan konsep ini dengan kata-katamu sendiri... (Enter untuk kirim)"
            rows={1}
            className="flex-1 text-sm text-[#37352f] placeholder-[#9b9a97] resize-none focus:outline-none bg-transparent leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#37352f] flex items-center justify-center hover:bg-[#2f2d2a] transition-colors disabled:opacity-30 mb-0.5"
            aria-label="Kirim"
          >
            <ArrowUp size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#9b9a97] mt-1.5 text-center">
          Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}
