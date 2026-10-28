'use client';

import type { ReactNode } from 'react';
import { HOME_MOTION } from '@/styles/motion';
import { useHome } from './HomeState';

/** Reduced motion: T0 ⇄ T1 cross-fades the scene (half out, swap, half in) instead of playing Animation A. */
export function SceneFade({ children }: { children: ReactNode }) {
  const { fadedOut, phase } = useHome();
  return (
    <div data-phase={phase} style={{ opacity: fadedOut ? 0 : 1, transition: `opacity ${HOME_MOTION.reducedFade / 2}s ease-out` }}>
      {children}
    </div>
  );
}
