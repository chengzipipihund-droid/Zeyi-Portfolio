import caseIndex from '@/data/figma/cases/index.json';
import t1 from '@/data/figma/layouts/t1.json';
import type { FigmaSvgKey } from '@/assets/figma';
import { componentTree, svgKeyFor } from '@/lib/figma/specs';
import type { FigmaNode, LayoutNode } from '@/lib/figma/types';

// Copy comes from Figma (T1 card instances + Detail Board variants). Only the decisions below are written by hand.

export type ProjectSlug = 'ultra-bridge' | 'seatrial' | 'coreds' | 'scada-plus';

/** Skill tag labels in T1 order (Figma "Skill tags"). */
const items = (t1 as unknown as { items: LayoutNode[] }).items;
export const skills = items
  .find((n) => n.name === 'Skill tags')!
  .children!.map((n) => n.texts!.find((t) => t.layer === 'Label')!.text);

// Zeyi, 2026-10-28 — skill tag → projects (docs/home-page-brief.md §6).
const SKILLS: Record<ProjectSlug, string[]> = {
  'ultra-bridge': ['HMI / SCADA', 'AI decision support', 'System architecture', 'Front-end · React', 'Sustainable design'],
  seatrial: ['AI decision support', 'System architecture', 'Front-end · React', 'B2B web tools'],
  coreds: ['HMI / SCADA', 'Design systems', 'Front-end · React'],
  'scada-plus': ['HMI / SCADA', 'System architecture', 'Front-end · React'],
};

// Figma names: card instance "Card · <name>", Detail Board variant "Project=<name>".
const FIGMA_NAME: Record<ProjectSlug, string> = {
  'ultra-bridge': 'Ultra Bridge',
  seatrial: 'SeaTrial',
  coreds: 'CoreDS',
  'scada-plus': 'SCADA+',
};

export type ProjectDetail = {
  kicker?: string;
  pager?: string;
  lead?: string;
  from?: string;
  to?: string;
  facts: { key: string; value: string }[];
  /** Case page route (M9), when the project has one (matched by number in src/data/figma/cases/index.json). */
  caseHref?: string;
  pdfHref?: string;
};

export type Project = {
  slug: ProjectSlug;
  theme: string;
  number: string;
  meta: string;
  title: string;
  subtitle: string;
  focus: string;
  icon: FigmaSvgKey;
  showStatus: boolean;
  skills: string[];
  /** Figma "Detail Board" variant value (Project=…). */
  detailVariant: string;
  detail: ProjectDetail;
};

function cardProps(node: LayoutNode) {
  const p = node.props ?? {};
  const icon = svgKeyFor(String(p.Icon));
  if (!icon) throw new Error(`No exported SVG for card icon "${p.Icon}" (${node.name})`);
  return {
    number: String(p.Number),
    meta: String(p.Meta),
    title: String(p.Title),
    subtitle: String(p.Subtitle),
    focus: String(p.Focus),
    icon,
    showStatus: p['Show status'] === true,
  };
}

function findAll(n: FigmaNode, test: (n: FigmaNode) => boolean, out: FigmaNode[] = []): FigmaNode[] {
  if (test(n)) out.push(n);
  n.children?.forEach((c) => findAll(c, test, out));
  return out;
}

function detailOf(variant: string): ProjectDetail {
  const tree = componentTree('Detail Board', { Project: variant });
  if (!tree) return { facts: [] };
  const text = (layer: string) => findAll(tree, (n) => n.type === 'TEXT' && n.name === layer)[0]?.text;
  const facts = findAll(tree, (n) => n.name.startsWith('Meta · ')).map((m) => ({
    key: findAll(m, (n) => n.name === 'Key')[0]?.text ?? '',
    value: findAll(m, (n) => n.name === 'Value')[0]?.text ?? '',
  }));
  return { kicker: text('Kicker'), pager: text('Pager'), lead: text('Lead'), from: text('From value'), to: text('To value'), facts };
}

const caseSlugByNumber = new Map(caseIndex.cases.map((c) => [c.number, c.slug]));
const caseOf = (number: string) => (caseSlugByNumber.has(number) ? `/work/${caseSlugByNumber.get(number)}` : undefined);

export const projects: Project[] = (Object.keys(FIGMA_NAME) as ProjectSlug[]).map((slug) => {
  const card = items.find((n) => n.name === `Card · ${FIGMA_NAME[slug]}`);
  if (!card) throw new Error(`T1 has no "Card · ${FIGMA_NAME[slug]}"`);
  return {
    slug,
    theme: card.modes?.theme ?? slug,
    ...cardProps(card),
    skills: SKILLS[slug],
    detailVariant: FIGMA_NAME[slug],
    detail: { ...detailOf(FIGMA_NAME[slug]), caseHref: caseOf(cardProps(card).number) },
  };
});

/** Archive minis A1–A3 in the archive bin (T1 "Archive · …" Project Card Mini instances). */
export const archive = items
  .filter((n) => n.name.startsWith('Archive · ') && n.component === 'Project Card')
  .map((n) => ({ layer: n.name, theme: n.modes?.theme ?? 'neutral', ...cardProps(n) }));

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
export const projectsWithSkill = (skill: string) => projects.filter((p) => p.skills.includes(skill));
