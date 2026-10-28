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

export const metadata: Metadata = {
  title: 'Zeyi Cheng — UI/UX & Product Designer',
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
