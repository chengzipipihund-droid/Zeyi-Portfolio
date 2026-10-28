import { backOut, cubicBezier, spring } from 'motion';
import animationAJson from '@/data/figma/motion/animation-a.json';
import hoverBinJson from '@/data/figma/motion/t0-hover-bin.json';
import hoverHiJson from '@/data/figma/motion/t0-hover-hi.json';

// Figma-motion keyframes (src/data/figma/motion/*.json, see their _howTo) → poses at any time t.

export type FigmaEase = {
  type: string;
  easingFunctionCubicBezier?: { x1: number; y1: number; x2: number; y2: number };
  easingFunctionSpring?: { bounce?: number };
};
type Value = number | { x: number; y: number };
export type Keyframe = { t: number; v: Value; ease?: FigmaEase };
export type TrackName = 'TRANSLATION_X' | 'TRANSLATION_Y' | 'ROTATION' | 'SCALE_XY' | 'OPACITY';

export type MotionNode = {
  id: string;
  name: string;
  path: string;
  type: string;
  box: { x: number; y: number; w: number; h: number };
  center: { x: number; y: number };
  rotation: number;
  opacity: number;
  tracks: Partial<Record<TrackName, Keyframe[]>>;
};
export type MotionFile = { duration: number; nodes: MotionNode[] };

export const animationA = animationAJson as unknown as MotionFile;
export const hoverHi = hoverHiJson as unknown as MotionFile;
export const hoverBin = hoverBinJson as unknown as MotionFile;

export const motionNode = (file: MotionFile, path: string) => file.nodes.find((n) => n.path === path);

const SPRINGS = new Set(['GENTLE', 'QUICK', 'BOUNCY', 'SLOW', 'CUSTOM_SPRING']);
export const isSpring = (e?: FigmaEase) => !!e && (SPRINGS.has(e.type) || !!e.easingFunctionSpring);

/** Spring progress 0→1 for a segment of `duration` s (Figma bounce → Motion bounce, visual duration = segment). */
function springAt(e: FigmaEase, duration: number, elapsed: number): number {
  const gen = spring({ keyframes: [0, 1], bounce: e.easingFunctionSpring?.bounce ?? 0.25, visualDuration: Math.max(duration, 0.01) });
  return gen.next(elapsed * 1000).value as number;
}

/** Easing INTO a keyframe as a 0→1 function of segment progress (springs are handled by `sample`). */
export function easeFn(e?: FigmaEase): (p: number) => number {
  if (!e) return (p) => p;
  if (e.type === 'HOLD') return (p) => (p < 1 ? 0 : 1);
  if (e.type === 'EASE_OUT_BACK') return backOut;
  if (e.type === 'LINEAR') return (p) => p;
  const b = e.easingFunctionCubicBezier;
  return b ? cubicBezier(b.x1, b.y1, b.x2, b.y2) : (p) => p;
}

const lerp = (a: Value, b: Value, k: number): Value =>
  typeof a === 'number' && typeof b === 'number'
    ? a + (b - a) * k
    : { x: (a as { x: number }).x + ((b as { x: number }).x - (a as { x: number }).x) * k, y: (a as { y: number }).y + ((b as { y: number }).y - (a as { y: number }).y) * k };

/**
 * Value of a track at time t: holds the first value before the first keyframe and the last after the last.
 * A spring segment keeps settling after its keyframe (until the next keyframe), exactly like Figma plays it.
 */
export function sample(track: Keyframe[], t: number): Value {
  if (t <= track[0].t) return track[0].v;
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1];
    const b = track[i];
    const next = track[i + 1];
    if (isSpring(b.ease) && t > a.t && (!next || t < next.t)) return lerp(a.v, b.v, springAt(b.ease!, b.t - a.t, t - a.t));
    if (t <= b.t) return lerp(a.v, b.v, easeFn(b.ease)((t - a.t) / (b.t - a.t || 1)));
  }
  return track[track.length - 1].v;
}

/** CSS-ready pose of a node: offsets from its resting place (px), CSS rotation (deg, clockwise), scale, opacity. */
export type Pose = { x: number; y: number; rotate: number; scaleX: number; scaleY: number; opacity: number };

export function poseAt(node: MotionNode, t: number): Pose {
  const tr = node.tracks;
  const num = (k: TrackName, d: number) => (tr[k] ? (sample(tr[k]!, t) as number) : d);
  const s = tr.SCALE_XY ? sample(tr.SCALE_XY, t) : 1;
  return {
    x: num('TRANSLATION_X', 0),
    y: num('TRANSLATION_Y', 0),
    rotate: -num('ROTATION', 0), // Figma rotates counter-clockwise
    scaleX: typeof s === 'number' ? s : s.x,
    scaleY: typeof s === 'number' ? s : s.y,
    opacity: num('OPACITY', node.opacity),
  };
}

export const poseTransform = (p: Pose) => `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scaleX}, ${p.scaleY})`;
