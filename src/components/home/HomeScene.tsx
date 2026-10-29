import t0 from '@/data/figma/layouts/t0.json';
import t0HoverBin from '@/data/figma/layouts/t0-hover-bin.json';
import t0HoverHi from '@/data/figma/layouts/t0-hover-hi.json';
import t1 from '@/data/figma/layouts/t1.json';
import type { ReactNode } from 'react';
import { DetailBoard } from '@/components/card/DetailBoard';
import { ProjectCard, type ProjectCardState } from '@/components/card/ProjectCard';
import { FigmaComponent, FigmaLayer } from '@/components/figma/FigmaNode';
import { NavTab } from '@/components/parts/Parts';
import { LayoutPrimitive } from '@/components/stage/LayoutPrimitive';
import { Placed } from '@/components/stage/Placed';
import { archive, projects, skills, type Project } from '@/data/projects';
import assetsJson from '@/data/figma/assets.json';
import { boardHoles, boxCenter, emptySlotBox, hoverBox, propToStage, pushPose, states, type Box, type Pt } from '@/lib/board/geometry';
import { animationA, hoverBin, hoverHi, motionNode, type MotionNode } from '@/lib/motion/figma';
import { caseSlugs } from '@/lib/figma/cases';
import { componentTree, svgKeyFor } from '@/lib/figma/specs';
import { METAL_TOOLS } from '@/styles/motion';
import { fillCss, paintCss, radiusCss, shadowVar } from '@/lib/figma/style';
import type { FigmaNode, LayoutNode } from '@/lib/figma/types';
import { BinButton } from './BinButton';
import {
  BoardCard,
  BoardFade,
  BoardOverlay,
  BoardProp,
  BoardTag,
  CursorPill,
  DetailActions,
  FilterPillText,
  FilterStrings,
  RearrangeButton,
  SideFlip,
  WhenFiltered,
} from './Board';
import { Physics, type PhysCard, type PhysTool, type PhysWorld } from './Physics';
import { BoardStateProvider } from './BoardState';
import { Greeting } from './Greeting';
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
const REARRANGE = 'Rearrange (β)';
const PRIMITIVES = new Set(['Board/Panel', 'Peg/Hook', 'Shelf', 'Object']);
// Layers of the personal side board: they flip away when a project opens (T5).
const SIDE = new Set(['Side board · personal', 'Nameplate', 'Status lamp', 'Tags label', 'Badge · Tongji', 'Badge · Aalto', 'Shelf · education', 'Clipboard · EXP', 'Hook · clipboard']);
const SIDE_BOARD = byName(T1, 'Side board · personal')!.css!;
const SIDE_ORIGIN = boxCenter(SIDE_BOARD);

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
const at = (node: LayoutNode, b: { left: number; top: number; rotate?: number }): LayoutNode => ({
  ...node,
  css: { left: b.left, top: b.top, width: node.css!.width, height: node.css!.height, rotate: b.rotate ?? node.css!.rotate },
});
const withVariant = (node: LayoutNode, variant: Record<string, string>): LayoutNode => ({ ...node, variant: { ...node.variant, ...variant } });
const cssBox = (n: LayoutNode): Box => n.css!;

// ---------------------------------------------------------------- T1 interactions (M6)

const projectOfCard = (name: string) => projects.find((p) => name === `Card · ${p.detailVariant}`);
const cardLayer = (p: Project) => byName(T1, `Card · ${p.detailVariant}`)!;
const hookLayer = (p: Project) => byName(T1, `Hook · ${p.detailVariant}`)!;

/** The Hover variant's own frame, used for the box that grows from M to L. */
function hoverShell() {
  const t = componentTree('Project Card', { State: 'Hover' })!;
  const stroke = t.strokes?.map(paintCss).find(Boolean);
  return {
    background: fillCss(t.fills),
    borderRadius: radiusCss(t.radius),
    boxShadow: [`inset 0 0 0 ${t.strokeWeight}px ${stroke}`, shadowVar(t.effect)].filter(Boolean).join(', '),
  };
}

