'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { L, Lang } from '@/data/prototypes';

// Language of the /portfolio pages (English by default; `?lang=zh` or the toggle switches to Chinese).
// The prototypes themselves stay in the language they were designed in.
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'en', setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>('en');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lang');
    let saved: string | null = null;
    try { saved = window.sessionStorage.getItem('portfolio-lang'); } catch { /* private mode */ }
    const pick = q ?? saved;
    if (pick === 'zh' || pick === 'en') set(pick);
  }, []);
  const setLang = useCallback((l: Lang) => {
    set(l);
    try { window.sessionStorage.setItem('portfolio-lang', l); } catch { /* private mode */ }
  }, []);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** One bilingual string. */
export function T({ v }: { v: L }) {
  const { lang } = useLang();
  return <span lang={lang === 'zh' ? 'zh-Hans' : undefined}>{v[lang]}</span>;
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="pf-lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button type="button" aria-pressed={lang === 'zh'} onClick={() => setLang('zh')} lang="zh-Hans">中文</button>
    </div>
  );
}
