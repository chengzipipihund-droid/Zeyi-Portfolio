'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The chapter tab rail (Zeyi, 2026-11-01): scrolled to, it sticks under the site header as one bar with it; scrolled
 * back up into the hero it stays in its own place. The tab of the chapter being read is State=Current (scroll-spy);
 * a click scrolls smoothly to the chapter (its scroll-margin keeps it clear of both bars).
 * `top`: sticky offset — the rail's empty top padding slides under the header (which is drawn above it).
 */
export function ChapterTabs({ top, label, section, children }: { top: number; label: string; section: string; children: ReactNode }) {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = nav.current!;
    const tabs = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => ({
      a,
      tab: a.querySelector<HTMLElement>('[data-tab]'),
      chapter: document.getElementById(decodeURIComponent(a.hash.slice(1))),
    }));
    let raf = 0;
    const spy = () => {
      raf = 0;
      const line = root.getBoundingClientRect().bottom + 1;
      let current = tabs[0];
      for (const t of tabs) if (t.chapter && t.chapter.getBoundingClientRect().top <= line) current = t;
      for (const t of tabs) {
        const on = t === current;
        t.tab?.toggleAttribute('data-active', on);
        if (on) t.a.setAttribute('aria-current', 'location');
        else t.a.removeAttribute('aria-current');
      }
    };
    const onScroll = () => (raf ||= requestAnimationFrame(spy));
    const onClick = (e: MouseEvent) => {
      const t = tabs.find((x) => x.a.contains(e.target as Node));
      if (!t?.chapter || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      t.chapter.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', t.a.hash);
    };
    spy();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    root.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <nav ref={nav} data-figma-section={section} aria-label={label} className="sticky z-40" style={{ top, background: 'var(--surface-wall)' }}>
      {children}
    </nav>
  );
}
