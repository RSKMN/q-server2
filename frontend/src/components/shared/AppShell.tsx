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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Mobile nav */}
      <MobileNav />

      <div className="flex min-h-0 flex-1">
        {/* Left sidebar */}
        <div
          className={`hidden flex-shrink-0 transition-all duration-300 ease-in-out sm:block ${
            isSidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          <Sidebar
            collapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          />
        </div>

        {/* Main workspace */}
        <main className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-background/50">
          <div className="mx-auto min-h-full max-w-[1600px] p-6 lg:p-10">
            {children}
          </div>
        </main>

        {/* Right panel */}
        <RightPanel isOpen={isRightPanelOpen} onToggle={toggleRightPanel} />
      </div>
    </div>
  );
}

