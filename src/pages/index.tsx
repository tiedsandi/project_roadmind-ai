"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import type { Roadmap } from "@/repositories/types";
import { roadmapRepository } from "@/repositories";

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
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Page header */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-1">Explore</h1>
      <p className="text-[#9b9a97] mb-8">
        Roadmap belajar yang dibuat komunitas
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Cari roadmap..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 px-3 py-1.5 text-sm border border-[#e9e9e7] rounded-md bg-[#f7f7f5] text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/30"
        />
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {/* List */}
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
        <p className="text-sm text-[#9b9a97]">
          {search
            ? "Tidak ada roadmap yang cocok."
            : "Belum ada roadmap tersedia."}
        </p>
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
                <span className="text-xs text-[#9b9a97] whitespace-nowrap mt-0.5">
                  {date}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
