import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { FigmaLayer } from '@/components/figma/FigmaNode';
import { LangToggle, NavTab } from '@/components/parts/Parts';
import t1 from '@/data/figma/layouts/t1.json';
import { footerSpec } from '@/lib/figma/cases';
import type { LayoutNode } from '@/lib/figma/types';
import { fillCss, radiusCss, textStyleClass } from '@/lib/figma/style';

// Site/Header and Site/Footer of the case pages. The header is the home's top bar (T1 layers: rail, logo, nav, language
// toggle — same component in Figma); LAB is not on the site (Zeyi, 2026-10-28). It stays at the top while the page
// scrolls, and its second line (Logo sub) names the page (Zeyi, 2026-11-01). The footer comes from the MCP supplement
// (the case export only has its texts).

const FRAME_W = 1440;
const items = (t1 as unknown as { items: LayoutNode[] }).items;
const layer = (name: string) => {
  const n = items.find((x) => x.name === name);
  if (!n?.css) throw new Error(`T1 has no "${name}" — the case header is built from it`);
  return n;
};

/** Left-hand layers keep their left offset, the nav stays centred, right-hand layers keep their right offset. */
function anchor(css: NonNullable<LayoutNode['css']>, to: 'left' | 'center' | 'right'): CSSProperties {
  const s: CSSProperties = { position: 'absolute', top: css.top, width: css.width, height: css.height };
  if (to === 'left') s.left = css.left;
  else if (to === 'right') s.right = FRAME_W - css.left - css.width;
  else s.left = `calc(50% + ${css.left - FRAME_W / 2}px)`;
  return s;
}

const NAV: { layer: string; href?: string }[] = [
  { layer: 'Nav · WORK', href: '/home' },
  // TODO(zeyi): EXP / INFO pages don't exist yet — the tabs are shown, not linked.
  { layer: 'Nav · EXP' },
  { layer: 'Nav · INFO' },
];

const plain: CSSProperties = { color: 'inherit', textDecoration: 'none' };

/** `sub`: the logo's second line for this page, drawn in the theme colour (default: the home's Logo sub). */
export function SiteHeader({ section, sub }: { section: string; sub?: string }) {
  const rail = layer('Top rail');
  const logo = layer('Logo');
  const home = layer('Logo sub');
  const line: LayoutNode = sub ? { ...home, text: sub, fills: ['var(--theme-accent)'] } : home;
  const lang = layer('Lang toggle');
  return (
    <header data-figma-section={section} className="sticky top-0 z-50" style={{ height: 112, background: 'var(--surface-wall)' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: rail.css!.left,
          right: FRAME_W - rail.css!.left - rail.css!.width,
          top: rail.css!.top,
          height: rail.css!.height,
          background: fillCss(rail.fills),
          borderRadius: radiusCss(rail.radius),
        }}
      />
      <Link href="/" aria-label="Zeyi Cheng — home" style={plain}>
        <FigmaLayer node={logo} style={anchor(logo.css!, 'left')} />
        <FigmaLayer node={line} style={anchor(line.css!, 'left')} />
      </Link>
      <nav aria-label="Main">
        {NAV.map(({ layer: name, href }) => {
          const n = layer(name);
          const tab = <NavTab label={n.texts?.[0]?.text ?? ''} state={n.variant?.State === 'Current' ? 'current' : 'default'} />;
          return href ? (
            <Link key={name} href={href} style={{ ...anchor(n.css!, 'center'), ...plain }} aria-current={n.variant?.State === 'Current' ? 'page' : undefined}>
              {tab}
            </Link>
          ) : (
            <div key={name} style={anchor(n.css!, 'center')}>
              {tab}
            </div>
          );
        })}
      </nav>
      {/* TODO(zeyi): no Chinese version yet — the toggle is shown as in Figma. */}
      <div style={anchor(lang.css!, 'right')} aria-hidden>
        <LangToggle lang={lang.variant?.Lang === 'ZH' ? 'zh' : 'en'} />
      </div>
    </header>
  );
}

export function SiteFooter({ section, left, right }: { section: string; left: ReactNode; right: ReactNode }) {
  const { rule, left: l, right: r, h, fill } = footerSpec;
  return (
    <footer data-figma-section={section} className="relative" style={{ height: h, background: fill }}>
      <div aria-hidden style={{ position: 'absolute', left: rule.x, right: FRAME_W - rule.x - rule.w, top: rule.y, height: rule.h, background: rule.fill }} />
      <p className={textStyleClass(l.textStyle)} style={{ position: 'absolute', left: l.x, top: l.y, margin: 0, color: l.fill, whiteSpace: 'pre' }}>
        {left}
      </p>
      <p className={textStyleClass(r.textStyle)} style={{ position: 'absolute', right: rule.x, top: r.y, margin: 0, color: r.fill, whiteSpace: 'pre' }}>
        {right}
      </p>
    </footer>
  );
}
