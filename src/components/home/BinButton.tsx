'use client';

import t0 from '@/data/figma/layouts/t0.json';
import t1 from '@/data/figma/layouts/t1.json';
import { useEffect, useState, type ReactNode } from 'react';
import { stagePoint } from '@/components/stage/Stage';
import type { LayoutNode } from '@/lib/figma/types';
import { HOME_MOTION } from '@/styles/motion';
import { useHome } from './HomeState';
import { HoverTarget } from './MotionLayer';

const box = (layout: unknown, name: string) => {
  const { left, top, width, height } = (layout as { items: LayoutNode[] }).items.find((n) => n.name === name)!.css!;
  return { left, top, width, height };
};
// The bin where it stands: on the desk in T0, on the board in T1 / with the cards stowed.
const DESK_BIN = box(t0, 'Archive bin');
const BOARD_BIN = box(t1, 'Project bin');
const inside = (p: { x: number; y: number }, b: typeof BOARD_BIN) => p.x >= b.left && p.x <= b.left + b.width && p.y >= b.top && p.y <= b.top + b.height;

/**
 * The Project bin (with the minis in it).
 * T0: hover fans the minis out, click / Enter / Space opens the board.
 * Board (Zeyi, 2026-10-29): the SCADA+ card covers part of the bin, so the bin reacts to the pointer anywhere inside its
 * own box — it lifts above the cards — and a click collects the cards into it (Animation A backwards to T0.5) or, when they
 * are stowed, hangs them up again.
 */
export function BinButton({ children }: { children: ReactNode }) {
  const home = useHome();
  const onBoard = home.phase === 't1' || home.phase === 'stowed';
  const [hot, setHot] = useState(false);

  useEffect(() => {
    setHot(false);
    if (!onBoard) return;
    const move = (e: PointerEvent) => {
      const p = stagePoint(e);
      setHot(!!p && inside(p, BOARD_BIN));
    };
    const leave = () => setHot(false);
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [onBoard]);

  const { lift, duration } = HOME_MOTION.binHover;
  // One stable tree in every phase (no remount when Animation A starts); the wrapper never takes pointer events itself.
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
      <HoverTarget hover="bin" label="Open the project board" onActivate={home.openBoard} focusBox={DESK_BIN}>
        {children}
      </HoverTarget>
      {onBoard && (
        <button
          type="button"
          aria-label={home.phase === 't1' ? 'Put the cards back in the bin' : 'Hang the cards up'}
          onClick={home.phase === 't1' ? home.collectCards : home.hangCards}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          className="pointer-events-auto absolute m-0 cursor-pointer appearance-none rounded-[4px] border-0 bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
          style={BOARD_BIN}
        />
      )}
    </div>
  );
}