function boardCard(n: LayoutNode, p: Project) {
  const variant = (state: ProjectCardState) => <ProjectCard {...p} showStatus={n.props?.['Show status'] === true} state={state} />;
  return (
    <BoardCard
      slug={p.slug}
      label={`${p.title} — ${p.subtitle}`}
      skills={p.skills}
      rest={cssBox(n)}
      hover={hoverBox(cssBox(n))}
      hookName={hookLayer(p).name}
      pivotY={motionNode(animationA, `Hang · ${p.detailVariant}`)!.center.y}
      shell={hoverShell()}
      variants={{ rest: variant('rest'), hover: variant('hover'), match: variant('match'), dim: variant('dim'), taken: variant('taken') }}
    />
  );
}

function boardProp(n: LayoutNode) {
  const pushes = Object.fromEntries(
    projects.map((p) => [p.slug, pushPose({ name: n.name, box: cssBox(n) }, { name: cardLayer(p).name, box: cssBox(cardLayer(p)) })]),
  );
  return (
    <BoardProp
      name={n.name}
      center={boxCenter(cssBox(n))}
      pushes={pushes}
      rest={<Layer node={n} />}
      held={<Layer node={withVariant(n, { State: 'Held' })} />}
      slot={<Layer node={withVariant(n, { State: 'Slot' })} />}
    />
  );
}

// ---------------------------------------------------------------- M7 physics data (stage px, from the layout + assets)

type AssetMeta = { w: number; h: number; art: { x: number; y: number; w: number; h: number } | null; hull: number[][] | null; anchor: Pt | null };
const ASSETS = assetsJson as unknown as Record<string, AssetMeta>;

function physicsData(): { tools: PhysTool[]; cards: PhysCard[]; world: PhysWorld } {
  const tools: PhysTool[] = [];
  for (const n of T1) {
    if (!n.component?.startsWith('Prop/')) continue;
    const key = svgKeyFor(n.component, n.variant);
    const a = key && ASSETS[key];
    if (!a?.hull || !a.art) continue;
    const box = cssBox(n);
    const toStage = (p: Pt) => propToStage(box, a, p);
    const base = key!.replace(/-rest$/, '');
    tools.push({
      name: n.name,
      label: n.name.replace(/^Prop · /, ''),
      hull: a.hull.map(([x, y]) => toStage({ x, y })),
      // hang point: Figma "Anchor" layer, else the top centre of the art (brief §8)
      anchor: toStage(a.anchor ?? { x: a.art.x + a.art.w / 2, y: a.art.y }),
      metal: METAL_TOOLS.has(base),
      tapeRoll: base === 'tape-roll',
    });
  }
  const cards: PhysCard[] = projects.map((p) => {
    const hook = cssBox(hookLayer(p));
    return { slug: p.slug, box: cssBox(cardLayer(p)), pivot: { x: hook.left + hook.width / 2, y: motionNode(animationA, `Hang · ${p.detailVariant}`)!.center.y } };
  });
  const board = cssBox(byName(T1, 'Main board')!);
  const edge = 2; // Board/Panel inside stroke
  const shelf = cssBox(byName(T1, 'Shelf · desk')!);
  const plank = layerBoxOfSvgPlank();
  const world: PhysWorld = {
    statics: [
      { left: board.left - 50 + edge, top: board.top, width: 50, height: board.height },
      { left: board.left + board.width - edge, top: board.top, width: 50, height: board.height },
      { left: board.left, top: board.top + board.height - edge, width: board.width, height: 50 },
      { left: board.left, top: board.top - 50 + edge, width: board.width, height: 50 },
      { left: shelf.left + plank.left, top: shelf.top + plank.top, width: plank.width, height: plank.height },
      cssBox(byName(T1, 'Ruler · timeline')!),
    ],
    bins: [cssBox(byName(T1, 'Archive bin')!), cssBox(byName(T1, 'Project bin')!)],
    holes: boardHoles(board, componentTree('Board/Hole')!),
  };
  return { tools, cards, world };
}

/** The shelf plank inside the Shelf SVG (its top bar, 1 → 319 × 1 → 11 in the 320 × 52 drawing). */
function layerBoxOfSvgPlank(): Box {
  const a = ASSETS.shelf;
  return { left: 1, top: 1, width: a.w - 2, height: 10 };
}

