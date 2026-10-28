import { figmaSvg } from '@/assets/figma';
import { Bin } from '@/components/board/Bin';
import { Board, type BoardSurface } from '@/components/board/Board';
import { Peg, Shelf, type PegType } from '@/components/board/Hardware';
import { componentTree, svgKeyFor, svgSize } from '@/lib/figma/specs';
import type { LayoutNode } from '@/lib/figma/types';
import { Placed } from './Placed';

const textOf = (node: LayoutNode, layer: string) => node.texts?.find((t) => t.layer === layer)?.text;

/** M1 primitives (board, pegs, shelves, bins, props) of a layout JSON, at their Figma boxes. Other nodes → null. */
export function LayoutPrimitive({ node }: { node: LayoutNode }) {
  const c = node.component;
  if (!c || !node.css) return null;

  if (c === 'Board/Panel') {
    return (
      <Placed node={node}>
        <Board width={node.css.width} height={node.css.height} surface={node.modes?.surface as BoardSurface | undefined} />
      </Placed>
    );
  }
  if (c === 'Peg/Hook') {
    return (
      <Placed node={node}>
        <Peg type={node.variant?.Type.toLowerCase() as PegType} />
      </Placed>
    );
  }
  if (c === 'Shelf') {
    return (
      <Placed node={node}>
        <Shelf />
      </Placed>
    );
  }
  if (c === 'Object') {
    const tree = componentTree(c, node.variant)!;
    return (
      <Placed node={node} native={tree}>
        <Bin
          variant={node.variant?.['Property 1'] === 'ProjectBin' ? 'project' : 'archive'}
          label={textOf(node, 'Label')}
          caption={textOf(node, 'Caption')}
        />
      </Placed>
    );
  }
  if (c.startsWith('Prop/')) {
    const key = svgKeyFor(c, node.variant);
    if (!key) return null;
    const Svg = figmaSvg[key];
    const native = svgSize(key);
    return (
      <Placed node={node} native={native}>
        <Svg aria-hidden width={native.w} height={native.h} />
      </Placed>
    );
  }
  return null;
}
