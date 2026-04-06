"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <path d="M4 13.5V20h6v-6.5H4Zm10 0V20h6v-6.5h-6ZM4 4v6.5h6V4H4Zm10 0v6.5h6V4h-6Z" />
    ),
  },
  {
    href: "/molecules",
    label: "Molecules",
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
    label: "Results",
    icon: (
      <path d="M5 4h14v16H5V4Zm2 2v12h10V6H7Zm2 2h6v2H9V8Zm0 4h6v2H9v-2Z" />
    ),
  },
  {
    href: "/similarity-search",
    label: "Similarity Search",
    icon: (
      <path d="M11 3a8 8 0 1 0 4.9 14.3L21 22l1-1-5.1-4.7A8 8 0 0 0 11 3Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
    ),
  },
] ;

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col border-r transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
      style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
    >
      <div
        className={`flex h-14 items-center border-b ${collapsed ? "justify-center px-2" : "px-6"}`}
        style={{ borderColor: "var(--border)" }}
      >
        {collapsed ? (
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} aria-hidden="true" />
        ) : (
          <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Scientific Dashboard
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          const sharedItemStyle = {
            backgroundColor: isActive ? "var(--accent-bg)" : "transparent",
            color: isActive ? "var(--accent-text)" : "var(--muted-text)",
            boxShadow: isActive ? "inset 3px 0 0 var(--accent)" : "none",
          };
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
              style={sharedItemStyle}
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {navItems.find((item) => item.href === href)?.icon}
              </svg>
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
      </nav>
      {onToggleCollapsed ? (
        <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "justify-center" : "justify-start"}`}
            style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "transparent" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="text-base" aria-hidden="true">
              {collapsed ? "→" : "←"}
            </span>
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
