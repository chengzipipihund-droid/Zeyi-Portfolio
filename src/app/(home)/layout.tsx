import type { ReactNode } from 'react';
import { HomeScene } from '@/components/home/HomeScene';
import { HomeStateProvider } from '@/components/home/HomeState';
import { SceneFade } from '@/components/home/SceneFade';
import { Stage } from '@/components/stage/Stage';

// The home is two routes — T0 at "/" and T1 at "/home" — sharing this layout, so the scene stays mounted and
// navigating between them animates the same objects (Animation A forward / backward). The pages only carry metadata.
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-wall">
      <HomeStateProvider>
        <Stage>
          <SceneFade>
            <HomeScene />
          </SceneFade>
        </Stage>
      </HomeStateProvider>
      {children}
    </main>
  );
}
