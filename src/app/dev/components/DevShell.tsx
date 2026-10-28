'use client';

import { useState, type ReactNode } from 'react';
import { themeModes } from '@/styles/tailwind-tokens';

type Theme = (typeof themeModes.theme.modes)[number];
type Surface = (typeof themeModes.surface.modes)[number];

/** Review controls for /dev/components: theme + board surface for everything below, and the art/collider overlay. */
export function DevShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(themeModes.theme.default);
  const [surface, setSurface] = useState<Surface>(themeModes.surface.default);
  const [showArt, setShowArt] = useState(false);

  return (
    <main
      data-theme={theme}
      data-surface={surface}
      data-show-art={showArt ? '' : undefined}
      className="group min-h-screen bg-surface-wall p-8 text-text-primary"
    >
      <header className="mb-8 flex flex-wrap items-center gap-6">
        <h1 className="type-title-m">/dev/components</h1>
        <label className="type-label flex items-center gap-2">
          data-theme
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="type-small">
            {themeModes.theme.modes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="type-label flex items-center gap-2">
          data-surface
          <select value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className="type-small">
            {themeModes.surface.modes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="type-label flex items-center gap-2">
          <input type="checkbox" checked={showArt} onChange={(e) => setShowArt(e.target.checked)} />
          art / collider box
        </label>
      </header>
      {children}
    </main>
  );
}

/** A titled block of /dev/components. */
export function DevSection({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="type-label mb-1 uppercase">{title}</h2>
      {note && <p className="type-small mb-4 text-text-secondary">{note}</p>}
      <div className="flex flex-wrap items-end gap-6">{children}</div>
    </section>
  );
}

export function DevItem({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2 border border-line-soft bg-board-fill p-4">
      {children}
      <figcaption>
        <div className="type-label">{label}</div>
        {detail && <div className="type-small text-text-secondary">{detail}</div>}
      </figcaption>
    </figure>
  );
}
