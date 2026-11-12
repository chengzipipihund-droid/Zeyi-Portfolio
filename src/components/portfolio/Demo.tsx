'use client';

// One prototype with its guided tour: a rail of design decisions on the left, the live prototype on the right.
// Guided: opening a step puts the prototype in that step's scene and outlines what to touch; the prototype reports
// what the visitor did, which ticks the step. Explore: the rail steps aside and the prototype is simply used.
import Link from 'next/link';
import { Maximize, Minimize } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { pageCopy as C, prototypes, type Prototype } from '@/data/prototypes';
import { FloatopiaPrototype } from '@/prototypes/floatopia/Floatopia';
import { SeaTrialPrototype } from '@/prototypes/seatrial/SeaTrial';
import { LangSwitch, T, useLang } from './Lang';
import './portfolio.css';

type Handle = { goto(scene: string): void };
const REGISTRY = { 'seatrial-explorer': SeaTrialPrototype, floatopia: FloatopiaPrototype } as const;
/** Smallest logical size each prototype is laid out at; smaller stages scale it down instead of squeezing it. */
const MIN = { desktop: { w: 1280, h: 770 }, phone: { w: 402, h: 874 } };

function PrototypeStage({ fullscreen, label, children }: { fullscreen: boolean; label: string; children: ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const native = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLang();
  const action = expanded ? C.exitFullscreen[lang] : C.enterFullscreen[lang];

  useEffect(() => {
    const element = host.current;
    const sync = () => {
      const current = document.fullscreenElement === element;
      if (current || native.current) setExpanded(current);
      native.current = current;
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const element = host.current!;
    const control = button.current;
    const siblings = [...element.parentElement!.children]
      .filter((sibling): sibling is HTMLElement => sibling instanceof HTMLElement && sibling !== element)
      .map((sibling) => ({ sibling, inert: sibling.inert }));
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    siblings.forEach(({ sibling }) => { sibling.inert = true; });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        event.preventDefault();
        setExpanded(false);
      }
      if (event.key !== 'Tab') return;
      const controls = [...element.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((control) => !control.matches(':disabled') && !control.closest('[hidden], [inert]') && control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    control?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = overflow;
      siblings.forEach(({ sibling, inert }) => { sibling.inert = inert; });
      document.removeEventListener('keydown', keydown);
      control?.focus({ preventScroll: true });
    };
  }, [expanded]);

  const toggle = async () => {
    const element = host.current!;
    if (expanded) {
      if (document.fullscreenElement === element) await document.exitFullscreen().catch(() => undefined);
      setExpanded(document.fullscreenElement === element);
      return;
    }
    setExpanded(true);
    if (document.fullscreenEnabled && element.requestFullscreen) {
      await element.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <main ref={host} className="pf-stage" aria-label={label} data-expanded={expanded || undefined}>
      {fullscreen && (
        <div className="pf-stage-tools">
          <button ref={button} type="button" className="pf-btn pf-fullscreen type-body" onClick={toggle} aria-label={action} title={action} aria-pressed={expanded}>
            {expanded ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
          </button>
        </div>
      )}
      {children}
    </main>
  );
}

export function Demo({ slug }: { slug: Prototype['slug'] }) {
  const proto = prototypes.find((p) => p.slug === slug)!;
  const other = prototypes.find((p) => p.slug !== slug);
  const Prototype = REGISTRY[slug];
  const { lang } = useLang();
  const api = useRef<Handle>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [active, setActive] = useState(0);
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const step = proto.steps[active];
  const guided = mode === 'guided';
  const last = active === proto.steps.length - 1;

  useLayoutEffect(() => {
    const el = stage.current!;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  const ready = box.w > 0;

  // Opening a step stages its scene. A step with nothing to do counts as seen.
  useEffect(() => {
    if (!ready || !guided) return;
    api.current?.goto(step.scene);
    if (step.done.length === 0) setDone((d) => new Set(d).add(step.id));
  }, [ready, guided, step]);

  const onEvent = useCallback((event: string) => {
    setDone((d) => {
      const s = stepRef.current;
      return guidedRef.current && s.done.includes(event) && !d.has(s.id) ? new Set(d).add(s.id) : d;
    });
  }, []);
  const stepRef = useRef(step);
  const guidedRef = useRef(guided);
  stepRef.current = step;
  guidedRef.current = guided;

  // Outline the controls of the open step. The prototype re-renders freely, so the marks are re-applied on a slow tick.
  useEffect(() => {
    const root = stage.current!;
    const mark = () => {
      root.querySelectorAll<HTMLElement>('[data-tour]').forEach((el) => {
        const on = guided && step.hot.includes(el.dataset.tour!);
        if (on !== el.hasAttribute('data-hot')) el.toggleAttribute('data-hot', on);
      });
    };
    mark();
    const id = window.setInterval(mark, 250);
    return () => {
      window.clearInterval(id);
      root.querySelectorAll('[data-hot]').forEach((el) => el.removeAttribute('data-hot'));
    };
  }, [guided, step]);

  let frame: CSSProperties = {};
  if (ready && proto.kind === 'desktop') {
    const s = Math.min(1, box.w / MIN.desktop.w, box.h / MIN.desktop.h);
    frame = { width: box.w / s, height: box.h / s, transform: `scale(${s})` };
  } else if (ready) {
    const s = Math.min(1, (box.h - 8) / MIN.phone.h, box.w / MIN.phone.w);
    frame = { width: MIN.phone.w, height: MIN.phone.h, left: (box.w - MIN.phone.w * s) / 2, top: (box.h - MIN.phone.h * s) / 2, transform: `scale(${s})` };
  }

  return (
    <div className="pf-demo" data-theme={proto.theme} data-mode={mode} data-kind={proto.kind}>
      <header className="pf-bar">
        <Link href="/" className="pf-logo type-title-m">Zeyi Cheng</Link>
        <nav aria-label="Breadcrumb" className="pf-crumb type-body">
          <Link href="/portfolio"><T v={C.kicker} /></Link><span aria-hidden>/</span><span aria-current="page">{proto.title}</span>
        </nav>
        <span className="pf-grow" />
        <div className="pf-mode" role="group" aria-label="Mode">
          <button type="button" aria-pressed={guided} onClick={() => setMode('guided')}><T v={C.guided} /></button>
          <button type="button" aria-pressed={!guided} onClick={() => setMode('free')}><T v={C.free} /></button>
        </div>
        <LangSwitch />
        {proto.caseHref && <Link href={proto.caseHref} className="pf-link type-body-strong"><T v={C.caseStudy} /> →</Link>}
      </header>

      <aside className="pf-rail" aria-label={`${proto.title}: guided tour`} hidden={!guided}>
        <header>
          <p className="type-small pf-muted"><T v={proto.label} /></p>
          <h1 className="type-title-l pf-accent">{proto.title}</h1>
          <p className="type-body"><T v={proto.summary} /></p>
          <p className="type-small pf-muted"><b><T v={C.role} /></b> · <T v={proto.role} /></p>
        </header>
        <ol className="pf-steps">
          {proto.steps.map((s, i) => {
            const open = i === active;
            const tried = done.has(s.id);
            return (
              <li key={s.id} data-open={open || undefined} data-done={tried || undefined}>
                <button type="button" className="pf-step" aria-expanded={open} aria-current={open ? 'step' : undefined} onClick={() => setActive(i)}>
                  <i aria-hidden>{tried ? <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.5L5 9l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}</i>
                  <span className="type-body-strong"><T v={s.title} /></span>
                </button>
                {open && (
                  <div className="pf-step-body type-body">
                    <p><T v={s.what} /></p>
                    <p className="pf-why"><b className="type-small"><T v={C.why} /></b><T v={s.why} /></p>
                    {s.try && (
                      <p className="pf-try"><b className="type-small"><T v={C.tryIt} /></b><T v={s.try} />
                        {tried && <em className="type-small" role="status"><T v={C.tried} /></em>}</p>
                    )}
                    <div className="pf-step-nav">
                      <button type="button" className="pf-btn" disabled={i === 0} onClick={() => setActive(i - 1)}><T v={C.back} /></button>
                      {last
                        ? <button type="button" className="pf-btn pf-btn-ink" onClick={() => setMode('free')}><T v={C.finish} /></button>
                        : <button type="button" className="pf-btn pf-btn-ink" onClick={() => setActive(i + 1)}><T v={C.next} /> →</button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <footer className="type-small pf-muted">
          <span><T v={C.scope} /></span>
          {other && <Link href={`/portfolio/${other.slug}${lang === 'zh' ? '?lang=zh' : ''}`}><T v={C.nextProto} />: {other.title} →</Link>}
        </footer>
      </aside>

      <PrototypeStage fullscreen={proto.kind === 'desktop'} label={`${proto.title} prototype`}>
        {!guided && <p className="pf-free type-small pf-muted"><T v={C.freeHint} /></p>}
        {proto.kind === 'desktop' && <p className="pf-narrow type-small pf-muted"><T v={C.narrow} /></p>}
        <div className="pf-stage-box" ref={stage}>
          {ready && (
            <div className="pf-frame" style={frame}>
              <Prototype ref={api} onEvent={onEvent} />
            </div>
          )}
        </div>
      </PrototypeStage>
    </div>
  );
}
