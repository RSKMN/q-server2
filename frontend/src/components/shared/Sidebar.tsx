"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Intelligence",
    icon: (
      <path d="M4 13.5V20h6v-6.5H4Zm10 0V20h6v-6.5h-6ZM4 4v6.5h6V4H4Zm10 0v6.5h6V4h-6Z" />
    ),
  },
  {
    href: "/molecules",
    label: "Molecule Explorer",
    icon: (
      <path d="M12 2a4 4 0 0 1 4 4c0 .7-.18 1.36-.5 1.93l2.8 2.8A4 4 0 1 1 14.07 15l-2.8-2.8A4 4 0 1 1 8 6a4 4 0 0 1 4-4Zm-5 13.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm10 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    ),
  },
  {
    href: "/chemical-space",
    label: "Chemical Space",
    icon: (
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6 3.3-6 3.3-6-3.3 6-3.3Zm-7 5.2 6 3.3v6.7l-6-3.3V9.5Zm14 0v6.7l-6 3.3v-6.7l6-3.3Z" />
    ),
  },
  {
    href: "/visualization",
    label: "Visualization",
    icon: (
      <path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h8v2H8V9Zm0 4h5v2H8v-2Z" />
    ),
  },
  {
    href: "/results",
    label: "Screening Results",
    icon: (
      <path d="M5 4h14v16H5V4Zm2 2v12h10V6H7Zm2 2h6v2H9V8Zm0 4h6v2H9v-2Z" />
    ),
  },
  {
    href: "/similarity-search",
    label: "Similarity Engine",
    icon: (
      <path d="M11 3a8 8 0 1 0 4.9 14.3L21 22l1-1-5.1-4.7A8 8 0 0 0 11 3Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
    ),
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-card transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`flex h-20 items-center border-b border-border/50 ${collapsed ? "justify-center px-2" : "px-6"}`}>
        {collapsed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-text">OncoResearch</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">AI PLATFORM</span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {navItems.map(({ href, label, icon }) => {
          const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-text-secondary hover:bg-surface-subtle hover:text-text"
              } ${collapsed ? "justify-center" : ""}`}
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {icon}
              </svg>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {label}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-primary"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-4">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-surface-subtle px-4 py-2.5 text-xs font-semibold text-text transition-all hover:bg-border/30 active:scale-95"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className={`text-sm transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            ←
          </span>
          {!collapsed && <span>COLLAPSE SYSTEM</span>}
        </button>
      </div>
    </aside>
  );
}

