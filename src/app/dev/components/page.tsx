import type { Metadata } from 'next';
import { SvgGallery } from './SvgGallery';

export const metadata: Metadata = {
  title: 'Components · dev',
  robots: { index: false, follow: false },
};

// Dev-only review page: every generated SVG (M0), then every component and state (M1, M2).
export default function DevComponentsPage() {
  return <SvgGallery />;
}
