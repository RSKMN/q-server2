"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthenticated, removeToken } from "@/services";
import { ThemeToggle } from "@/components/shared";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <path d="M4 13.5V20h6v-6.5H4Zm10 0V20h6v-6.5h-6ZM4 4v6.5h6V4H4Zm10 0v6.5h6V4h-6Z" /> },
  { label: "Workspace", href: "/workspace", icon: <path d="M4 6h16v12H4V6Zm2 2v8h12V8H6Zm2 1h8v2H8V9Zm0 4h5v2H8v-2Z" /> },
  { label: "Molecules", href: "/molecules", icon: <path d="M12 2a4 4 0 0 1 4 4c0 .7-.18 1.36-.5 1.93l2.8 2.8A4 4 0 1 1 14.07 15l-2.8-2.8A4 4 0 1 1 8 6a4 4 0 0 1 4-4Z" /> },
  { label: "Similarity", href: "/similarity", icon: <path d="M11 3a8 8 0 1 0 4.9 14.3L21 22l1-1-5.1-4.7A8 8 0 0 0 11 3Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" /> },
  { label: "Chemical Space", href: "/chemical-space", icon: <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6 3.3-6 3.3-6-3.3 6-3.3Z" /> },
  { label: "Visualization", href: "/visualization", icon: <path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h8v2H8V9Zm0 4h5v2H8v-2Z" /> },
  { label: "Results", href: "/results", icon: <path d="M5 4h14v16H5V4Zm2 2v12h10V6H7Zm2 2h6v2H9V8Zm0 4h6v2H9v-2Z" /> },
  { label: "Simulation", href: "/simulation", icon: <path d="M6 4h12v3H6V4Zm0 5h12v11H6V9Zm3 2v7l6-3.5L9 11Z" /> },
  { label: "Copilot", href: "/copilot", icon: <path d="M12 2 2 7v10l10 5 10-5V7L12 2Zm0 2.3 6.9 3.4L12 11.1 5.1 7.7 12 4.3ZM4 9.1l7 3.5v7.3L4 16.4V9.1Zm16 0v7.3l-7 3.5v-7.3l7-3.5Z" /> },
  { label: "History", href: "/history", icon: <path d="M13 3a9 9 0 1 0 8.9 10.5H20a8 8 0 1 1-2.3-5.7L15 10h6V4l-2.1 2.1A8.9 8.9 0 0 0 13 3Z" /> },
  { label: "Settings", href: "/settings", icon: <path d="M12 8.5A3.5 3.5 0 1 0 12 15a3.5 3.5 0 0 0 0-6.5Zm8 3.5-.9-.5.1-1.1-1.5-2.6-1.1.1-.7-.8-1.1-2H12l-.8 1.7-.9.1-.7.8-1.1-.1-1.5 2.6.1 1.1L4 12l.1 3 1 .5-.1 1.1 1.5 2.6 1.1-.1.7.8 1.1 2H12l.8-1.7.9-.1.7-.8 1.1.1 1.5-2.6-.1-1.1 1-.5.1-3Z" /> },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    setCanAccess(true);
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.replace("/");
  };

  if (!canAccess) {
    return <div className="min-h-screen" style={{ background: "var(--bg)" }} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r backdrop-blur-xl lg:flex ${isSidebarCollapsed ? "w-20" : "w-72"}`} style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--card) 92%, transparent)" }}>
        <div className="flex h-full flex-col">
          <div className={`border-b py-5 ${isSidebarCollapsed ? "px-3 text-center" : "px-6"}`} style={{ borderColor: "var(--border)" }}>
            {isSidebarCollapsed ? (
              <div className="mx-auto h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} aria-hidden="true" />
            ) : (
              <>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  Quinfosys<span style={{ verticalAlign: "super", fontSize: "0.65em", lineHeight: 0 }}>™</span> QuDrugForge
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--muted-text)" }}>
                  Quantum AI for Drug Discovery
                </p>
              </>
            )}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

              return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${isSidebarCollapsed ? "justify-center" : ""}`}
                style={{
                  borderColor: isActive ? "var(--accent-border)" : "transparent",
                  backgroundColor: isActive ? "var(--accent-bg)" : "transparent",
                  color: isActive ? "var(--accent-text)" : "var(--muted-text)",
                  boxShadow: isActive ? "inset 3px 0 0 var(--accent)" : "none",
                }}
                aria-label={item.label}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {item.icon}
                </svg>
                {!isSidebarCollapsed ? <span>{item.label}</span> : null}
              </Link>
              );
            })}
          </nav>

          <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isSidebarCollapsed ? "justify-center" : "justify-start"}`}
              style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "transparent" }}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-base" aria-hidden="true">
                {isSidebarCollapsed ? "→" : "←"}
              </span>
              {!isSidebarCollapsed ? <span>Collapse</span> : null}
            </button>
          </div>
        </div>
      </aside>

      <div className="transition-[padding] duration-200 lg:pl-72" style={{ paddingLeft: isSidebarCollapsed ? "5rem" : undefined }}>
        <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--muted-text)" }}>Dashboard</p>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Scientific Workspace
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <ThemeToggle />
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
              <div className="hidden text-sm sm:block" style={{ color: "var(--muted-text)" }}>Research User</div>
              <button
                type="button"
                onClick={handleLogout}
                className="ui-button rounded-md border px-3 py-1.5 text-xs font-medium transition"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "transparent" }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="h-[calc(100vh-4rem)] overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}