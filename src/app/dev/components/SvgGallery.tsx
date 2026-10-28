'use client';

import { useState } from 'react';
import assetsJson from '@/data/figma/assets.json';
import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { themeModes } from '@/styles/tailwind-tokens';

type Box = { x: number; y: number; w: number; h: number };
type AssetMeta = { group: string; source: string; w: number; h: number; art: Box | null; collider: Box | null };

const { _note, ...assetMeta } = assetsJson as unknown as { _note: string } & Record<FigmaSvgKey, AssetMeta>;
const keys = Object.keys(figmaSvg) as FigmaSvgKey[];
const groups = [...new Set(keys.map((k) => assetMeta[k].group))];

type Theme = (typeof themeModes.theme.modes)[number];
type Surface = (typeof themeModes.surface.modes)[number];

export function SvgGallery() {
  const [theme, setTheme] = useState<Theme>(themeModes.theme.default);
  const [surface, setSurface] = useState<Surface>(themeModes.surface.default);
  const [showArt, setShowArt] = useState(false);

  return (
    <main data-theme={theme} data-surface={surface} className="min-h-screen bg-surface-wall p-8 text-text-primary">
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
        <p className="type-small text-text-secondary">{keys.length} SVGs · {_note}</p>
      </header>

      {groups.map((group) => (
        <section key={group} className="mb-12">
          <h2 className="type-label mb-4 uppercase">{group}</h2>
          <div className="flex flex-wrap items-end gap-6">
            {keys.filter((k) => assetMeta[k].group === group).map((key) => {
              const Svg = figmaSvg[key];
              const meta = assetMeta[key];
              const box = meta.collider ?? meta.art;
              return (
                <figure key={key} className="flex flex-col gap-2 border border-line-soft bg-board-fill p-4">
                  <div className="relative" style={{ width: meta.w, height: meta.h }}>
                    <Svg width={meta.w} height={meta.h} aria-hidden />
                    {showArt && box && (
                      <div
                        className="pointer-events-none absolute outline-dashed outline-1 outline-theme-accent"
                        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                      />
                    )}
                  </div>
                  <figcaption>
                    <div className="type-label">{key}</div>
                    <div className="type-small text-text-secondary">
                      {meta.w}×{meta.h} · {meta.source}
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
