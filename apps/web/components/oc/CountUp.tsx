"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a real, server-computed number up from 0 when it scrolls into view. Never generates
 * or inflates the number itself — purely a presentation effect on data already fetched from the
 * database. Skips the animation entirely under prefers-reduced-motion (shows the final value
 * immediately). */
export function CountUp({ value, durationMs = 900 }: { value: number; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}
