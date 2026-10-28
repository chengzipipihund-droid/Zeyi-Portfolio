'use client';

import type { ReactNode } from 'react';
import { useHome } from './HomeState';

type Box = { left: number; top: number; width: number; height: number };

/**
 * A button at a layer's Figma box on T1: WORK goes back to the desk (T0, "/"), the Logo replays Animation A.
 * In T0 / during the intro it is inert (WORK shows its Default state there).
 */
export function StageButton({ box, action, label, children }: { box: Box; action: 'backToDesk' | 'replay'; label: string; children: ReactNode }) {
  const home = useHome();
  const enabled = home.phase === 't1' || home.phase === 'stowed';
  return (
    <button
      type="button"
      aria-label={label}
      disabled={!enabled}
      onClick={home[action]}
      className="absolute m-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent disabled:cursor-default"
      style={box}
    >
      {children}
    </button>
  );
}
