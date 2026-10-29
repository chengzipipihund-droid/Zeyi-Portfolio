'use client';

import { animate, useReducedMotion } from 'motion/react';
import type MatterNS from 'matter-js';
import { useEffect, useRef } from 'react';
import { stagePoint } from '@/components/stage/Stage';
import type { Box, Pt } from '@/lib/board/geometry';
import { PHYSICS } from '@/styles/motion';
import { useBoard } from './BoardState';

// M7 physics toy (docs/home-page-brief.md §8). Matter.js runs headless; the DOM layers are moved by transform in rAF.

export type PhysTool = { name: string; label: string; hull: Pt[]; anchor: Pt; metal: boolean; tapeRoll: boolean };
export type PhysCard = { slug: string; box: Box; pivot: Pt };
export type PhysWorld = { statics: Box[]; bins: Box[]; holes: Pt[] };

type Home = { dx: number; dy: number };
type Pose = { x: number; y: number; a: number };
const HOMES = 'pb-homes';
const STEP = 1000 / 60;
const CAT = { static: 0x1, pinned: 0x2, free: 0x4, card: 0x8 };

const loadHomes = (): Record<string, Home> => {
  try {
    return JSON.parse(window.sessionStorage.getItem(HOMES) ?? '{}');
  } catch {
    return {};
  }
};
const saveHomes = (h: Record<string, Home>) => {
  try {
    window.sessionStorage.setItem(HOMES, JSON.stringify(h));
  } catch {
    /* private mode: positions only live until reload */
  }
};

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

type ToolRt = PhysTool & { el: HTMLElement; c0: Pt; home: Home; pose: Pose; body?: MatterNS.Body; free: boolean };

/** Writes a tool's pose to its DOM layer (transform-origin = the hull centroid at its original place). */
function paint(t: ToolRt) {
  t.el.style.transform = `translate(${t.pose.x - t.c0.x}px, ${t.pose.y - t.c0.y}px) rotate(${t.pose.a}rad)`;
}
const homePose = (t: ToolRt): Pose => ({ x: t.c0.x + t.home.dx, y: t.c0.y + t.home.dy, a: 0 });
/** Where the anchor (hang point) is for a pose. */
const anchorAt = (t: ToolRt, p: Pose) => {
  const v = rot({ x: t.anchor.x - t.c0.x, y: t.anchor.y - t.c0.y }, p.a);
  return { x: p.x + v.x, y: p.y + v.y };
};

/**
 * Rearrange (β): with it on, tools come off the wall when dragged past 60 px (rubber band before), fly with the pointer's
 * velocity, collide (tools, cards on their hooks, shelf, bins, board edges), pile up, and hang on a free hole when released
 * near one (their new home for this visit). Off: everything flies home. Keyboard: Tab, Enter, arrows, Enter / Esc.
 * Reduced motion: no physics — click a tool, then click where it should hang.
 */
