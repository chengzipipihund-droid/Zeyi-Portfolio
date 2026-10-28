import { FigmaComponent } from '@/components/figma/FigmaNode';
import { projectBySlug, type ProjectSlug } from '@/data/projects';

/**
 * Detail Board (1066-16989): the side board when a project is open (T5). One data-driven variant per project;
 * theme + accent surface come from the variant. SCADA+ is still in progress in Figma — TODO(zeyi).
 */
export function DetailBoard({ project }: { project: ProjectSlug }) {
  const p = projectBySlug(project)!;
  return <FigmaComponent component="Detail Board" variant={{ Project: p.detailVariant }} />;
}
