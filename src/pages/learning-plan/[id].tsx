import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { learningPlanRepository } from "@/repositories";
import type { LearningPlan } from "@/repositories/types";
import { useRouter } from "next/router";

export default function LearningPlanDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSession, setActiveSession] = useState<number>(1);

  useEffect(() => {
    if (!id) return;
    learningPlanRepository.getById(id as string).then((data) => {
      if (data) setPlan(data);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Learning plan tidak ditemukan.</p>
        <Link
          href="/learning-plan"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-72 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="h-4 w-48 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-[#f7f7f5] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const currentSesi = plan.sesi.find((s) => s.nomor === activeSession);

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Back */}
      <Link
        href="/learning-plan"
        className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Learning Plans
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-1">{plan.judul}</h1>
      <p className="text-sm text-[#9b9a97] mb-6">{plan.deskripsi}</p>

      {/* Stats */}
      <div className="flex items-center gap-6 pb-6 mb-8 border-b border-[#e9e9e7]">
        <div>
          <p className="text-2xl font-bold text-[#37352f]">{plan.totalJam}</p>
          <p className="text-xs text-[#9b9a97]">Total Jam</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#37352f]">
            {plan.sesi.length}
          </p>
          <p className="text-xs text-[#9b9a97]">Sesi</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#37352f] capitalize">
            {plan.level}
          </p>
          <p className="text-xs text-[#9b9a97]">Level</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#37352f]">{plan.topik}</p>
          <p className="text-xs text-[#9b9a97]">Topik</p>
        </div>
      </div>

      {/* Layout: session list + detail */}
      <div className="flex gap-6">
        {/* Session list (kiri) */}
        <div className="w-36 flex-shrink-0 space-y-1">
          {plan.sesi.map((s) => (
            <button
              key={s.nomor}
              onClick={() => setActiveSession(s.nomor)}
              className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-colors ${
                activeSession === s.nomor
                  ? "bg-[#37352f] text-white font-medium"
                  : "text-[#5b5a57] hover:bg-[#f7f7f5]"
              }`}
            >
              <span className="font-mono">Sesi {s.nomor}</span>
              <p
                className={`truncate mt-0.5 leading-tight ${
                  activeSession === s.nomor ? "text-white/70" : "text-[#9b9a97]"
                }`}
              >
                {s.tujuan}
              </p>
            </button>
          ))}
        </div>

        {/* Session detail (kanan) */}
        {currentSesi && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#37352f] flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-white">
                  {currentSesi.nomor}
                </span>
              </div>
              <h2 className="text-base font-semibold text-[#37352f]">
                {currentSesi.tujuan}
              </h2>
            </div>

            <div className="space-y-5">
              <Section label="⚡ Aktivitas">
                <div className="rm-prose text-sm text-[#37352f]">
                  <ReactMarkdown>{currentSesi.aktivitas}</ReactMarkdown>
                </div>
              </Section>

              <Section label="📚 Resource">
                <p className="text-sm text-[#37352f]">{currentSesi.resource}</p>
              </Section>

              <Section label="✅ Review (15 menit)">
                <p className="text-sm text-[#37352f]">{currentSesi.review}</p>
              </Section>
            </div>

            {/* Next / Prev */}
            <div className="flex justify-between mt-8 pt-4 border-t border-[#e9e9e7]">
              <button
                onClick={() => setActiveSession((p) => Math.max(1, p - 1))}
                disabled={activeSession === 1}
                className="text-xs text-[#9b9a97] hover:text-[#37352f] disabled:opacity-30 transition-colors"
              >
                ← Sesi sebelumnya
              </button>
              <button
                onClick={() =>
                  setActiveSession((p) => Math.min(plan.sesi.length, p + 1))
                }
                disabled={activeSession === plan.sesi.length}
                className="text-xs text-[#9b9a97] hover:text-[#37352f] disabled:opacity-30 transition-colors"
              >
                Sesi berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9b9a97] mb-1.5">
        {label}
      </p>
      <div className="bg-[#f7f7f5] rounded-lg px-4 py-3">{children}</div>
    </div>
  );
}
