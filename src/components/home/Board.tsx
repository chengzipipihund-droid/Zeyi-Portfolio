'use client';

import { motion, useAnimate, useReducedMotion, useTransform, type Transition } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { stagePoint } from '@/components/stage/Stage';
import { hookPoint, states, tagHole, type Box, type Pose, type Push } from '@/lib/board/geometry';
import { BOARD_MOTION } from '@/styles/motion';
import { useBoard, type SideFace, type Slug } from './BoardState';

// T1 interactions. Every visual variant (card states, tool rest/held/slot, tag default/active) is rendered on the server
// and passed in as nodes; these client components only switch opacity / transforms (no SVG code in the client bundle).

type CardState = 'rest' | 'hover' | 'match' | 'dim' | 'taken';

const fade = (on: boolean, s: number): CSSProperties => ({ opacity: on ? 1 : 0, transition: `opacity ${s}s ease-out`, pointerEvents: on ? undefined : 'none' });
const box = (b: Box): CSSProperties => ({ position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height });

/** Raise the Animation A pivot that holds `el` (cards grow over neighbours, pushed tools over cards). */
function useRaise(ref: React.RefObject<HTMLElement>, z: number | null, extra?: string) {
  useLayoutEffect(() => {
    const pivots = [ref.current?.closest<HTMLElement>('[data-motion]'), extra ? document.querySelector<HTMLElement>(`[data-motion="${extra}"]`) : null];
    pivots.forEach((p, i) => p && (p.style.zIndex = z === null ? '' : String(z + i)));
  }, [ref, z, extra]);
}

