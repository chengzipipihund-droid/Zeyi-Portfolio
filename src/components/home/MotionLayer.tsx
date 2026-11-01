'use client';

import { motion, useReducedMotion, type Easing, type Transition } from 'motion/react';
import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { easeFn, isSpring, poseAt, poseTransform, type Keyframe, type MotionNode, type Pose } from '@/lib/motion/figma';
import { useHome, type T0Hover } from './HomeState';

/**
 * A pivot at a point of the stage: children keep stage coordinates, transforms pivot on (x, y) — like Figma,
 * where every motion pivots on the node centre (wrapper frames "Hang · / Fly · / Motion ·" move the centre).
 */
function Pivot({
  at,
  style,
  nodeRef,
  children,
  ...rest
}: { at: { x: number; y: number }; style?: CSSProperties; children: ReactNode } & Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> & {
  nodeRef?: Ref<HTMLDivElement>;
  'data-motion'?: string;
}) {
  return (
    <div ref={nodeRef} style={{ position: 'absolute', left: at.x, top: at.y, width: 0, height: 0, ...style }} {...rest}>
      <div style={{ position: 'absolute', left: -at.x, top: -at.y }}>{children}</div>
    </div>
  );
}

// Hidden = opacity 0 + inert, never `visibility: hidden`: visibility is inherited by SVG <mask> content, and the same
// icon appears in several layers (mini + card) sharing mask ids — a hidden copy would blank the visible one.
function applyPose(el: HTMLDivElement, pose: Pose) {
  const hidden = pose.opacity <= 0;
  el.style.transform = poseTransform(pose);
  el.style.opacity = String(pose.opacity);
  el.style.pointerEvents = hidden ? 'none' : 'auto'; // explicit: a wrapper above may be pointer-events: none (BinButton)
  if (el.hasAttribute('inert') !== hidden) {
    el.toggleAttribute('inert', hidden);
    el.toggleAttribute('aria-hidden', hidden);
  }
}

/**
 * A layer of Animation A, posed by the clock (T0 = first keyframes, T1 = resting state). The pose is written to the DOM
 * on every clock tick, so playing the 4.8 s timeline never re-renders React.
 */
export function MotionLayer({
  node,
  timeline = 'main',
  children,
}: {
  node: MotionNode;
  /** `cards`: the project cards (min of Animation A and the cards clock); `archive`: the archive cards' clock. */
  timeline?: 'main' | 'cards' | 'archive';
  children: ReactNode;
}) {
  const { clock, cardsClock, archiveClock } = useHome();
  const ref = useRef<HTMLDivElement>(null);
  const time = () => (timeline === 'cards' ? Math.min(clock.get(), cardsClock.get()) : timeline === 'archive' ? archiveClock.get() : clock.get());
  const pose = poseAt(node, time());
  useLayoutEffect(() => {
    const el = ref.current!;
    const update = () => applyPose(el, poseAt(node, time()));
    update();
    const subs = timeline === 'cards' ? [clock, cardsClock] : timeline === 'archive' ? [archiveClock] : [clock];
    const offs = subs.map((c) => c.subscribe(update));
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `time` reads the same clocks
  }, [clock, cardsClock, archiveClock, node, timeline]);
  return (
    <Pivot at={node.center} data-motion={node.name} nodeRef={ref} style={{ transform: poseTransform(pose), opacity: pose.opacity }}>
      {children}
    </Pivot>
  );
}

// ---------------------------------------------------------------- T0 hovers (motion/t0-hover-*.json)

const rel = (track: Keyframe[], css: (d: number) => number) => track.map((k) => css((k.v as number) - (track[0].v as number)));

/** Figma ease into a keyframe → Motion keyframe ease (springs inside keyframes → the brief's ease-out curve). */
function motionEase(k: Keyframe): Easing {
  if (isSpring(k.ease)) return [0.22, 1, 0.36, 1];
  if (k.ease?.type === 'HOLD') return () => 0;
  return easeFn(k.ease);
}

/** Motion transition for one track, relative to its first keyframe (= the T0 pose). */
function trackTransition(track: Keyframe[]): Transition {
  const [first, ...rest] = track;
  const last = track[track.length - 1];
  if (track.length === 2 && isSpring(last.ease)) {
    return { type: 'spring', bounce: last.ease!.easingFunctionSpring?.bounce ?? 0.25, visualDuration: last.t - first.t, delay: first.t };
  }
  const span = last.t - first.t || 1;
  return { duration: span, delay: first.t, times: track.map((k) => (k.t - first.t) / span), ease: rest.map(motionEase) };
}

