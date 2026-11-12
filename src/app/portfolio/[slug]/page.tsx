import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Demo } from '@/components/portfolio/Demo';
import { findPrototype, prototypes } from '@/data/prototypes';

// /portfolio/<slug> — one prototype with its guided tour (components/portfolio/Demo.tsx).
export const dynamicParams = false;

export function generateStaticParams() {
  return prototypes.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = findPrototype(params.slug);
  if (!p) return {};
  const title = `${p.title} — interactive prototype · Zeyi Cheng`;
  return {
    title: { absolute: title },
    description: p.summary.en,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: { title, description: p.summary.en, url: `/portfolio/${p.slug}`, images: [{ url: p.cover.src, width: p.cover.w, height: p.cover.h }] },
  };
}

export default function PrototypePage({ params }: { params: { slug: string } }) {
  const p = findPrototype(params.slug);
  if (!p) notFound();
  return <Demo slug={p.slug} />;
}