/** A project card on its hook: rest ⇄ L (T2), Match / Dim (T4), pulled off → Taken (T5), put back with a swing. */
export function BoardCard({
  slug,
  label,
  skills,
  rest,
  hover,
  hookName,
  pivotY,
  shell,
  variants,
}: {
  slug: Slug;
  label: string;
  skills: string[];
  rest: Box;
  hover: Box;
  hookName: string;
  /** Hook point y (swing pivot) in stage px. */
  pivotY: number;
  /** Hover variant frame (fill, stroke, radius, shadow) for the growing box. */
  shell: CSSProperties;
  variants: Record<CardState, ReactNode>;
}) {
  const board = useBoard();
  const reduced = useReducedMotion();
  const instant = board.forced || !!reduced;
  const state: CardState =
    board.opened === slug ? 'taken' : board.skill ? (skills.includes(board.skill) ? 'match' : 'dim') : board.hovered === slug ? 'hover' : 'rest';
  const big = state === 'hover';
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const restLayer = useRef<HTMLDivElement>(null);
  const takenLayer = useRef<HTMLDivElement>(null);
  const intent = useRef<number>();
  const pointer = useRef<string>('mouse');
  const prev = useRef<CardState>(state);
  useRaise(scope, big ? 30 : null, hookName);

  // Pull off (→ taken) and put back (taken →): brief §7.5.
  useEffect(() => {
    const was = prev.current;
    prev.current = state;
    const p = BOARD_MOTION.pull;
    const r = restLayer.current!;
    const t = takenLayer.current!;
    // `restLayer` only carries the pull / put-back motion; which variant shows is the CSS cross-fade around it.
    if (instant) {
      animate(r, { y: 0, scale: 1, opacity: state === 'taken' ? 0 : 1 }, { duration: 0 });
      animate(t, { opacity: state === 'taken' ? 1 : 0 }, { duration: 0 });
      return;
    }
    if (state === 'taken' && was !== 'taken') {
      animate(r, { y: -p.lift, scale: p.scale }, { duration: p.duration, ease: 'easeOut' }).then(() =>
        animate(r, { opacity: 0 }, { duration: p.fade, ease: 'easeOut' }),
      );
      animate(t, { opacity: 1 }, { duration: p.fade, delay: p.duration, ease: 'easeOut' });
    } else if (was === 'taken' && state !== 'taken') {
      const s = BOARD_MOTION.putBack;
      animate(t, { opacity: 0 }, { duration: p.fade, ease: 'easeOut' });
      animate(r, { opacity: [0, 1], y: [-p.lift, 0], scale: 1 }, { duration: p.fade, ease: 'easeIn' }).then(() =>
        animate(scope.current, { rotate: [s.swing, 0] }, { duration: s.duration, ease: 'easeOut' }),
      );
    }
  }, [state, instant, animate, scope]);

  const enabled = board.active;
  const activate = () => {
    if (!enabled) return;
    if (state === 'taken') return board.close();
    // Touch: the first tap shows the L card, the second opens it.
    if (pointer.current === 'touch' && board.hovered !== slug && !board.skill) return board.hover(slug);
    board.open(slug);
  };
  const enter = () => {
    if (!enabled || board.opened === slug || pointer.current === 'touch') return;
    window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => board.hover(slug), BOARD_MOTION.hoverIntent * 1000);
  };
  const leave = () => {
    window.clearTimeout(intent.current);
    if (board.hovered === slug && !board.forced) board.hover(null);
  };

  const colour = instant ? 0 : BOARD_MOTION.colour;
  const grow: Transition = instant ? { duration: 0 } : BOARD_MOTION.grow;
  return (
    <motion.div
      ref={scope}
      data-card={slug}
      role={enabled ? 'button' : undefined}
      tabIndex={enabled ? 0 : -1}
      aria-label={state === 'taken' ? `${label}. Put it back` : `${label}. Open details`}
      aria-pressed={enabled ? state === 'taken' : undefined}
      className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent"
      style={{ ...box(rest), borderRadius: 16, transformOrigin: `${rest.width / 2}px ${pivotY - rest.top}px`, cursor: enabled ? 'pointer' : undefined }}
      onPointerDown={(e) => (pointer.current = e.pointerType)}
      onPointerEnter={(e) => {
        pointer.current = e.pointerType;
        enter();
      }}
      // Touch fires pointerleave on every lift; the L card from the first tap must stay for the second.
      onPointerLeave={(e) => e.pointerType !== 'touch' && leave()}
      // Keyboard focus shows the L card; focus from a tap or click must not (a tap would otherwise open at once).
      onFocus={(e) => enabled && e.currentTarget.matches(':focus-visible') && board.opened !== slug && !board.skill && board.hover(slug)}
      onBlur={leave}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      {/* L: a box growing from the hook (spring), the Hover variant revealed inside it */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ width: big ? hover.width : rest.width, height: big ? hover.height : rest.height, x: big ? hover.left - rest.left : 0, opacity: big ? 1 : 0 }}
        transition={{ ...grow, opacity: { duration: colour } }}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', ...shell }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0 }}>{variants.hover}</div>
      </motion.div>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...fade(state === 'rest' || state === 'taken', colour) }}>
        <div ref={restLayer} style={{ position: 'absolute', inset: 0 }}>
          {variants.rest}
        </div>
      </div>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...fade(state === 'match', colour) }}>{variants.match}</div>
      <div aria-hidden style={{ position: 'absolute', inset: 0, ...fade(state === 'dim', colour) }}>{variants.dim}</div>
      <div ref={takenLayer} aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0 }}>{variants.taken}</div>
    </motion.div>
  );
}

/** The top layer of the board (`<BoardOverlay />`): tools that are pushed aside are drawn there, above the L card. */
export function BoardOverlay() {
  return <div data-board-overlay="" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 40 }} />;
}

/**
 * A tool on the board when an L card covers it:
 * - Figma pose (T2): picked up (Held), moved clear of the card in the board overlay (above the card), Slot left in its place;
 * - otherwise the brief's nudge: shifted in place, staying under the card.
 * Dimmed by a skill filter.
 */
