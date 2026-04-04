import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className = "" }: TooltipProps) {
  const placementClass =
    position === "bottom"
      ? "top-full mt-2 left-1/2 -translate-x-1/2"
      : "bottom-full mb-2 left-1/2 -translate-x-1/2";

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 w-max max-w-[220px] rounded-md border border-white/15 bg-slate-900/95 px-2 py-1 text-[11px] font-medium leading-4 text-slate-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${placementClass}`}
      >
        {content}
      </span>
    </span>
  );
}