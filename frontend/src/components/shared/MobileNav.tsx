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
    <nav
      className="flex gap-1 border-b px-2 py-2 sm:hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
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
              className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "var(--muted-bg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--muted-text)",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
