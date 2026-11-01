'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HOME_MOTION } from '@/styles/motion';
import { animationA } from '@/lib/motion/figma';

/** `stowed` = the board with the cards collected back into the bin (Animation A at T0.5), on /home. */
export type Phase = 't0' | 'intro' | 't1' | 'stowed';
export type T0Hover = 'hi' | 'bin' | null;

/** The two pages of the home (Zeyi, 2026-10-29): T0 is the domain root, T1 is /home. */
export const ROUTES = { t0: '/', t1: '/home' } as const;
const END = animationA.duration;
/** T0.5 "Page Default": board and tools in place, cards still in the bin (brief §7.3; storyboard t = 1.65 s). */
export const T05 = 1.65;

/** Animation A clock (seconds). Layers subscribe and write their pose to the DOM directly — no React render per frame. */
export type Clock = { get: () => number; set: (t: number) => void; subscribe: (fn: (t: number) => void) => () => void };
function createClock(initial: number): Clock {
  let t = initial;
  const fns = new Set<(t: number) => void>();
  return {
    get: () => t,
    set: (v) => {
      t = v;
      fns.forEach((fn) => fn(v));
    },
    subscribe: (fn) => {
      fns.add(fn);
      return () => fns.delete(fn);
    },
  };
}

type HomeState = {
  phase: Phase;
  clock: Clock;
  hover: T0Hover;
  /** `?hover=` forces a hover at its end pose (visual checks). */
  forcedHover: boolean;
  /** Reduced motion: the scene cross-fades instead of playing Animation A. */
  fadedOut: boolean;
  setHover: (h: T0Hover) => void;
  /** T0 → T1: the bin. */
  openBoard: () => void;
  /** T1 → T0: the WORK tab. */
  backToDesk: () => void;
  /** Play Animation A again on /home (the Logo). */
  replay: () => void;
  /** T1 → stowed: the Project bin collects the cards (Animation A backwards to T0.5). */
  collectCards: () => void;
  /** stowed → T1: the bin hangs them up again. */
  hangCards: () => void;
  /**
   * Which cards hang on the board (Zeyi, 2026-10-29): the projects, or the archive (A1–A3, out of the Archive bin).
   * `cardsClock` drives the project cards alone (Animation A's card layers sample min(main clock, cards clock)), so
   * they can go back into the Project bin while the rest of the board stays; `archiveClock` drives the archive cards.
   */
  cards: 'projects' | 'archive';
  swapping: boolean;
  cardsClock: Clock;
  archiveClock: Clock;
  /** Archive bin: projects back into the Project bin, archive cards onto the hooks — and back. */
  toggleArchive: () => void;
};

const Ctx = createContext<HomeState | null>(null);
const phaseOf = (pathname: string): Phase => (pathname === ROUTES.t1 ? 't1' : 't0');

/**
 * T0 (/) ⇄ Animation A ⇄ T1 (/home). One persistent scene (app/(home)/layout.tsx): navigating between the two routes
 * plays Animation A forward or backward on the same elements, so the pages share their objects.
 */
