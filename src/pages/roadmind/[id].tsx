import { useEffect, useState } from "react";

import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { roadmapRepository } from "@/repositories";
import type { Roadmap } from "@/repositories/types";
import { useRouter } from "next/router";

export default function RoadmindDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [roadmind, setRoadmind] = useState<Roadmap | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const data = await roadmapRepository.getById(id as string);
      if (data) {
        setRoadmind(data);
      } else {
        setNotFound(true);
      }
    };
    fetchData();
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Roadmap tidak ditemukan.</p>
        <Link
          href="/roadmind"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  if (!roadmind) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-64 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="h-4 w-96 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-[#f7f7f5] rounded-lg animate-pulse"
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
        href="/roadmind"
        className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        My Roadmaps
      </Link>

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#37352f] mb-2">
        {roadmind.judul}
      </h1>
      <div className="text-sm text-[#9b9a97] mb-8 rm-prose">
        <ReactMarkdown>{roadmind.subJudul}</ReactMarkdown>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#e9e9e7]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#37352f]">
            {roadmind.roadmap.length}
          </p>
          <p className="text-xs text-[#9b9a97]">Hari</p>
        </div>
      </div>

      {/* Roadmap items */}
      <div className="space-y-2">
        {roadmind.roadmap.map((item) => (
          <div
            key={item.hari}
            className="flex gap-4 p-3 rounded-lg hover:bg-[#f7f7f5] transition-colors group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[#f1f1ef] flex items-center justify-center">
              <span className="text-xs font-mono font-semibold text-[#9b9a97]">
                {item.hari}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-sm text-[#37352f] rm-prose pt-1">
              <ReactMarkdown>{item.kegiatan}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