export function BoardProp({
  name,
  center,
  pushes,
  rest,
  held,
  slot,
}: {
  /** Layer name — the M7 physics moves the `[data-tool]` layer. */
  name: string;
  center: { x: number; y: number };
  pushes: Record<Slug, Push | null>;
  rest: ReactNode;
  held: ReactNode;
  slot: ReactNode;
}) {
  const board = useBoard();
  const reduced = useReducedMotion();
  const instant = board.forced || !!reduced;
  const push = board.hovered ? pushes[board.hovered] ?? null : null;
  const lifted = push?.kind === 'figma' ? push : null;
  const nudge = push?.kind === 'nudge' ? push : null;
  const [overlay, setOverlay] = useState<HTMLElement | null>(null);
  useEffect(() => setOverlay(document.querySelector<HTMLElement>('[data-board-overlay]')), []);
  const t = instant ? 0 : BOARD_MOTION.colour;
  const spring: Transition = instant ? { duration: 0 } : BOARD_MOTION.grow;
  const pivot = (children: ReactNode, pose: Pose | null, extra?: { opacity: number }) => (
    <motion.div
      initial={false}
      animate={{ x: pose?.x ?? 0, y: pose?.y ?? 0, rotate: pose?.rotate ?? 0, ...extra }}
      transition={extra ? { ...spring, opacity: { duration: t, delay: pose ? 0 : t } } : spring}
      style={{ position: 'absolute', left: center.x, top: center.y, width: 0, height: 0 }}
    >
      <div style={{ position: 'absolute', left: -center.x, top: -center.y }}>{children}</div>
    </motion.div>
  );
  return (
    <div style={{ opacity: board.skill ? states.t4.toolOpacity : 1, transition: `opacity ${t}s ease-out` }}>
      <div aria-hidden style={fade(!!lifted, t)}>{slot}</div>
      <div data-tool={name} className="outline-none focus-visible:[filter:var(--drop-shadow-lift)]" style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        <div style={fade(!lifted, lifted ? 0 : t)}>{pivot(rest, nudge)}</div>
      </div>
      {overlay && createPortal(<div aria-hidden style={{ pointerEvents: 'none' }}>{pivot(held, lifted, { opacity: lifted ? 1 : 0 })}</div>, overlay)}
    </div>
  );
}

/** Dims (or hides) a layer while a skill filter is on, unless the layer belongs to a project with that skill. */
export function BoardFade({ opacity, keepFor, children }: { opacity: number; keepFor?: string[]; children: ReactNode }) {
  const board = useBoard();
  const dim = !!board.skill && !keepFor?.includes(board.skill);
  const t = board.forced ? 0 : BOARD_MOTION.colour;
  return <div style={{ opacity: dim ? opacity : 1, transition: `opacity ${t}s ease-out`, pointerEvents: dim && opacity === 0 ? 'none' : undefined }}>{children}</div>;
}

/** Shows a layer only while a skill filter is on (the T4 pill). */
export function WhenFiltered({ children }: { children: ReactNode }) {
  const board = useBoard();
  return <div aria-hidden={!board.skill || undefined} style={fade(!!board.skill, board.forced ? 0 : BOARD_MOTION.colour)}>{children}</div>;
}

/** "N TOOLS USE <SKILL> · ESC TO RELEASE" (T4 pill text; Figma pattern in states.json). */
export function FilterPillText({ counts }: { counts: Record<string, number> }) {
  const { skill } = useBoard();
  if (!skill) return null;
  return <>{states.t4.pill.text.replace('{n}', String(counts[skill] ?? 0)).replace('{SKILL}', skill.toUpperCase())}</>;
}

/** A skill tag: click pulls it (Active, down 10 px) and filters the board; its empty slot (dashed) stays behind. */
export function BoardTag({ label, tag, slotBox, idle, pulled }: { label: string; tag: Box; slotBox: Box; idle: ReactNode; pulled: ReactNode }) {
  const board = useBoard();
  const on = board.skill === label;
  const t = board.forced ? 0 : BOARD_MOTION.colour;
  const slot = states.t4.emptySlot;
  return (
    <>
      <span
        aria-hidden
        style={{
          ...box(slotBox),
          borderRadius: slot.radius,
          border: `${slot.strokeWeight}px dashed var(--line-strong)`,
          opacity: on ? slot.opacity : 0,
          transition: `opacity ${t}s ease-out`,
          pointerEvents: 'none',
        }}
      />
      <motion.button
        type="button"
        aria-pressed={on}
        aria-label={label}
        disabled={!board.active}
        onClick={() => board.toggleSkill(label)}
        initial={false}
        animate={{ y: on ? states.t4.pulledTag.dy : 0 }}
        transition={board.forced ? { duration: 0 } : BOARD_MOTION.grow}
        className="absolute m-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent disabled:cursor-default"
        style={{ left: tag.left, top: tag.top, width: tag.width, height: tag.height }}
      >
        <span style={{ position: 'absolute', left: -tag.left, top: -tag.top }}>
          <span style={{ display: 'block', ...fade(!on, t) }}>{idle}</span>
          <span style={{ display: 'block', ...fade(on, t) }}>{pulled}</span>
        </span>
      </motion.button>
    </>
  );
}

