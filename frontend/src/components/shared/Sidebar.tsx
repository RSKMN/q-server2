"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/molecules", label: "Molecules" },
  { href: "/chemical-space", label: "Chemical Space" },
  { href: "/similarity-search", label: "Similarity Search" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-14 items-center border-b border-slate-200 px-6 dark:border-slate-700">
        <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Scientific Dashboard
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
