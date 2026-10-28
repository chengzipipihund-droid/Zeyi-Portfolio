import Image from 'next/image';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { Board, type BoardSurface } from '@/components/board/Board';
import imagesJson from '@/data/figma/images.json';
import { componentTree, svgKeyFor, svgSize } from '@/lib/figma/specs';
import { fillCss, flexAlign, fontCss, paintCss, radiusCss, shadowVar, textStyleClass } from '@/lib/figma/style';
import type { FigmaNode as Node, FigmaText } from '@/lib/figma/types';

/**
 * Overrides of an instance, keyed by Figma layer name — the same things a Figma instance can override.
 * `textList` is the instance's exported `texts` (document order, layer names may repeat).
 */
export type Overrides = {
  textList?: FigmaText[];
  texts?: Record<string, ReactNode>;
  visible?: Record<string, boolean>;
  /** Replace a layer's content with React (vector art → generated SVG, interactive parts…). */
  slots?: Record<string, ReactNode>;
};

type Ctx = { ov: Overrides; textByPath: Map<string, string> };

const images = imagesJson as unknown as Record<string, { src: string; w: number; h: number }>;
const VECTOR_TYPES = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON', 'LINE']);

/** Pre-order walk of the instance's tree (nested instances expanded), like the exporter's findAll(TEXT && visible). */
function assignTexts(root: Node, list: FigmaText[] | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (!list?.length) return out;
  const queue = [...list];
  const walk = (n: Node, path: string) => {
    if (n.type === 'TEXT' && n.visible !== false) {
      const i = queue.findIndex((t) => t.layer === n.name);
      if (i >= 0) out.set(path, queue.splice(i, 1)[0].text);
    }
    const kids = n.type === 'INSTANCE' && n.component && !n.children ? componentTree(n.component, n.variant)?.children : n.children;
    kids?.forEach((c) => walk(c, `${path}/${c.id}`));
  };
  walk(root, root.id);
  return out;
}

function sizeAxis(node: Node, parent: Node | undefined, axis: 0 | 1, inFlow: boolean): CSSProperties {
  const px = axis === 0 ? node.w : node.h;
  const prop = axis === 0 ? 'width' : 'height';
  const sizing = inFlow ? node.sizing?.[axis] : undefined;
  if (sizing === 'FILL' && parent?.layout) {
    const primary = (parent.layout.mode === 'HORIZONTAL') === (axis === 0);
    return primary ? { flexGrow: 1, flexBasis: 0, [prop === 'width' ? 'minWidth' : 'minHeight']: 0 } : { alignSelf: 'stretch' };
  }
  if (sizing === 'HUG') return {};
  if (sizing === 'FIXED') return { [prop]: px };
  // No sizing exported (older export, or parent without auto layout): infer from the node itself.
  if (node.type === 'TEXT') {
    if (node.autoResize === 'WIDTH_AND_HEIGHT') return {};
    if (node.autoResize === 'HEIGHT' && axis === 1) return {};
    return { [prop]: px };
  }
  const l = node.layout;
  if (l && l.mode !== 'NONE') {
    const primary = (l.mode === 'HORIZONTAL') === (axis === 0);
    if ((primary ? l.primarySizing : l.counterSizing) === 'AUTO') return {};
  }
  return { [prop]: px };
}

function boxStyle(node: Node, parent: Node | undefined, root: boolean): CSSProperties {
  // Exported art already contains its rotation: place its rendered box instead of the rotated layer.
  if (node.artBox) node = { ...node, x: node.artBox.x, y: node.artBox.y, w: node.artBox.w, h: node.artBox.h, rotation: undefined };
  const pl = parent?.layout;
  const inFlow = !root && !!pl && pl.mode !== 'NONE' && !node.absolute;
  const s: CSSProperties = { boxSizing: 'border-box', flexShrink: 0, position: root || inFlow ? 'relative' : 'absolute' };
  if (!root && !inFlow) {
    // Children of a GROUP are positioned in the group's parent space (art boxes are already relative to the group).
    const ox = parent?.type === 'GROUP' && !node.artBox ? parent.x : 0;
    const oy = parent?.type === 'GROUP' && !node.artBox ? parent.y : 0;
    s.left = node.x - ox;
    s.top = node.y - oy;
  }
  if (node.rotation) {
    s.transformOrigin = '0 0';
    s.transform = `rotate(${-node.rotation}deg)`; // Figma rotates counter-clockwise around the layer origin
  }
  Object.assign(s, sizeAxis(node, parent, 0, inFlow), sizeAxis(node, parent, 1, inFlow));
  if (node.opacity != null) s.opacity = node.opacity;
  const radius = node.type === 'ELLIPSE' ? '50%' : radiusCss(node.radius);
  if (radius) s.borderRadius = radius;
  const shadow = shadowVar(node.effect) ?? node.effectCss?.boxShadow;
  if (shadow) s.boxShadow = shadow;
  return s;
}

