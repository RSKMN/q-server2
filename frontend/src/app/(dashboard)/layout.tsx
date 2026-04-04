"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthenticated, removeToken } from "@/services";

const DASHBOARD_NAV_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Workspace", href: "/workspace" },
  { label: "Molecules", href: "/molecules" },
  { label: "Similarity", href: "/similarity" },
  { label: "Chemical Space", href: "/chemical-space" },
  { label: "Visualization", href: "/visualization" },
  { label: "Results", href: "/results" },
  { label: "Simulation", href: "/simulation" },
  { label: "Copilot", href: "/copilot" },
  { label: "History", href: "/history" },
  { label: "Settings", href: "/settings" },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [canAccess, setCanAccess] = useState(false);

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
    return <div className="min-h-screen bg-slate-950" />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-900/70 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              QuinfosysTM QuDrugForge
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">
              Quantum AI for Drug Discovery
            </h2>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {DASHBOARD_NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg border border-transparent px-3 py-2 text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100">
                Scientific Workspace
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500" />
              <div className="hidden text-sm text-slate-300 sm:block">Research User</div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
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