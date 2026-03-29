import { useEffect, useState } from "react";

import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { learningLadderRepository } from "@/repositories";
import type { LearningLadder } from "@/repositories/types";
import { useRouter } from "next/router";

const LEVEL_COLORS: Record<
  number,
  { bg: string; text: string; border: string }
> = {
  1: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  2: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  3: { bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  4: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  5: { bg: "#fdf4ff", text: "#9333ea", border: "#e9d5ff" },
};

export default function LadderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [ladder, setLadder] = useState<LearningLadder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    learningLadderRepository.getById(id as string).then((data) => {
      if (data) setLadder(data);
      else setNotFound(true);
    });
  }, [id]);

  const toggleLevel = (level: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Hapus level ini dan semua di atasnya
        next.forEach((l) => {
          if (l >= level) next.delete(l);
        });
      } else {
        // Tandai semua level sampai level ini
        for (let i = 1; i <= level; i++) next.add(i);
      }
      return next;
    });
  };

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Ladder tidak ditemukan.</p>
        <Link
          href="/ladder"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali
        </Link>
      </div>
    );
  }

  if (!ladder) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-56 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 bg-[#f7f7f5] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const progressPct =
    ladder.levels.length > 0
      ? Math.round((completed.size / ladder.levels.length) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Back */}
      <Link
        href="/ladder"
        className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Learning Ladders
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-1">{ladder.topik}</h1>
      <p className="text-sm text-[#9b9a97] mb-6">
        {ladder.levels.length} level · dari pemula ke mahir
      </p>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-[#9b9a97] mb-1.5">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-[#e9e9e7] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#37352f] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Levels */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-5 top-6 bottom-6 w-px bg-[#e9e9e7]" />

        <div className="space-y-4">
          {ladder.levels.map((lvl) => {
            const isDone = completed.has(lvl.level);
            const colors = LEVEL_COLORS[lvl.level] ?? LEVEL_COLORS[1];

            return (
              <div key={lvl.level} className="relative flex gap-4">
                {/* Step indicator */}
                <button
                  onClick={() => toggleLevel(lvl.level)}
                  className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: isDone ? "#37352f" : "#ffffff",
                    border: `2px solid ${isDone ? "#37352f" : "#e9e9e7"}`,
                  }}
                  aria-label={
                    isDone ? "Tandai belum selesai" : "Tandai selesai"
                  }
                >
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-white" />
                  ) : (
                    <Circle size={16} className="text-[#9b9a97]" />
                  )}
                </button>

                {/* Card */}
                <div
                  className="flex-1 rounded-xl p-4 border transition-all"
                  style={{
                    background: isDone ? colors.bg : "#ffffff",
                    borderColor: isDone ? colors.border : "#e9e9e7",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      Level {lvl.level}
                    </span>
                    <span className="text-sm font-semibold text-[#37352f]">
                      {lvl.nama}
                    </span>
                  </div>

                  <p className="text-xs text-[#5b5a57] mb-3 leading-relaxed">
                    {lvl.deskripsi}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Skills */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9b9a97] mb-1.5">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {lvl.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-[#f7f7f5] text-[#37352f] rounded border border-[#e9e9e7]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Project & Milestone */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9b9a97] mb-1">
                          Project
                        </p>
                        <p className="text-xs text-[#37352f]">{lvl.project}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[#9b9a97] mb-1">
                          Milestone
                        </p>
                        <p className="text-xs text-[#37352f]">
                          {lvl.milestone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
