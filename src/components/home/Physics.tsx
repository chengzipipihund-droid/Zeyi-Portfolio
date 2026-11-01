'use client';

import { animate, useReducedMotion } from 'motion/react';
import type MatterNS from 'matter-js';
import { useEffect, useRef } from 'react';
import { stagePoint } from '@/components/stage/Stage';
import type { Box, Pt } from '@/lib/board/geometry';
import { PHYSICS } from '@/styles/motion';
import { useBoard } from './BoardState';
import { useHome } from './HomeState';
import { toolStore } from './toolStore';

// M7 physics toy (docs/home-page-brief.md §8, revised by Zeyi 2026-10-29). On the board the tools can always be picked up:
// dragged past `detach` they come off the wall, fly with the pointer and collide (tools, cards and bins on their hooks,
// shelf, timeline, board edges); put back within `hang` px of their own place they hang there again, anywhere else they
// drop. Reset sends every tool home. Matter.js runs headless; DOM layers are moved by transform in rAF.

export type PhysTool = { name: string; label: string; hull: Pt[]; anchor: Pt; metal: boolean; tapeRoll: boolean };
/** A card hanging on a hook: the projects or the archive set (only the set on the board collides). */
export type PhysCard = { id: string; set: 'projects' | 'archive'; box: Box; pivot: Pt };
/** A bin hanging on the board, swinging from its top centre (`pivot`). */
export type PhysBin = { kind: 'project' | 'archive'; box: Box; pivot: Pt };
export type PhysWorld = { statics: Box[]; bins: PhysBin[]; /** the main board: tools never leave it */ bounds: Box };

type Pose = { x: number; y: number; a: number };
const STEP = 1000 / 60;
const CAT = { static: 0x1, pinned: 0x2, free: 0x4, card: 0x8, bin: 0x10 };
const FREE_MASK = CAT.static | CAT.pinned | CAT.free | CAT.card | CAT.bin;

