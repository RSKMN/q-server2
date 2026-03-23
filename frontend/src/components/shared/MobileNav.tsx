"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/molecules", label: "Molecules" },
  { href: "/chemical-space", label: "Chemical Space" },
  { href: "/similarity-search", label: "Similarity Search" },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-800 sm:hidden">
      <div className="flex w-full gap-1 overflow-x-auto">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
