import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import {
  BookOpen,
  Zap,
  Layers,
  PenLine,
  Users,
  ArrowRight,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { courseRepository } from "@/repositories";
import type { Course } from "@/repositories/types";

const FEATURES = [
  {
    icon: <Zap size={20} className="text-indigo-500" />,
    title: "Konten di-generate AI",
    desc: "Learning plan, cheat sheet, dan resource list otomatis dibuat AI berdasarkan topik dan level — creator tinggal review dan publish.",
  },
  {
    icon: <Layers size={20} className="text-indigo-500" />,
    title: "Belajar sesuai level",
    desc: "Setiap course terbagi dalam level bertahap. Mulai dari Pemula sampai Mahir, belajar sesuai ritmu sendiri.",
  },
  {
    icon: <PenLine size={20} className="text-indigo-500" />,
    title: "Siapa saja bisa jadi creator",
    desc: "Buat course-mu sendiri dalam hitungan menit. Tidak perlu keahlian teknis — AI menangani pembuatan konten.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    courseRepository
      .getAll()
      .then((all) => setCourses(all.slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoadingCourses(false));
  }, []);

  const handleCreateCourse = () => {
    if (userId) {
      router.push("/mycourse/create");
    } else {
      router.push("/explore");
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-[#e4e4e7]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen size={18} className="text-zinc-900" />
            <span className="font-semibold text-zinc-900 text-sm tracking-tight">
              RoadMind
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {userId ? (
              <Link
                href="/explore"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/explore"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#e4e4e7] rounded-md text-zinc-900 hover:bg-[#fafafa] transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fafafa] border border-[#e4e4e7] rounded-full text-xs text-[#52525b] mb-8">
          <Zap size={10} className="text-zinc-900" />
          Platform belajar berbasis AI
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 leading-tight mb-6">
          Belajar lebih cepat,
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
            }}
          >
            dengan panduan AI
          </span>
        </h1>
        <p className="text-base sm:text-lg text-[#71717a] max-w-xl mx-auto mb-10 leading-relaxed">
          RoadMind adalah platform kursus hybrid — konten di-generate AI, bisa
          diedit creator, dan terbuka untuk semua. Belajar atau mulai mengajar
          hari ini.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
          >
            Mulai Belajar
            <ArrowRight size={15} />
          </Link>
          <button
            onClick={handleCreateCourse}
            className="flex items-center gap-2 px-6 py-3 border border-[#e4e4e7] text-zinc-900 rounded-xl text-sm font-medium hover:bg-[#fafafa] transition-colors w-full sm:w-auto justify-center"
          >
            <PenLine size={15} />
            Buat Course
          </button>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────── */}
      <section className="bg-[#fafafa] border-y border-[#e4e4e7] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#71717a] mb-10">
            Kenapa RoadMind?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#e4e4e7] rounded-2xl p-6"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-[#71717a] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Courses ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#71717a] mb-1">
              Dari komunitas
            </p>
            <h2 className="text-2xl font-bold text-zinc-900">Course Terbaru</h2>
          </div>
          <Link
            href="/explore"
            className="text-xs text-[#71717a] hover:text-zinc-900 transition-colors flex items-center gap-1"
          >
            Lihat semua <ArrowRight size={11} />
          </Link>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-36 bg-[#fafafa] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#e4e4e7] rounded-2xl">
            <p className="text-sm text-[#71717a]">Belum ada course tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="group border border-[#e4e4e7] rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all bg-white"
              >
                <div className="w-8 h-8 rounded-lg bg-[#fafafa] flex items-center justify-center mb-3 text-base">
                  📚
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 group-hover:underline leading-snug mb-1 line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-xs text-[#71717a] line-clamp-2 mb-3 leading-relaxed">
                  {c.description}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-[#71717a]">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {c.subscriberCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers size={10} />
                    {c.levelCount} level
                  </span>
                  <span className="truncate ml-auto">{c.creatorName}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Siap mulai belajar?
          </h2>
          <p className="text-sm text-[#71717a] mb-8">
            Jelajahi ratusan course gratis atau buat course-mu sendiri sekarang.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-50 transition-colors w-full sm:w-auto"
            >
              Jelajahi Course
            </Link>
            <button
              onClick={handleCreateCourse}
              className="px-6 py-3 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              Mulai Mengajar
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e4e4e7] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-[#71717a]" />
            <span className="text-sm font-semibold text-zinc-900">
              RoadMind
            </span>
          </div>
          <p className="text-xs text-[#71717a]">
            © {new Date().getFullYear()} RoadMind. Platform belajar berbasis AI.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-xs text-[#71717a] hover:text-zinc-900 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/mycourse/create"
              className="text-xs text-[#71717a] hover:text-zinc-900 transition-colors"
            >
              Buat Course
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Tidak pakai AppLayout (sidebar) — full-page standalone
LandingPage.getLayout = (page: ReactElement) => page;
