import { useId, type ReactNode } from 'react';
import { componentTree } from '@/lib/figma/specs';

// Board/Panel (1019-296): hole fields start at the panel's first child; each hole is Board/Hole (8×24, r 4)
// on the 40 px grid, 12 px right / 8 px down inside its cell → first hole at (20, 20).
const panel = componentTree('Board/Panel')!;
const field = panel.children![0];
const hole = componentTree('Board/Hole')!;
const CELL = 40;
const HOLE_IN_CELL = { x: 12, y: 8 };

export type BoardSurface = 'light' | 'accent';

/** Board/Panel: pegboard with holes. `surface` = Figma "Pegboard / Surface" mode (inherited when omitted); colours follow data-theme. */
export function Board({
  width,
  height,
  surface,
  children,
  className,
}: {
  width: number;
  height: number;
  surface?: BoardSurface;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      data-surface={surface}
      className={`relative overflow-hidden rounded-board bg-board-fill ${className ?? ''}`}
      style={{ width, height }}
    >
      <svg aria-hidden className="absolute inset-0" width={width} height={height}>
        <defs>
          <pattern id={`${id}-holes`} x={field.x} y={field.y} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect x={HOLE_IN_CELL.x} y={HOLE_IN_CELL.y} width={hole.w} height={hole.h} rx={hole.radius as number} style={{ fill: 'var(--board-hole)' }} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${id}-holes)`} />
      </svg>
      {children}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-board border-[length:var(--stroke-line)] border-board-stroke" />
    </div>
  );
}
