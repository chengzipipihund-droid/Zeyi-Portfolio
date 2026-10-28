import { figmaSvg } from '@/assets/figma';
import { FigmaComponent } from '@/components/figma/FigmaNode';

export type BinVariant = 'project' | 'archive';

const VARIANT = { project: 'ProjectBin', archive: 'ArchiveBin' } as const;

/**
 * Object (1146-112083), Figma variant "Property 1" = ProjectBin | ArchiveBin.
 * Body = exported SVG (label plate removed); the label plate is rebuilt from the component spec with the two text layers.
 * Cards inside the bin are rendered *before* it, so the bin front covers them.
 */
export function Bin({ variant, label, caption }: { variant: BinVariant; label?: string; caption?: string }) {
  const Body = variant === 'project' ? figmaSvg['object-projectbin'] : figmaSvg['object-archivebin'];
  return (
    <FigmaComponent
      component="Object"
      variant={{ 'Property 1': VARIANT[variant] }}
      overrides={{
        texts: { Label: label, Caption: caption },
        slots: { Front: <Body aria-hidden width="100%" height="100%" /> },
      }}
    />
  );
}
