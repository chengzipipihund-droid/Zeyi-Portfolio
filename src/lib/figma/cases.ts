import fs from 'node:fs';
import path from 'node:path';
import supplementJson from '../../../design/figma-mcp/cases-supplement.json';
import type { Sizing } from './types';

// Case pages (M9): src/data/figma/cases/<slug>.json + index.json, written by scripts/figma-import-cases.mjs from the
// exporter's "Export case pages" zips (docs/case-pages-brief.md §2). Fields the export lacks come from
// design/figma-mcp/cases-supplement.json (read with the MCP), merged here by node id.

export type CaseLayout = {
  mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  gap?: number;
  padding?: [number, number, number, number];
  primaryAlign?: string;
  counterAlign?: string;
  primarySizing?: 'FIXED' | 'AUTO';
  counterSizing?: 'FIXED' | 'AUTO';
  wrap?: 'NO_WRAP' | 'WRAP';
  clips?: boolean;
};

export type CaseMedia = { src: string; w: number; h: number; x?: number; y?: number; format: string; fit?: string; alt?: string };

export type CaseFont = { family: string; style: string; size: number; lh?: string; ls?: string };

export type CaseNode = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'frame' | 'text' | 'mount' | 'media-frame' | 'image' | 'image-bg' | 'art' | 'component' | 'shape';
  sizing?: [Sizing, Sizing];
  absolute?: boolean;
  rotation?: number;
  opacity?: number;
  layout?: CaseLayout;
  style?: {
    fills?: string[];
    strokes?: string[];
    strokeWeight?: number;
    strokeAlign?: 'INSIDE' | 'CENTER' | 'OUTSIDE';
    radius?: number | number[];
    clips?: boolean;
  };
  children?: CaseNode[];
  // text
  text?: string;
  textStyle?: string | null;
  fills?: string[];
  align?: string;
  autoResize?: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  link?: string;
  // component
  component?: string;
  variant?: Record<string, string>;
  props?: Record<string, string | boolean>;
  texts?: { layer: string; text: string }[];
  modes?: Record<string, string>;
  // media
  media?: CaseMedia;
  frame?: 'board' | 'image';
  pins?: { x: number; y: number; w: number; h: number }[];
  caption?: { text: string; textStyle: string | null; fills: string[] };
  effect?: string;
  shape?: 'rectangle' | 'ellipse';
  // from the MCP supplement
  font?: CaseFont;
  strokeSides?: [number, number, number, number];
  shadow?: string;
};

export type SectionKind = 'header' | 'film' | 'breadcrumb' | 'hero' | 'tabs' | 'chapter' | 'next' | 'footer';

export type CaseSection = {
  key: string;
  kind: SectionKind;
  name: string;
  nodeId: string;
  y: number;
  w: number;
  h: number;
  number?: string;
  title?: string;
  anchor?: string;
  video?: { src: string; note?: string };
  tree: CaseNode;
};

export type CaseData = {
  slug: string;
  number: string;
  title: string;
  w: number;
  h: number;
  modes: { theme: string };
  sections: CaseSection[];
};

export type CaseSummary = { slug: string; number: string; title: string; theme: string };

const DIR = path.join(process.cwd(), 'src/data/figma/cases');

type Supplement = {
  text: Record<string, CaseFont>;
  strokeSides: Record<string, [number, number, number, number]>;
  shadow: Record<string, string>;
  footer: {
    w: number;
    h: number;
    fill: string;
    rule: { x: number; y: number; w: number; h: number; fill: string };
    left: { x: number; y: number; textStyle: string; fill: string };
    right: { x: number; y: number; textStyle: string; fill: string };
  };
};
const supplement = supplementJson as unknown as Supplement;
export const footerSpec = supplement.footer;

/** Case pages in number order (index.json). */
export function caseList(): CaseSummary[] {
  const file = path.join(DIR, 'index.json');
  if (!fs.existsSync(file)) return [];
  const index = JSON.parse(fs.readFileSync(file, 'utf8')) as { cases: CaseSummary[] };
  return index.cases.map(({ slug, number, title, theme }) => ({ slug, number, title, theme }));
}

export function caseSlugs(): string[] {
  return caseList().map((c) => c.slug);
}

function enrich(n: CaseNode) {
  const font = supplement.text[n.id];
  if (font && n.kind === 'text' && !n.textStyle) n.font = font;
  const sides = supplement.strokeSides[n.id];
  if (sides && n.style?.strokeWeight == null) n.strokeSides = sides;
  const shadow = supplement.shadow[n.id];
  if (shadow) n.shadow = shadow;
  n.children?.forEach(enrich);
}

export function loadCase(slug: string): CaseData | null {
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as CaseData;
  data.sections.forEach((s) => enrich(s.tree));
  return data;
}

/** Hand-added files (e.g. the intro film) are only used when they exist in public/. */
export const publicFileExists = (src: string) => fs.existsSync(path.join(process.cwd(), 'public', src));

/** Height of Figma's Site/Header (the same bar on the home and the case pages), from the case export. */
export function siteHeaderHeight(): number {
  const first = caseSlugs()[0];
  const header = first ? loadCase(first)?.sections.find((s) => s.kind === 'header') : undefined;
  return header?.h ?? 112;
}
