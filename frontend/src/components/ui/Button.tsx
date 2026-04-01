import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
}

const BASE_STYLES =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:hover:bg-cyan-400",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:hover:bg-slate-800",
  outline:
    "border border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800/60 disabled:hover:bg-transparent",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-800/50 disabled:hover:bg-transparent",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={joinClasses(
        BASE_STYLES,
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{loadingText ?? children ?? "Loading"}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";
