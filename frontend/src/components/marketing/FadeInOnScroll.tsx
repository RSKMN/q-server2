"use client";

import { useEffect, useRef, useState } from "react";

type FadeInOnScrollProps = {
  children: React.ReactNode;
  delayMs?: number;
};

export function FadeInOnScroll({ children, delayMs = 0 }: FadeInOnScrollProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`reveal-on-scroll ${isVisible ? "is-visible" : ""}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