export function HomeStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const target = phaseOf(pathname);
  const [phase, setPhase] = useState<Phase>(target);
  const [hover, setHoverState] = useState<T0Hover>(null);
  const [forcedHover, setForcedHover] = useState(false);
  const [fadedOut, setFadedOut] = useState(false);
  const clock = useRef<Clock>(createClock(target === 't1' ? END : 0)).current;
  const cardsClock = useRef<Clock>(createClock(END)).current;
  const archiveClock = useRef<Clock>(createClock(T05)).current;
  const [cards, setCards] = useState<'projects' | 'archive'>('projects');
  const [swapping, setSwapping] = useState(false);
  const run = useRef<{ raf: number; to: number } | null>(null);
  const frozen = useRef(false);

  /** Run a group clock to `to` (Figma timing × speed); instant with reduced motion. */
  const tween = useCallback((c: Clock, to: number, speed: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      c.set(to);
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const from = c.get();
      const span = Math.abs(to - from) / speed || 1e-6;
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / 1000 / span);
        c.set(from + (to - from) * k);
        if (k < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const finish = useCallback(
    (to: number) => {
      if (run.current) cancelAnimationFrame(run.current.raf);
      run.current = null;
      clock.set(to);
      setPhase(to >= END ? 't1' : to <= 0 ? 't0' : 'stowed');
      if (to <= 0) {
        // back on the desk: the board starts with the projects next time
        cardsClock.set(END);
        archiveClock.set(T05);
        setCards('projects');
      }
    },
    [clock, cardsClock, archiveClock],
  );

  /** Play the clock from where it is to `to` (0 or END); `speed` 1 = Figma timing. */
  const play = useCallback(
    (to: number, speed: number) => {
      setHoverState(null);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // docs/home-page-brief.md §7.3: 300 ms cross-fade instead of the animation.
        setFadedOut(true);
        window.setTimeout(() => {
          finish(to);
          setFadedOut(false);
        }, HOME_MOTION.reducedFade * 500);
        return;
      }
      if (run.current) cancelAnimationFrame(run.current.raf);
      const from = clock.get();
      const span = Math.abs(to - from) / speed;
      const start = performance.now();
      setPhase('intro');
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / 1000 / (span || 1e-6));
        clock.set(from + (to - from) * k);
        if (k < 1) run.current = { raf: requestAnimationFrame(tick), to };
        else finish(to);
      };
      run.current = { raf: requestAnimationFrame(tick), to };
    },
    [clock, finish],
  );

  // Debug / visual-check params, read once before paint: ?t=<s> freezes Animation A, ?hover=hi|bin forces a T0 hover.
  useLayoutEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (pathname === ROUTES.t0 && (q.has('p') || q.has('skill'))) {
      router.replace(`${ROUTES.t1}?${q.toString()}`); // deep links land on the board
      return;
    }
    const t = q.get('t');
    if (t !== null && Number.isFinite(+t)) {
      frozen.current = true;
      clock.set(Math.min(END, Math.max(0, +t)));
      setPhase('intro');
      return;
    }
    const h = q.get('hover');
    if (target === 't0' && (h === 'hi' || h === 'bin')) {
      setHoverState(h);
      setForcedHover(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on first load
  }, []);

  // Route changed (back/forward, or a click whose animation already started): animate to the route's state.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (frozen.current) return;
    const to = target === 't1' ? END : 0;
    if (run.current?.to === to || (!run.current && clock.get() === to)) return; // already on its way (or there)
    if (target === 't1') play(END, 1);
    else play(0, HOME_MOTION.backToDeskSpeed);
  }, [target, play, clock]);

  // Both routes are one scene: have the other one ready so a click never waits for the network (or a dev compile).
  useEffect(() => {
    router.prefetch(target === 't1' ? ROUTES.t0 : ROUTES.t1);
  }, [router, target]);

  // Click or Esc during Animation A jumps to its end.
  useEffect(() => {
    if (phase !== 'intro' || frozen.current) return;
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (run.current) finish(run.current.to);
    };
    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', skip, true);
    return () => {
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
    };
  }, [phase, finish]);

  const setHover = useCallback((h: T0Hover) => {
    if (!forcedHover) setHoverState(h);
  }, [forcedHover]);
  // The animation starts on the click; the URL follows (the route effect then sees it is already on its way).
  const openBoard = useCallback(() => {
    play(END, 1);
    router.push(ROUTES.t1, { scroll: false });
  }, [router, play]);
  const backToDesk = useCallback(() => {
    // archive cards go back into their bin while Animation A plays backwards (the projects are already in theirs)
    if (cards === 'archive') tween(archiveClock, T05, HOME_MOTION.backToDeskSpeed);
    play(0, HOME_MOTION.backToDeskSpeed);
    router.push(ROUTES.t0, { scroll: false });
  }, [router, cards, tween, archiveClock, play]);
  const toggleArchive = useCallback(async () => {
    if (swapping || (phase !== 't1' && phase !== 'stowed')) return;
    setSwapping(true);
    setHoverState(null);
    if (phase === 'stowed') {
      // Projects already in their bin (Zeyi: the Archive bin works at any time): the board finishes Animation A with
      // the project cards held in the bin while the archive cards fly onto the hooks.
      cardsClock.set(T05);
      await Promise.all([tween(clock, END, 1), tween(archiveClock, END, 1)]);
      setPhase('t1');
      setCards('archive');
    } else if (cards === 'projects') {
      await tween(cardsClock, T05, HOME_MOTION.backToDeskSpeed); // projects back into the Project bin
      await tween(archiveClock, END, 1); // archive cards out of the Archive bin onto the hooks
      setCards('archive');
    } else {
      await tween(archiveClock, T05, HOME_MOTION.backToDeskSpeed);
      await tween(cardsClock, END, 1);
      setCards('projects');
    }
    setSwapping(false);
  }, [swapping, phase, cards, tween, clock, cardsClock, archiveClock]);
  const replay = useCallback(() => {
    clock.set(0);
    play(END, 1);
  }, [clock, play]);
  const collectCards = useCallback(() => play(T05, HOME_MOTION.backToDeskSpeed), [play]);
  const hangCards = useCallback(() => play(END, 1), [play]);

  const value = useMemo<HomeState>(
    () => ({
      phase,
      clock,
      hover: phase === 't0' ? hover : null,
      forcedHover,
      fadedOut,
      setHover,
      openBoard,
      backToDesk,
      replay,
      collectCards,
      hangCards,
      cards,
      swapping,
      cardsClock,
      archiveClock,
      toggleArchive,
    }),
    [phase, clock, hover, forcedHover, fadedOut, setHover, openBoard, backToDesk, replay, collectCards, hangCards, cards, swapping, cardsClock, archiveClock, toggleArchive],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHome(): HomeState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHome() outside <HomeStateProvider>');
  return v;
}
