import type { Metadata } from 'next';
import { Baloo_Chettan_2, Gentium_Book_Plus, Tilt_Warp } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

const tiltWarp = Tilt_Warp({ subsets: ['latin'], variable: '--font-tilt-warp', display: 'swap' });
// Stand-in for Figma's Gentium Book Basic (not in Next 14's font list); used when Helvetica is missing — see globals.css.
const gentiumBookPlus = Gentium_Book_Plus({ subsets: ['latin'], weight: '400', variable: '--font-gentium-book-plus', display: 'swap' });
// Used by one unstyled text layer (the "AI" badge on the Ultra Bridge Detail Board).
const balooChettan2 = Baloo_Chettan_2({ subsets: ['latin'], weight: '400', variable: '--font-baloo-chettan-2', display: 'swap', preload: false });

// Copy from Figma: nameplate role + logo sub ("UX / HMI DESIGNER · HELSINKI", "SHADOW-BOARD PORTFOLIO · 2025—26").
const description = 'Zeyi Cheng — UX / HMI designer in Helsinki. Shadow-board portfolio 2025–26: Ultra Bridge, SeaTrial Explorer, CoreDS, SCADA+.';

export const metadata: Metadata = {
  metadataBase: new URL('https://zeyi-cheng.org'),
  title: { default: 'Zeyi Cheng — UI/UX & Product Designer', template: '%s' },
  description,
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Zeyi Cheng',
    title: 'Zeyi Cheng — UI/UX & Product Designer',
    description,
    // The Figma render of T1 · Rest (design/reference/t1-rest.png). TODO(zeyi): a dedicated 1200 × 630 OG frame.
    images: [{ url: '/og.png', width: 1440, height: 1024, alt: 'The shadow board: project cards on a pegboard' }],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${tiltWarp.variable} ${gentiumBookPlus.variable} ${balooChettan2.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
