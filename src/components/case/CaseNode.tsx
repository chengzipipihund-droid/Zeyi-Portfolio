import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { Peg, Prop, Shelf, type PegType, type PropKind, type PropState } from '@/components/board/Hardware';
import { ProjectCard } from '@/components/card/ProjectCard';
import { NavTab } from '@/components/parts/Parts';
import { projects } from '@/data/projects';
import type { CaseFont, CaseNode } from '@/lib/figma/cases';
import { flexAlign, radiusCss, textStyleClass } from '@/lib/figma/style';

// Generic renderer for the case-page trees (docs/case-pages-brief.md §2): frame → flex box from `layout`, text → element
// with its .type-* class, mount → figure, media → next/image, component → the home component. Sizes are the Figma
// sizes at 1440; FILL / HUG map onto flex so the boxes follow their content like auto layout does.

export type CaseLink = { href: string; external?: boolean; label?: string };

export type CaseCtx = {
  /** Node id → link (frame or text becomes the <a>). */
  links?: Record<string, CaseLink>;
  /** Node id → DOM id (chapter titles, for aria-labelledby). */
  ids?: Record<string, string>;
  /** Node id → heading level, overriding the one from the text style. */
  tags?: Record<string, 'h1' | 'h2' | 'h3' | 'p'>;
  /** Node ids left out (design notes). */
  hide?: Set<string>;
  /** Node id → extra React content drawn inside that node (after its children). */
  extra?: Record<string, ReactNode>;
  /** Node id → React content drawn right above that node's picture, below its children (the film video). */
  under?: Record<string, ReactNode>;
  /** Load the images of this section first (hero / film poster). */
  priority?: boolean;
  /** Inside a link already: no nested <a>. */
  inLink?: boolean;
};

const linkOf = (node: CaseNode, ctx: CaseCtx): CaseLink | undefined =>
  ctx.inLink ? undefined : (ctx.links?.[node.id] ?? (node.link ? { href: node.link, external: true } : undefined));