/** Area centroid of a polygon (= Matter's body.position for Bodies.fromVertices). */
function centroid(pts: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const f = p.x * q.y - q.x * p.y;
    a += f;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
}
const rot = (v: Pt, a: number): Pt => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const unwind = (a: number) => (((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;

type ToolRt = PhysTool & { el: HTMLElement; c0: Pt; pose: Pose; shown?: Pose; body?: MatterNS.Body; free: boolean };
type Swinger = { body: MatterNS.Body; els: () => HTMLElement[]; max: number; shown?: number };

/** Writes a tool's pose to its DOM layer (transform-origin = the hull centroid at its place). */
function paint(t: ToolRt) {
  t.shown = t.pose;
  t.el.style.transform = `translate(${t.pose.x - t.c0.x}px, ${t.pose.y - t.c0.y}px) rotate(${t.pose.a}rad)`;
}
/**
 * Physics frames: skip moves below the jitter threshold (PHYSICS.jitter) — the larger `still` one while the tool is
 * meant to be at rest (held by a still hand, or loose and barely moving), so it doesn't rock back and forth.
 */
function paintMoved(t: ToolRt, still: boolean) {
  const s = t.shown, j = still ? PHYSICS.jitter.still : PHYSICS.jitter;
  if (s && Math.abs(t.pose.x - s.x) < j.px && Math.abs(t.pose.y - s.y) < j.px && Math.abs(t.pose.a - s.a) < j.rad) return;
  paint(t);
}
const homePose = (t: ToolRt): Pose => ({ x: t.c0.x, y: t.c0.y, a: 0 });

export function Physics({ tools, cards, world }: { tools: PhysTool[]; cards: PhysCard[]; world: PhysWorld }) {
  const home = useHome();
  const board = useBoard();
  const reduced = useReducedMotion();
  const rt = useRef<ToolRt[]>([]);
  const api = useRef<{ reset: () => void; cards: (set: PhysCard['set'] | null) => void } | null>(null);
  const onBoard = home.phase === 't1' || home.phase === 'stowed';
  const cardSet: PhysCard['set'] | null = home.swapping || home.phase !== 't1' ? null : home.cards;

  // Tool layers, at their place.
  useEffect(() => {
    rt.current = tools.flatMap((t) => {
      const el = document.querySelector<HTMLElement>(`[data-tool="${CSS.escape(t.name)}"]`);
      if (!el) return [];
      const c0 = centroid(t.hull);
      el.style.transformOrigin = `${c0.x}px ${c0.y}px`;
      const r: ToolRt = { ...t, el, c0, pose: { x: c0.x, y: c0.y, a: 0 }, free: false };
      paint(r);
      return [r];
    });
  }, [tools]);

  useEffect(() => {
    if (!onBoard || reduced) return;
    let cancelled = false;
    let stop = () => {};

    const start = async () => {
      const M = (await import('matter-js')).default;
      if (cancelled) return;
      const { Bodies, Body, Composite, Constraint, Engine, Sleeping } = M;
      const engine = Engine.create({
        enableSleeping: true,
        gravity: { x: 0, y: 1, scale: 0.001 },
        positionIterations: PHYSICS.iterations.position,
        velocityIterations: PHYSICS.iterations.velocity,
      });
      const wall = (b: Box, extra: MatterNS.IChamferableBodyDefinition = {}) =>
        Bodies.rectangle(b.left + b.width / 2, b.top + b.height / 2, b.width, b.height, { isStatic: true, friction: PHYSICS.friction, collisionFilter: { category: CAT.static }, ...extra });
      Composite.add(engine.world, world.statics.map((b) => wall(b)));

      // Tools: pinned = static. Made static after creation — a body *created* static has no stored mass, and
      // setStatic(false) would then give it NaN positions when it comes off the wall.
      for (const t of rt.current) {
        const body = Bodies.fromVertices(t.c0.x, t.c0.y, [M.Vertices.hull(t.hull.map((p) => ({ ...p })) as unknown as MatterNS.Vertex[])], {
          friction: PHYSICS.friction,
          frictionStatic: PHYSICS.frictionStatic,
          frictionAir: PHYSICS.frictionAir,
          restitution: t.tapeRoll ? PHYSICS.restitution.tapeRoll : PHYSICS.restitution.metal,
          density: t.metal ? PHYSICS.density.metal : PHYSICS.density.light,
          slop: PHYSICS.slop,
        });
        Body.setStatic(body, true);
        Body.setPosition(body, { x: t.pose.x, y: t.pose.y });
        Body.setAngle(body, t.pose.a);
        body.collisionFilter = { category: CAT.pinned, mask: CAT.free, group: 0 };
        t.body = body;
        Composite.add(engine.world, body);
      }

      // Pendulums on the board: cards (on their hooks) and bins (from their top centre). Hit by free tools only.
      const swingers: (Swinger & { set?: PhysCard['set'] })[] = [];
      const hang = (body: MatterNS.Body, pivot: Pt) => {
        Composite.add(engine.world, [body, Constraint.create({ pointA: { ...pivot }, bodyB: body, pointB: { x: pivot.x - body.position.x, y: pivot.y - body.position.y }, length: 0, stiffness: 1 })]);
      };
      for (const c of cards) {
        const body = Bodies.rectangle(c.box.left + c.box.width / 2, c.box.top + c.box.height / 2, c.box.width, c.box.height, {
          frictionAir: PHYSICS.cardFrictionAir,
          density: PHYSICS.cardDensity,
          collisionFilter: { category: CAT.card, mask: 0 },
        });
        hang(body, c.pivot);
        swingers.push({ body, set: c.set, max: PHYSICS.cardMaxSwing, els: () => [...document.querySelectorAll<HTMLElement>(`[data-card="${c.id}"]`)] });
      }
      for (const b of world.bins) {
        const part = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x + w / 2, y + h / 2, w, h);
        const { left: x, top: y, width: w, height: h } = b.box;
        const body = Body.create({
          parts: [part(x + 4, y, 6, h), part(x + w - 10, y, 6, h), part(x + 8, y + h - 6, w - 16, 6)],
          frictionAir: PHYSICS.binFrictionAir,
          collisionFilter: { category: CAT.bin, mask: CAT.free },
        });
        Body.setDensity(body, PHYSICS.binDensity);
        hang(body, b.pivot);
        const els = () => [...document.querySelectorAll<HTMLElement>(`[data-bin="${b.kind}"]`)];
        els().forEach((el) => (el.style.transformOrigin = `${b.pivot.x}px ${b.pivot.y}px`));
        swingers.push({ body, max: PHYSICS.binMaxSwing, els });
      }
      const settle = (s: Swinger) => {
        Body.setAngle(s.body, 0);
        Body.setAngularVelocity(s.body, 0);
        s.shown = 0;
        s.els().forEach((el) => (el.style.rotate = ''));
      };

      // ---- loop: fixed 60 Hz steps (≤ 3 per frame), paused while the tab is hidden
      let raf = 0, last = performance.now(), acc = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden) { last = now; return; }
        acc = Math.min(acc + (now - last), STEP * 3);
        last = now;
        while (acc >= STEP) {
          Engine.update(engine, STEP);
          acc -= STEP;
          // soft swing limit: past ±max the card / bin stops there and swings back
          for (const s of swingers) {
            const max = (s.max * Math.PI) / 180;
            if (Math.abs(s.body.angle) > max) {
              Body.setAngle(s.body, Math.sign(s.body.angle) * max);
              Body.setAngularVelocity(s.body, -s.body.angularVelocity * 0.3);
            }
          }
          // speed cap: a stopped pendulum must never fling a tool through the board's edges
          for (const t of rt.current) {
            if (!t.free || !t.body) continue;
            const v = t.body.velocity, s = Math.hypot(v.x, v.y);
            if (s > PHYSICS.maxSpeed) Body.setVelocity(t.body, { x: (v.x / s) * PHYSICS.maxSpeed, y: (v.y / s) * PHYSICS.maxSpeed });
          }
        }
        for (const t of rt.current) {
          if (!t.free || !t.body) continue;
          t.pose = { x: t.body.position.x, y: t.body.position.y, a: t.body.angle };
          const b = world.bounds;
          // safety net: anything that still leaves the board goes back onto its place
          if (t.pose.x < b.left || t.pose.x > b.left + b.width || t.pose.y < b.top || t.pose.y > b.top + b.height) flyHome(t);
          else {
            const J = PHYSICS.jitter, v = t.body.velocity;
            const still = drag?.t === t ? now - drag.stillSince > J.handMs : Math.hypot(v.x, v.y) < J.slowSpeed && Math.abs(t.body.angularVelocity) < J.rad;
            paintMoved(t, still);
          }
        }
        for (const s of swingers) {
          if (s.body.isSleeping || (s.shown !== undefined && Math.abs(s.body.angle - s.shown) < PHYSICS.jitter.rad)) continue;
          s.shown = s.body.angle;
          s.els().forEach((el) => (el.style.rotate = `${s.body.angle}rad`));
        }
      };
      raf = requestAnimationFrame(frame);

      // ---- tools
      const setPinned = (t: ToolRt, p: Pose) => {
        t.pose = p;
        t.free = false;
        Body.setStatic(t.body!, true);
        Body.setPosition(t.body!, { x: p.x, y: p.y });
        Body.setAngle(t.body!, p.a);
        t.body!.collisionFilter = { category: CAT.pinned, mask: CAT.free, group: 0 };
        toolStore.set(t.name, false);
        paint(t);
      };
      const setFree = (t: ToolRt) => {
        t.free = true;
        Body.setStatic(t.body!, false);
        Body.setPosition(t.body!, { x: t.pose.x, y: t.pose.y });
        Body.setAngle(t.body!, t.pose.a);
        Sleeping.set(t.body!, false);
        t.body!.collisionFilter = { category: CAT.free, mask: FREE_MASK, group: 0 };
        toolStore.set(t.name, true);
      };
      /** Back onto its own place with a spring (Reset, a short drag, leaving the board). */
      const flyHome = (t: ToolRt) => {
        const from = { ...t.pose, a: unwind(t.pose.a) }, to = homePose(t);
        setPinned(t, from);
        animate(0, 1, {
          ...PHYSICS.home,
          onUpdate: (k) => {
            t.pose = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, a: from.a * (1 - k) };
            paint(t);
          },
          onComplete: () => setPinned(t, to),
        });
      };
      const raise = (t: ToolRt, on: boolean) => {
        const pivot = t.el.closest<HTMLElement>('[data-motion]');
        if (pivot) pivot.style.zIndex = on ? '45' : '';
        t.el.style.filter = on ? 'var(--drop-shadow-lift)' : '';
      };

      // ---- pointer: rubber band → off the wall (constraint drag) → throw, or back on its own place
      // stillAt / stillSince: where and since when the hand has stayed within PHYSICS.jitter.handPx (jitter threshold)
      let drag: { t: ToolRt; start: Pt; grab?: MatterNS.Constraint; grabLocal?: Pt; trail: { p: Pt; at: number }[]; stillAt: Pt; stillSince: number } | null = null;
      const attach = (p: Pt, local?: Pt) => {
        const b = drag!.t.body!;
        // the grabbed point, in the tool's own frame (body position = hull centroid, angle 0 = as it hangs)
        drag!.grabLocal = local ?? rot({ x: p.x - b.position.x, y: p.y - b.position.y }, -b.angle);
        drag!.grab = Constraint.create({ pointA: { ...p }, bodyB: b, pointB: drag!.grabLocal, ...PHYSICS.drag, length: 0 });
        Composite.add(engine.world, drag!.grab);
        b.frictionAir = PHYSICS.heldFrictionAir;
      };
      const down = (e: PointerEvent) => {
        const el = (e.target as Element).closest<HTMLElement>('[data-tool]');
        const t = el && rt.current.find((x) => x.el === el);
        const p = stagePoint(e);
        if (!t || !p) return;
        e.preventDefault();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag = { t, start: p, trail: [{ p, at: performance.now() }], stillAt: p, stillSince: performance.now() };
        raise(t, true);
        if (t.free) attach(p);
      };
      const move = (e: PointerEvent) => {
        if (!drag) return;
        const p = stagePoint(e);
        if (!p) return;
        drag.trail = [...drag.trail.slice(-3), { p, at: performance.now() }];
        if (dist(p, drag.stillAt) > PHYSICS.jitter.handPx) {
          drag.stillAt = p;
          drag.stillSince = performance.now();
        }
        const t = drag.t;
        if (!t.free) {
          const off = { x: p.x - drag.start.x, y: p.y - drag.start.y };
          if (Math.hypot(off.x, off.y) < PHYSICS.detach) {
            const h = homePose(t);
            t.pose = { x: h.x + off.x * PHYSICS.rubberBand, y: h.y + off.y * PHYSICS.rubberBand, a: 0 };
            paint(t);
            return;
          }
          setFree(t);
          // hold it where it was first taken (the rubber band let it lag behind the hand)
          attach(p, { x: drag.start.x - t.c0.x, y: drag.start.y - t.c0.y });
        }
        if (drag.grab) drag.grab.pointA = { ...p };
      };
      const up = () => {
        if (!drag) return;
        const { t, grab, grabLocal, trail } = drag;
        drag = null;
        raise(t, false);
        if (grab) Composite.remove(engine.world, grab);
        if (t.body) t.body.frictionAir = PHYSICS.frictionAir;
        if (!t.free) return flyHome(t); // never came off: back onto its place
        const a = trail[0], b = trail[trail.length - 1];
        const dt = Math.max(1, performance.now() - a.at) / STEP;
        const v = { x: ((b.p.x - a.p.x) / dt) * PHYSICS.throw, y: ((b.p.y - a.p.y) / dt) * PHYSICS.throw };
        const s = Math.hypot(v.x, v.y);
        // Put down near its own place (slowly) → hangs there again; anywhere else it drops (Zeyi). "Its place" = where the
        // hand would be holding that same point if the tool hung at home (a held tool sags and tilts, the hand doesn't).
        const homeGrab = grabLocal ? { x: t.c0.x + grabLocal.x, y: t.c0.y + grabLocal.y } : t.anchor;
        if (s <= PHYSICS.snapMaxSpeed && dist(b.p, homeGrab) <= PHYSICS.hang) return flyHome(t);
        const k = s > PHYSICS.maxThrow ? PHYSICS.maxThrow / s : 1;
        Sleeping.set(t.body!, false);
        Body.setVelocity(t.body!, { x: v.x * k, y: v.y * k });
      };

      // ---- keyboard: Enter knocks the focused tool off its hook; Enter again (or Esc) hangs it back
      const focusables = rt.current.map((t) => {
        t.el.tabIndex = 0;
        t.el.setAttribute('role', 'button');
        t.el.setAttribute('aria-label', `${t.label}. Enter to knock it off, again to hang it back`);
        t.el.style.cursor = 'grab';
        return t.el;
      });
      const key = (e: KeyboardEvent) => {
        const t = rt.current.find((x) => x.el === document.activeElement);
        if (!t) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (t.free) flyHome(t);
          else {
            setFree(t);
            Body.setVelocity(t.body!, { x: 0, y: -2 });
          }
        } else if (e.key === 'Escape' && t.free) flyHome(t);
      };

      window.addEventListener('pointerdown', down, true);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('keydown', key);

      api.current = {
        // Reset: the board as it first hung — every tool home, cards and bins eased back to straight
        reset: () => {
          rt.current.forEach((t) => (t.free || t.pose.x !== t.c0.x || t.pose.y !== t.c0.y) && flyHome(t));
          for (const s of swingers) {
            const from = s.body.angle;
            Body.setAngularVelocity(s.body, 0);
            if (!from) continue;
            animate(from, 0, {
              ...PHYSICS.home,
              onUpdate: (a) => {
                Body.setAngle(s.body, a);
                Body.setAngularVelocity(s.body, 0);
                s.els().forEach((el) => (el.style.rotate = `${a}rad`));
              },
              onComplete: () => settle(s),
            });
          }
        },
        cards: (set) => {
          for (const s of swingers) {
            if (!s.set) continue;
            const on = s.set === set;
            s.body.collisionFilter = { category: CAT.card, mask: on ? CAT.free : 0, group: 0 };
            if (!on) settle(s);
          }
        },
      };
      api.current.cards(cardSet);

      stop = () => {
        window.removeEventListener('pointerdown', down, true);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('keydown', key);
        cancelAnimationFrame(raf);
        // leaving the board: every tool goes home, cards and bins hang still, the world goes away
        rt.current.forEach((t) => {
          raise(t, false);
          flyHome(t);
        });
        swingers.forEach(settle);
        for (const el of focusables) {
          el.removeAttribute('tabindex');
          el.removeAttribute('role');
          el.removeAttribute('aria-label');
          el.style.cursor = '';
        }
        api.current = null;
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    };
    start();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the card set is applied by its own effect
  }, [onBoard, reduced, cards, world]);

  // Which card set collides (projects / archive / none while swapping or stowed).
  useEffect(() => api.current?.cards(cardSet), [cardSet]);
  // Reset (header button).
  useEffect(() => {
    if (board.resetCount) api.current?.reset();
  }, [board.resetCount]);

  return null;
}
