'use client';

import { animate, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BOARD_MOTION } from '@/styles/motion';
import { useHome } from './HomeState';

export type Slug = string;
/** What the side board shows: the personal board, or a project's Detail Board (T5). */
export type SideFace = 'personal' | Slug;

type BoardState = {
  /** T1 interactions run only on the board at rest (not in T0, the intro, or with the cards stowed). */
  active: boolean;
  hovered: Slug | null;
  opened: Slug | null;
  /** Active skill tag label (T4). */
  skill: string | null;
  /** `?state=` visual checks: states appear at their end pose, without transitions. */
  forced: boolean;
  side: SideFace;
  /** Side board rotateY, degrees (T5 flip). */
  flip: MotionValue<number>;
  hover: (slug: Slug | null) => void;
  open: (slug: Slug) => void;
  close: () => void;
  toggleSkill: (label: string) => void;
};

const Ctx = createContext<BoardState | null>(null);
const slugOf = (s: string) => s.toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** URL of the board state, kept in the address bar without navigating: /home?p=<project> or /home?skill=<skill>. */
function syncUrl(opened: Slug | null, skill: string | null) {
  const q = opened ? `?p=${opened}` : skill ? `?skill=${slugOf(skill)}` : '';
  const url = `${window.location.pathname}${q}`;
  if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', url);
}

/** T1 interactions (brief §7.4–7.5): hover → L (T2), click → Detail Board (T5), skill tag → filter (T4), Esc reverses. */
export function BoardStateProvider({ skills, children }: { skills: string[]; children: ReactNode }) {
  const home = useHome();
  const active = home.phase === 't1';
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<Slug | null>(null);
  const [opened, setOpened] = useState<Slug | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const [forced, setForced] = useState(false);
  const [side, setSide] = useState<SideFace>('personal');
  const flip = useMotionValue(0);
  const ready = useRef(false);

  // Deep links and visual-check states, once the board is at rest: ?p=, ?skill=, ?state=hover|open|filter&card=&skill=.
  useLayoutEffect(() => {
    if (!active || ready.current) return;
    ready.current = true;
    const q = new URLSearchParams(window.location.search);
    const state = q.get('state');
    const card = q.get('card') ?? q.get('p');
    const sk = q.get('skill');
    const label = sk ? skills.find((s) => slugOf(s) === sk) ?? null : null;
    if (state) setForced(true);
    if ((state === 'open' || (!state && q.has('p'))) && card) {
      setOpened(card);
      setSide(card);
    } else if (label) setSkill(label);
    else if (state === 'hover' && card) setHovered(card);
  }, [active, skills]);

  // Leaving the board (WORK, stowing the cards) puts everything back.
  useEffect(() => {
    if (active) return;
    setHovered(null);
    setOpened(null);
    setSkill(null);
    setSide('personal');
    flip.set(0);
  }, [active, flip]);

  useEffect(() => {
    if (active && ready.current) syncUrl(opened, skill);
  }, [active, opened, skill]);

  /** T5 side board flip: rotateY 0 → 90°, swap face, 90 → 0° (brief §7.5). Reduced motion: swap only. */
  const turnSide = useCallback(
    (face: SideFace) => {
      if (reduced || forced) {
        setSide(face);
        return;
      }
      const half = BOARD_MOTION.flipHalf;
      animate(flip, 90, { duration: half, ease: 'easeIn' }).then(() => {
        setSide(face);
        animate(flip, 0, { duration: half, ease: 'easeOut' });
      });
    },
    [flip, reduced, forced],
  );

  const hover = useCallback((slug: Slug | null) => setHovered(slug), []);
  const open = useCallback(
    (slug: Slug) => {
      setForced(false);
      setHovered(null);
      setSkill(null);
      setOpened(slug);
      turnSide(slug);
    },
    [turnSide],
  );
  const close = useCallback(() => {
    setForced(false);
    setOpened(null);
    turnSide('personal');
  }, [turnSide]);
  const toggleSkill = useCallback((label: string) => {
    setForced(false);
    setHovered(null);
    setSkill((s) => (s === label ? null : label));
  }, []);

  // Esc: put the open project back, else release the skill tag.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (opened) close();
      else if (skill) setSkill(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, opened, skill, close]);

  const value = useMemo<BoardState>(
    () => ({
      active,
      hovered: active ? hovered : null,
      opened: active ? opened : null,
      skill: active ? skill : null,
      forced,
      side,
      flip,
      hover,
      open,
      close,
      toggleSkill,
    }),
    [active, hovered, opened, skill, forced, side, flip, hover, open, close, toggleSkill],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBoard(): BoardState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBoard() outside <BoardStateProvider>');
  return v;
}