type Props = { node: CaseNode; parent?: CaseNode; root?: boolean; ctx: CaseCtx };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** "gradient_linear(a 0%, b 100%)" → CSS; colours pass through (var(--…), #hex, rgba). */
function paint(p: string): string {
  const g = p.match(/^gradient_(linear|radial)\((.*)\)$/);
  if (g) return g[1] === 'linear' ? `linear-gradient(${g[2]})` : `radial-gradient(${g[2]})`;
  return p;
}

/** Figma stacks fills bottom → top; CSS backgrounds list top → bottom. */
function background(fills: string[] | undefined): string | undefined {
  if (!fills?.length) return undefined;
  const layers = fills.map(paint);
  if (layers.length === 1) return layers[0];
  return layers
    .reverse()
    .map((c) => (c.includes('gradient(') ? c : `linear-gradient(${c}, ${c})`))
    .join(', ');
}

function fontCss(f: CaseFont): CSSProperties {
  const style = f.style.toLowerCase().replace(/\s+/g, '');
  const weight = /thin/.test(style) ? 100 : /extralight/.test(style) ? 200 : /light/.test(style) ? 300 : /medium/.test(style) ? 500 : /semibold/.test(style) ? 600 : /extrabold/.test(style) ? 800 : /bold/.test(style) ? 700 : /black/.test(style) ? 900 : 400;
  const generic = /mono/i.test(f.family) ? 'monospace' : 'sans-serif';
  return {
    fontFamily: `var(--font-${slug(f.family)}), "${f.family}", ${generic}`,
    fontSize: f.size,
    fontWeight: weight,
    lineHeight: f.lh && f.lh !== 'normal' ? f.lh : undefined,
    letterSpacing: f.ls && f.ls !== '0em' ? f.ls : undefined,
  };
}

const inFlowOf = (node: CaseNode, parent: CaseNode | undefined, root: boolean) =>
  !root && !!parent?.layout && parent.layout.mode !== 'NONE' && !node.absolute;

function sizeAxis(node: CaseNode, parent: CaseNode | undefined, axis: 0 | 1, inFlow: boolean): CSSProperties {
  const px = axis === 0 ? node.w : node.h;
  const prop = axis === 0 ? 'width' : 'height';
  const sizing = inFlow ? node.sizing?.[axis] : undefined;
  if (sizing === 'FILL' && parent?.layout) {
    const primary = (parent.layout.mode === 'HORIZONTAL') === (axis === 0);
    return primary ? { flexGrow: 1, flexBasis: 0, [axis === 0 ? 'minWidth' : 'minHeight']: 0 } : { alignSelf: 'stretch' };
  }
  if (sizing === 'HUG') return {};
  if (sizing === 'FIXED') return { [prop]: px };
  // Not in auto layout: infer from the node itself.
  if (node.kind === 'text') {
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

function boxStyle(node: CaseNode, parent: CaseNode | undefined, root: boolean): CSSProperties {
  const inFlow = inFlowOf(node, parent, root);
  const s: CSSProperties = { boxSizing: 'border-box', flexShrink: 0, position: root || inFlow ? 'relative' : 'absolute' };
  if (root) {
    s.width = '100%';
    if (!node.layout || node.layout.mode === 'NONE') s.height = node.h;
  } else {
    if (!inFlow) {
      s.left = node.x;
      s.top = node.y;
    }
    Object.assign(s, sizeAxis(node, parent, 0, inFlow), sizeAxis(node, parent, 1, inFlow));
  }
  if (node.rotation) {
    s.transformOrigin = '0 0';
    s.transform = `rotate(${-node.rotation}deg)`; // Figma rotates counter-clockwise around the layer origin
  }
  if (node.opacity != null) s.opacity = node.opacity;
  const radius = node.shape === 'ellipse' ? '50%' : node.style?.radius ? radiusCss(node.style.radius) : undefined;
  if (radius) s.borderRadius = radius;
  if (node.shadow) s.boxShadow = node.shadow;
  return s;
}

function layoutStyle(node: CaseNode): CSSProperties {
  const l = node.layout;
  const s: CSSProperties = {};
  if (l?.clips || node.style?.clips) s.overflow = 'hidden';
  if (!l || l.mode === 'NONE') return s;
  const inset = strokeInset(node);
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
  if (l.wrap === 'WRAP') {
    const g = wrapGap(node);
    if (g) s[l.mode === 'HORIZONTAL' ? 'rowGap' : 'columnGap'] = g;
  }
  return s;
}

/**
 * Figma "Strokes included in layout" (not in the export): an INSIDE stroke then adds to the padding. Read it from the
 * first child's offset — on every axis where it starts at the edge, it sits at padding + stroke instead of padding.
 */
function strokeInset(node: CaseNode): number {
  const sw = node.style?.strokeWeight;
  const l = node.layout;
  if (!sw || node.style?.strokeAlign !== 'INSIDE' || !l?.padding) return 0;
  const first = node.children?.find((c) => !c.absolute);
  if (!first) return 0;
  const [t, , , lft] = l.padding;
  const startX = (l.mode === 'HORIZONTAL' ? l.primaryAlign : l.counterAlign) === 'MIN';
  const startY = (l.mode === 'VERTICAL' ? l.primaryAlign : l.counterAlign) === 'MIN';
  const checks = [startX && Math.abs(first.x - (lft + sw)) < 0.6, startY && Math.abs(first.y - (t + sw)) < 0.6].filter((_, i) => (i ? startY : startX));
  return checks.length && checks.every(Boolean) ? sw : 0;
}

/** Row spacing of a wrapping auto layout, measured from the child positions (the export has no counter-axis gap). */
function wrapGap(node: CaseNode): number | undefined {
  const horizontal = node.layout?.mode === 'HORIZONTAL';
  const rows = new Map<number, number>();
  for (const c of (node.children ?? []).filter((c) => !c.absolute)) {
    const start = horizontal ? c.y : c.x;
    rows.set(start, Math.max(rows.get(start) ?? 0, horizontal ? c.h : c.w));
  }
  const starts = [...rows.keys()].sort((a, b) => a - b);
  const gaps = starts.slice(1).map((s, i) => s - (starts[i] + rows.get(starts[i])!));
  return gaps.length ? Math.max(0, Math.min(...gaps)) : undefined;
}

/** Figma strokes are painted above the content and never change layout — an overlay does the same. */
function Stroke({ node }: { node: CaseNode }) {
  const st = node.style;
  const color = st?.strokes?.[0];
  const w = st?.strokeWeight ?? 0;
  if (!color || (!w && !node.strokeSides)) return null;
  const out = st?.strokeAlign === 'OUTSIDE' ? w : st?.strokeAlign === 'CENTER' ? w / 2 : 0;
  const r = node.shape === 'ellipse' ? '50%' : typeof st?.radius === 'number' ? `${st.radius + out}px` : radiusCss(st?.radius);
  // Per-side strokes as borders; uniform ones as an inset shadow (Chrome floors border widths, 1.5px → 1px).
  const line: CSSProperties = node.strokeSides
    ? { borderStyle: 'solid', borderColor: color, borderWidth: node.strokeSides.map((s) => `${s}px`).join(' ') }
    : { boxShadow: `inset 0 0 0 ${w}px ${color}` };
  return <span aria-hidden style={{ position: 'absolute', inset: -out, borderRadius: r, pointerEvents: 'none', zIndex: 1, ...line }} />;
}

const modeAttrs = (node: CaseNode) => ({ 'data-theme': node.modes?.theme, 'data-surface': node.modes?.surface });

/** `sizes` for next/image: the Figma width at 1440, proportional below. */
const sizes = (w: number) => `(max-width: 1440px) ${Math.ceil((w / 1440) * 100)}vw, ${Math.ceil(w)}px`;

function Picture({ media, priority, fit, fill }: { media: NonNullable<CaseNode['media']>; priority?: boolean; fit?: CSSProperties['objectFit']; fill?: boolean }) {
  const svg = media.format === 'svg';
  const alt = media.alt ?? '';
  const common = { src: media.src, priority, unoptimized: svg, draggable: false } as const;
  return fill ? (
    <Image {...common} alt={alt} fill sizes={sizes(media.w)} style={{ objectFit: fit ?? 'cover' }} />
  ) : (
    <Image {...common} alt={alt} width={Math.round(media.w)} height={Math.round(media.h)} sizes={sizes(media.w)} style={{ display: 'block', width: '100%', height: 'auto' }} />
  );
}

const FIT: Record<string, CSSProperties['objectFit']> = { FILL: 'cover', FIT: 'contain', CROP: 'cover', TILE: 'cover' };

function headingTag(node: CaseNode, ctx: CaseCtx) {
  const t = ctx.tags?.[node.id];
  if (t) return t;
  if (node.textStyle === 'Pegboard/Case H2') return 'h2';
  if (node.textStyle === 'Pegboard/Case H3') return 'h3';
  return 'p';
}

function Wrap({ node, link, style, className, children, as = 'div' }: { node: CaseNode; link?: CaseLink; style: CSSProperties; className?: string; children: ReactNode; as?: 'div' | 'figure' }) {
  const attrs = { 'data-layer': node.name, className, style, ...modeAttrs(node) };
  if (link?.external) {
    return (
      <a {...attrs} href={link.href} target="_blank" rel="noopener" aria-label={link.label}>
        {children}
      </a>
    );
  }
  if (link) {
    return (
      <Link {...attrs} href={link.href} aria-label={link.label}>
        {children}
      </Link>
    );
  }
  const Tag = as;
  return <Tag {...attrs}>{children}</Tag>;
}

function Component({ node, box, link }: { node: CaseNode; box: CSSProperties; link?: CaseLink }) {
  if (link) {
    // A linked instance (chapter tab, next project card): the link takes the box, the component draws inside it.
    return (
      <Wrap node={node} link={link} style={{ ...box, display: 'block', color: 'inherit', textDecoration: 'none' }}>
        <Component node={{ ...node, x: 0, y: 0 }} box={{ position: 'relative' }} />
      </Wrap>
    );
  }
  const c = node.component ?? '';
  const variant = node.variant ?? {};
  // Zeyi (2026-11-01): no pins on case-page cards — a card is just its rounded rectangle. Hooks (next tool) stay.
  if (c === 'Peg/Hook' && variant.Type === 'Pin') return null;
  if (c === 'Peg/Hook') return <Peg data-layer={node.name} type={(variant.Type ?? 'Hook').toLowerCase() as PegType} width={node.w} height={node.h} style={box} />;
  if (c === 'Shelf') return <Shelf data-layer={node.name} style={box} />;
  if (c.startsWith('Prop/')) {
    return <Prop data-layer={node.name} kind={slug(c.slice(5)) as PropKind} state={(variant.State ?? 'Rest').toLowerCase() as PropState} width={node.w} height={node.h} style={box} />;
  }
  if (c === 'Nav/Tab') {
    // Both states, so the chapter scroll-spy (ChapterTabs) only flips [data-active]; Figma's Current tab starts active.
    const label = node.texts?.[0]?.text ?? String(node.props?.Label ?? '');
    return (
      <div data-layer={node.name} data-tab="" data-active={variant.State === 'Current' ? '' : undefined} style={box}>
        <span data-tab-state="default" className="absolute left-0 top-0">
          <NavTab label={label} />
        </span>
        <span data-tab-state="current" className="absolute left-0 top-0">
          <NavTab label={label} state="current" />
        </span>
      </div>
    );
  }
  if (c === 'Project Card') {
    const p = projects.find((x) => x.number === String(node.props?.Number));
    if (!p) throw new Error(`Case page: no project with number ${String(node.props?.Number)} for "${node.name}"`);
    return (
      <div data-layer={node.name} style={box}>
        <ProjectCard {...p} theme={node.modes?.theme ?? p.theme} />
      </div>
    );
  }
  if (node.media) return <div data-layer={node.name} style={box}><Picture media={node.media} /></div>;
  throw new Error(`Case page: no renderer for component "${c}" (${node.name})`);
}

export function CaseNodeView({ node, parent, root = false, ctx }: Props): ReactNode {
  if (ctx.hide?.has(node.id)) return null;
  const box = boxStyle(node, parent, root);
  const extra = ctx.extra?.[node.id];
  const link = linkOf(node, ctx);
  const inner: CaseCtx = link ? { ...ctx, inLink: true } : ctx;
  const kids = node.children?.map((c) => <CaseNodeView key={c.id} node={c} parent={node} ctx={inner} />);

  switch (node.kind) {
    case 'text': {
      const Tag = headingTag(node, ctx);
      const font = node.font ? fontCss(node.font) : {};
      // Figma "Auto" line height ≠ the browser's `normal`; for one-line hug text the exported box height is Figma's line box.
      if (node.font && !node.font.lh && node.autoResize === 'WIDTH_AND_HEIGHT' && !node.text?.includes('\n')) font.lineHeight = `${node.h}px`;
      // Unstyled hug text often uses glyphs its font lacks (Tilt Warp "→"); the fallback is wider than Figma's, so keep
      // Figma's width and let the row share out its space the same way.
      if (node.font && node.autoResize === 'WIDTH_AND_HEIGHT' && inFlowOf(node, parent, root)) font.width = node.w;
      const style: CSSProperties = {
        ...box,
        ...font,
        margin: 0,
        color: background(node.fills),
        textAlign: node.align === 'JUSTIFIED' ? 'justify' : (node.align?.toLowerCase() as CSSProperties['textAlign']),
        whiteSpace: node.autoResize === 'WIDTH_AND_HEIGHT' ? 'pre' : 'pre-line',
      };
      const content = link ? (
        link.external ? (
          <a href={link.href} target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>
            {node.text}
          </a>
        ) : (
          <Link href={link.href} style={{ color: 'inherit', textDecoration: 'none' }}>
            {node.text}
          </Link>
        )
      ) : (
        node.text
      );
      return (
        <Tag data-layer={node.name} id={ctx.ids?.[node.id]} className={textStyleClass(node.textStyle)} style={style}>
          {content}
        </Tag>
      );
    }

    case 'shape':
      return (
        <div data-layer={node.name} aria-hidden style={{ ...box, background: background(node.style?.fills) }}>
          <Stroke node={node} />
        </div>
      );

    case 'art':
      return (
        <div data-layer={node.name} style={box} {...modeAttrs(node)}>
          {node.media && <Picture media={node.media} priority={ctx.priority} />}
        </div>
      );

    case 'component':
      return <Component node={node} box={box} link={link} />;

    case 'image':
    case 'image-bg':
      return (
        <Wrap node={node} link={link} style={{ ...box, ...layoutStyle(node), overflow: 'hidden', background: background(node.style?.fills) }}>
          {node.media && <Picture media={node.media} priority={ctx.priority} fill fit={FIT[node.media.fit ?? 'FILL']} />}
          {ctx.under?.[node.id]}
          {kids}
          {extra}
          <Stroke node={node} />
        </Wrap>
      );

    case 'media-frame': {
      const m = node.media!;
      // The picture sits at its Figma offset inside the frame (board or image frame alike); the frame's padding keeps the
      // rest of the box — without it, a picture with its own rounded border gets clipped by the frame's corners.
      const pad = `${m.y ?? 0}px ${Math.max(0, node.w - (m.x ?? 0) - m.w)}px ${Math.max(0, node.h - (m.y ?? 0) - m.h)}px ${m.x ?? 0}px`;
      return (
        <Wrap node={node} link={link} style={{ ...box, height: undefined, padding: pad, background: background(node.style?.fills), overflow: node.frame === 'image' ? 'hidden' : undefined }}>
          <Picture media={m} priority={ctx.priority} />
          {extra}
          <Stroke node={node} />
        </Wrap>
      );
    }

    case 'mount':
      return (
        <Wrap node={node} link={link} as="figure" style={{ ...box, ...layoutStyle(node), margin: 0 }}>
          {kids}
          {node.caption && (
            <figcaption className={textStyleClass(node.caption.textStyle)} style={{ alignSelf: 'stretch', color: background(node.caption.fills), whiteSpace: 'pre-line' }}>
              {node.caption.text}
            </figcaption>
          )}
          {extra}
        </Wrap>
      );

    default:
      return (
        <Wrap node={node} link={link} style={{ ...box, ...layoutStyle(node), background: background(node.style?.fills) }}>
          {kids}
          {extra}
          <Stroke node={node} />
        </Wrap>
      );
  }
}

/** First node of a subtree that passes the test. */
export function findNode(n: CaseNode, test: (n: CaseNode) => boolean): CaseNode | undefined {
  if (test(n)) return n;
  for (const c of n.children ?? []) {
    const f = findNode(c, test);
    if (f) return f;
  }
  return undefined;
}