type Entry = { key: string; motion?: MotionNode; el: ReactNode; side?: boolean };

/** T1 layers in Figma z-order, each with its T1 interaction; the skill tags split per tag (each has its own track). */
function t1Entries(): Entry[] {
  const out: Entry[] = [];
  const tagsFrame = byName(T1, 'Skill tags')!;
  const tagBoxes = ((tagsFrame.children ?? []) as LayoutNode[]).map((tag) => ({
    label: tag.texts?.find((t) => t.layer === 'Label')?.text ?? tag.name,
    node: at(tag, { left: tagsFrame.css!.left + tag.css!.left, top: tagsFrame.css!.top + tag.css!.top }),
  }));
  const hmiTag = cssBox(tagBoxes.find((t) => t.label === states.t4.skill)!.node);
  for (const n of T1) {
    if (REMOVED.has(n.name)) continue;
    if (n.name === 'Skill tags') {
      out.push({
        key: 'filter-strings',
        el: <FilterStrings tags={tagBoxes.map((t) => ({ label: t.label, box: cssBox(t.node) }))} cards={projects.map((p) => ({ slug: p.slug, skills: p.skills, hook: cssBox(hookLayer(p)) }))} />,
      });
      for (const { label, node } of tagBoxes) {
        out.push({
          key: node.id,
          side: true,
          motion: motionNode(animationA, `Skill tags / ${node.name}`),
          el: (
            <BoardTag
              label={label}
              tag={cssBox(node)}
              slotBox={emptySlotBox(cssBox(node), hmiTag)}
              idle={<Layer node={node} />}
              pulled={<Layer node={withVariant(node, { State: states.t4.pulledTag.state })} />}
            />
          ),
        });
      }
      continue;
    }
    const wrapper = n.name.startsWith('Card · ') ? `Hang · ${n.name.slice('Card · '.length)}` : n.name === 'Clipboard · EXP' ? 'Hang · Clipboard' : n.name;
    const action = STAGE_BUTTONS[n.name];
    const project = projectOfCard(n.name);
    const hookOf = projects.find((p) => hookLayer(p).name === n.name);
    let el: ReactNode;
    if (action) {
      el = (
        <StageButton box={n.css!} action={action} label={n.texts?.[0]?.text ?? n.text ?? n.name}>
          <Layer node={at(n, { left: 0, top: 0 })} />
        </StageButton>
      );
    } else if (n.name === REARRANGE) {
      el = (
        <RearrangeButton box={n.css!} label={n.children?.find((c) => c.type === 'TEXT')?.text ?? n.name}>
          <Layer node={at(n, { left: 0, top: 0 })} />
        </RearrangeButton>
      );
    } else if (project) el = boardCard(n, project);
    else if (n.component?.startsWith('Prop/')) el = boardProp(n);
    else if (hookOf) el = <BoardFade opacity={states.t4.dimHookOpacity} keepFor={hookOf.skills}><Layer node={n} /></BoardFade>;
    else if (n.name === 'Pin · pliers') el = <BoardFade opacity={states.t4.toolOpacity}><Layer node={n} /></BoardFade>;
    else if (n.name.startsWith('Archive · ')) el = <BoardFade opacity={states.t4.archiveOpacity}><Layer node={n} /></BoardFade>;
    else if (states.t4.hidden.includes(n.name)) el = <BoardFade opacity={0}><Layer node={n} /></BoardFade>;
    else el = <Layer node={n} />;
    out.push({ key: n.id, motion: motionNode(animationA, wrapper), el, side: SIDE.has(n.name) });
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

/** Path to a layer inside a component tree → its box in the component (Figma x/y are relative to the parent). */
function layerBox(tree: FigmaNode, name: string, ox = 0, oy = 0): Box | null {
  for (const c of tree.children ?? []) {
    if (c.name === name) return { left: ox + c.x, top: oy + c.y, width: c.w, height: c.h };
    const found = layerBox(c, name, ox + c.x, oy + c.y);
    if (found) return found;
  }
  return null;
}

/** T5: each project's Detail Board on the side board's place, with its "put back" button. */
function detailBoards(): ReactNode[] {
  const [x, y] = states.t5.detailBoardBox;
  const withCase = new Set(caseSlugs());
  return projects.map((p) => {
    const tree = componentTree('Detail Board', { Project: p.detailVariant })!;
    const put = layerBox(tree, 'Put back')!;
    const text = (re: RegExp, fallback: string) => JSON.stringify(tree).match(re)?.[1] ?? fallback;
    return (
      <SideFlip key={`detail-${p.slug}`} face={p.slug} origin={SIDE_ORIGIN}>
        <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'auto' }}>
          <DetailBoard project={p.slug} />
          <DetailActions
            slug={p.slug}
            label={text(/"text":"(↩[^"]*)"/, 'Put back')}
            putBack={put}
            openCase={layerBox(tree, 'Open case page')}
            caseHref={withCase.has(p.slug) ? `/work/${p.slug}` : undefined}
            caseLabel={text(/"text":"(Open the case[^"]*)"/, 'Open the case')}
          />
        </div>
      </SideFlip>
    );
  });
}

