import type { SVGProps } from 'react';
import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { svgSize } from '@/lib/figma/specs';

type SvgProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'width' | 'height'> & { width?: number; height?: number };

function Art({ svg, width, height, ...rest }: { svg: FigmaSvgKey; width?: number; height?: number } & SvgProps) {
  const Svg = figmaSvg[svg];
  const native = svgSize(svg);
  return <Svg aria-hidden width={width ?? native.w} height={height ?? native.h} {...rest} />;
}

/** Peg/Hook (1019-1287): `type` = Figma "Type" variant. */
export type PegType = 'hook' | 'pin' | 'double';
export function Peg({ type = 'hook', ...rest }: { type?: PegType } & SvgProps) {
  return <Art svg={`peg-hook-${type}`} {...rest} />;
}

/** Shelf (1019-1336). Always drawn at its native 320 px: in Figma resized instances keep the plank and brackets. */
export function Shelf(props: SvgProps) {
  return <Art svg="shelf" {...props} />;
}

/** Prop/<Tool> (Props 1063-12072): `kind` = tool, `state` = Figma "State" variant (rest | held | slot). */
type PropKey = Extract<FigmaSvgKey, `${string}-rest`>;
export type PropKind = PropKey extends `${infer K}-rest` ? K : never;
export type PropState = 'rest' | 'held' | 'slot';
export function Prop({
  kind,
  state = 'rest',
  width,
  height,
  ...rest
}: { kind: PropKind; state?: PropState; width?: number; height?: number } & SvgProps) {
  return <Art svg={`${kind}-${state}` as FigmaSvgKey} width={width} height={height} {...rest} />;
}
