import { toFriendlyErrorMessage } from "@/services/api";

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  message = "Something did not load as expected.",
  title = "We hit a small hiccup",
  onRetry,
  retryLabel = "Try again",
  className = "",
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={`ui-fade-in ui-state-transition rounded-xl border border-rose-300/40 bg-rose-50/70 p-4 text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/30 dark:text-rose-100 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-rose-800/90 dark:text-rose-200/90">{message}</p>
          <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">
            You can retry now. Existing data will stay visible when available.
          </p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="ui-button inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/50"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface ApiErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  fallbackMessage?: string;
  title?: string;
  className?: string;
}

export function ApiErrorState({
  error,
  onRetry,
  fallbackMessage,
  title,
  className,
}: ApiErrorStateProps) {
  return (
    <ErrorState
      title={title}
      message={toFriendlyErrorMessage(error, fallbackMessage)}
      onRetry={onRetry}
      className={className}
    />
  );
}