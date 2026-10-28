import { FigmaComponent, FigmaLayer } from '@/components/figma/FigmaNode';
import type { FigmaNode } from '@/lib/figma/types';

// Small Figma components of the home page. Props mirror the Figma component properties; variants become `state`.

export type SkillTagState = 'default' | 'active' | 'dim';
/** Tag/Skill (1019-1297). */
export function SkillTag({ label, state = 'default' }: { label: string; state?: SkillTagState }) {
  const State = { default: 'Default', active: 'Active', dim: 'Dim' }[state];
  return <FigmaComponent component="Tag/Skill" variant={{ State }} overrides={{ texts: { Label: label } }} />;
}

export type NavTabState = 'default' | 'current';
/** Nav/Tab (1019-1308). */
export function NavTab({ label, state = 'default' }: { label: string; state?: NavTabState }) {
  const State = { default: 'Default', current: 'Current' }[state];
  return <FigmaComponent component="Nav/Tab" variant={{ State }} overrides={{ texts: { Label: label } }} />;
}

export type Lang = 'en' | 'zh';
/** Toggle/Lang (1019-1319). */
export function LangToggle({ lang = 'en' }: { lang?: Lang }) {
  return <FigmaComponent component="Toggle/Lang" variant={{ Lang: lang === 'en' ? 'EN' : 'ZH' }} />;
}

export type LampStatus = 'on' | 'wip' | 'off';
/** Lamp/Status (1019-1353). */
export function StatusLamp({ status = 'on', label }: { status?: LampStatus; label: string }) {
  const Status = { on: 'On', wip: 'WIP', off: 'Off' }[status];
  return <FigmaComponent component="Lamp/Status" variant={{ Status }} overrides={{ texts: { Label: label } }} />;
}

/** Plate/Nameplate (1019-1320). */
export function Nameplate({ name, role }: { name: string; role: string }) {
  return <FigmaComponent component="Plate/Nameplate" overrides={{ texts: { Name: name, Role: role } }} />;
}

/** Badge/Edu (1019-1327). */
export function EduBadge({ code, degree, years }: { code: string; degree: string; years: string }) {
  return <FigmaComponent component="Badge/Edu" overrides={{ texts: { Code: code, Degree: degree, Years: years } }} />;
}

export type ClipboardEntry = { year: string; role: string };
/** Object/Clipboard (1019-1354): title, the three entries of the Figma component, and the "more" link. */
export function Clipboard({ title, entries, more }: { title: string; entries: ClipboardEntry[]; more: string }) {
  const textList = [
    { layer: 'Title', text: title },
    ...entries.flatMap((e) => [{ layer: 'Year', text: e.year }, { layer: 'Role', text: e.role }]),
    { layer: 'More', text: more },
  ];
  return <FigmaComponent component="Object/Clipboard" overrides={{ textList }} />;
}

/** Timeline ruler: the "Ruler · timeline" frame of a layout JSON (not a Figma component), drawn as in Figma. */
export function TimelineRuler({ node }: { node: FigmaNode }) {
  return <FigmaLayer node={node} />;
}
