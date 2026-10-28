'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const FRAME = { w: 1440, h: 1024 };

/**
 * The 1440×1024 Figma frame scaled uniformly to the container width (never above 1), centred when wider.
 * `?visual=1` forces scale 1 and marks the layer with `data-stage` for scripts/visual-check.mjs.
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [visual, setVisual] = useState(false);

  useLayoutEffect(() => {
    const isVisual = new URLSearchParams(window.location.search).get('visual') === '1';
    setVisual(isVisual);
    const el = ref.current;
    if (!el || isVisual) return setScale(1);
    const update = () => setScale(Math.min(el.clientWidth / FRAME.w, 1));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = scale ?? 1;
  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ height: FRAME.h * s }}>
      <div
        data-stage={visual ? '' : undefined}
        className="relative mx-auto bg-surface-wall"
        style={{
          width: FRAME.w,
          height: FRAME.h,
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
