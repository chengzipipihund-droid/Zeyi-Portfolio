import { Archivo, Barlow, DM_Mono } from 'next/font/google';
import { LangProvider } from '@/components/portfolio/Lang';

// /portfolio — prototypes that can be tried. Fonts of the prototypes (the site fonts come from the root layout):
// Barlow = SeaTrial Explorer (Machinery UI); DM Mono + Archivo at 125 % width = Floatopia (Archivo stands in for
// SF Pro Expanded, which cannot be served as a web font; Inter from the root layout stands in for SF Pro).
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-barlow', display: 'swap' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-dm-mono', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${barlow.variable} ${dmMono.variable} ${archivo.variable}`}>
      <LangProvider>{children}</LangProvider>
    </div>
  );
}
