import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FigmaLayer } from '@/components/figma/FigmaNode';
import { Stage } from '@/components/stage/Stage';
import { projectBySlug } from '@/data/projects';
import { caseSlugs, loadCase } from '@/lib/figma/cases';
import { fillCss } from '@/lib/figma/style';

// Case pages 01–03 (M9): the Figma frame rendered as it is (same renderer as the home), scaled to the window width.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = projectBySlug(params.slug);
  return p ? { title: `${p.title} — Zeyi Cheng`, description: p.subtitle } : {};
}

export default function CasePageRoute({ params }: { params: { slug: string } }) {
  const page = loadCase(params.slug);
  if (!page) notFound();
  const { frame, tree } = page;
  return (
    <main className="min-h-screen" style={{ background: fillCss(frame.fills) ?? 'var(--surface-wall)' }}>
      <Stage width={frame.w} height={frame.h}>
        <FigmaLayer node={tree} />
      </Stage>
    </main>
  );
}
