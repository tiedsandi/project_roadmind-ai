import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { useRouter } from "next/router";

const PAGE_TITLES: Record<string, string> = {
  "/": "Explore",
  "/roadmind": "My Roadmaps",
  "/learning-plan": "Learning Plan",
  "/cheat-sheet": "Cheat Sheet",
  "/ladder": "Learning Ladder",
  "/resources": "Resources",
  "/quiz": "Quiz",
  "/feynman": "Feynman Loop",
};

function usePageTitle() {
  const { pathname } = useRouter();
  // Match exact atau prefix (misal /roadmind/[id])
  const key = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)));
  return key ? PAGE_TITLES[key] : "RoadMind";
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = usePageTitle();

  return (
    <div className="min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area — offset by sidebar width on desktop */}
      <div className="md:ml-60 h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#e9e9e7] sticky top-0 bg-white/90 backdrop-blur-sm z-10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#37352f] hover:bg-[#efefed] p-1.5 rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-[#37352f] text-sm">{title}</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
