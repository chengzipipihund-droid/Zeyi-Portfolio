'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const FRAME = { w: 1440, h: 1024 };

/** Pointer position in stage px (Figma frame coordinates), whatever the current scale. */
export function stagePoint(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  const layer = document.querySelector<HTMLElement>('[data-stage-layer]');
  if (!layer) return null;
  const r = layer.getBoundingClientRect();
  const s = r.width / FRAME.w;
  return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
}

/**
 * The 1440×1024 Figma frame scaled uniformly to the container width (never above 1), centred when wider.
 * `?visual=1` forces scale 1 and marks the layer with `data-stage` for scripts/visual-check.mjs.
 * `band`: a strip of the same frame drawn elsewhere (the sticky site header) — same scale, but not the stage that
 * stagePoint() and the visual check look for.
 */
export function Stage({ children, width = FRAME.w, height = FRAME.h, band = false }: { children: ReactNode; width?: number; height?: number; band?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [visual, setVisual] = useState(false);

  useLayoutEffect(() => {
    const isVisual = new URLSearchParams(window.location.search).get('visual') === '1';
    setVisual(isVisual);
    const el = ref.current;
    if (!el || isVisual) return setScale(1);
    const update = () => setScale(Math.min(el.clientWidth / width, 1));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const s = scale ?? 1;
  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ height: height * s }}>
      <div
        data-stage={visual && !band ? '' : undefined}
        data-stage-layer={band ? undefined : ''}
        className="relative mx-auto bg-surface-wall"
        style={{
          width: width,
          height: height,
          transform: `scale(${s})`,
          transformOrigin: 'top left',
          visibility: scale === null ? 'hidden' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