// The T0 bin = Fly minis + Project bin + its T0 label, consecutive in the motion frame: one hover/press target.
const BIN_GROUP = /^(Fly · Mini · |Project bin$|Bin · T0 label$)/;

/** The home page: one DOM for T0, Animation A and T1 (CLAUDE.md → Page model), the T0 hovers and the T1 interactions. */
export function HomeScene() {
  const entries = sceneEntries();
  const out: ReactNode[] = [];
  const layer = (e: Entry) => {
    const el = e.motion ? <MotionLayer key={e.key} node={e.motion}>{e.el}</MotionLayer> : <div key={e.key}>{e.el}</div>;
    return e.side ? <SideFlip key={e.key} face="personal" origin={SIDE_ORIGIN}>{el}</SideFlip> : el;
  };
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.motion && BIN_GROUP.test(e.motion.name)) {
      const group: Entry[] = [];
      while (i < entries.length && entries[i].motion && BIN_GROUP.test(entries[i].motion!.name)) group.push(entries[i++]);
      i--;
      out.push(<BinButton key="bin">{group.map(layer)}</BinButton>);
      continue;
    }
    out.push(layer(e));
  }
  const greeting = byName(items(t0HoverHi), 'Greeting')!;
  const pill = byName(items(t0HoverBin), 'Overlay pill')!; // the pill style of T0 / T2 / T4
  const pillText = pill.children?.find((c) => c.type === 'TEXT')?.name ?? '';
  const [fx, fy, fw, fh] = states.t4.pill.box;
  const filterPill: LayoutNode = { ...pill, effect: states.t4.pill.shadow ? pill.effect : undefined, effectCss: undefined, css: { left: fx, top: fy, width: fw, height: fh, rotate: 0 } };
  const counts = Object.fromEntries(skills.map((s) => [s, projects.filter((p) => p.skills.includes(s)).length]));
  const [px, py] = states.t2.pill.box;
  const [cx, cy] = states.t2.pill.cursor;
  return (
    <BoardStateProvider skills={skills}>
      {out}
      <Physics {...physicsData()} />
      <BoardOverlay />
      {detailBoards()}
      <WhenFiltered>
        <Placed node={filterPill}>
          <FigmaLayer node={filterPill} overrides={{ slots: { [pillText]: <FilterPillText counts={counts} /> } }} />
        </Placed>
      </WhenFiltered>
      <CursorPill offset={{ x: px - cx, y: py - cy }} forcedAt={{ x: cx, y: cy }}>
        <FigmaLayer node={pill} overrides={{ texts: { [pillText]: states.t2.pill.text } }} />
      </CursorPill>
      <HoverFade hover="hi">
        <Placed node={greeting}>
          <FigmaLayer node={greeting} overrides={{ slots: { Greeting: <Greeting text={greeting.text ?? ''} /> } }} />
        </Placed>
      </HoverFade>
      <HoverFade hover="bin">
        <Placed node={pill}><FigmaLayer node={pill} /></Placed>
      </HoverFade>
    </BoardStateProvider>
  );
}
