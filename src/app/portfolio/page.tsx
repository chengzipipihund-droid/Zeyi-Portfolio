import type { Metadata } from 'next';
import Link from 'next/link';
import { CaseZoom } from '@/components/case/CaseZoom';
import { SiteHeader } from '@/components/case/SiteChrome';
import { LangSwitch, T } from '@/components/portfolio/Lang';
import { pageCopy as C, prototypes } from '@/data/prototypes';
import '@/components/portfolio/portfolio.css';

// /portfolio — which prototypes can be tried. Laid out at 1440 and scaled like the case pages (CaseZoom).
const FRAME = 1440;
const title = 'Prototypes you can use · Zeyi Cheng';
const description = 'SeaTrial Explorer and Floatopia as working front-end prototypes, each with a guided tour of the design decisions.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/portfolio' },
  openGraph: { title, description, url: '/portfolio', images: [{ url: prototypes[0].cover.src, width: prototypes[0].cover.w, height: prototypes[0].cover.h }] },
};

export default function PortfolioIndex() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-wall)', color: 'var(--text-primary)' }}>
      <CaseZoom frame={FRAME} />
      <div className="mx-auto" style={{ maxWidth: FRAME, zoom: 'var(--case-zoom, 1)' }}>
        <SiteHeader section="header" sub="PROTOTYPES · TRY THE DESIGN" />
        <main className="pf-index">
          <section className="pf-intro" aria-labelledby="pf-title">
            <div className="pf-intro-top">
              <h1 id="pf-title" className="type-case-h2"><T v={C.title} /></h1>
              <LangSwitch />
            </div>
            <p className="type-case-lead"><T v={C.lead} /></p>
            <p className="type-body pf-muted"><T v={C.note} /></p>
          </section>
          <ul className="pf-cards">
            {prototypes.map((p) => (
              <li key={p.slug} data-theme={p.theme}>
                <Link href={`/portfolio/${p.slug}`} className="pf-card" aria-labelledby={`pf-${p.slug}`}>
                  <div className="pf-cover" data-kind={p.kind}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a Figma render, already sized */}
                    <img src={p.cover.src} alt={p.cover.alt} width={p.cover.w} height={p.cover.h} />
                  </div>
                  <div className="pf-card-head">
                    <p className="type-small pf-muted"><T v={p.label} /></p>
                    <h2 id={`pf-${p.slug}`} className="type-title-l pf-accent">{p.title}</h2>
                    <p className="type-lead"><T v={p.tagline} /></p>
                  </div>
                  <p className="type-body pf-muted"><T v={p.summary} /></p>
                  <div>
                    <p className="type-body-strong" style={{ marginBottom: 8 }}><T v={C.tryLabel} /></p>
                    <ul className="type-body">{p.highlights.map((h) => <li key={h.en}><T v={h} /></li>)}</ul>
                  </div>
                  <div className="pf-card-foot">
                    <span className="type-small pf-muted">{p.steps.length} <T v={C.steps} /> · ≈ {p.minutes} <T v={C.minutes} /></span>
                    <span className="pf-btn pf-btn-ink type-body-strong"><T v={C.open} /> →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
