"use client";

import { useState } from "react";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className="flex h-dvh w-full flex-col overflow-hidden lg:h-screen"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Mobile nav - horizontal scroll on small screens */}
      <MobileNav />

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar - fixed width, hidden on mobile */}
        <div className={`hidden flex-shrink-0 sm:block ${isSidebarCollapsed ? "w-16" : "w-52 md:w-56"}`}>
          <Sidebar collapsed={isSidebarCollapsed} onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)} />
        </div>

        {/* Main workspace - scrollable */}
        <main
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300"
          style={{
            backgroundColor: "var(--muted-bg)",
          }}
        >
          <div className="min-h-full p-4 sm:p-6">{children}</div>
        </main>

        {/* Right panel - collapsible */}
        <RightPanel isOpen={isRightPanelOpen} onToggle={toggleRightPanel} />
      </div>
    </div>
  );
}
