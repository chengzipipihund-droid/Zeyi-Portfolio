'use client';

// SeaTrial Explorer · Compare + Value, rebuilt from Figma "P06 · Compare" (872:18979) and the prototype's Value view.
// Self-contained: no imports from the portfolio site, no backend. Data is illustrative (see data.ts).
// Drawing rules of the map follow the Figma "Simulation panel v2": 100 m grid, ghost hull every N s, past track solid,
// future dotted, 40 s velocity vector, environment as instruments.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  compass, delta, formatMetric, ghostTimes, HULL, METRICS, mmss, mss, SCENARIOS, stateAt, translate, VALUE_DEFAULTS, VESSEL,
  type Identity, type Run, type Scenario, type ShipState,
} from './data';
import './seatrial.css';

export interface PrototypeHandle {
  goto(scene: string): void;
}
type Props = { onEvent?: (event: string) => void };
type Tab = 'compare' | 'value';
type Layout = 'split' | 'overlay';

const ID_COLOR: Record<Identity, string> = { baseline: 'var(--st-id-baseline)', 'gate-rudder': 'var(--st-id-gate)' };
const SPEEDS = [1, 4, 8, 16];
const HULL_EVERY = [15, 30, 60];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Icons exported from the Figma shell (22 px grid, 1.6 stroke).
const ICON = {
  home: 'M3.67 10.08L11 3.67l7.33 6.41M5.5 8.71v9.62h11V8.71M9.17 18.33v-4.58h3.66v4.58',
  cases: 'M3.21 6.87h5.5l1.83 1.84h8.25v8.71H3.21V6.87zm0 0V4.58h5.5l1.83 2.29',
  library: 'M4.58 3.67h2.75v14.66H4.58V3.67zm4.59 0h2.75v14.66H9.17V3.67zm4.76.55l2.66-.74 3.3 14.3-2.66.74-3.3-14.3z',
  compare: 'M5.96 13.75l1.83-3.21 1.38 1.83m5.04 1.38l1.83-3.67 1.38 2.29M3.67 4.58h6.41v12.84H3.67V4.58zm8.25 0h6.41v12.84h-6.41V4.58z',
  report: 'M17.42 6.42L13.75 2.75H5.5v16.5h11.92V6.42zM13.75 2.75v3.67h3.67M8.25 11h6.42m-6.42 3.21h6.42M8.25 8.25H11',
  help: 'M8.8 8.53a2.3 2.3 0 114.57.34c-.1.8-.67 1.5-1.45 1.86-.64.27-.92.73-.92 1.37v.55m0 2.75v.18M11 19.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z',
  settings: 'M11 13.93a2.93 2.93 0 100-5.86 2.93 2.93 0 000 5.86zm6.78-1.55l1.47 1.1-1.65 2.84-1.74-.64c-.52.42-1.11.76-1.74 1l-.28 1.84h-3.3l-.27-1.84a6.4 6.4 0 01-1.74-1l-1.75.64-1.65-2.84 1.47-1.1a6.4 6.4 0 010-2.66L3.3 8.53l1.65-2.85 1.74.65c.53-.43 1.11-.77 1.74-1.01l.28-1.84h3.3l.27 1.84c.63.24 1.22.58 1.75 1l1.74-.64 1.65 2.85-1.47 1.1c.19.87.19 1.78 0 2.65l1.83.1z',
  caret: 'M7.5 4.17L13.33 10 7.5 15.83',
  up: 'M16.5 13.75L11 8.25l-5.5 5.5',
  prev: 'M13.75 4.58L7.33 11l6.42 6.42',
  next: 'M8.25 4.58L14.67 11l-6.42 6.42',
};
function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size === 20 ? 20 : 22} ${size === 20 ? 20 : 22}`} fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** One shared clock for every view. */
function usePlayback(duration: number, initial: number) {
  const [raw, setT] = useState(initial);
  const t = Math.min(raw, duration);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(8);
  const state = useRef({ duration, speed });
  state.current = { duration, speed };
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((v) => {
        const next = v + dt * state.current.speed;
        if (next >= state.current.duration) {
          setPlaying(false);
          return state.current.duration;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  // Not clamped to the duration here: a seek may arrive together with a change of scenario (the render clamps).
  const seek = useCallback((v: number) => setT(Math.max(0, v)), []);
  const toggle = useCallback(() => {
    setT((v) => (v >= state.current.duration - 0.01 ? 0 : v));
    setPlaying((p) => !p);
  }, []);
  return { t, playing, speed, setSpeed, seek, toggle, pause: () => setPlaying(false) };
}

type Side = { letter: 'A' | 'B'; run: Run };

// ---------------------------------------------------------------- map
function HarbourMap({ sc, layers, faint, t, ghostEvery, mid, children }: {
  sc: Scenario; layers: Side[]; faint?: Side; t: number; ghostEvery: number; mid: { x: number; y: number }; children?: ReactNode;
}) {
  const [ref, { width: w, height: h }] = useSize<HTMLDivElement>();
  const hb = sc.harbour;
  const s = w / hb.view.widthM;
  const visW = hb.view.widthM;
  const visH = s > 0 ? h / s : 0;
  // The camera rests on the berth and only follows once the ships would leave the frame. Both maps share it.
  const camX = clamp(hb.view.cx, mid.x - visW * 0.27, mid.x + visW * 0.27);
  const camY = clamp(hb.view.cy, mid.y - visH * 0.22, mid.y + visH * 0.22);
  const x0 = camX - visW / 2;
  const y1 = camY + visH / 2;
  const px = (x: number) => (x - x0) * s;
  const py = (y: number) => (y1 - y) * s;
  const pt = (x: number, y: number) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(x0 / 100) * 100; x <= x0 + visW; x += 100) xs.push(x);
  for (let y = Math.ceil((y1 - visH) / 100) * 100; y <= y1; y += 100) ys.push(y);

  const hull = (st: Pick<ShipState, 'x' | 'y' | 'headingDeg'>) => {
    const r = (st.headingDeg * Math.PI) / 180;
    const fx = Math.sin(r), fy = Math.cos(r), sx = Math.cos(r), sy = -Math.sin(r);
    return HULL.map(([lx, ly]) => pt(st.x + lx * VESSEL.loaM * fx + ly * VESSEL.beamM * sx, st.y + lx * VESSEL.loaM * fy + ly * VESSEL.beamM * sy)).join(' ');
  };
  const bow = (st: Pick<ShipState, 'x' | 'y' | 'headingDeg'>) => {
    const r = (st.headingDeg * Math.PI) / 180;
    return [px(st.x + 0.5 * VESSEL.loaM * Math.sin(r)), py(st.y + 0.5 * VESSEL.loaM * Math.cos(r))];
  };
  const b = hb.berth;
  const landUp = b.landSide === 'north';
  const fin = hb.finish;
  const finVisible = px(fin.x) > 0 && px(fin.x) < w && py(fin.y) > 0 && py(fin.y) < h;
  const lead = stateAt(layers[layers.length - 1].run.samples, t);
  const bollards: number[] = [];
  for (let x = b.x0 - 80; x <= b.x1 + 120; x += 40) bollards.push(x);

  return (
    <div ref={ref} className="st-map">
      {s > 0 && (
        <svg width={w} height={h} role="img" aria-label={`Harbour chart, ${sc.port}. ${layers.map((l) => `${l.letter}: ${l.run.config.name}`).join('; ')}`}>
          {xs.map((x) => <line key={`x${x}`} x1={px(x)} x2={px(x)} y1={0} y2={h} className="st-grid" />)}
          {ys.map((y) => <line key={`y${y}`} y1={py(y)} y2={py(y)} x1={0} x2={w} className="st-grid" />)}
          {hb.contours.map((c, i) => <polyline key={i} points={c.points.map(([x, y]) => pt(x, y)).join(' ')} className="st-contour" />)}
          {hb.land.map((poly, i) => <polygon key={i} points={poly.map(([x, y]) => pt(x, y)).join(' ')} className="st-land" />)}
          {hb.basin && <circle cx={px(hb.basin.x)} cy={py(hb.basin.y)} r={hb.basin.r * s} className="st-zone" />}
          {hb.basin && <text x={px(hb.basin.x)} y={py(hb.basin.y - hb.basin.r) - 6} textAnchor="middle" className="st-maplabel">Turning circle · Ø {hb.basin.r * 2} m</text>}
          {bollards.map((x) => <rect key={x} x={px(x) - 2} y={py(b.y) + (landUp ? -8 : 4)} width={4} height={4} className="st-bollard" />)}
          <line x1={px(b.x0)} x2={px(b.x1)} y1={py(b.y)} y2={py(b.y)} className="st-berth" />
          <text x={px(b.x0) + 8} y={py(b.y) + (landUp ? -14 : 22)} className="st-maplabel">{b.label}</text>
          <circle cx={px(fin.x)} cy={py(fin.y)} r={fin.r * s} className="st-finish" />
          {finVisible && <text x={px(fin.x)} y={py(fin.y - fin.r) + 14} textAnchor="middle" className="st-maplabel">Finish zone</text>}
          {faint && <polyline points={faint.run.samples.map((p) => pt(p[1], p[2])).join(' ')} className="st-trk-faint" style={{ stroke: ID_COLOR[faint.run.config.identity] }} />}
          {layers.map(({ run, letter }) => {
            const color = ID_COLOR[run.config.identity];
            const base = run.config.identity === 'baseline';
            const now = stateAt(run.samples, t);
            const split = run.samples.findIndex((p) => p[0] > t);
            const past = (split === -1 ? run.samples : run.samples.slice(0, split)).map((p) => pt(p[1], p[2]));
            past.push(pt(now.x, now.y));
            const future = split === -1 ? [] : [pt(now.x, now.y), ...run.samples.slice(split).map((p) => pt(p[1], p[2]))];
            const ahead = stateAt(run.samples, Math.min(run.duration, t + 40));
            const [bx, by] = bow(now);
            const ax = px(ahead.x), ay = py(ahead.y), cx = px(now.x), cy = py(now.y);
            const ang = Math.atan2(ay - cy, ax - cx);
            const head = (d: number) => `${ax - 8 * Math.cos(ang + d)},${ay - 8 * Math.sin(ang + d)}`;
            return (
              <g key={letter} className={base ? 'st-layer is-baseline' : 'st-layer'} style={{ '--c': color } as CSSProperties}>
                {future.length > 1 && <polyline points={future.join(' ')} className="st-trk-future" />}
                <polyline points={past.join(' ')} className="st-trk-past" />
                {ghostTimes(run.duration, t, ghostEvery).map((gt) => {
                  const g = stateAt(run.samples, gt);
                  const [gx, gy] = bow(g);
                  return (
                    <g key={gt}>
                      <polygon points={hull(g)} className="st-ghost" />
                      {gt > 0 && gt % 60 === 0 && t - gt >= 60 && <text x={gx + 8} y={gy + 4} className="st-ghostlabel">{mss(gt)}</text>}
                    </g>
                  );
                })}
                <polygon points={hull(now)} className="st-hull" />
                {!now.ended && Math.hypot(ax - cx, ay - cy) > 6 && (
                  <g className="st-velocity">
                    <line x1={cx} y1={cy} x2={ax} y2={ay} />
                    <polygon points={`${ax},${ay} ${head(0.45)} ${head(-0.45)}`} />
                  </g>
                )}
                <text x={bx > w - 130 ? bx - 12 : bx + 10} y={bx > w - 130 ? by - 12 : by + 16} textAnchor={bx > w - 130 ? 'end' : 'start'} className="st-nowlabel">
                  {now.ended ? `finished ${mmss(run.duration)}` : `${mmss(t)} · ${now.sogKn.toFixed(1)} kn`}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {!finVisible && s > 0 && (
        <div className="st-chip st-chip-finish">
          Finish zone · {(Math.hypot(fin.x - lead.x, fin.y - lead.y) / 1000).toFixed(1)} km to {compass(fin.x - lead.x, fin.y - lead.y)}
        </div>
      )}
      <div className="st-scale" aria-hidden>
        <svg width="12" height="20" viewBox="0 0 12 20"><path d="M6 1l5 17-5-4-5 4z" fill="currentColor" /></svg>
        <div style={{ width: 200 * s }}><span>200 m</span></div>
      </div>
      {children}
    </div>
  );
}

function Instruments({ sc }: { sc: Scenario }) {
  const e = sc.env;
  const deg = (d: number) => `${String(Math.round(d)).padStart(3, '0')}°`;
  const dial = (toward: number, dashed = false) => (
    <svg width="27" height="27" viewBox="0 0 27 27" aria-hidden>
      <circle cx="13.5" cy="13.5" r="12" fill="#fff" stroke="rgba(14,34,54,.35)" strokeWidth=".8" />
      <path d="M13.5 1.5v3" stroke="#0e2236" strokeWidth="1.35" />
      <g transform={`rotate(${toward} 13.5 13.5)`}>
        <path d="M13.5 21V8" stroke="#0e2236" strokeWidth="1.35" strokeDasharray={dashed ? '1.7 1.4' : undefined} />
        <path d="M13.5 5l3 5.2h-6z" fill="#0e2236" />
      </g>
    </svg>
  );
  return (
    <div className="st-chip st-instruments" data-tour="st-env">
      <div>{dial((e.wind.fromDeg + 180) % 360)}<p><i>Wind</i><b>{e.wind.kn} kn</b><span>from {deg(e.wind.fromDeg)}</span></p></div>
      <div>{dial((e.waves.fromDeg + 180) % 360)}<p><i>Waves</i><b>Hs {e.waves.hsM.toFixed(1)} m</b><span>from {deg(e.waves.fromDeg)} · Tp {e.waves.tpS} s</span></p></div>
      <div>{dial(e.current.towardDeg, true)}<p><i>Current</i><b>{e.current.kn.toFixed(1)} kn</b><span>{e.current.kn ? `toward ${deg(e.current.towardDeg)}` : 'slack'}</span></p></div>
      <div><p><i>Depth</i><b>{e.depthM} m</b><span>UKC {(e.depthM - VESSEL.draughtM).toFixed(1)} m</span></p></div>
    </div>
  );
}

const explain = (run: Run, t: number) => {
  const mode = run.events.filter((e) => e.kind === 'mode' && e.t <= t).pop();
  return mode ? `${mmss(t)} · ${run.config.short} in ${mode.label.toLowerCase()}` : null;
};

// ---------------------------------------------------------------- timeline
function Timeline({ a, b, duration, pb, onSeek, onEvent }: {
  a: Side; b: Side; duration: number; pb: ReturnType<typeof usePlayback>; onSeek: (t: number, how: string) => void; onEvent?: (e: string) => void;
}) {
  const plot = useRef<HTMLDivElement>(null);
  const [chartRef, chart] = useSize<HTMLDivElement>();
  const at = (clientX: number) => {
    const r = plot.current!.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width, 0, 1) * duration;
  };
  const pct = (t: number) => `${(t / duration) * 100}%`;
  const ticks: number[] = [];
  for (let m = 0; m * 120 < duration - 60; m++) ticks.push(m * 120);
  const sog = (run: Run) =>
    run.samples.filter((_, i) => i % 4 === 0 || i === run.samples.length - 1).map((p) => `${((p[0] / duration) * chart.width).toFixed(1)},${(chart.height - 4 - (Math.min(p[4], 6) / 6) * (chart.height - 8)).toFixed(1)}`).join(' ');
  const saved = a.run.duration - b.run.duration;
  // A label that would run into the previous one keeps its marker only (the label stays in the tooltip).
  const lane = (side: Side) => {
    const list = side.run.events.filter((e) => e.kind !== 'finish' && e.t > 0);
    const x = (t: number) => (t / duration) * chart.width;
    return list.map((e, i) => {
      const next = list[i + 1];
      const quiet = !!next && x(next.t) < x(e.t) + 28 + (e.label.length + 4) * 6.2;
      return (

      <button key={side.letter + e.t} type="button" className="st-event" style={{ left: pct(e.t), '--c': ID_COLOR[side.run.config.identity] } as CSSProperties}
        data-base={side.run.config.identity === 'baseline' || undefined} data-quiet={quiet || undefined}
        onClick={() => { onSeek(e.t, 'event'); onEvent?.('event'); }} title={`${side.letter} · ${e.label} · jump to ${mmss(e.t)}`}>
        <i aria-hidden />{side.letter} · {e.label.toLowerCase()}
      </button>
      );
    });
  };
  return (
    <section className="st-card st-timeline" aria-label="Shared timeline" data-tour="st-timeline">
      <div className="st-tl-controls">
        <button type="button" className="st-play" onClick={() => { pb.toggle(); onEvent?.('play'); }} aria-label={pb.playing ? 'Pause' : 'Play'} data-tour="st-play">
          {pb.playing
            ? <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M5 3.75h3v10.5H5zM10 3.75h3v10.5h-3z" fill="#fff" /></svg>
            : <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M6 3.75v10.5L14.25 9 6 3.75z" fill="#fff" /></svg>}
        </button>
        <p className="st-clock"><b>{mmss(pb.t)}</b> / {mmss(duration)}</p>
        <div className="st-seg" role="group" aria-label="Replay speed">
          {SPEEDS.map((v) => <button key={v} type="button" aria-pressed={pb.speed === v} onClick={() => pb.setSpeed(v)}>{v}×</button>)}
        </div>
        <span className="st-hint">Drag to scrub · both maps follow</span>
        <span className="st-spacer" />
        <span className="st-legend"><i data-base /> A finishes {mmss(a.run.duration)}</span>
        <span className="st-legend"><i /> B finishes {mmss(b.run.duration)}{saved !== 0 && ` · ${mss(Math.abs(saved))} ${saved > 0 ? 'earlier' : 'later'}`}</span>
      </div>
      <div className="st-tl-grid">
        <p className="st-tl-label st-muted">Elapsed</p>
        <div className="st-tl-plot" ref={plot} role="slider" tabIndex={0} aria-label="Elapsed time" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(pb.t)} aria-valuetext={mmss(pb.t)}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pb.pause(); onSeek(at(e.clientX), 'scrub'); }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) onSeek(at(e.clientX), 'scrub'); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); onSeek(pb.t + (e.key === 'ArrowRight' ? 10 : -10), 'scrub'); }
            if (e.key === ' ') { e.preventDefault(); pb.toggle(); }
          }}>
          <div className="st-scrub">
            <i className="st-scrub-track" /><i className="st-scrub-progress" style={{ width: pct(pb.t) }} />
            <i className="st-scrub-finish" style={{ left: pct(a.run.duration), background: ID_COLOR[a.run.config.identity] }} />
            <i className="st-scrub-finish" style={{ left: pct(b.run.duration), background: ID_COLOR[b.run.config.identity] }} />
          </div>
          <div className="st-sog" ref={chartRef}>
            {chart.width > 0 && (
              <svg width={chart.width} height={chart.height} aria-hidden>
                {[0, 0.5, 1].map((f) => <line key={f} x1={0} x2={chart.width} y1={4 + f * (chart.height - 8)} y2={4 + f * (chart.height - 8)} className="st-sog-rule" />)}
                {[a, b].map((side) => <polyline key={side.letter} points={sog(side.run)} className="st-sog-line" data-base={side.run.config.identity === 'baseline' || undefined} style={{ stroke: ID_COLOR[side.run.config.identity] }} />)}
              </svg>
            )}
          </div>
          <i className="st-playhead" style={{ left: pct(pb.t) }}><b /></i>
        </div>
        <p className="st-tl-label st-sog-label"><b>Speed over ground</b><span className="st-muted">kn · 0–6</span></p>
        <p className="st-tl-label st-ev-label"><b>Events</b></p>
        <div className="st-events" data-tour="st-events"><div>{lane(a)}</div><div>{lane(b)}</div></div>
        <div className="st-axis" aria-hidden>
          {ticks.map((v) => <span key={v} style={{ left: pct(v) }}>{mss(v)}</span>)}
          <span style={{ left: '100%' }} data-end>{mss(duration)}</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- compare
function MapCard({ side, sub, children }: { side: Side; sub: string; children: ReactNode }) {
  return (
    <div className="st-mapcard">
      <header className="st-card st-mapcard-head">
        <i className="st-badge" style={{ background: ID_COLOR[side.run.config.identity] }}>{side.letter}</i>
        <p><b>{side.run.config.name}</b><span>Nordline Ferries · {sub}</span></p>
        <span className="st-spacer" />
        <span className="st-fidelity"><i aria-hidden>○</i> Reference library</span>
      </header>
      {children}
    </div>
  );
}

function Tiles({ side, against }: { side: Side; against?: Run }) {
  return (
    <div className="st-tiles" data-tour={against ? 'st-tiles' : undefined}>
      {METRICS.map((m) => {
        const d = against && delta(m.key, against.metrics[m.key], side.run.metrics[m.key]);
        return (
          <div key={m.key} className="st-card st-tile" style={{ '--c': ID_COLOR[side.run.config.identity] } as CSSProperties}>
            <p className="st-tile-label">{m.label}</p>
            <p className="st-tile-value">{formatMetric(m.key, side.run.metrics[m.key])}</p>
            {d ? <p className="st-delta" data-verdict={d.verdict}>{d.verdict === 'same' ? 'same as A' : `${d.text} vs A`}</p> : <p className="st-tile-note">reference side</p>}
          </div>
        );
      })}
    </div>
  );
}

function ValueView({ a, b, sc, hours, setHours }: { a: Side; b: Side; sc: Scenario; hours: number; setHours: (h: number) => void }) {
  const saved = a.run.duration - b.run.duration;
  const v = translate(saved, hours);
  const sign = saved >= 0 ? '−' : '+';
  const good = saved >= 0;
  const eur = Math.abs(v.eurPerYear) / 1e6;
  const steps: { k: string; v: string; n: ReactNode }[] = [
    { k: 'Per manoeuvre', v: `${sign}${mss(Math.abs(saved))}`, n: <>B against A · {sc.port}</> },
    { k: 'Per crossing', v: `${sign}${mss(Math.abs(v.perCrossingS))}`, n: <>{VALUE_DEFAULTS.manoeuvresPerCrossing} manoeuvres: departure and arrival</> },
    { k: 'Sail slower, arrive on time', v: `${sign}${Math.abs(v.speedPct).toFixed(1)} %`, n: <>speed over a {hours.toFixed(1)} h crossing</> },
    { k: 'Energy per crossing', v: `${sign}${Math.abs(v.energyPct).toFixed(1)} %`, n: <>energy taken as ∝ speed²</> },
    { k: 'Fuel cost per year', v: `≈ ${good ? '' : '+'}€${eur.toFixed(2)} M`, n: <>of €{(VALUE_DEFAULTS.annualFuelEUR / 1e6).toFixed(1)} M annual fuel{good ? ' saved' : ' added'}</> },
  ];
  return (
    <div className="st-value">
      <header>
        <h2>What the difference is worth</h2>
        <p>Seconds in the harbour become a slower, cheaper crossing. Every step shows its assumption, and each one can be changed with the customer in the room.</p>
      </header>
      <ol className="st-chain" data-tour="st-chain">
        {steps.map((s, i) => (
          <li key={s.k} className="st-card" data-last={i === steps.length - 1 || undefined} data-good={good}>
            <p className="st-tile-label">{s.k}</p>
            <p className="st-tile-value">{s.v}</p>
            <p className="st-tile-note">{s.n}</p>
          </li>
        ))}
      </ol>
      <div className="st-value-row">
        <section className="st-card st-assume" data-tour="st-assume">
          <h3>Assumption · crossing time</h3>
          <div className="st-stepper">
            <button type="button" onClick={() => setHours(Math.max(1, hours - 0.5))} aria-label="Shorter crossing">−</button>
            <output>{hours.toFixed(1)} h</output>
            <button type="button" onClick={() => setHours(Math.min(12, hours + 0.5))} aria-label="Longer crossing">+</button>
          </div>
          <p className="st-muted">A short route gains more from the same minutes: the saved time is a larger share of the crossing.</p>
        </section>
        <section className="st-card st-assume">
          <h3>Capex</h3>
          <p className="st-capex">From quotation</p>
          <p className="st-muted">Shown next to the yearly value, never netted into one number. The owner&apos;s finance team does that sum with their own figures.</p>
        </section>
        <section className="st-card st-assume">
          <h3>How sure</h3>
          <p className="st-capex"><i aria-hidden>○</i> Reference · ±10 %</p>
          <p className="st-muted">Both results come from the reference library. The band is a placeholder until hydrodynamics confirms it. Illustrative data.</p>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shell
export const SeaTrialPrototype = forwardRef<PrototypeHandle, Props>(function SeaTrialPrototype({ onEvent }, handle) {
  const [scId, setScId] = useState(SCENARIOS[0].id);
  const [swapped, setSwapped] = useState(false);
  const [layout, setLayout] = useState<Layout>('split');
  const [ghostEvery, setGhostEvery] = useState(30);
  const [tab, setTab] = useState<Tab>('compare');
  const [menu, setMenu] = useState(false);
  const [hours, setHours] = useState(VALUE_DEFAULTS.crossingHours);
  const [note, setNote] = useState<string | null>(null);
  const sc = SCENARIOS.find((s) => s.id === scId)!;
  const a: Side = { letter: 'A', run: swapped ? sc.runs.gate : sc.runs.flap };
  const b: Side = { letter: 'B', run: swapped ? sc.runs.flap : sc.runs.gate };
  const duration = Math.max(a.run.duration, b.run.duration);
  const pb = usePlayback(duration, 252);
  const emit = (e: string) => onEvent?.(e);
  const picker = useRef<HTMLDivElement>(null);
  // The harbour menu closes on Escape and on a press anywhere outside it.
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    const press = (e: PointerEvent) => !picker.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', press);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', press);
    };
  }, [menu]);

  useImperativeHandle(handle, () => ({
    goto(scene) {
      pb.pause();
      setNote(null);
      setMenu(scene === 'harbour');
      setTab(scene === 'value' ? 'value' : 'compare');
      if (scene === 'harbour' || scene === 'clock' || scene === 'hulls') { setScId('open-quay'); pb.seek(252); }
      if (scene === 'clock' || scene === 'hulls') setLayout('split');
      if (scene === 'explain') { setScId('open-quay'); setLayout('split'); pb.seek(140); }
      if (scene === 'verdict') { setScId('inner-basin'); setLayout('split'); pb.seek(9999); }
    },
  }));

  const pick = (id: string) => {
    setScId(id);
    setMenu(false);
    pb.pause();
    pb.seek(Math.min(252, SCENARIOS.find((s) => s.id === id)!.runs.gate.duration));
    emit('harbour');
  };
  const later = (what: string) => setNote(`${what} is part of the Figma prototype. This demo covers Compare and Value.`);
  const sa = stateAt(a.run.samples, pb.t);
  const sb = stateAt(b.run.samples, pb.t);
  const mid = { x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 };
  const status = note ?? (tab === 'compare'
    ? `Replay ${mmss(pb.t)} / ${mmss(duration)} · both maps follow the shared timeline`
    : 'Value · assumptions travel with the report');
  const tools: [string, string, boolean?][] = [['Home', ICON.home], ['Cases', ICON.cases], ['Library', ICON.library], ['Compare', ICON.compare, true], ['Report', ICON.report], ['Help', ICON.help]];
  const chips = (own: Side, other: Side) => {
    const ex = explain(own.run, pb.t);
    return (
      <>
        <div className="st-chip st-chip-ghost">Hull every {ghostEvery} s · {other.letter} track faint</div>
        {ex && <div className="st-chip st-chip-explain" data-tour="st-explain">{ex}</div>}
      </>
    );
  };

  return (
    <div className="st-root">
      <header className="st-l1">
        <p className="st-product"><i aria-hidden />SeaTrial Explorer</p>
        <span className="st-l1-meta">21.10.2026&ensp;09:58</span>
        <span className="st-spacer" />
        <p className="st-context"><span>Workspace</span><b>Propulsion sales · Nordics</b><i aria-hidden>DD</i><b>Dana Designer · Sales engineer</b></p>
      </header>
      <div className="st-l2">
        <span className="st-l2-toggle" aria-hidden><Icon d={ICON.caret} size={20} /></span>
        <p className="st-l2-lead"><b>Comparison</b><span>A vs B</span></p>
        <p className="st-l2-item"><span>A</span><b>{a.run.config.name}</b></p>
        <p className="st-l2-item"><span>B</span><b>{b.run.config.name}</b></p>
        <p className="st-l2-item st-l2-vessel"><span>Vessel</span><b>{VESSEL.name}</b></p>
        <div className="st-l2-item st-l2-pick" ref={picker}>
          <button type="button" aria-haspopup="listbox" aria-expanded={menu} onClick={() => setMenu((m) => !m)} data-tour="st-harbour">
            <span>Harbour · manoeuvre</span><b>{sc.port} — {sc.manoeuvre}<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg></b>
          </button>
          {menu && (
            <ul className="st-menu" role="listbox" aria-label="Harbour and manoeuvre" data-tour="st-harbour-menu">
              {SCENARIOS.map((s) => (
                <li key={s.id} role="option" aria-selected={s.id === scId}>
                  <button type="button" onClick={() => pick(s.id)}>
                    <b>{s.port}</b><span>{s.manoeuvre}</span><small>{s.note}</small>
                    <em>A {mmss(s.runs.flap.duration)} · B {mmss(s.runs.gate.duration)}</em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="st-l2-item st-l2-fid"><span>Fidelity</span><b>○ Reference · ±10 %</b></p>
        <span className="st-spacer" />
        <span className="st-l2-meta">Library RL-2026.10 · illustrative data</span>
      </div>
      <div className="st-body">
        <div className="st-work">
          <nav className="st-l3" aria-label="Case views">
            <span className="st-l2-toggle" aria-hidden><Icon d={ICON.caret} size={20} /></span>
            <button type="button" onClick={() => later('Overview')}>Overview</button>
            <button type="button" onClick={() => later('Configurations')}>Configurations <i>3</i></button>
            <button type="button" aria-current={tab === 'compare' ? 'page' : undefined} onClick={() => { setTab('compare'); setNote(null); }}>Compare</button>
            <button type="button" aria-current={tab === 'value' ? 'page' : undefined} onClick={() => { setTab('value'); setNote(null); pb.pause(); emit('value'); }} data-tour="st-tab-value">Value</button>
            <button type="button" onClick={() => later('Report')}>Report</button>
            <span className="st-spacer" />
            {tab === 'compare' && (
              <>
                <div className="st-seg" role="group" aria-label="Layout" data-tour="st-layout">
                  {(['split', 'overlay'] as const).map((l) => <button key={l} type="button" aria-pressed={layout === l} onClick={() => { setLayout(l); emit('layout'); }}>{l === 'split' ? 'Split' : 'Overlay'}</button>)}
                </div>
                <div className="st-seg" role="group" aria-label="Hull every" data-tour="st-ghost">
                  {HULL_EVERY.map((v) => <button key={v} type="button" aria-pressed={ghostEvery === v} onClick={() => { setGhostEvery(v); emit('ghost'); }}>{v} s</button>)}
                </div>
                <button type="button" className="st-btn" onClick={() => { setSwapped((s) => !s); emit('swap'); }} data-tour="st-swap">Swap A/B</button>
              </>
            )}
            <button type="button" className="st-btn st-btn-primary" onClick={() => later('Report')}>Create report</button>
          </nav>
          {tab === 'compare' ? (
            <main className="st-content">
              {layout === 'split' ? (
                <div className="st-maps" data-tour="st-maps">
                  <MapCard side={a} sub={a.run.config.role}>
                    <HarbourMap sc={sc} layers={[a]} faint={b} t={pb.t} ghostEvery={ghostEvery} mid={mid}>{chips(a, b)}<Instruments sc={sc} /></HarbourMap>
                    <Tiles side={a} />
                  </MapCard>
                  <MapCard side={b} sub={b.run.config.role}>
                    <HarbourMap sc={sc} layers={[b]} faint={a} t={pb.t} ghostEvery={ghostEvery} mid={mid}>{chips(b, a)}<Instruments sc={sc} /></HarbourMap>
                    <Tiles side={b} against={a.run} />
                  </MapCard>
                </div>
              ) : (
                <div className="st-maps st-maps-overlay" data-tour="st-maps">
                  <div className="st-mapcard">
                    <header className="st-card st-mapcard-head">
                      <i className="st-badge" style={{ background: ID_COLOR[a.run.config.identity] }}>A</i><p><b>{a.run.config.name}</b></p>
                      <i className="st-badge" style={{ background: ID_COLOR[b.run.config.identity] }}>B</i><p><b>{b.run.config.name}</b></p>
                      <span className="st-spacer" /><span className="st-fidelity">Same start, same finish, one clock</span>
                    </header>
                    <HarbourMap sc={sc} layers={a.run.config.identity === 'baseline' ? [a, b] : [b, a]} t={pb.t} ghostEvery={ghostEvery} mid={mid}>
                      <div className="st-chip st-chip-ghost">Hull every {ghostEvery} s</div><Instruments sc={sc} />
                    </HarbourMap>
                    <div className="st-tiles-2"><Tiles side={a} /><Tiles side={b} against={a.run} /></div>
                  </div>
                </div>
              )}
              <Timeline a={a} b={b} duration={duration} pb={pb} onSeek={(t, how) => { pb.seek(t); if (how === 'scrub') emit('scrub'); }} onEvent={emit} />
            </main>
          ) : (
            <main className="st-content"><ValueView a={a} b={b} sc={sc} hours={hours} setHours={(h) => { setHours(h); emit('assume'); }} /></main>
          )}
        </div>
        <aside className="st-toolbar" aria-label="Places">
          {tools.map(([label, d, on]) => (
            <button key={label} type="button" aria-current={on ? 'page' : undefined} onClick={() => !on && later(label)}><Icon d={d} />{label}</button>
          ))}
          <span className="st-spacer" /><hr />
          <button type="button" onClick={() => later('Settings')}><Icon d={ICON.settings} />Settings</button>
        </aside>
      </div>
      <footer className="st-footer">
        <span className="st-footer-nav" aria-hidden><Icon d={ICON.up} /><Icon d={ICON.prev} /><Icon d={ICON.next} /><Icon d={ICON.home} /></span>
        <p className="st-status" role="status"><i aria-hidden />{status}</p>
        <p className="st-role"><b>Propulsion Sales (Nordics)</b><span>Sales engineer</span></p>
      </footer>
    </div>
  );
});
