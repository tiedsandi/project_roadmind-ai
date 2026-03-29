import { useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { roadmapRepository, progressRepository } from "@/repositories";
import type { Roadmap } from "@/repositories/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function RoadmindDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [roadmind, setRoadmind] = useState<Roadmap | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

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

  // Load progress setelah userId & roadmapId tersedia
  useEffect(() => {
    if (!userId || !id) return;
    progressRepository.get(userId, id as string).then((progress) => {
      if (progress) setCompletedDays(new Set(progress.completedDays));
    });
  }, [userId, id]);

  const toggleDay = (hari: number) => {
    if (!userId || !id) return;
    setCompletedDays((prev) => {
      const next = new Set(prev);
      if (next.has(hari)) next.delete(hari);
      else next.add(hari);

      // Debounce save ke Firestore (500ms)
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        progressRepository.save(userId, id as string, Array.from(next));
      }, 500);

      return next;
    });
  };

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
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#e9e9e7]">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#37352f]">
            {roadmind.roadmap.length}
          </p>
          <p className="text-xs text-[#9b9a97]">Hari</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#37352f]">
            {completedDays.size}
          </p>
          <p className="text-xs text-[#9b9a97]">Selesai</p>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#9b9a97] mb-1">
            <span>Progress</span>
            <span>
              {roadmind.roadmap.length > 0
                ? Math.round(
                    (completedDays.size / roadmind.roadmap.length) * 100,
                  )
                : 0}
              %
            </span>
          </div>
          <div className="h-1.5 bg-[#e9e9e7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#37352f] rounded-full transition-all duration-500"
              style={{
                width:
                  roadmind.roadmap.length > 0
                    ? `${(completedDays.size / roadmind.roadmap.length) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Roadmap items */}
      <div className="space-y-1">
        {roadmind.roadmap.map((item) => {
          const done = completedDays.has(item.hari);
          return (
            <div
              key={item.hari}
              onClick={() => toggleDay(item.hari)}
              className={`flex gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                done ? "bg-[#f0fdf4] hover:bg-[#dcfce7]" : "hover:bg-[#f7f7f5]"
              }`}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    done ? "bg-[#16a34a] border-[#16a34a]" : "border-[#d1d5db]"
                  }`}
                >
                  {done && (
                    <svg
                      width="9"
                      height="7"
                      viewBox="0 0 9 7"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              {/* Hari badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[#f1f1ef] flex items-center justify-center -mt-0.5">
                <span className="text-xs font-mono font-semibold text-[#9b9a97]">
                  {item.hari}
                </span>
              </div>
              <div
                className={`flex-1 min-w-0 text-sm rm-prose pt-1 transition-colors ${
                  done ? "text-[#9b9a97] line-through" : "text-[#37352f]"
                }`}
              >
                <ReactMarkdown>{item.kegiatan}</ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
