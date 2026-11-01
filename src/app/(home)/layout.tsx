import type { ReactNode } from 'react';
import { BoardStateProvider } from '@/components/home/BoardState';
import { HomeHeader, HomeScene } from '@/components/home/HomeScene';
import { HomeStateProvider } from '@/components/home/HomeState';
import { SceneFade } from '@/components/home/SceneFade';
import { Stage } from '@/components/stage/Stage';
import { skills } from '@/data/projects';
import { siteHeaderHeight } from '@/lib/figma/cases';

// The home is two routes — T0 at "/" and T1 at "/home" — sharing this layout, so the scene stays mounted and
// navigating between them animates the same objects (Animation A forward / backward). The pages only carry metadata.
// The header strip (logo, nav, Reset, language) is the top band of the same frame, drawn sticky over the scene so it
// stays at the top when the page scrolls (Zeyi, 2026-11-01); at rest it sits exactly where it is in Figma.
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-wall">
      <HomeStateProvider>
        <BoardStateProvider skills={skills}>
          <header className="sticky top-0 z-50 h-0">
            <Stage height={siteHeaderHeight()} band>
              <HomeHeader />
            </Stage>
          </header>
          <Stage>
            <SceneFade>
              <HomeScene />
            </SceneFade>
          </Stage>
        </BoardStateProvider>
      </HomeStateProvider>
      {children}
    </main>
  );
}
