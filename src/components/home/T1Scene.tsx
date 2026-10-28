import t1 from '@/data/figma/layouts/t1.json';
import { ProjectCard } from '@/components/card/ProjectCard';
import { FigmaComponent, FigmaLayer } from '@/components/figma/FigmaNode';
import { NavTab } from '@/components/parts/Parts';
import { LayoutPrimitive } from '@/components/stage/LayoutPrimitive';
import { Placed } from '@/components/stage/Placed';
import { archive, projects } from '@/data/projects';
import { componentTree } from '@/lib/figma/specs';
import type { LayoutNode } from '@/lib/figma/types';

const items = (t1 as unknown as { items: LayoutNode[] }).items;

// Zeyi, 2026-10-28: LAB is not on the site.
const REMOVED = new Set(['Nav · LAB']);

const PRIMITIVES = new Set(['Board/Panel', 'Peg/Hook', 'Shelf', 'Object']);
const isPrimitive = (c: string) => PRIMITIVES.has(c) || c.startsWith('Prop/');

/** One layer of T1, drawn with the component that will own its interaction later (cards, nav) or as in Figma. */
function Layer({ node }: { node: LayoutNode }) {
  const c = node.component;
  if (!c) return <Placed node={node}><FigmaLayer node={node} /></Placed>;
  if (isPrimitive(c)) return <LayoutPrimitive node={node} />;

  const native = componentTree(c, node.variant);
  if (c === 'Project Card') {
    const data = projects.find((p) => node.name === `Card · ${p.detailVariant}`) ?? archive.find((a) => a.layer === node.name);
    if (!data) throw new Error(`No project data for "${node.name}"`);
    return (
      <Placed node={node} native={native}>
        <ProjectCard {...data} state={node.variant?.State === 'Mini' ? 'mini' : 'rest'} />
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

/** T1 · Rest (1068-82267): the home page at rest, every layer at its Figma box, in Figma z-order. */
export function T1Scene() {
  return (
    <>
      {items.filter((n) => !REMOVED.has(n.name)).map((n) => <Layer key={n.id} node={n} />)}
    </>
  );
}
