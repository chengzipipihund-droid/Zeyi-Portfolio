'use client';

import type { CSSProperties } from 'react';

/** "Back to top" above the next-tool card (Zeyi, 2026-11-01 — not in Figma): scrolls the case page back up. */
export function BackToTop({ style }: { style: CSSProperties }) {
  const up = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    // keyboard users land on the page's first link, not at the bottom
    document.querySelector<HTMLElement>('header a')?.focus({ preventScroll: true });
  };
  return (
    <button
      type="button"
      onClick={up}
      className="type-label cursor-pointer border-0 bg-transparent p-0 text-text-secondary outline-none hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
      style={style}
    >
      BACK TO TOP ↑
    </button>
  );
}
