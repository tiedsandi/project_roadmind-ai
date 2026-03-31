import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, Layers, ArrowRight, BookOpen } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { courseRepository } from "@/repositories";
import type { Course } from "@/repositories/types";

const CARD_PALETTES = [
  {
    bg: "bg-[#dbeafe]",
    badge: "bg-[#bfdbfe] text-[#1e40af]",
    btn: "border-[#93c5fd] text-[#1d4ed8] hover:bg-[#bfdbfe]",
  },
  {
    bg: "bg-[#fed7aa]",
    badge: "bg-[#fdba74] text-[#9a3412]",
    btn: "border-[#fb923c] text-[#c2410c] hover:bg-[#fdba74]",
  },
  {
    bg: "bg-[#e9d5ff]",
    badge: "bg-[#d8b4fe] text-[#6b21a8]",
    btn: "border-[#c084fc] text-[#7e22ce] hover:bg-[#d8b4fe]",
  },
  {
    bg: "bg-[#bbf7d0]",
    badge: "bg-[#86efac] text-[#14532d]",
    btn: "border-[#4ade80] text-[#15803d] hover:bg-[#86efac]",
  },
  {
    bg: "bg-[#fde68a]",
    badge: "bg-[#fcd34d] text-[#78350f]",
    btn: "border-[#fbbf24] text-[#92400e] hover:bg-[#fcd34d]",
  },
  {
    bg: "bg-[#fecdd3]",
    badge: "bg-[#fda4af] text-[#881337]",
    btn: "border-[#fb7185] text-[#be123c] hover:bg-[#fda4af]",
  },
] as const;

type Palette = (typeof CARD_PALETTES)[number];

function CourseCard({ course, palette }: { course: Course; palette: Palette }) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 min-h-[210px] ${palette.bg}`}
    >
      {/* Title + description */}
      <div className="flex-1">
        <h2 className="text-base font-bold text-[#18181b] leading-snug mb-1.5">
          {course.title}
        </h2>
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
          {course.description}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${palette.badge}`}
        >
          <Layers size={9} />
          {course.levelCount} level
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${palette.badge}`}
        >
          <Users size={9} />
          {course.subscriberCount} subscriber
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${palette.badge}`}
        >
          <BookOpen size={9} />
          {course.creatorName}
        </span>
      </div>

      {/* Footer */}
      <div className="border-t border-black/10 pt-3 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">
          oleh {course.creatorName}
        </span>
        <Link
          href={`/courses/${course.id}`}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${palette.btn}`}
        >
          Lihat Detail
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard({ palette }: { palette: Palette }) {
  return (
    <div
      className={`rounded-2xl p-5 min-h-[210px] flex flex-col gap-3 opacity-60 ${palette.bg}`}
    >
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/4 bg-black/10 rounded animate-pulse" />
        <div className="h-3 w-full bg-black/10 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-black/10 rounded animate-pulse" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 bg-black/10 rounded-full animate-pulse" />
        <div className="h-5 w-20 bg-black/10 rounded-full animate-pulse" />
      </div>
      <div className="border-t border-black/10 pt-3 flex justify-end">
        <div className="h-6 w-24 bg-black/10 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    courseRepository
      .getAll()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Explore</h1>
          <p className="text-sm text-[#71717a] mt-1">
            {loading ? "Memuat course..." : `${courses.length} course tersedia`}
          </p>
        </div>
        {userId && (
          <Link
            href="/mycourse/create"
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            Buat Course
          </Link>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard
              key={i}
              palette={CARD_PALETTES[i % CARD_PALETTES.length]}
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-5 border border-dashed border-[#e4e4e7] rounded-2xl bg-[#fafafa]">
          <span className="text-5xl select-none">📭</span>
          <div className="text-center">
            <p className="text-base font-semibold text-zinc-900 mb-1">
              Belum ada course tersedia
            </p>
            <p className="text-sm text-[#71717a]">
              Jadilah yang pertama membuat course di RoadMind!
            </p>
          </div>
          {userId ? (
            <Link
              href="/mycourse/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} />
              Buat Course Pertama
            </Link>
          ) : (
            <p className="text-xs text-[#71717a]">
              Login untuk mulai membuat course.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {courses.map((c, i) => (
            <CourseCard
              key={c.id}
              course={c}
              palette={CARD_PALETTES[i % CARD_PALETTES.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
