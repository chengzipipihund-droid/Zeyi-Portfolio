import t1 from '@/data/figma/layouts/t1.json';
import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { Bin } from '@/components/board/Bin';
import { Board } from '@/components/board/Board';
import { Peg, Prop, Shelf, type PegType, type PropKind } from '@/components/board/Hardware';
import { LayoutPrimitive } from '@/components/stage/LayoutPrimitive';
import { Stage } from '@/components/stage/Stage';
import type { LayoutNode } from '@/lib/figma/types';
import { DevItem, DevSection } from './DevShell';

const items = (t1 as unknown as { items: LayoutNode[] }).items;
const propKinds = (Object.keys(figmaSvg) as FigmaSvgKey[])
  .filter((k) => k.endsWith('-rest'))
  .map((k) => k.slice(0, -'-rest'.length) as PropKind);
const pegs: PegType[] = ['hook', 'pin', 'double'];

/** M1: Stage, Board, Peg, Shelf, Bin, Prop. */
export function Primitives() {
  return (
    <>
      <DevSection title="M1 · Stage + primitives from layouts/t1.json" note="Board, pegs, shelves, bins and props at their T1 positions (cards, text and side-board content arrive in M2/M3).">
        <div className="w-full">
          <Stage>
            {items.map((n) => <LayoutPrimitive key={n.id} node={n} />)}
          </Stage>
        </div>
      </DevSection>

      <DevSection title="Board/Panel" note="surface = light | accent; colours follow data-theme">
        <DevItem label="Board · light" detail="376×300">
          <Board width={376} height={300} surface="light" />
        </DevItem>
        <DevItem label="Board · accent" detail="376×300 · try data-theme = ultra-bridge">
          <Board width={376} height={300} surface="accent" />
        </DevItem>
      </DevSection>

      <DevSection title="Peg/Hook · Shelf · Object">
        {pegs.map((t) => (
          <DevItem key={t} label={`Peg · ${t}`}>
            <Peg type={t} />
          </DevItem>
        ))}
        <DevItem label="Shelf" detail="native 320×52">
          <Shelf />
        </DevItem>
        <DevItem label="Bin · project" detail="label plate from specs.json">
          <Bin variant="project" />
        </DevItem>
        <DevItem label="Bin · archive">
          <Bin variant="archive" />
        </DevItem>
      </DevSection>

      <DevSection title="Prop · rest / held / slot">
        {propKinds.map((k) => (
          <DevItem key={k} label={k}>
            <div className="flex items-end gap-3">
              <Prop kind={k} state="rest" />
              <Prop kind={k} state="held" />
              <Prop kind={k} state="slot" />
            </div>
          </DevItem>
        ))}
      </DevSection>
    </>
  );
}
