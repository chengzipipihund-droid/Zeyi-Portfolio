import type { MetadataRoute } from 'next';
import { caseSlugs } from '@/lib/figma/cases';
import { prototypes } from '@/data/prototypes';

const BASE = 'https://zeyi-cheng.org';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE}/home`, changeFrequency: 'monthly', priority: 0.9 },
    ...caseSlugs().map((slug) => ({ url: `${BASE}/work/${slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${BASE}/portfolio`, changeFrequency: 'monthly', priority: 0.7 },
    ...prototypes.map(({ slug }) => ({ url: `${BASE}/portfolio/${slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