const LEAVE: Record<'hi' | 'bin', (track: Keyframe[]) => Transition> = {
  // Figma has no "leave" keyframes: the minis spring back with the same spring; the plate eases back in 150 ms.
  bin: (track) => ({ ...trackTransition(track), delay: 0 }),
  hi: () => ({ duration: 0.15, ease: 'easeOut' }),
};

/**
 * Plays a T0 hover motion on top of the T0 pose: the hover frame is the end pose, its first keyframes are the T0 pose,
 * so the offset from T0 is (track − first keyframe). `pivot` = the layer's centre in its parent's resting space.
 */
export function HoverLayer({ hover, node, pivot, children }: { hover: 'hi' | 'bin'; node: MotionNode; pivot: { x: number; y: number }; children: ReactNode }) {
  const home = useHome();
  const reduced = useReducedMotion();
  const on = home.hover === hover;
  const tr = node.tracks;
  const x = tr.TRANSLATION_X ? rel(tr.TRANSLATION_X, (d) => d) : [0];
  const y = tr.TRANSLATION_Y ? rel(tr.TRANSLATION_Y, (d) => d) : [0];
  const r = tr.ROTATION ? rel(tr.ROTATION, (d) => -d) : [0];
  const end = { x: x[x.length - 1], y: y[y.length - 1], rotate: r[r.length - 1] };
  // Reduced motion: the hover pose is shown at once (no swing, no spring).
  const instant = home.forcedHover || !!reduced;
  const target = on ? (instant ? end : { x, y, rotate: r }) : { x: 0, y: 0, rotate: 0 };
  const transition: Transition = {};
  for (const [key, track] of [['x', tr.TRANSLATION_X], ['y', tr.TRANSLATION_Y], ['rotate', tr.ROTATION]] as const) {
    if (track) (transition as Record<string, Transition>)[key] = instant ? { duration: 0 } : on ? trackTransition(track) : LEAVE[hover](track);
  }
  return (
    <motion.div
      style={{ position: 'absolute', left: pivot.x, top: pivot.y, width: 0, height: 0 }}
      initial={false}
      animate={target}
      transition={transition}
    >
      <div style={{ position: 'absolute', left: -pivot.x, top: -pivot.y }}>{children}</div>
    </motion.div>
  );
}

/** Fades a hover-only layer (greeting, "CLICK TO HANG THEM UP") in with its hover and out in 150 ms. */
export function HoverFade({ hover, children }: { hover: Exclude<T0Hover, null>; children: ReactNode }) {
  const home = useHome();
  const on = home.hover === hover;
  return (
    <motion.div
      aria-hidden={!on || undefined}
      initial={false}
      animate={{ opacity: on ? 1 : 0 }}
      transition={{ duration: home.forcedHover ? 0 : 0.15, ease: 'easeOut' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {children}
    </motion.div>
  );
}

type Box = { left: number; top: number; width: number; height: number };

/** Pointer + keyboard target for a T0 hover; the bin also opens the board (click / Enter / Space). */
export function HoverTarget({
  hover,
  label,
  onActivate,
  focusBox,
  children,
}: {
  hover: 'hi' | 'bin';
  label: string;
  onActivate?: () => void;
  /** Where the focus ring is drawn (stage px, in the target's own space). */
  focusBox?: Box;
  children: ReactNode;
}) {
  const home = useHome();
  // Always the same element (so the layers inside never remount when the phase changes); a target only in T0.
  const active = home.phase === 't0';
  const interactive = active && !!onActivate;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={active ? 0 : undefined}
      aria-label={active ? label : undefined}
      className="group/target outline-none"
      onPointerEnter={active ? () => home.setHover(hover) : undefined}
      onPointerLeave={active ? () => home.setHover(null) : undefined}
      onFocus={active ? () => home.setHover(hover) : undefined}
      onBlur={active ? () => home.setHover(null) : undefined}
      onClick={interactive ? onActivate : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onActivate!();
        }
      }}
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      {children}
      {active && focusBox && (
        <span
          aria-hidden
          className="pointer-events-none absolute hidden rounded-[4px] outline outline-2 outline-offset-4 outline-theme-accent group-focus-visible/target:block"
          style={focusBox}
        />
      )}
    </div>
  );
}
