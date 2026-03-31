import { BookOpen, Compass, LayoutDashboard, LogOut, User } from "lucide-react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { Course, Subscription } from "@/repositories/types";
import { courseRepository, subscriptionRepository } from "@/repositories";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [subCourses, setSubCourses] = useState<Course[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setSubCourses([]);
      return;
    }
    setLoadingSubs(true);
    subscriptionRepository
      .getByUserId(user.uid)
      .then(async (subs: Subscription[]) => {
        const courses = await Promise.all(
          subs.map((s) => courseRepository.getById(s.courseId)),
        );
        setSubCourses(courses.filter((c): c is Course => c !== null));
      })
      .catch(console.error)
      .finally(() => setLoadingSubs(false));
  }, [user]);

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch {
      // silent
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/explore");
  };

  const isActive = (href: string) =>
    router.pathname === href || router.pathname.startsWith(href + "/");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-white border-r border-zinc-200 z-30 flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center gap-2">
          <BookOpen size={17} className="text-zinc-900 flex-shrink-0" />
          <span className="font-semibold text-zinc-900 text-sm tracking-tight">
            RoadMind
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5">
          {/* WORKSPACE */}
          <div>
            <p className="px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#71717a]">
              Workspace
            </p>

            <Link
              href="/explore"
              onClick={onClose}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                isActive("/explore")
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-[#52525b] hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Compass size={14} className="flex-shrink-0 opacity-70" />
              Explore
            </Link>

            {user && (
              <Link
                href="/mycourse"
                onClick={onClose}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  isActive("/mycourse")
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-[#52525b] hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <LayoutDashboard
                  size={14}
                  className="flex-shrink-0 opacity-70"
                />
                Kursus Saya
              </Link>
            )}
          </div>

          {/* SUBSCRIPTIONS */}
          {user && (
            <div>
              <p className="px-2 mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#71717a]">
                Langganan
              </p>

              {loadingSubs ? (
                <div className="space-y-1 px-2 mt-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-5 bg-[#e4e4e7] rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : subCourses.length === 0 ? (
                <p className="px-2 mt-1 text-xs text-[#a1a1aa] italic">
                  Belum ada course yang diikuti
                </p>
              ) : (
                <div className="space-y-0.5 mt-0.5">
                  {subCourses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      onClick={onClose}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                        isActive(`/courses/${c.id}`)
                          ? "bg-indigo-50 text-indigo-600 font-medium"
                          : "text-[#52525b] hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                      title={c.title}
                    >
                      <span className="w-1 h-1 rounded-full bg-[#a1a1aa] flex-shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Login prompt (unauthenticated) */}
          {!user && (
            <div className="px-2">
              <p className="text-xs text-[#71717a] leading-relaxed">
                Login untuk akses Kursus Saya dan Langganan.
              </p>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="border-t border-[#e4e4e7] px-2 py-2">
          {user ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 px-2 py-1.5">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#e4e4e7] flex items-center justify-center flex-shrink-0">
                    <User size={11} className="text-[#71717a]" />
                  </div>
                )}
                <span className="text-xs text-zinc-900 truncate">
                  {user.displayName ?? user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              >
                <LogOut size={13} />
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-[#52525b] hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-50"
            >
              <User size={14} />
              {authLoading ? "Login..." : "Login dengan Google"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
