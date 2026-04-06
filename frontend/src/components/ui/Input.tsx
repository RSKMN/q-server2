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
        <label
          htmlFor={id}
          className={joinClasses("mb-2 block text-sm font-medium", labelClassName)}
          style={{ color: "var(--text)" }}
        >
          {label}
        </label>
      ) : null}

      {children}

      {hasError ? (
        <p
          id={errorId}
          className="mt-2 text-sm"
          style={{ color: "var(--error)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    error,
    className,
    containerClassName,
    labelClassName,
    "aria-describedby": ariaDescribedBy,
    style,
    ...props
  },
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
          "w-full rounded-lg border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          hasError ? "focus-visible:ring-offset-transparent" : "",
          className,
        )}
        style={{
          backgroundColor: "var(--input-bg)",
          color: "var(--input-text)",
          borderColor: hasError ? "var(--error)" : "var(--input-border)",
          ...style,
        }}
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
    style,
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
          "w-full rounded-lg border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          hasError ? "focus-visible:ring-offset-transparent" : "",
          className,
        )}
        style={{
          backgroundColor: "var(--input-bg)",
          color: "var(--input-text)",
          borderColor: hasError ? "var(--error)" : "var(--input-border)",
          ...style,
        }}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldShell>
  );
});

Input.displayName = "Input";
Textarea.displayName = "Textarea";
