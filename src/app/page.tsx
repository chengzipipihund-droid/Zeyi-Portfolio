import { T1Scene } from '@/components/home/T1Scene';
import { Stage } from '@/components/stage/Stage';

// M3: the home page renders T1 · Rest. M4 adds T0 (`/`) and `?phase=` switching; until then every phase shows T1.
export default function Home() {
  return (
    <main className="min-h-screen bg-surface-wall">
      <Stage>
        <T1Scene />
      </Stage>
    </main>
  );
}