export function Physics({ tools, cards, world }: { tools: PhysTool[]; cards: PhysCard[]; world: PhysWorld }) {
  const board = useBoard();
  const reduced = useReducedMotion();
  const rt = useRef<ToolRt[]>([]);

  // Tools at their remembered homes (also with Rearrange off).
  useEffect(() => {
    const homes = loadHomes();
    rt.current = tools.flatMap((t) => {
      const el = document.querySelector<HTMLElement>(`[data-tool="${CSS.escape(t.name)}"]`);
      if (!el) return [];
      const c0 = centroid(t.hull);
      el.style.transformOrigin = `${c0.x}px ${c0.y}px`;
      const r: ToolRt = { ...t, el, c0, home: homes[t.name] ?? { dx: 0, dy: 0 }, pose: { x: 0, y: 0, a: 0 }, free: false };
      r.pose = homePose(r);
      paint(r);
      return [r];
    });
  }, [tools]);

  useEffect(() => {
    if (!board.rearrange) return;
    let cancelled = false;
    let cleanup = () => {};
    const homes = loadHomes();
    const occupied = (hole: Pt, except: ToolRt) => rt.current.some((o) => o !== except && dist(anchorAt(o, o.pose), hole) < 12);
    const nearestHole = (p: Pt, except: ToolRt) =>
      world.holes.filter((h) => !occupied(h, except)).reduce<{ h: Pt; d: number } | null>((best, h) => {
        const d = dist(h, p);
        return !best || d < best.d ? { h, d } : best;
      }, null);
    /** Hang a tool so its anchor sits on `hole`: that becomes its home. */
    const hangAt = (t: ToolRt, hole: Pt) => {
      t.home = { dx: hole.x - t.anchor.x, dy: hole.y - t.anchor.y };
      homes[t.name] = t.home;
      saveHomes(homes);
    };

    // Focusable tools (keyboard path).
    const focusables = rt.current.map((t) => {
      t.el.tabIndex = 0;
      t.el.setAttribute('role', 'button');
      t.el.setAttribute('aria-label', `${t.label}. Enter to pick it up`);
      t.el.style.cursor = 'grab';
      return t.el;
    });

    const start = async () => {
      let M: typeof MatterNS | null = null;
      if (!reduced) M = (await import('matter-js')).default;
      if (cancelled) return;
      const engine = M?.Engine.create({ enableSleeping: true, gravity: { x: 0, y: 1, scale: 0.001 } });
      if (M && engine) {
        const { Bodies, Composite, Constraint } = M;
        const wall = (b: Box) => Bodies.rectangle(b.left + b.width / 2, b.top + b.height / 2, b.width, b.height, { isStatic: true, friction: PHYSICS.friction, collisionFilter: { category: CAT.static } });
        const statics = [...world.statics.map(wall), ...world.bins.flatMap((b) => [
          wall({ left: b.left + 4, top: b.top, width: 6, height: b.height }),
          wall({ left: b.left + b.width - 10, top: b.top, width: 6, height: b.height }),
          wall({ left: b.left + 8, top: b.top + b.height - 6, width: b.width - 16, height: 6 }),
        ])];
        Composite.add(engine.world, statics);
        for (const t of rt.current) {
          // Matter's own hull: rounding can leave the imported hull a hair concave
          const body = Bodies.fromVertices(t.c0.x, t.c0.y, [M.Vertices.hull(t.hull.map((p) => ({ ...p })) as unknown as MatterNS.Vertex[])], {
            friction: PHYSICS.friction,
            frictionStatic: PHYSICS.frictionStatic,
            frictionAir: PHYSICS.frictionAir,
            restitution: t.tapeRoll ? PHYSICS.restitution.tapeRoll : PHYSICS.restitution.metal,
            density: t.metal ? PHYSICS.density.metal : PHYSICS.density.light,
            collisionFilter: { category: CAT.pinned, mask: CAT.free },
          });
          // Pinned = static. Made static after creation: a body *created* static has no stored mass, and
          // setStatic(false) would then give it NaN positions when it comes off the wall.
          M.Body.setStatic(body, true);
          M.Body.setPosition(body, { x: t.pose.x, y: t.pose.y });
          t.body = body;
          Composite.add(engine.world, body);
        }
        for (const c of cards) {
          const cx = c.box.left + c.box.width / 2, cy = c.box.top + c.box.height / 2;
          const body = Bodies.rectangle(cx, cy, c.box.width, c.box.height, { frictionAir: PHYSICS.cardFrictionAir, density: PHYSICS.cardDensity, collisionFilter: { category: CAT.card, mask: CAT.free } });
          const pin = Constraint.create({ pointA: { ...c.pivot }, bodyB: body, pointB: { x: c.pivot.x - cx, y: c.pivot.y - cy }, length: 0, stiffness: 1 });
          (body as MatterNS.Body & { slug: string }).slug = c.slug;
          Composite.add(engine.world, [body, pin]);
        }
      }
      const cardBodies = () => (engine ? (engine.world.bodies.filter((b) => (b as { slug?: string }).slug) as (MatterNS.Body & { slug: string })[]) : []);

      // ---- loop: fixed 60 Hz steps (≤ 3 per frame), paused while the tab is hidden
      let raf = 0, last = performance.now(), acc = 0;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!M || !engine || document.hidden) { last = now; return; }
        acc = Math.min(acc + (now - last), STEP * 3);
        last = now;
        const maxSwing = (PHYSICS.cardMaxSwing * Math.PI) / 180;
        while (acc >= STEP) {
          M.Engine.update(engine, STEP);
          acc -= STEP;
          // soft swing limit: past ±maxSwing the card stops there and swings back
          for (const b of cardBodies()) {
            if (Math.abs(b.angle) > maxSwing) {
              M.Body.setAngle(b, Math.sign(b.angle) * maxSwing);
              M.Body.setAngularVelocity(b, -b.angularVelocity * 0.3);
            }
          }
        }
        for (const t of rt.current) if (t.free && t.body) { t.pose = { x: t.body.position.x, y: t.body.position.y, a: t.body.angle }; paint(t); }
        for (const b of cardBodies()) {
          const el = document.querySelector<HTMLElement>(`[data-card="${b.slug}"]`);
          if (el) el.style.rotate = `${b.angle}rad`;
        }
      };
      raf = requestAnimationFrame(frame);

      // ---- pointer: rubber band → detach → drag (constraint) → throw / hang
      let drag: { t: ToolRt; start: Pt; grab?: MatterNS.Constraint; trail: { p: Pt; at: number }[] } | null = null;
      let picked: ToolRt | null = null; // reduced motion / keyboard: the tool waiting for a hole
      const raise = (t: ToolRt, on: boolean) => {
        const pivot = t.el.closest<HTMLElement>('[data-motion]');
        if (pivot) pivot.style.zIndex = on ? '45' : '';
        t.el.style.filter = on ? 'var(--drop-shadow-lift)' : '';
      };
      const setStaticPose = (t: ToolRt, p: Pose) => {
        t.pose = p;
        if (M && t.body) {
          M.Body.setStatic(t.body, true);
          M.Body.setPosition(t.body, { x: p.x, y: p.y });
          M.Body.setAngle(t.body, p.a);
          t.body.collisionFilter = { category: CAT.pinned, mask: CAT.free, group: 0 };
        }
        t.free = false;
        paint(t);
      };
      const down = (e: PointerEvent) => {
        const p = stagePoint(e);
        if (!p) return;
        const el = (e.target as Element).closest<HTMLElement>('[data-tool]');
        const t = el && rt.current.find((x) => x.el === el);
        if (picked && !t) {
          // reduced motion: second click = where to hang it
          const hole = nearestHole(p, picked);
          if (hole) { hangAt(picked, hole.h); setStaticPose(picked, homePose(picked)); }
          raise(picked, false);
          picked = null;
          return;
        }
        if (!t) return;
        e.preventDefault();
        if (!M) { picked = t; raise(t, true); return; }
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag = { t, start: p, trail: [{ p, at: performance.now() }] };
        raise(t, true);
        if (t.free && t.body) attach(p);
      };
      const attach = (p: Pt) => {
        if (!M || !engine || !drag) return;
        const b = drag.t.body!;
        drag.grab = M.Constraint.create({ pointA: { ...p }, bodyB: b, pointB: rot({ x: p.x - b.position.x, y: p.y - b.position.y }, -b.angle), stiffness: 0.2, damping: 0.1, length: 0 });
        M.Composite.add(engine.world, drag.grab);
      };
      const move = (e: PointerEvent) => {
        if (!drag || !M) return;
        const p = stagePoint(e);
        if (!p) return;
        drag.trail = [...drag.trail.slice(-3), { p, at: performance.now() }];
        const t = drag.t;
        if (!t.free) {
          const off = { x: p.x - drag.start.x, y: p.y - drag.start.y };
          if (Math.hypot(off.x, off.y) < PHYSICS.detach) {
            const h = homePose(t);
            t.pose = { x: h.x + off.x * PHYSICS.rubberBand, y: h.y + off.y * PHYSICS.rubberBand, a: 0 };
            paint(t);
            return;
          }
          // off the wall (a pinned tool was static + asleep: wake it)
          t.free = true;
          M.Body.setStatic(t.body!, false);
          M.Body.setPosition(t.body!, { x: t.pose.x, y: t.pose.y });
          M.Sleeping.set(t.body!, false);
          t.body!.collisionFilter = { category: CAT.free, mask: CAT.static | CAT.pinned | CAT.free | CAT.card, group: 0 };
          attach(p);
        }
        if (drag.grab) drag.grab.pointA = { ...p };
      };
      const up = () => {
        if (!drag || !M) return;
        const { t, grab, trail } = drag;
        drag = null;
        raise(t, false);
        if (grab && engine) M.Composite.remove(engine.world, grab);
        if (!t.free) {
          // released before coming off: back onto its hook
          const from = t.pose, to = homePose(t);
          animate(0, 1, { ...PHYSICS.home, onUpdate: (k) => { t.pose = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, a: 0 }; paint(t); } });
          return;
        }
        // Put down (pointer nearly still) near a free hole → hangs there; otherwise it flies with the pointer's velocity.
        // (Holes are 40 px apart, so without the speed test every throw would end on a hole.)
        const a = trail[0], b = trail[trail.length - 1];
        const dt = Math.max(1, performance.now() - a.at) / STEP;
        const v = { x: ((b.p.x - a.p.x) / dt) * PHYSICS.throw, y: ((b.p.y - a.p.y) / dt) * PHYSICS.throw };
        const s = Math.hypot(v.x, v.y);
        const hole = nearestHole(anchorAt(t, { x: t.body!.position.x, y: t.body!.position.y, a: t.body!.angle }), t);
        if (s <= PHYSICS.snapMaxSpeed && hole && hole.d <= PHYSICS.snap) {
          hangAt(t, hole.h);
          setStaticPose(t, homePose(t));
          return;
        }
        const k = s > PHYSICS.maxThrow ? PHYSICS.maxThrow / s : 1;
        M.Sleeping.set(t.body!, false);
        M.Body.setVelocity(t.body!, { x: v.x * k, y: v.y * k });
      };

      // ---- keyboard: Enter picks up, arrows move hole by hole, Enter hangs, Esc puts it back
      const key = (e: KeyboardEvent) => {
        const t = rt.current.find((x) => x.el === document.activeElement);
        if (!t) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (picked === t) {
            const hole = nearestHole(anchorAt(t, t.pose), t);
            if (hole) hangAt(t, hole.h);
            setStaticPose(t, homePose(t));
            raise(t, false);
            picked = null;
          } else {
            // picked up: its hang point goes onto the nearest hole, so the arrows step from hole to hole
            picked = t;
            raise(t, true);
            const hole = nearestHole(anchorAt(t, t.pose), t);
            if (hole) {
              const a = anchorAt(t, t.pose);
              t.pose = { x: t.pose.x + hole.h.x - a.x, y: t.pose.y + hole.h.y - a.y, a: 0 };
              paint(t);
            }
          }
        } else if (picked === t && e.key.startsWith('Arrow')) {
          e.preventDefault();
          const d = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[e.key] ?? [0, 0];
          const next = { x: t.pose.x + d[0], y: t.pose.y + d[1], a: 0 };
          const a = anchorAt(t, next);
          if (world.holes.some((h) => dist(h, a) < 20)) { t.pose = next; paint(t); }
        } else if (e.key === 'Escape' && picked === t) {
          setStaticPose(t, homePose(t));
          raise(t, false);
          picked = null;
        }
      };

      window.addEventListener('pointerdown', down, true);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('keydown', key);
      cleanup = () => {
        window.removeEventListener('pointerdown', down, true);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('keydown', key);
        cancelAnimationFrame(raf);
        // Rearrange off: everything flies home, cards settle, the world goes away.
        for (const t of rt.current) {
          raise(t, false);
          const from = { ...t.pose }, to = homePose(t);
          const da = ((from.a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
          t.free = false;
          if (from.x !== to.x || from.y !== to.y || da) {
            animate(0, 1, { ...PHYSICS.home, onUpdate: (k) => { t.pose = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, a: da * (1 - k) }; paint(t); } });
          }
        }
        for (const b of cardBodies()) {
          const el = document.querySelector<HTMLElement>(`[data-card="${b.slug}"]`);
          if (el) animate(b.angle, 0, { ...PHYSICS.home, onUpdate: (a) => (el.style.rotate = `${a}rad`), onComplete: () => (el.style.rotate = '') });
        }
        if (M && engine) { M.Composite.clear(engine.world, false); M.Engine.clear(engine); }
      };
    };
    start();
    return () => {
      cancelled = true;
      cleanup();
      for (const el of focusables) {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
        el.style.cursor = '';
      }
    };
  }, [board.rearrange, reduced, cards, world]);

  return null;
}
