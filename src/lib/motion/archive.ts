import type { Box } from '@/lib/board/geometry';
import { animationA, motionNode, type Keyframe, type MotionNode, type TrackName } from './figma';

// Archive bin (Zeyi, 2026-10-29): the archive minis A1–A3 fly out of the Archive bin onto hooks 01–03, exactly like the
// project cards do in Animation A from T0.5 on (lift 120 px, fly, turn upright, grow, unfold, swing). Their tracks are
// Figma's card tracks from T0.5 on, with the flight recomputed from the archive mini to the card on hook k.

const T05 = 1.65;

/** A track from `from` on, its last value replaced (the start values — 0 / 1 — stay). */
function tail(track: Keyframe[] | undefined, end?: number): Keyframe[] | undefined {
  if (!track) return undefined;
  const kept = track.filter((k) => k.t >= T05);
  if (!kept.length) return undefined;
  if (end === undefined) return kept;
  return kept.map((k, i) => (i === kept.length - 1 ? { ...k, v: end } : k));
}

export type ArchiveFlight = { fly: MotionNode; hang: MotionNode };

/**
 * @param mini   the archive mini in T1 (its box and CSS rotation)
 * @param card   the project card k it replaces on hook k (Fly · Mini · <title>, Hang · <name>)
 */
export function archiveFlight(mini: Box, card: { flyName: string; hangName: string; box: Box }): ArchiveFlight {
  const fly = motionNode(animationA, card.flyName)!;
  const hang = motionNode(animationA, card.hangName)!;
  const from = { x: mini.left + mini.width / 2, y: mini.top + mini.height / 2 };
  const to = { x: card.box.left + card.box.width / 2, y: card.box.top + card.box.height / 2 };
  const tracks: Partial<Record<TrackName, Keyframe[]>> = {
    TRANSLATION_X: tail(fly.tracks.TRANSLATION_X, to.x - from.x),
    TRANSLATION_Y: tail(fly.tracks.TRANSLATION_Y, to.y - from.y),
    // upright: Figma rotation adds counter-clockwise, the mini is tilted by its CSS rotation
    ROTATION: tail(fly.tracks.ROTATION, mini.rotate ?? 0),
    // the mini grows to the card's width (a T1 mini is the Mini variant at 0.72)
    SCALE_XY: tail(fly.tracks.SCALE_XY, card.box.width / mini.width),
    OPACITY: tail(fly.tracks.OPACITY),
  };
  return {
    fly: { ...fly, id: `${fly.id}-archive`, name: `${fly.name} (archive)`, path: `${fly.path} (archive)`, center: from, tracks },
    hang: { ...hang, id: `${hang.id}-archive`, name: `${hang.name} (archive)`, path: `${hang.path} (archive)`, tracks: { ...hang.tracks } },
  };
}
