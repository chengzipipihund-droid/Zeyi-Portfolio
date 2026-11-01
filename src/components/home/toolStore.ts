'use client';

import { useSyncExternalStore } from 'react';

// Tools the physics has taken off their place (M7). A displaced tool skips the T2 hover push, which is computed from
// where the tool hangs at first.

const displaced = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const toolStore = {
  set(name: string, moved: boolean) {
    if (moved === displaced.has(name)) return;
    if (moved) displaced.add(name);
    else displaced.delete(name);
    emit();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  has: (name: string) => displaced.has(name),
};

export function useDisplaced(name: string): boolean {
  return useSyncExternalStore(toolStore.subscribe, () => toolStore.has(name), () => false);
}