/** T4 strings: from the pulled tag's hole to the hook of every card with that skill (draw 400 ms, 60 ms stagger). */
export function FilterStrings({ tags, cards }: { tags: { label: string; box: Box }[]; cards: { slug: Slug; skills: string[]; hook: Box }[] }) {
  const board = useBoard();
  const tag = tags.find((t) => t.label === board.skill);
  const s = states.t4.strings;
  const from = tag ? tagHole(tag.box) : null;
  const ends = from ? cards.filter((c) => c.skills.includes(board.skill!)).map((c) => ({ slug: c.slug, ...hookPoint(c.hook) })) : [];
  const instant = board.forced;
  return (
    <svg aria-hidden width={1440} height={1024} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: s.opacity, overflow: 'visible' }}>
      {from &&
        ends.map((e, i) => (
          <g key={`${board.skill}-${e.slug}`}>
            <motion.path
              d={`M ${from.x} ${from.y} L ${e.x} ${e.y}`}
              style={{ stroke: 'var(--line-strong)', strokeWidth: s.strokeWeight, strokeLinecap: 'round', fill: 'none' }}
              initial={{ pathLength: instant ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: instant ? 0 : BOARD_MOTION.strings.duration, delay: instant ? 0 : i * BOARD_MOTION.strings.stagger, ease: 'easeOut' }}
            />
            <motion.circle
              cx={e.x}
              cy={e.y}
              r={s.dot / 2}
              style={{ fill: 'var(--line-strong)' }}
              initial={{ opacity: instant ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1, delay: instant ? 0 : i * BOARD_MOTION.strings.stagger + BOARD_MOTION.strings.duration }}
            />
          </g>
        ))}
    </svg>
  );
}

/** "CLICK TO TAKE IT OFF" (T2): follows the pointer over a card that has grown to L. */
export function CursorPill({ offset, forcedAt, children }: { offset: { x: number; y: number }; forcedAt: { x: number; y: number }; children: ReactNode }) {
  const board = useBoard();
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!board.hovered) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return setAt(null);
      setAt(stagePoint(e));
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [board.hovered]);
  const p = board.forced ? forcedAt : at;
  const show = !!board.hovered && !!p;
  return (
    <div aria-hidden style={{ position: 'absolute', zIndex: 50, left: (p?.x ?? 0) + offset.x, top: (p?.y ?? 0) + offset.y, pointerEvents: 'none', ...fade(show, board.forced ? 0 : 0.12) }}>
      {children}
    </div>
  );
}

/** A face of the side board (personal / a project's Detail Board), flipping about the side board's centre (T5). */
export function SideFlip({ face, origin, children }: { face: SideFace; origin: { x: number; y: number }; children: ReactNode }) {
  const board = useBoard();
  const shown = board.side === face;
  const ref = useRef<HTMLDivElement>(null);
  const transform = useTransform(board.flip, (a) => (a ? `perspective(1600px) rotateY(${a}deg)` : 'none'));
  useLayoutEffect(() => {
    ref.current?.toggleAttribute('inert', !shown);
  }, [shown]);
  return (
    <motion.div
      ref={ref}
      aria-hidden={!shown || undefined}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transformOrigin: `${origin.x}px ${origin.y}px`, transform, opacity: shown ? 1 : 0 }}
    >
      {children}
    </motion.div>
  );
}

/** Rearrange (β) in the header: toggles the physics toy on the board (M7). Pressed = an accent ring (no Figma "on" state). */
export function RearrangeButton({ box, label, children }: { box: Box; label: string; children: ReactNode }) {
  const board = useBoard();
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={board.rearrange}
      disabled={!board.onBoard}
      onClick={() => board.setRearrange(!board.rearrange)}
      className="absolute m-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-accent disabled:cursor-default aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-theme-accent"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
    >
      {children}
    </button>
  );
}

/** Buttons on a Detail Board: "↩ PUT BACK · ESC" puts the card back. (Open the case / PDF: case pages are M9 — TODO(zeyi).) */
export function DetailActions({ slug, putBack, label }: { slug: Slug; putBack: Box; label: string }) {
  const board = useBoard();
  const ref = useRef<HTMLButtonElement>(null);
  const shown = board.side === slug;
  useEffect(() => {
    if (shown && !board.forced) ref.current?.focus({ preventScroll: true });
  }, [shown, board.forced]);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={board.close}
      className="pointer-events-auto absolute m-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
      style={box(putBack)}
    />
  );
}
