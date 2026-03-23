"use client";

import { useUiStore } from "@/store";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import MobileNav from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const isRightPanelOpen = useUiStore((s) => s.isRightPanelOpen);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 lg:h-screen">
      {/* Mobile nav - horizontal scroll on small screens */}
      <MobileNav />

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar - fixed width, hidden on mobile */}
        <div className="hidden w-52 flex-shrink-0 sm:block md:w-56">
          <Sidebar />
        </div>

        {/* Main workspace - scrollable */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
          <div className="min-h-full p-4 sm:p-6">{children}</div>
        </main>

        {/* Right panel - collapsible */}
        <RightPanel isOpen={isRightPanelOpen} onToggle={toggleRightPanel} />
      </div>
    </div>
  );
}
