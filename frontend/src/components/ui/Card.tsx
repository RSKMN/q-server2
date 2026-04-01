import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  className,
  header,
  content,
  footer,
  headerClassName,
  contentClassName,
  footerClassName,
  children,
  ...props
}: CardProps) {
  const resolvedContent = content ?? children;

  return (
    <section
      className={joinClasses(
        "rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {header ? (
        <div className={joinClasses("border-b border-white/10 px-6 py-4", headerClassName)}>
          {header}
        </div>
      ) : null}

      {resolvedContent ? (
        <div className={joinClasses("px-6 py-5", contentClassName)}>{resolvedContent}</div>
      ) : null}

      {footer ? (
        <div className={joinClasses("border-t border-white/10 px-6 py-4", footerClassName)}>
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={joinClasses("border-b border-white/10 px-6 py-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={joinClasses("px-6 py-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSectionProps) {
  return <div className={joinClasses("border-t border-white/10 px-6 py-4", className)} {...props} />;
}
