import assetsJson from '@/data/figma/assets.json';
import { figmaSvg, type FigmaSvgKey } from '@/assets/figma';
import { DevItem, DevSection } from './DevShell';

type Box = { x: number; y: number; w: number; h: number };
type AssetMeta = { group: string; source: string; w: number; h: number; art: Box | null; collider: Box | null };

const { _note, ...assetMeta } = assetsJson as unknown as { _note: string } & Record<FigmaSvgKey, AssetMeta>;
const keys = Object.keys(figmaSvg) as FigmaSvgKey[];
const groups = [...new Set(keys.map((k) => assetMeta[k].group))];

/** Every generated SVG with its registry key (M0). */
export function SvgGallery() {
  return (
    <>
      <p className="type-small mb-8 text-text-secondary">{keys.length} SVGs · {_note}</p>
      {groups.map((group) => (
        <DevSection key={group} title={`svg · ${group}`}>
          {keys.filter((k) => assetMeta[k].group === group).map((key) => {
            const Svg = figmaSvg[key];
            const meta = assetMeta[key];
            const box = meta.collider ?? meta.art;
            return (
              <DevItem key={key} label={key} detail={`${meta.w}×${meta.h} · ${meta.source}`}>
                <div className="relative" style={{ width: meta.w, height: meta.h }}>
                  <Svg width={meta.w} height={meta.h} aria-hidden />
                  {box && (
                    <div
                      className="pointer-events-none absolute hidden outline-dashed outline-1 outline-theme-accent group-data-[show-art]:block"
                      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                    />
                  )}
                </div>
              </DevItem>
            );
          })}
        </DevSection>
      ))}
    </>
  );
}
