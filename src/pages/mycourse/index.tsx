import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Plus, Users, Layers, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { courseRepository } from "@/repositories";
import type { Course } from "@/repositories/types";

export default function MyCoursePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/explore");
        return;
      }
      setUserId(u.uid);
      courseRepository
        .getByCreatorId(u.uid)
        .then(setCourses)
        .catch(console.error)
        .finally(() => setLoading(false));
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Courses</h1>
          <p className="text-sm text-[#71717a] mt-1">
            {loading ? "Memuat..." : `${courses.length} kursus yang kamu buat`}
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

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-[#fafafa] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-5 border border-dashed border-[#e4e4e7] rounded-2xl bg-[#fafafa]">
          <span className="text-5xl select-none">🗂️</span>
          <div className="text-center">
            <p className="text-base font-semibold text-zinc-900 mb-1">
              Belum ada kursus yang kamu buat
            </p>
            <p className="text-sm text-[#71717a]">
              Mulai buat kursus pertamamu — AI akan bantu menyusun strukturnya.
            </p>
          </div>
          <Link
            href="/mycourse/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            Buat Course Pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="flex items-center gap-4 border border-[#e4e4e7] rounded-2xl px-5 py-4 hover:border-indigo-200 hover:bg-[#fafafa] transition-all group"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900 group-hover:underline truncate">
                  {c.title}
                </h2>
                <p className="text-xs text-[#71717a] mt-0.5 line-clamp-1">
                  {c.description}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#71717a]">
                    <Layers size={10} />
                    {c.levelCount} level
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#71717a]">
                    <Users size={10} />
                    {c.subscriberCount} subscriber
                  </span>
                </div>
              </div>
              <ArrowRight
                size={15}
                className="text-[#a1a1aa] group-hover:text-zinc-900 transition-colors flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
