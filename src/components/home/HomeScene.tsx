import t0 from '@/data/figma/layouts/t0.json';
import t0HoverBin from '@/data/figma/layouts/t0-hover-bin.json';
import t0HoverHi from '@/data/figma/layouts/t0-hover-hi.json';
import t1 from '@/data/figma/layouts/t1.json';
import type { ReactNode } from 'react';
import { ProjectCard } from '@/components/card/ProjectCard';
import { FigmaComponent, FigmaLayer } from '@/components/figma/FigmaNode';
import { NavTab } from '@/components/parts/Parts';
import { LayoutPrimitive } from '@/components/stage/LayoutPrimitive';
import { Placed } from '@/components/stage/Placed';
import { archive, projects } from '@/data/projects';
import { animationA, hoverBin, hoverHi, motionNode, type MotionNode } from '@/lib/motion/figma';
import { componentTree } from '@/lib/figma/specs';
import type { LayoutNode } from '@/lib/figma/types';
import { Greeting } from './Greeting';
import { BinButton } from './BinButton';
import { HoverFade, HoverLayer, HoverTarget, MotionLayer } from './MotionLayer';
import { StageButton } from './StageButton';

const items = (layout: unknown) => (layout as { items: LayoutNode[] }).items;
const T1 = items(t1);
const T0 = items(t0);
const byName = (list: LayoutNode[], name: string) => list.find((n) => n.name === name);

// Zeyi, 2026-10-28: LAB is not on the site.
const REMOVED = new Set(['Nav · LAB']);
// Animation A layers that only exist in T0 → the exported T0 layer they show (the motion frame is a copy of T1 + these).
const T0_COPY: Record<string, string> = { 'Nav · WORK (T0)': 'Nav · WORK', 'Bin · T0 label': 'Archive bin', 'Badge · hi (T0)': 'Badge · Aalto' };
const DEMO_ONLY = new Set(['Cursor · click']); // storyboard cursor, not rendered
// T1 controls (Zeyi, 2026-10-29): WORK takes you back to the desk ("/"), the Logo replays Animation A (brief §7.3).
const STAGE_BUTTONS: Record<string, 'backToDesk' | 'replay'> = { 'Nav · WORK': 'backToDesk', Logo: 'replay' };
const PRIMITIVES = new Set(['Board/Panel', 'Peg/Hook', 'Shelf', 'Object']);

/** One layout layer drawn with the component that owns its interaction (cards, nav) or exactly as in Figma. */
function Layer({ node }: { node: LayoutNode }) {
  const c = node.component;
  if (!c) return <Placed node={node}><FigmaLayer node={node} /></Placed>;
  if (PRIMITIVES.has(c) || c.startsWith('Prop/')) return <LayoutPrimitive node={node} />;
  const native = componentTree(c, node.variant);
  if (c === 'Project Card') {
    const mini = node.variant?.State === 'Mini';
    const title = node.texts?.find((t) => t.layer === 'Title')?.text;
    const data =
      projects.find((p) => node.name === `Card · ${p.detailVariant}` || (mini && p.title === title)) ?? archive.find((a) => a.layer === node.name);
    if (!data) throw new Error(`No project data for "${node.name}"`);
    // The instance's own "Show status" wins (the T0 minis hide the SCADA+ WIP lamp, the T1 card shows it).
    const showStatus = typeof node.props?.['Show status'] === 'boolean' ? (node.props['Show status'] as boolean) : data.showStatus;
    return (
      <Placed node={node} native={native}>
        <ProjectCard {...data} showStatus={showStatus} state={mini ? 'mini' : 'rest'} />
      </Placed>
    );
  }
  if (c === 'Nav/Tab') {
    return (
      <Placed node={node} native={native}>
        <NavTab label={node.texts?.[0]?.text ?? ''} state={node.variant?.State === 'Current' ? 'current' : 'default'} />
      </Placed>
    );
  }
  return (
    <Placed node={node} native={native}>
      <FigmaComponent component={c} variant={node.variant} data-theme={node.modes?.theme} overrides={{ textList: node.texts }} />
    </Placed>
  );
}

/** A layer moved to another box (its resting place in Animation A), keeping its own size and rotation. */
const at = (node: LayoutNode, box: { left: number; top: number; rotate?: number }): LayoutNode => ({
  ...node,
  css: { left: box.left, top: box.top, width: node.css!.width, height: node.css!.height, rotate: box.rotate ?? node.css!.rotate },
});

type Entry = { key: string; motion?: MotionNode; el: ReactNode };

