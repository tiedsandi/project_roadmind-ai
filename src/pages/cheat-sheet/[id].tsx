import { useEffect, useState } from "react";

import { ArrowLeft, Lightbulb, AlertTriangle, BookOpen } from "lucide-react";
import Link from "next/link";
import { cheatSheetRepository } from "@/repositories";
import type { CheatSheet } from "@/repositories/types";
import { useRouter } from "next/router";

export default function CheatSheetDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [sheet, setSheet] = useState<CheatSheet | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    cheatSheetRepository.getById(id as string).then((data) => {
      if (data) setSheet(data);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Cheat sheet tidak ditemukan.</p>
        <Link
          href="/cheat-sheet"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali
        </Link>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-72 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="h-4 w-96 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-[#f7f7f5] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Back */}
      <Link
        href="/cheat-sheet"
        className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Cheat Sheets
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-1">{sheet.judul}</h1>
      <p className="text-sm text-[#9b9a97] mb-8">{sheet.ringkasan}</p>

      {/* Konsep Utama */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-[#9b9a97]" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9b9a97]">
            Konsep Utama
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sheet.konsepUtama.map((k, i) => (
            <div
              key={i}
              className="border border-[#e9e9e7] rounded-lg p-4 hover:border-[#37352f]/20 transition-colors"
            >
              <p className="text-sm font-semibold text-[#37352f] mb-1">
                {k.nama}
              </p>
              <p className="text-xs text-[#5b5a57] mb-2 leading-relaxed">
                {k.penjelasan}
              </p>
              {k.contoh && (
                <code className="block text-xs bg-[#f1f1ef] text-[#37352f] px-2.5 py-1.5 rounded font-mono leading-relaxed whitespace-pre-wrap">
                  {k.contoh}
                </code>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tips */}
        {sheet.tips.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-[#9b9a97]" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9b9a97]">
                Tips
              </h2>
            </div>
            <ul className="space-y-2">
              {sheet.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#37352f]">
                  <span className="mt-0.5 text-green-500 flex-shrink-0">✓</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Kesalahan Umum */}
        {sheet.kesalahanUmum.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-[#9b9a97]" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9b9a97]">
                Kesalahan Umum
              </h2>
            </div>
            <ul className="space-y-2">
              {sheet.kesalahanUmum.map((err, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#37352f]">
                  <span className="mt-0.5 text-red-400 flex-shrink-0">✗</span>
                  <span className="leading-relaxed">{err}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
