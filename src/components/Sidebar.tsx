import {
  BookOpen,
  Brain,
  FileText,
  FlaskConical,
  Home,
  Layers,
  Library,
  LogOut,
  Map,
  Timer,
  User,
} from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
}

const workspaceNav: NavItem[] = [
  { href: "/", label: "Explore", icon: <Home size={15} /> },
  { href: "/roadmind", label: "My Roadmaps", icon: <Map size={15} /> },
];

const toolsNav: NavItem[] = [
  {
    href: "/learning-plan",
    label: "Learning Plan",
    icon: <Timer size={15} />,
  },
  {
    href: "/cheat-sheet",
    label: "Cheat Sheet",
    icon: <FileText size={15} />,
  },
  {
    href: "/ladder",
    label: "Learning Ladder",
    icon: <Layers size={15} />,
  },
  {
    href: "/resources",
    label: "Resources",
    icon: <Library size={15} />,
  },
  {
    href: "/quiz",
    label: "Quiz",
    icon: <FlaskConical size={15} />,
  },
  {
    href: "/feynman",
    label: "Feynman Loop",
    icon: <Brain size={15} />,
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

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
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[#f7f7f5] border-r border-[#e9e9e7] z-30 flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
          <BookOpen size={18} className="text-[#37352f]" />
          <span className="font-semibold text-[#37352f] text-sm tracking-tight">
            RoadMind
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {/* Workspace */}
          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#9b9a97]">
              Workspace
            </p>
            {workspaceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors
                  ${
                    isActive(item.href)
                      ? "bg-[#e9e9e7] text-[#37352f] font-medium"
                      : "text-[#5b5a57] hover:bg-[#efefed] hover:text-[#37352f]"
                  }`}
              >
                <span className="opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Tools */}
          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#9b9a97]">
              Tools
            </p>
            {toolsNav.map((item) =>
              item.soon ? (
                <div
                  key={item.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[#9b9a97] cursor-not-allowed"
                >
                  <span className="opacity-50">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[9px] bg-[#e9e9e7] text-[#9b9a97] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                    soon
                  </span>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors
                    ${
                      isActive(item.href)
                        ? "bg-[#e9e9e7] text-[#37352f] font-medium"
                        : "text-[#5b5a57] hover:bg-[#efefed] hover:text-[#37352f]"
                    }`}
                >
                  <span className="opacity-60">{item.icon}</span>
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>

        {/* User section */}
        <div className="border-t border-[#e9e9e7] p-2">
          {user ? (
            <div>
              <div className="flex items-center gap-2.5 px-2 py-2">
                {user.photoURL ? (
                  // photoURL comes from Google OAuth — trusted source
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#e9e9e7] flex items-center justify-center">
                    <User size={12} className="text-[#9b9a97]" />
                  </div>
                )}
                <span className="text-xs text-[#37352f] truncate flex-1">
                  {user.displayName ?? user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm text-[#9b9a97] hover:bg-[#efefed] hover:text-[#37352f] transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm bg-[#37352f] text-white hover:bg-[#2f2d2a] transition-colors disabled:opacity-50"
            >
              <User size={13} />
              {authLoading ? "Masuk..." : "Login dengan Google"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
