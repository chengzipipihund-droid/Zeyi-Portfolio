import type { Metadata } from 'next';
import { Components } from './Components';
import { DevShell } from './DevShell';
import { Primitives } from './Primitives';
import { SvgGallery } from './SvgGallery';

export const metadata: Metadata = {
  title: 'Components · dev',
  robots: { index: false, follow: false },
};

// Dev-only review page: every component and state (M1, M2), then every generated SVG (M0).
export default function DevComponentsPage() {
  return (
    <DevShell>
      <Primitives />
      <Components />
      <SvgGallery />
    </DevShell>
  );
}
