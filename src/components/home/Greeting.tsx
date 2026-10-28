'use client';

import { useEffect, useState } from 'react';
import { useHome } from './HomeState';

// Figma TextStagger on "T0 · Hover hi": grouping CHARACTER, 1.1 s, linear (docs/home-page-brief.md §7.1).
const TYPE_DURATION = 1.1;

/** The greeting above the hi plate, typed one character at a time while the plate is hovered. */
export function Greeting({ text }: { text: string }) {
  const { hover, forcedHover } = useHome();
  const on = hover === 'hi';
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!on) return;
    if (forcedHover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setShown(text.length);
    setShown(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const n = Math.min(text.length, Math.floor(((now - start) / 1000 / TYPE_DURATION) * text.length) + 1);
      setShown(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, forcedHover, text]);

  return (
    <span aria-live="polite">
      <span className="sr-only">{on ? text : ''}</span>
      <span aria-hidden>
        {[...text].map((ch, i) => (
          <span key={i} style={{ opacity: i < shown ? 1 : 0 }}>{ch}</span>
        ))}
      </span>
    </span>
  );
}
