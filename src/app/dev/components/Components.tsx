import t1 from '@/data/figma/layouts/t1.json';
import { DetailBoard } from '@/components/card/DetailBoard';
import { ProjectCard, type ProjectCardState } from '@/components/card/ProjectCard';
import {
  Clipboard,
  EduBadge,
  LangToggle,
  Nameplate,
  NavTab,
  SkillTag,
  StatusLamp,
  TimelineRuler,
  type LampStatus,
  type SkillTagState,
} from '@/components/parts/Parts';
import { archive, projects, skills } from '@/data/projects';
import type { LayoutNode } from '@/lib/figma/types';
import { DevItem, DevSection } from './DevShell';

const items = (t1 as unknown as { items: LayoutNode[] }).items;
const item = (name: string) => items.find((n) => n.name === name)!;
const text = (node: LayoutNode, layer: string, i = 0) => node.texts!.filter((t) => t.layer === layer)[i]?.text ?? '';

const cardStates: ProjectCardState[] = ['rest', 'hover', 'match', 'dim', 'taken', 'mini'];
const tagStates: SkillTagState[] = ['default', 'active', 'dim'];
const lampStates: LampStatus[] = ['on', 'wip', 'off'];

/** M2: ProjectCard, DetailBoard and the small parts, every state, copy from layouts/t1.json. */
export function Components() {
  const lamp = item('Status lamp');
  const plate = item('Nameplate');
  const clip = item('Clipboard · EXP');
  return (
    <>
      {projects.map((p) => (
        <DevSection key={p.slug} title={`Project Card · ${p.title}`} note={`data-theme="${p.theme}" · skills: ${p.skills.join(', ')}`}>
          {cardStates.map((s) => (
            <DevItem key={s} label={s}>
              <ProjectCard state={s} {...p} />
            </DevItem>
          ))}
        </DevSection>
      ))}

      <DevSection title="Project Card · Mini · archive A1–A3">
        {archive.map((a) => (
          <DevItem key={a.layer} label={a.layer} detail={`data-theme="${a.theme}"`}>
            <ProjectCard state="mini" {...a} />
          </DevItem>
        ))}
      </DevSection>

      <DevSection title="Detail Board · 01–04" note="SCADA+ is in progress in Figma — TODO(zeyi)">
        {projects.map((p) => (
          <DevItem key={p.slug} label={p.title} detail={p.detailVariant}>
            <DetailBoard project={p.slug} />
          </DevItem>
        ))}
      </DevSection>

      <DevSection title="Tag/Skill">
        {tagStates.map((s) => (
          <DevItem key={s} label={s}>
            <SkillTag label={skills[0]} state={s} />
          </DevItem>
        ))}
        <DevItem label="all skills (default)">
          <div className="flex max-w-[328px] flex-wrap gap-2">
            {skills.map((l) => <SkillTag key={l} label={l} />)}
          </div>
        </DevItem>
      </DevSection>

      <DevSection title="Nav/Tab · Toggle/Lang · Lamp/Status" note="LAB is removed from the site (Zeyi, 2026-10-28)">
        {['Nav · WORK', 'Nav · EXP', 'Nav · INFO'].map((n) => {
          const nav = item(n);
          return (
            <DevItem key={n} label={n}>
              <NavTab label={text(nav, 'Label')} state={nav.variant?.State === 'Current' ? 'current' : 'default'} />
            </DevItem>
          );
        })}
        <DevItem label="Lang · en">
          <LangToggle lang="en" />
        </DevItem>
        <DevItem label="Lang · zh">
          <LangToggle lang="zh" />
        </DevItem>
        {lampStates.map((s) => (
          <DevItem key={s} label={`lamp · ${s}`}>
            <StatusLamp status={s} label={text(lamp, 'Label')} />
          </DevItem>
        ))}
      </DevSection>

      <DevSection title="Plate/Nameplate · Badge/Edu · Object/Clipboard · timeline">
        <DevItem label="Nameplate">
          <Nameplate name={text(plate, 'Name')} role={text(plate, 'Role')} />
        </DevItem>
        {['Badge · Tongji', 'Badge · Aalto'].map((n) => {
          const b = item(n);
          return (
            <DevItem key={n} label={n}>
              <EduBadge code={text(b, 'Code')} degree={text(b, 'Degree')} years={text(b, 'Years')} />
            </DevItem>
          );
        })}
        <DevItem label="Clipboard · EXP">
          <Clipboard
            title={text(clip, 'Title')}
            entries={[0, 1, 2].map((i) => ({ year: text(clip, 'Year', i), role: text(clip, 'Role', i) }))}
            more={text(clip, 'More')}
          />
        </DevItem>
        <DevItem label="Ruler · timeline" detail="880×44 frame from layouts/t1.json">
          <TimelineRuler node={item('Ruler · timeline')} />
        </DevItem>
      </DevSection>
    </>
  );
}
