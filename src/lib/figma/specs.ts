import assetsJson from '@/data/figma/assets.json';
import specsJson from '@/data/figma/specs.json';
import type { FigmaSvgKey } from '@/assets/figma';
import type { ComponentSpec, FigmaNode } from './types';

const specs = specsJson as unknown as Record<string, ComponentSpec>;

/** The node tree of a component (or of one variant of a component set), as exported from Figma. */
export function componentTree(component: string, variant?: Record<string, string>): FigmaNode | undefined {
  const spec = specs[component];
  if (!spec) return undefined;
  if (spec.tree) return spec.tree;
  const match = spec.variants?.find((v) => Object.entries(variant ?? {}).every(([k, val]) => v.variant[k] === val));
  return (match ?? spec.variants?.[0])?.tree;
}

export function componentSpec(component: string): ComponentSpec | undefined {
  return specs[component];
}

// assets.json "source" is the Figma name of the exported node: "Prop/Hammer / State=Rest", "Peg/Hook / Type=Pin", "Shelf".
const assets = assetsJson as unknown as Record<FigmaSvgKey, { source: string; w: number; h: number }>;
const svgBySource = new Map(
  Object.entries(assets)
    .filter(([key]) => key !== '_note')
    .map(([key, a]) => [a.source, key as FigmaSvgKey]),
);

/** The exported SVG for a component instance, if Figma exported one for it. */
export function svgKeyFor(component: string, variant?: Record<string, string>): FigmaSvgKey | undefined {
  const v = Object.entries(variant ?? {}).map(([k, val]) => `${k}=${val}`).join(', ');
  return svgBySource.get(v ? `${component} / ${v}` : component);
}

export function svgSize(key: FigmaSvgKey): { w: number; h: number } {
  return assets[key];
}
