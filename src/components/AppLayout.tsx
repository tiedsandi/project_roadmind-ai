import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area — offset by sidebar width on desktop */}
      <div className="md:ml-60 h-screen flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#e9e9e7] sticky top-0 bg-white z-10 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#37352f] hover:bg-[#efefed] p-1 rounded"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-[#37352f] text-sm">RoadMind</span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
