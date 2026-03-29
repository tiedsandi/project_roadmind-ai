"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import type { Roadmap } from "@/repositories/types";
import { roadmapRepository } from "@/repositories";

const TOOLS = [
  {
    href: "/roadmind",
    emoji: "🗺️",
    label: "My Roadmaps",
    desc: "Rencana belajar hari per hari",
  },
  {
    href: "/learning-plan",
    emoji: "⏱️",
    label: "Learning Plan",
    desc: "Teknik 20 jam Josh Kaufman",
  },
  {
    href: "/cheat-sheet",
    emoji: "📄",
    label: "Cheat Sheet",
    desc: "Ringkasan 1 halaman, review 5 menit",
  },
  {
    href: "/ladder",
    emoji: "🪜",
    label: "Learning Ladder",
    desc: "Jalur naik dari pemula ke mahir",
  },
  {
    href: "/resources",
    emoji: "🔍",
    label: "Resources",
    desc: "5 sumber belajar terkurasi AI",
  },
  {
    href: "/quiz",
    emoji: "🧪",
    label: "Quiz",
    desc: "Uji pemahaman dengan pilihan ganda",
  },
  {
    href: "/feynman",
    emoji: "🧠",
    label: "Feynman Loop",
    desc: "Jelaskan ulang, temukan celah",
  },
];

export default function HomePage() {
  const [blogs, setBlogs] = useState<Roadmap[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const allBlogs = await roadmapRepository.getAllPublic();
      setBlogs(allBlogs);
    } catch (err) {
      console.error("❌ Gagal ambil blogs:", err);
      setError("Gagal memuat data. Silakan coba lagi.");
    }
    setLoading(false);
  };

  const filteredBlogs = blogs.filter((blog) =>
    blog.judul.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#37352f] mb-1">
          Selamat datang di RoadMind
        </h1>
        <p className="text-[#9b9a97] text-sm">
          AI-powered learning platform — rencanakan, pelajari, dan uji
          pemahamanmu.
        </p>
      </div>

      {/* Tools grid */}
      <div className="mb-12">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9b9a97] mb-3">
          Tools
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col gap-1 p-3 border border-[#e9e9e7] rounded-xl hover:border-[#37352f]/20 hover:bg-[#f7f7f5] transition-all group"
            >
              <span className="text-xl">{t.emoji}</span>
              <p className="text-xs font-semibold text-[#37352f] group-hover:underline leading-tight">
                {t.label}
              </p>
              <p className="text-[10px] text-[#9b9a97] leading-snug">
                {t.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Community Roadmaps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9b9a97]">
            Community Roadmaps
          </p>
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-36 px-2.5 py-1 text-xs border border-[#e9e9e7] rounded-md bg-[#f7f7f5] text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:ring-1 focus:ring-[#37352f]/20"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-[#f7f7f5] rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#e9e9e7] rounded-xl">
            <p className="text-sm text-[#9b9a97]">
              {search
                ? "Tidak ada roadmap yang cocok."
                : "Belum ada roadmap tersedia."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e9e9e7]">
            {filteredBlogs.map((blog) => {
              const date = blog.createdAt
                ? blog.createdAt.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "";

              return (
                <Link
                  key={blog.id}
                  href={`/roadmind/${blog.id}`}
                  className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-md hover:bg-[#f7f7f5] transition-colors group"
                >
                  <span className="mt-0.5 text-base">📚</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#37352f] group-hover:underline truncate">
                      {blog.judul}
                    </p>
                    <p className="text-xs text-[#9b9a97] truncate mt-0.5">
                      {blog.subJudul}
                    </p>
                  </div>
                  <span className="text-xs text-[#9b9a97] whitespace-nowrap mt-0.5 hidden sm:block">
                    {date}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
