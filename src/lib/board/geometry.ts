import statesJson from '@/data/figma/states.json';
import { componentTree } from '@/lib/figma/specs';

// T1 interaction geometry (T2 hover, T4 filter, T5 open), in stage px. Figma data: src/data/figma/states.json.

export type Box = { left: number; top: number; width: number; height: number; rotate?: number };
export type Pose = { x: number; y: number; rotate: number };

type FigmaPose = { box: [number, number, number, number]; rot?: number; state: string };
export const states = statesJson as unknown as {
  t2: { card: string; cardBox: number[]; pushed: Record<string, FigmaPose>; slots: string[]; pill: { text: string; box: number[]; cursor: number[] } };
  t4: {
    skill: string;
    toolOpacity: number;
    archiveOpacity: number;
    dimHookOpacity: number;
    pulledTag: { dy: number; state: string };
    emptySlot: { box: number[]; opacity: number; strokeWeight: number; dash: number[]; radius: number };
    strings: { opacity: number; strokeWeight: number; dot: number; from: number[]; hookDy: number };
    pill: { text: string; box: number[]; shadow: boolean };
    hidden: string[];
  };
  t5: { card: string; cardState: string; detailBoardBox: number[] };
};

/** Centre of a Figma box (x, y = the rotated layer origin; rotation counter-clockwise, degrees). */
export function figmaCenter([x, y, w, h]: number[], rot = 0) {
  const t = (rot * Math.PI) / 180;
  return { x: x + Math.cos(t) * (w / 2) + Math.sin(t) * (h / 2), y: y - Math.sin(t) * (w / 2) + Math.cos(t) * (h / 2) };
}

export const boxCenter = (b: Box) => ({ x: b.left + b.width / 2, y: b.top + b.height / 2 });

/** Axis-aligned bounds of a (CSS-)rotated box. */
function bounds(b: Box) {
  const c = boxCenter(b);
  const t = ((b.rotate ?? 0) * Math.PI) / 180;
  const w = Math.abs(b.width * Math.cos(t)) + Math.abs(b.height * Math.sin(t));
  const h = Math.abs(b.width * Math.sin(t)) + Math.abs(b.height * Math.cos(t));
  return { l: c.x - w / 2, r: c.x + w / 2, t: c.y - h / 2, b: c.y + h / 2 };
}
const overlaps = (a: Box, b: Box) => {
  const p = bounds(a);
  const q = bounds(b);
  return p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
};

// Project Card "Hover" (L) size from the component spec; the card grows under its hook (T2: x centred, top unchanged).
const L = componentTree('Project Card', { State: 'Hover' })!;
export function hoverBox(rest: Box): Box {
  return { left: rest.left + rest.width / 2 - L.w / 2, top: rest.top, width: L.w, height: L.h };
}

// Brief §7.4: tools under an L card without a Figma pose are nudged ≤ 24 px, ≤ 6° (M7 physics replaces this).
const NUDGE = { px: 24, deg: 6 };

/**
 * How a tool moves when `card` grows to L: Figma's T2 pose where Figma has one (Ultra Bridge), else the brief's nudge
 * away from the card; null when the tool is not under the L card.
 */
export type Push = Pose & {
  /** `figma`: picked up (Held) and moved clear of the card, Slot left behind (T2). `nudge`: shifted in place, under the card. */
  kind: 'figma' | 'nudge';
};

export function pushPose(tool: { name: string; box: Box }, card: { name: string; box: Box }): Push | null {
  const l = hoverBox(card.box);
  if (!overlaps(tool.box, l)) return null;
  const rest = boxCenter(tool.box);
  const figma = card.name === states.t2.card ? states.t2.pushed[tool.name] : undefined;
  if (figma) {
    const c = figmaCenter(figma.box, figma.rot);
    return { x: c.x - rest.x, y: c.y - rest.y, rotate: -(figma.rot ?? 0) - (tool.box.rotate ?? 0), kind: 'figma' };
  }
  const dir = rest.x < boxCenter(l).x ? -1 : 1;
  return { x: dir * NUDGE.px, y: 0, rotate: dir * NUDGE.deg, kind: 'nudge' };
}

/** A tag's empty slot (T4): Figma drew it on the HMI / SCADA tag; other tags get the same insets from their own box. */
export function emptySlotBox(tag: Box, hmiTag: Box): Box {
  const [x, y, w, h] = states.t4.emptySlot.box;
  return { left: tag.left + (x - hmiTag.left), top: tag.top + (y - hmiTag.top), width: tag.width - (hmiTag.width - w), height: tag.height - (hmiTag.height - h) };
}

/** String end on a card's hook (T4): hook centre x, hook top + hookDy. */
export const hookPoint = (hook: Box) => ({ x: hook.left + hook.width / 2, y: hook.top + states.t4.strings.hookDy });

/** String start on a pulled tag: its hang hole. `from` was measured on the pulled HMI / SCADA tag, whose T1 place is the empty slot. */
export function tagHole(tag: Box) {
  const [fx, fy] = states.t4.strings.from;
  const [sx, sy] = states.t4.emptySlot.box;
  return { x: tag.left + (fx - sx), y: tag.top + (fy - sy) };
}
