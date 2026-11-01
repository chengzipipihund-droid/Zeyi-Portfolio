import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CasePage } from '@/components/case/CasePage';
import { findNode } from '@/components/case/CaseNode';
import { caseSlugs, loadCase } from '@/lib/figma/cases';

// Case pages 01–03 (M9, docs/case-pages-brief.md): statically generated from src/data/figma/cases/<slug>.json.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const data = loadCase(params.slug);
  const hero = data?.sections.find((s) => s.kind === 'hero')?.tree;
  if (!data || !hero) return {};
  const text = (name: string) => findNode(hero, (n) => n.kind === 'text' && n.name === name)?.text;
  const subtitle = text('Subtitle');
  const lead = text('Lead');
  const visual = findNode(hero, (n) => !!n.media)?.media;
  const title = `${data.title}${subtitle ? ` — ${subtitle}` : ''} · Zeyi Cheng`;
  return {
    title: { absolute: title },
    description: lead,
    alternates: { canonical: `/work/${data.slug}` },
    openGraph: { title, description: lead, url: `/work/${data.slug}`, images: visual ? [{ url: visual.src, width: Math.round(visual.w), height: Math.round(visual.h) }] : undefined },
  };
}

export default function CasePageRoute({ params }: { params: { slug: string } }) {
  const data = loadCase(params.slug);
  if (!data) notFound();
  return <CasePage data={data} />;
}