/** T1 layers in Figma z-order; the skill tags split per tag (each has its own Animation A track). */
function t1Entries(): Entry[] {
  const out: Entry[] = [];
  for (const n of T1) {
    if (REMOVED.has(n.name)) continue;
    if (n.name === 'Skill tags') {
      for (const tag of n.children ?? []) {
        const placed = at(tag, { left: n.css!.left + tag.css!.left, top: n.css!.top + tag.css!.top });
        out.push({ key: tag.id, motion: motionNode(animationA, `Skill tags / ${tag.name}`), el: <Layer node={placed} /> });
      }
      continue;
    }
    const wrapper = n.name.startsWith('Card · ') ? `Hang · ${n.name.slice('Card · '.length)}` : n.name === 'Clipboard · EXP' ? 'Hang · Clipboard' : n.name;
    const action = STAGE_BUTTONS[n.name];
    const el = action ? (
      <StageButton box={n.css!} action={action} label={n.texts?.[0]?.text ?? n.text ?? n.name}>
        <Layer node={at(n, { left: 0, top: 0 })} />
      </StageButton>
    ) : (
      <Layer node={n} />
    );
    out.push({ key: n.id, motion: motionNode(animationA, wrapper), el });
  }
  return out;
}

/** Animation A layers that exist only in T0, drawn from the T0 layout at their Animation A resting box. */
function t0Entry(m: MotionNode): Entry | null {
  if (DEMO_ONLY.has(m.name)) return null;
  if (m.name.startsWith('Fly · Mini · ')) {
    // The mini sits centred in its Fly frame, tilted as in T0 (the frame turns it upright during the intro).
    const mini = byName(byName(T0, 'Group 161')?.children ?? [], m.name.replace('Fly · ', ''))!;
    const placed = at(mini, { left: m.center.x - mini.css!.width / 2, top: m.center.y - mini.css!.height / 2 });
    const hover = motionNode(hoverBin, m.name.replace('Fly · ', 'Motion · '));
    const el = <Layer node={placed} />;
    return { key: m.id, motion: m, el: hover ? <HoverLayer hover="bin" node={hover} pivot={m.center}>{el}</HoverLayer> : el };
  }
  const source = T0_COPY[m.name] && byName(T0, T0_COPY[m.name]);
  if (!source) return null;
  const el = <Layer node={at(source, { left: m.box.x, top: m.box.y, rotate: 0 })} />;
  if (m.name === 'Badge · hi (T0)') {
    return {
      key: m.id,
      motion: m,
      el: (
        <HoverTarget
          hover="hi"
          label={source.texts?.map((t) => t.text).join(' ').trim() || 'hi'}
          focusBox={{ left: m.box.x, top: m.box.y, width: m.box.w, height: m.box.h }}
        >
          <HoverLayer hover="hi" node={motionNode(hoverHi, 'Badge · hi')!} pivot={m.center}>{el}</HoverLayer>
        </HoverTarget>
      ),
    };
  }
  return { key: m.id, motion: m, el };
}

/** T1 entries + T0-only layers, each inserted after the Animation A layer that precedes it in the motion frame. */
function sceneEntries(): Entry[] {
  const entries = t1Entries();
  const present = new Set(entries.map((e) => e.motion?.id).filter(Boolean));
  let insertAfter = -1;
  for (const m of animationA.nodes) {
    if (present.has(m.id)) {
      insertAfter = entries.findIndex((e) => e.motion?.id === m.id);
      continue;
    }
    const e = t0Entry(m);
    if (e) entries.splice(++insertAfter, 0, e);
  }
  return entries;
}

// The T0 bin = Fly minis + Project bin + its T0 label, consecutive in the motion frame: one hover/press target.
const BIN_GROUP = /^(Fly · Mini · |Project bin$|Bin · T0 label$)/;

/** The home page: one DOM for T0, Animation A and T1 (CLAUDE.md → Page model), plus the T0 hover layers. */
export function HomeScene() {
  const entries = sceneEntries();
  const out: ReactNode[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.motion && BIN_GROUP.test(e.motion.name)) {
      const group: Entry[] = [];
      while (i < entries.length && entries[i].motion && BIN_GROUP.test(entries[i].motion!.name)) group.push(entries[i++]);
      i--;
      out.push(
        <BinButton key="bin">
          {group.map((g) => <MotionLayer key={g.key} node={g.motion!}>{g.el}</MotionLayer>)}
        </BinButton>,
      );
      continue;
    }
    out.push(e.motion ? <MotionLayer key={e.key} node={e.motion}>{e.el}</MotionLayer> : <div key={e.key}>{e.el}</div>);
  }
  const greeting = byName(items(t0HoverHi), 'Greeting')!;
  const pill = byName(items(t0HoverBin), 'Overlay pill')!;
  return (
    <>
      {out}
      <HoverFade hover="hi">
        <Placed node={greeting}>
          <FigmaLayer node={greeting} overrides={{ slots: { Greeting: <Greeting text={greeting.text ?? ''} /> } }} />
        </Placed>
      </HoverFade>
      <HoverFade hover="bin">
        <Placed node={pill}><FigmaLayer node={pill} /></Placed>
      </HoverFade>
    </>
  );
}
