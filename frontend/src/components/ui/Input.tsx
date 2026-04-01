import { forwardRef, useId } from "react";

interface BaseFieldProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    BaseFieldProps {}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

interface FieldShellProps extends BaseFieldProps {
  id: string;
  errorId: string;
  hasError: boolean;
  children: React.ReactNode;
}

function FieldShell({
  id,
  errorId,
  label,
  error,
  hasError,
  containerClassName,
  labelClassName,
  children,
}: FieldShellProps) {
  return (
    <div className={joinClasses("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={id} className={joinClasses("mb-2 block text-sm font-medium text-slate-200", labelClassName)}>
          {label}
        </label>
      ) : null}

      {children}

      {hasError ? (
        <p id={errorId} className="mt-2 text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, className, containerClassName, labelClassName, "aria-describedby": ariaDescribedBy, ...props },
  ref,
) {
  const generatedId = useId().replace(/:/g, "");
  const fieldId = id ?? `input-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  const describedBy = joinClasses(ariaDescribedBy, hasError && errorId) || undefined;

  return (
    <FieldShell
      id={fieldId}
      errorId={errorId}
      label={label}
      error={error}
      hasError={hasError}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
    >
      <input
        id={fieldId}
        ref={ref}
        className={joinClasses(
          "w-full rounded-lg border bg-slate-900/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
          hasError
            ? "border-rose-500/70 focus-visible:ring-rose-400"
            : "border-slate-700 hover:border-slate-600",
          className,
        )}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    error,
    className,
    containerClassName,
    labelClassName,
    rows = 4,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId().replace(/:/g, "");
  const fieldId = id ?? `textarea-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(error);

  const describedBy = joinClasses(ariaDescribedBy, hasError && errorId) || undefined;

  return (
    <FieldShell
      id={fieldId}
      errorId={errorId}
      label={label}
      error={error}
      hasError={hasError}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
    >
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        className={joinClasses(
          "w-full rounded-lg border bg-slate-900/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
          hasError
            ? "border-rose-500/70 focus-visible:ring-rose-400"
            : "border-slate-700 hover:border-slate-600",
          className,
        )}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldShell>
  );
});

Input.displayName = "Input";
Textarea.displayName = "Textarea";
