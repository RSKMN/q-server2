"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/molecules", label: "Molecules" },
  { href: "/chemical-space", label: "Chemical Space" },
  { href: "/visualization", label: "Visualization" },
  { href: "/results", label: "Results" },
  { href: "/similarity-search", label: "Similarity Search" },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border/50 bg-card px-4 py-3 sm:hidden">
      <div className="flex w-full gap-2 overflow-x-auto scrollbar-none">
        {navItems.map(({ href, label }) => {
          const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-surface-subtle text-text-secondary hover:text-text"
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

