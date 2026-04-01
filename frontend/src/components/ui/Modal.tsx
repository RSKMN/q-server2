"use client";

import { useEffect, useRef, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  closeOnOutsideClick?: boolean;
}

const EXIT_ANIMATION_MS = 200;

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function Modal({
  isOpen,
  onClose,
  title,
  content,
  actions,
  children,
  closeOnOutsideClick = true,
}: ModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }

    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      closeTimerRef.current = null;
    }, EXIT_ANIMATION_MS);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isRendered, onClose]);

  if (!isRendered) {
    return null;
  }

  const resolvedContent = content ?? children;

  return (
    <div
      className={joinClasses(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
      )}
      onClick={(event) => {
        if (closeOnOutsideClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden="true" />

      <section
        className={joinClasses(
          "relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/30 transition-all duration-200",
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-2",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title ? (
          <header className="border-b border-white/10 px-6 py-4">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
              {title}
            </h2>
          </header>
        ) : null}

        {resolvedContent ? <div className="px-6 py-5 text-slate-200">{resolvedContent}</div> : null}

        {actions ? <footer className="border-t border-white/10 px-6 py-4">{actions}</footer> : null}
      </section>
    </div>
  );
}

export type { ModalProps };
