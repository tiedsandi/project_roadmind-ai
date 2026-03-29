import { useEffect, useState } from "react";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { resourceRepository } from "@/repositories";
import type { Resource, ResourceCollection } from "@/repositories/types";
import { useRouter } from "next/router";

const TYPE_CONFIG: Record<
  Resource["jenis"],
  { emoji: string; bg: string; text: string; border: string }
> = {
  Buku: { emoji: "📖", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  Video: { emoji: "🎬", bg: "#fdf4ff", text: "#9333ea", border: "#e9d5ff" },
  Kursus: { emoji: "🎓", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  Artikel: { emoji: "📝", bg: "#fefce8", text: "#ca8a04", border: "#fef08a" },
  Tokoh: { emoji: "🧑‍💻", bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
};

export default function ResourceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [collection, setCollection] = useState<ResourceCollection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeType, setActiveType] = useState<Resource["jenis"] | "Semua">(
    "Semua",
  );

  useEffect(() => {
    if (!id) return;
    resourceRepository.getById(id as string).then((data) => {
      if (data) setCollection(data);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Resource tidak ditemukan.</p>
        <Link
          href="/resources"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali
        </Link>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-56 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#f7f7f5] rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const allTypes = Array.from(
    new Set(collection.resources.map((r) => r.jenis)),
  );

  const filtered =
    activeType === "Semua"
      ? collection.resources
      : collection.resources.filter((r) => r.jenis === activeType);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Back */}
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Resources
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-1">
        {collection.topik}
      </h1>
      <p className="text-sm text-[#9b9a97] mb-6">
        {collection.resources.length} sumber belajar terkurasi
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["Semua", ...allTypes] as Array<Resource["jenis"] | "Semua">).map(
          (type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                activeType === type
                  ? "bg-[#37352f] text-white border-[#37352f]"
                  : "border-[#e9e9e7] text-[#5b5a57] hover:bg-[#f7f7f5]"
              }`}
            >
              {type !== "Semua" &&
                TYPE_CONFIG[type as Resource["jenis"]]?.emoji}{" "}
              {type}
            </button>
          ),
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((r, i) => {
          const cfg = TYPE_CONFIG[r.jenis] ?? TYPE_CONFIG["Artikel"];
          const hasLink = r.link && isValidUrl(r.link);

          return (
            <div
              key={i}
              className="border rounded-xl p-4 transition-colors hover:border-[#37352f]/20"
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {cfg.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-[#37352f]">
                        {r.nama}
                      </p>
                      <span
                        className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          background: "#ffffff80",
                          color: cfg.text,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {r.jenis}
                      </span>
                    </div>
                    <p className="text-xs text-[#5b5a57] leading-relaxed">
                      {r.alasan}
                    </p>
                  </div>
                </div>
                {hasLink && (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded-md hover:bg-white/60 transition-colors"
                    aria-label="Buka link"
                  >
                    <ExternalLink size={14} style={{ color: cfg.text }} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
