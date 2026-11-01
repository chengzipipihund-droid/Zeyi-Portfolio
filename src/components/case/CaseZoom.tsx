'use client';

import { useLayoutEffect } from 'react';

// Case pages are laid out at Figma's 1440 px and scaled down to narrower windows, like the home stage (never above 1;
// `?visual=1` keeps 1). The scale is the CSS variable --case-zoom, used as `zoom` on the page column.
// TODO: Figma has desktop only — phones get the same scaled layout until Zeyi designs mobile (brief §6).

const script = (frame: number) =>
  `(function(){var d=document.documentElement,v=/[?&]visual=1/.test(location.search);if(v)d.setAttribute('data-visual','');function f(){d.style.setProperty('--case-zoom',v?1:Math.min(1,d.clientWidth/${frame}))}f();addEventListener('resize',f)})();`;

/** First load: set before the page paints (inline script). Client navigation: the effect does it. */
export function CaseZoom({ frame }: { frame: number }) {
  useLayoutEffect(() => {
    const d = document.documentElement;
    const visual = new URLSearchParams(location.search).get('visual') === '1';
    if (visual) d.setAttribute('data-visual', ''); // static page for npm run visual:case (globals.css)
    const f = () => d.style.setProperty('--case-zoom', String(visual ? 1 : Math.min(1, d.clientWidth / frame)));
    f();
    window.addEventListener('resize', f);
    return () => {
      window.removeEventListener('resize', f);
      d.style.removeProperty('--case-zoom');
      d.removeAttribute('data-visual');
    };
  }, [frame]);
  return <script dangerouslySetInnerHTML={{ __html: script(frame) }} />;
}
