import fs from 'node:fs';
import path from 'node:path';
import type { FigmaNode } from './types';

// Case pages (M9): src/data/figma/cases/<slug>.json, written by figma-import from exporter v2.1 (Figma page "Pegboard v2 — Case pages").

export type CasePage = { frame: { id: string; name: string; w: number; h: number; fills?: string[] }; tree: FigmaNode };

const DIR = path.join(process.cwd(), 'src/data/figma/cases');

/** Projects that have an exported case page. */
export function caseSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

export function loadCase(slug: string): CasePage | null {
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as CasePage;
}