function layoutStyle(node: Node): CSSProperties {
  const l = node.layout;
  if (!l) return {};
  const s: CSSProperties = {};
  if (l.clips) s.overflow = 'hidden';
  if (l.mode === 'NONE') return s;
  const inset = l.strokesInLayout && node.strokeAlign === 'INSIDE' && typeof node.strokeWeight === 'number' ? node.strokeWeight : 0;
  const [t, r, b, lft] = (l.padding ?? [0, 0, 0, 0]).map((p) => p + inset);
  Object.assign(s, {
    display: 'flex',
    flexDirection: l.mode === 'HORIZONTAL' ? 'row' : 'column',
    flexWrap: l.wrap === 'WRAP' ? 'wrap' : undefined,
    justifyContent: flexAlign(l.primaryAlign),
    alignItems: flexAlign(l.counterAlign),
    padding: `${t}px ${r}px ${b}px ${lft}px`,
  } satisfies CSSProperties);
  if (l.primaryAlign !== 'SPACE_BETWEEN' && l.gap) s[l.mode === 'HORIZONTAL' ? 'columnGap' : 'rowGap'] = l.gap;
  const counterGap = l.counterGap ?? (l.wrap === 'WRAP' ? wrapGap(node) : undefined);
  if (counterGap) s[l.mode === 'HORIZONTAL' ? 'rowGap' : 'columnGap'] = counterGap;
  return s;
}

/** Row spacing of a wrapping auto layout, measured from the exported child positions (when the export lacks it). */
function wrapGap(node: Node): number | undefined {
  const horizontal = node.layout?.mode === 'HORIZONTAL';
  const kids = (node.children ?? []).filter((c) => c.visible !== false && !c.absolute);
  const rows = new Map<number, number>(); // row start → row extent
  for (const c of kids) {
    const start = horizontal ? c.y : c.x;
    rows.set(start, Math.max(rows.get(start) ?? 0, horizontal ? c.h : c.w));
  }
  const starts = [...rows.keys()].sort((a, b) => a - b);
  const gaps = starts.slice(1).map((s, i) => s - (starts[i] + rows.get(starts[i])!));
  return gaps.length ? Math.max(0, Math.min(...gaps)) : undefined;
}

/** Figma strokes are painted above the content and never change layout — an overlay border does the same. */
function Stroke({ node }: { node: Node }) {
  const color = node.strokes?.map(paintCss).find(Boolean);
  const w = typeof node.strokeWeight === 'number' ? node.strokeWeight : 0;
  if (!color || (!w && !node.strokeSides)) return null;
  const out = node.strokeAlign === 'OUTSIDE' ? w : node.strokeAlign === 'CENTER' ? w / 2 : 0;
  const r = node.type === 'ELLIPSE' ? '50%' : typeof node.radius === 'number' ? `${node.radius + out}px` : radiusCss(node.radius);
  // Solid uniform strokes as an inset shadow: Chrome floors border widths to whole pixels (1.5px → 1px), shadows keep 1.5.
  const line: CSSProperties =
    node.dash || node.strokeSides
      ? { borderStyle: node.dash ? 'dashed' : 'solid', borderColor: color, borderWidth: node.strokeSides ? node.strokeSides.map((s) => `${s}px`).join(' ') : w }
      : { boxShadow: `inset 0 0 0 ${w}px ${color}` };
  return <span aria-hidden style={{ position: 'absolute', inset: -out, borderRadius: r, pointerEvents: 'none', ...line }} />;
}

function modeAttrs(node: Node) {
  return {
    'data-theme': node.modes?.theme,
    'data-surface': node.modes?.surface,
  };
}

