'use client';

import t0 from '@/data/figma/layouts/t0.json';
import t1 from '@/data/figma/layouts/t1.json';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { stagePoint } from '@/components/stage/Stage';
import type { LayoutNode } from '@/lib/figma/types';
import { HOME_MOTION } from '@/styles/motion';
import { useHome } from './HomeState';
import { HoverTarget } from './MotionLayer';

const box = (layout: unknown, name: string) => {
  const { left, top, width, height } = (layout as { items: LayoutNode[] }).items.find((n) => n.name === name)!.css!;
  return { left, top, width, height };
};
// The Project bin stands on the desk in T0 (Figma layer "Archive bin" in T0 is that bin), on the board in T1.
const DESK_BIN = box(t0, 'Archive bin');
const BOARD_BINS = { project: box(t1, 'Project bin'), archive: box(t1, 'Archive bin') };
const inside = (p: { x: number; y: number }, b: typeof DESK_BIN) => p.x >= b.left && p.x <= b.left + b.width && p.y >= b.top && p.y <= b.top + b.height;

export type BinKind = 'project' | 'archive';

/**
 * A bin on the board.
 * Project bin — T0: hover fans the minis out, click / Enter / Space opens the board. Board: click collects the project
 * cards (Animation A backwards to T0.5) or hangs them up again; with the archive out, it brings the projects back.
 * Archive bin (Zeyi, 2026-10-29): click puts the projects into the Project bin and hangs the archive cards A1–A3 on the
 * hooks; again swaps back. Works at any time on the board, also with the projects collected (2026-10-31).
 * Both (Zeyi): the bin reacts to the pointer anywhere inside its own box — cards may cover it — and lifts above them.
 */
export function BinButton({ kind, children }: { kind: BinKind; children: ReactNode }) {
  const home = useHome();
  const binBox = BOARD_BINS[kind];
  const settled = !home.swapping && (home.phase === 't1' || home.phase === 'stowed');
  const [hot, setHot] = useState(false);

  // Last pointer position, so a board that settles under a still pointer already knows whether the bin is under it
  // (otherwise the first click there would go to the card on top).
  const last = useRef<{ clientX: number; clientY: number } | null>(null);
  useEffect(() => {
    const track = (e: PointerEvent) => (last.current = { clientX: e.clientX, clientY: e.clientY });
    window.addEventListener('pointermove', track, true);
    return () => window.removeEventListener('pointermove', track, true);
  }, []);

  useEffect(() => {
    const p0 = settled && last.current ? stagePoint(last.current) : null;
    setHot(!!p0 && inside(p0, binBox));
    if (!settled) return;
    const move = (e: PointerEvent) => {
      const p = stagePoint(e);
      setHot(!!p && inside(p, binBox));
    };
    const leave = () => setHot(false);
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [settled, binBox]);

  const archiveOut = home.cards === 'archive';
  const action =
    kind === 'archive'
      ? { label: archiveOut ? 'Put the archive back and hang the projects up' : 'Hang the archive up', run: home.toggleArchive }
      : home.phase === 'stowed'
        ? { label: 'Hang the cards up', run: home.hangCards }
        : archiveOut
          ? { label: 'Hang the projects up', run: home.toggleArchive }
          : { label: 'Put the cards back in the bin', run: home.collectCards };

  const { lift, duration } = HOME_MOTION.binHover;
  // One stable tree in every phase (no remount when Animation A starts); the wrapper never takes pointer events itself.
  const content = (
    <HoverTarget hover="bin" label="Open the project board" onActivate={home.openBoard} focusBox={DESK_BIN}>
      {children}
    </HoverTarget>
  );
  return (
    <div
      className="pointer-events-none absolute inset-0 motion-reduce:!transition-none"
      style={{
        zIndex: hot ? 20 : 'auto',
        transform: hot ? `translateY(${-lift}px)` : 'none',
        filter: hot ? 'var(--drop-shadow-lift)' : 'none',
        transition: `transform ${duration}s ease-out, filter ${duration}s ease-out`,
      }}
    >
      {kind === 'project' ? content : children}
      {settled && (
        <button
          type="button"
          aria-label={action.label}
          onClick={action.run}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          className="pointer-events-auto absolute m-0 cursor-pointer appearance-none rounded-[4px] border-0 bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
          style={binBox}
        />
      )}
    </div>
  );
}
