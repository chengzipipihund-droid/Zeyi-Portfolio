import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { FigmaComponent } from '@/components/figma/FigmaNode';

export type ProjectCardState = 'rest' | 'hover' | 'match' | 'dim' | 'taken' | 'mini';

const STATE: Record<ProjectCardState, string> = { rest: 'Rest', hover: 'Hover', match: 'Match', dim: 'Dim', taken: 'Taken', mini: 'Mini' };

export type ProjectCardProps = {
  state?: ProjectCardState;
  number: string;
  meta: string;
  title: string;
  subtitle: string;
  focus: string;
  icon: FigmaSvgKey;
  showStatus?: boolean;
  /** Project colours (data-theme slug); the Rest content stays neutral as in Figma. */
  theme: string;
};

/** Project Card (1064-11635): Rest 240×300 · Hover 320×540 · Match / Dim / Taken 240×300 · Mini 200×120. */
export function ProjectCard({ state = 'rest', number, meta, title, subtitle, focus, icon, showStatus = false, theme }: ProjectCardProps) {
  const Icon = figmaSvg[icon];
  return (
    <FigmaComponent
      component="Project Card"
      variant={{ State: STATE[state] }}
      data-theme={theme}
      overrides={{
        texts: { Number: number, Meta: meta, Title: title, Subtitle: subtitle, Focus: focus },
        visible: { Status: showStatus },
        slots: { Icon: <Icon aria-hidden width="100%" height="100%" /> },
      }}
    />
  );
}