function Render({ node, parent, root = false, path, ctx }: { node: Node; parent?: Node; root?: boolean; path: string; ctx: Ctx }): ReactNode {
  const { ov } = ctx;
  if ((ov.visible?.[node.name] ?? node.visible) === false) return null;
  const box = boxStyle(node, parent, root);
  const slot = ov.slots?.[node.name];

  if (node.type === 'TEXT') {
    const content = ctx.textByPath.get(path) ?? ov.texts?.[node.name] ?? node.text;
    const stroke = node.strokes?.map(paintCss).find(Boolean);
    // Figma "Auto" line height ≠ the browser's `normal`; for one-line hug text the exported box height is Figma's line box.
    const font = node.font && !node.textStyle ? fontCss(node.font) : {};
    if (node.font?.lineHeight === 'normal' && node.autoResize === 'WIDTH_AND_HEIGHT' && !node.text?.includes('\n')) font.lineHeight = `${node.h}px`;
    return (
      <div
        data-layer={node.name}
        className={textStyleClass(node.textStyle)}
        style={{
          ...box,
          ...font,
          color: fillCss(node.fills),
          textAlign: node.align === 'JUSTIFIED' ? 'justify' : node.align?.toLowerCase() as CSSProperties['textAlign'],
          whiteSpace: node.autoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-wrap',
          WebkitTextStroke: stroke && typeof node.strokeWeight === 'number' ? `${node.strokeWeight * (node.strokeAlign === 'OUTSIDE' ? 2 : 1)}px ${stroke}` : undefined,
          paintOrder: stroke ? 'stroke fill' : undefined,
        }}
      >
        {slot ?? content}
      </div>
    );
  }

  // Vector geometry is never in the spec: it only renders through an exported SVG (node.asset).
  if (VECTOR_TYPES.has(node.type) && !node.asset && slot === undefined) return null;

  if (node.asset && slot === undefined) {
    const key = node.asset as FigmaSvgKey;
    const Svg = figmaSvg[key];
    if (!Svg) throw new Error(`Art "${node.asset}" is not in src/assets/figma — re-run npm run figma:import.`);
    // The SVG includes stroke bleed outside the Figma box: draw it at its own size, centred on the box.
    const { w, h } = svgSize(key);
    const bw = node.artBox?.w ?? node.w;
    const bh = node.artBox?.h ?? node.h;
    return (
      <div data-layer={node.name} style={box}>
        <Svg aria-hidden width={w} height={h} style={{ position: 'absolute', left: (bw - w) / 2, top: (bh - h) / 2, overflow: 'visible' }} />
      </div>
    );
  }

  if (node.image && slot === undefined) {
    const img = images[node.image];
    if (!img) throw new Error(`Image "${node.image}" is not in src/data/figma/images.json — re-run npm run figma:import.`);
    return (
      <div data-layer={node.name} style={{ ...box, overflow: 'hidden' }}>
        <Image src={img.src} alt="" width={node.w} height={node.h} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  if (node.type === 'INSTANCE' && node.component === 'Board/Panel' && slot === undefined) {
    return (
      <div data-layer={node.name} style={box} {...modeAttrs(node)}>
        <Board width={node.w} height={node.h} surface={node.modes?.surface as BoardSurface | undefined} />
      </div>
    );
  }

  if (node.type === 'INSTANCE' && node.component && !node.children && slot === undefined) {
    const key = svgKeyFor(node.component, node.variant);
    if (key) {
      const Svg = figmaSvg[key];
      return <Svg data-layer={node.name} aria-hidden width={node.w} height={node.h} style={box} {...modeAttrs(node)} />;
    }
    const inner = componentTree(node.component, node.variant);
    if (inner) {
      // A nested instance: its own exported texts apply unless the outer instance already set them
      // (its text map is keyed from its own root, so it starts a fresh path).
      const own = !ctx.textByPath.size;
      const nestedCtx: Ctx = own ? { ov, textByPath: assignTexts(inner, node.texts) } : ctx;
      return (
        <div data-layer={node.name} style={box} {...modeAttrs(node)}>
          <Render node={{ ...inner, x: 0, y: 0 }} root path={own ? inner.id : `${path}/${inner.id}`} ctx={nestedCtx} />
        </div>
      );
    }
  }

  const fill = fillCss(node.fills);
  return (
    <div data-layer={node.name} style={{ ...box, ...layoutStyle(node), background: fill }} {...modeAttrs(node)}>
      {slot ?? node.children?.map((c) => <Render key={c.id} node={c} parent={node} path={`${path}/${c.id}`} ctx={ctx} />)}
      <Stroke node={node} />
    </div>
  );
}

type WrapperProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & { 'data-theme'?: string; 'data-surface'?: string };

/** Render one Figma component (or variant) with instance overrides. Extra props go on the wrapper (data-theme…). */
export function FigmaComponent({
  component,
  variant,
  overrides = {},
  style,
  ...rest
}: { component: string; variant?: Record<string, string>; overrides?: Overrides } & WrapperProps) {
  const tree = componentTree(component, variant);
  if (!tree) throw new Error(`Figma component "${component}" ${JSON.stringify(variant ?? {})} is not in specs.json — re-export from Figma.`);
  const ctx: Ctx = { ov: overrides, textByPath: assignTexts(tree, overrides.textList) };
  return (
    <div {...rest} style={{ position: 'relative', width: 'max-content', ...style }}>
      <Render node={tree} root path={tree.id} ctx={ctx} />
    </div>
  );
}

/** Render a plain Figma layer (e.g. a frame of a layout JSON) and its children as they are in Figma. */
export function FigmaLayer({ node, overrides = {}, ...rest }: { node: Node; overrides?: Overrides } & WrapperProps) {
  const ctx: Ctx = { ov: overrides, textByPath: assignTexts(node, overrides.textList) };
  return (
    <div {...rest} style={{ position: 'relative', width: 'max-content', ...rest.style }}>
      <Render node={node} root path={node.id} ctx={ctx} />
    </div>
  );
}
