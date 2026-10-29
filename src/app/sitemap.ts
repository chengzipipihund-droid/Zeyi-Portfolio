import type { MetadataRoute } from 'next';
import { caseSlugs } from '@/lib/figma/cases';

const BASE = 'https://zeyi-cheng.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE}/home`, changeFrequency: 'monthly', priority: 0.9 },
    ...caseSlugs().map((slug) => ({ url: `${BASE}/work/${slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}
