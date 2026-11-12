'use client';
/* eslint-disable @next/next/no-img-element -- the prototype stays portable (no next/image); every image is a pre-sized Figma render */

// Floatopia · booking prototype, rebuilt from Figma "07 · Prototype v2 — drawing-led" (1379:21907):
// Home (map + ask) → zoom → Island → open (exploded) → venue sheet → booked, plus Ask and Swap offer.
// Fixed 402 × 874 phone frame, Figma px. Self-contained: no imports from the portfolio site, no backend.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { addMinutes, ASK, DAYS, FILTERS, IMG, ISLANDS, LEVELS, NOTES, PRICE, slotsFor, STRIP, VENUES, type Booking, type Venue } from './data';
import './floatopia.css';

export interface PrototypeHandle {
  goto(scene: string): void;
}
type Props = { onEvent?: (event: string) => void };
type Screen = 'home' | 'island' | 'exploded' | 'booked' | 'ask' | 'swap';
type Tab = 'explore' | 'bookings' | 'me';

const at = (x: number, y: number, w?: number, h?: number): CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h });
const VIEW = 402;
const MINI = 354;
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- icons (exported from Figma)
const Spark = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden><path d="M8 1.5L9.6 6.4L14.5 8L9.6 9.6L8 14.5L6.4 9.6L1.5 8L6.4 6.4L8 1.5Z" fill="var(--fl-accent)" /></svg>
);
const Stroke = ({ d, size = 18, w = 1.8, color = 'currentColor' }: { d: string; size?: number; w?: number; color?: string }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden><path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const PATH = {
  back: 'M11 4L6 9L11 14',
  down: 'M4 6.5L9 11.5L14 6.5',
  expand: 'M7.5 3H3V7.5M3 3L8 8M10.5 15H15V10.5M15 15L10 10',
  close: 'M3 3L11 11M11 3L3 11',
  chevron: 'M6 3.5L10.5 8L6 12.5',
  filter: 'M3 5H15M5.5 9H12.5M8 13H10',
  check: 'M6 13.5L10.5 18L20 8.5',
};

function StatusBar() {
  return (
    <div className="fl-status" aria-hidden>
      <span>9:41</span>
      <svg width="78" height="14" viewBox="0 0 78 14" fill="none">
        <rect x="0" y="9" width="3.2" height="4" rx="1" fill="#141414" /><rect x="4.8" y="6.5" width="3.2" height="6.5" rx="1" fill="#141414" /><rect x="9.6" y="4" width="3.2" height="9" rx="1" fill="#141414" /><rect x="14.4" y="1.5" width="3.2" height="11.5" rx="1" fill="#141414" />
        <path d="M27 4.2C30.6 1.2 35.4 1.2 39 4.2M29.2 6.9C31.5 5 34.5 5 36.8 6.9M31.5 9.5C32.6 8.7 33.6 8.7 34.5 9.5" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="48.5" y="1.5" width="25" height="11" rx="3.5" stroke="#141414" /><rect x="50.5" y="3.5" width="21" height="7" rx="2" fill="#141414" /><path d="M75.5 5.5V8.5" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const item = (id: Tab, label: string, icon: ReactNode) => (
    <button type="button" className="fl-tab" aria-current={tab === id ? 'page' : undefined} onClick={() => onTab(id)} data-tour={`fl-tab-${id}`}>
      {icon}<span>{label}</span><i aria-hidden />
    </button>
  );
  return (
    <nav className="fl-tabbar" aria-label="Sections">
      {item('explore', 'Explore', (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden><rect x="2.5" y="7.5" width="21" height="12" rx="6" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="7.5" r="2.6" fill={tab === 'explore' ? 'var(--fl-accent)' : 'currentColor'} /></svg>
      ))}
      {item('bookings', 'Bookings', (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden><path d="M4 7.5H22V10.7C20.73 10.7 19.7 11.73 19.7 13C19.7 14.27 20.73 15.3 22 15.3V18.5H4V15.3C5.27 15.3 6.3 14.27 6.3 13C6.3 11.73 5.27 10.7 4 10.7V7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M15.5 8V18" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" /></svg>
      ))}
      {item('me', 'Me', (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden><circle cx="13" cy="9.5" r="3.8" stroke="currentColor" strokeWidth="1.8" /><path d="M5.5 21C7.1 17.2 9.8 15.5 13 15.5C16.2 15.5 18.9 17.2 20.5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      ))}
    </nav>
  );
}

const Badge = ({ v }: { v: Venue }) => <span className="fl-badge" data-status={v.status}>{v.badge}</span>;
const BackButton = ({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) => (
  <button type="button" className="fl-round" style={at(20, 60, 40, 40)} onClick={onClick} aria-label={label}><Stroke d={PATH.back} /></button>
);

// ---------------------------------------------------------------- home
function Home({ zooming, onIsland, onOther, onAsk, onPan }: { zooming: boolean; onIsland: () => void; onOther: (name: string) => void; onAsk: () => void; onPan: () => void }) {
  const map = useRef<HTMLDivElement>(null);
  const peeks = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const [active, setActive] = useState('sports');
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const lock = useRef(0);

  const centre = useCallback((id: string, smooth = true) => {
    const isl = ISLANDS.find((i) => i.id === id)!;
    const behavior = smooth && !reduced() ? 'smooth' : 'auto';
    lock.current = Date.now() + 600;
    setActive(id);
    map.current?.scrollTo({ left: Math.max(0, Math.min(STRIP.w - VIEW, isl.anchor[0] - VIEW / 2)), behavior });
    peeks.current?.scrollTo({ left: ISLANDS.indexOf(isl) * 312, behavior });
  }, []);

  const onMapScroll = () => {
    const left = map.current!.scrollLeft;
    setScroll(left);
    if (Date.now() < lock.current) return;
    // The island nearest to the middle of the view becomes the active one; its card follows.
    const mid = left + VIEW / 2 - (left < 4 ? 80 : 0);
    const near = ISLANDS.reduce((a, b) => (Math.abs(b.anchor[0] - mid) < Math.abs(a.anchor[0] - mid) ? b : a));
    if (near.id !== active) {
      setActive(near.id);
      peeks.current?.scrollTo({ left: ISLANDS.indexOf(near) * 312, behavior: reduced() ? 'auto' : 'smooth' });
    }
  };
  const open = (id: string) => {
    const isl = ISLANDS.find((i) => i.id === id)!;
    if (isl.built) onIsland();
    else { centre(id); onOther(isl.title); }
  };
  // Figma "Home — zoom to island": the strip sits at (−579, −252) of the map window, 2.2 × as large.
  const zoom: CSSProperties = zooming ? { transform: `translate(${scroll - 579}px, -252px) scale(2.2)` } : {};

  return (
    <div className="fl-screen fl-home" data-zooming={zooming || undefined}>
      <StatusBar />
      <p className="fl-kicker" style={at(24, 60)}>AREIA PRETA · MACAO</p>
      <h1 className="fl-display" style={{ ...at(24, 76), fontSize: 28, lineHeight: '33px' }}>Floatopia</h1>
      <span className="fl-avatar" style={at(338, 66, 40, 40)} aria-hidden>O</span>
      <button type="button" className="fl-ask" style={at(24, 126, 354, 48)} onClick={onAsk} data-tour="fl-ask">
        <Spark /><span>Ask: badminton tonight for two</span><Stroke d={PATH.filter} w={1.5} color="#4f4f4f" />
      </button>

      <div className="fl-map" style={at(0, 182, VIEW, 420)} ref={map} onScroll={onMapScroll} data-tour="fl-map"
        onPointerDown={(e) => { if (e.pointerType === 'mouse') drag.current = { x: e.clientX, left: map.current!.scrollLeft, moved: false }; }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const r = map.current!.getBoundingClientRect();
          const dx = ((e.clientX - d.x) * VIEW) / r.width;
          if (Math.abs(dx) > 4 && !d.moved) { d.moved = true; map.current!.setPointerCapture(e.pointerId); }
          if (d.moved) map.current!.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => { if (drag.current?.moved) onPan(); drag.current = null; }}
        onTouchEnd={onPan}
        onClickCapture={(e) => { if (drag.current?.moved) e.stopPropagation(); }}>
        <div className="fl-strip" style={{ width: STRIP.w, height: STRIP.h, ...zoom }}>
          <img src={`${IMG}/ring-map.webp`} alt="Axonometric drawing of the Floatopia ring: an elevated running line linking six islands" width={STRIP.w} height={STRIP.h} draggable={false} />
          <div className="fl-pins">
            <span className="fl-place" style={at(174, 338)}>JINGQING SPORTS CENTRE</span>
            <i className="fl-you-halo" style={at(333, 332, 44, 44)} /><i className="fl-you-dot" style={at(347, 346, 16, 16)} /><span className="fl-you" style={at(369, 343)}>YOU</span>
            {ISLANDS.map((isl) => (
              <button key={isl.id} type="button" className="fl-pin" data-active={active === isl.id || undefined} style={{ left: isl.anchor[0], top: isl.anchor[1] }}
                onClick={() => open(isl.id)} aria-label={`${isl.title} — ${isl.meta}`} data-tour={isl.built ? 'fl-pin-sports' : undefined}>
                <span><b>{isl.num}</b>{isl.pin}</span><i aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fl-mini" style={at(24, 612, MINI, 30)} data-tour="fl-mini">
        <i className="fl-mini-track" />
        {ISLANDS.map((isl) => (
          <button key={isl.id} type="button" data-active={active === isl.id || undefined} style={{ left: (isl.anchor[0] / STRIP.w) * MINI }} onClick={() => { centre(isl.id); onPan(); }} aria-label={`Go to ${isl.title}`} />
        ))}
        <i className="fl-mini-view" style={zooming ? { left: 65, width: 44 } : { left: (scroll / STRIP.w) * MINI, width: (VIEW / STRIP.w) * MINI }} />
      </div>
      <p className="fl-kicker fl-kicker-s" style={at(24, 646)}>SWIPE THE MAP TO TRAVEL THE RING →</p>

      <div className="fl-peeks" style={at(0, 670, VIEW, 104)} ref={peeks}>
        {ISLANDS.map((isl) => (
          <button key={isl.id} type="button" className="fl-peek" onClick={() => open(isl.id)} data-tour={isl.built ? 'fl-peek-sports' : undefined}>
            <img src={`${IMG}/peek-${isl.id}.webp`} alt="" width={88} height={88} />
            <span className="fl-kicker fl-kicker-m">{isl.index}</span>
            <b>{isl.title}</b>
            <span className="fl-peek-meta"><i aria-hidden />{isl.meta}</span>
            {isl.event && <em>{isl.event}</em>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- island (closed)
function IslandHead() {
  return (
    <>
      <p className="fl-kicker fl-kicker-m" style={at(72, 60)}>FLOATOPIA / 01 · ON HIGH LINE</p>
      <h1 className="fl-display" style={{ ...at(72, 74), fontSize: 21, lineHeight: '25px' }}>Sports Island <span className="fl-cn" lang="zh">体育浮岛</span></h1>
    </>
  );
}

function IslandScreen({ onBack, onExpand, onVenue }: { onBack: () => void; onExpand: () => void; onVenue: (v: Venue) => void }) {
  const [filter, setFilter] = useState('All');
  const list = VENUES.filter((v) => filter === 'All' || v.filter === filter);
  return (
    <div className="fl-screen fl-enter">
      <StatusBar />
      <BackButton onClick={onBack} label="Back to the ring" />
      <IslandHead />
      <div className="fl-hero" style={at(12, 112, 378, 236)}>
        <img src={`${IMG}/island-hero.webp`} alt="Sports Island seen from the ring, closed" width={378} height={236} />
        <span className="fl-hint">4 levels · 5 places to book</span>
        <button type="button" className="fl-round fl-round-dark" onClick={onExpand} aria-label="Open the island: exploded view" data-tour="fl-expand"><Stroke d={PATH.expand} w={1.6} color="#fff" /></button>
      </div>
      <p className="fl-note" style={at(24, 356, 354, 40)}><Spark />Quiet now — climbing and gym are free until 17:00</p>
      <div className="fl-filters" style={at(0, 404, VIEW)} role="group" aria-label="Filter by sport" data-tour="fl-filters">
        {FILTERS.map((f) => <button key={f} type="button" className="fl-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <p className="fl-count" style={at(24, 448, 354)}><b>{list.length} {list.length === 1 ? 'place' : 'places'}</b> · 14 slots free today<span>Sat 26 Oct</span></p>
      <ul className="fl-list" style={at(0, 474, VIEW)}>
        {list.map((v) => (
          <li key={v.id}>
            <button type="button" onClick={() => onVenue(v)} data-tour={v.id === 'climbing' ? 'fl-row-climbing' : undefined}>
              <i className="fl-num" data-open={v.status === 'open' || undefined}>{v.n}</i>
              <img src={`${IMG}/thumb-${v.id}.webp`} alt="" width={44} height={44} />
              <span className="fl-row-text"><b>{v.name}</b><span>{v.meta}</span></span>
              <Badge v={v} />
              <Stroke d={PATH.chevron} size={16} w={1.6} color="#9a9a9a" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- island (open, exploded)
function Exploded({ onCollapse, onSlots, onEvent }: { onCollapse: () => void; onSlots: (v: Venue) => void; onEvent: (e: string) => void }) {
  const [sel, setSel] = useState('climbing');
  const [week, setWeek] = useState<'this' | 'next'>('this');
  const v = VENUES.find((x) => x.id === sel)!;
  const tipLeft = v.marker[0] > 250;
  return (
    <div className="fl-screen fl-exploded fl-enter-zoom">
      <StatusBar />
      <button type="button" className="fl-round" style={at(20, 56, 40, 40)} onClick={onCollapse} aria-label="Close the island"><Stroke d={PATH.down} /></button>
      <h1 className="fl-display" style={{ ...at(72, 56), fontSize: 17, lineHeight: '20px' }}>Sports Island</h1>
      <p className="fl-sub" style={at(72, 79)}>Inside · 4 levels</p>
      <div className="fl-week" style={at(245, 60)} role="group" aria-label="Layout week" data-tour="fl-week">
        <button type="button" aria-pressed={week === 'this'} onClick={() => setWeek('this')}>This week</button>
        <button type="button" aria-pressed={week === 'next'} onClick={() => { setWeek('next'); onEvent('week'); }}>Next</button>
      </div>
      <img className="fl-exploded-art" style={at(0, 126, 402, 468)} src={`${IMG}/exploded.webp`} alt="Exploded axonometric of Sports Island: ring, deck, hall and centre" width={402} height={468} />
      {LEVELS.map((l) => (
        <p key={l.code} className="fl-level" style={at(338, l.y)}><i aria-hidden /><b>{l.code}</b><span>{l.name}</span></p>
      ))}
      {NOTES.map((n) => <p key={n.label} className="fl-poi" style={at(n.x, n.y - 2)}><i aria-hidden />{n.label}</p>)}
      <div>
        {VENUES.map((m) => (
          <button key={m.id} type="button" className="fl-marker" data-tour="fl-markers" data-selected={sel === m.id || undefined} data-open={m.status === 'open' || undefined}
            style={{ left: m.marker[0], top: m.marker[1] }} onClick={() => { setSel(m.id); onEvent('marker'); }} aria-label={m.tip} aria-pressed={sel === m.id}>
            {m.n}{week === 'next' && m.id === 'climbing' && <em>+1</em>}
          </button>
        ))}
      </div>
      <p className="fl-tip" style={tipLeft ? { right: VIEW - v.marker[0] + 18, top: v.marker[1] - 12 } : { left: v.marker[0] + 18, top: v.marker[1] - 12 }}>
        {week === 'next' && v.id === 'climbing' ? 'Rock Climbing · +1 module' : v.tip}
      </p>
      <section className="fl-vcard" style={at(12, 628, 378, 146)} aria-live="polite" key={v.id}>
        <img src={`${IMG}/thumb-${v.id}.webp`} alt="" width={64} height={64} />
        <b>{v.name}</b>
        <span className="fl-vcard-meta">{v.cardMeta}</span>
        <span className="fl-vcard-state"><Badge v={v} />{v.next}</span>
        {v.insight && <p className="fl-vcard-ai" data-strong={week === 'next' || undefined}><Spark />{v.insight}</p>}
        <button type="button" className="fl-btn fl-btn-accent" onClick={() => onSlots(v)} data-tour="fl-see-slots">{v.status === 'open' ? 'Walk in' : 'See slots'}</button>
      </section>
      <div className="fl-pager" style={at(168, 792)} aria-hidden>{VENUES.map((m) => <i key={m.id} data-on={m.id === sel || undefined} />)}</div>
      <i className="fl-homebar" aria-hidden />
    </div>
  );
}

// ---------------------------------------------------------------- venue sheet
function VenueSheet({ onClose, onBook, onEvent }: { onClose: () => void; onBook: (b: Booking) => void; onEvent: (e: string) => void }) {
  const [day, setDay] = useState(0);
  const [start, setStart] = useState('18:30');
  const [people, setPeople] = useState(1);
  const [coach, setCoach] = useState(false);
  const slots = slotsFor(day);
  const slot = slots.find((s) => s.start === start) ?? slots.find((s) => s.status !== 'waitlist')!;
  const end = addMinutes(slot.start, PRICE.minutes);
  const price = PRICE.session * people + (coach ? PRICE.coach : 0);
  const waiting = slot.status === 'waitlist';
  const d = DAYS[day];
  return (
    <div className="fl-sheet-layer">
      <button type="button" className="fl-scrim" onClick={onClose} aria-label="Close" />
      <section className="fl-sheet" role="dialog" aria-modal="true" aria-label="Rock Climbing Hall — pick a session">
        <i className="fl-grabber" aria-hidden />
        <div className="fl-photo" style={at(24, 26, 354, 150)}>
          <img src={`${IMG}/venue-climbing.webp`} alt="Bouldering wall in a glazed module above the city" width={354} height={150} />
          <span className="fl-kicker fl-kicker-m">MODULES B2–B4 · 3 × 5 M</span>
          <button type="button" onClick={onClose} aria-label="Close"><Stroke d={PATH.close} size={14} /></button>
        </div>
        <h2 className="fl-display" style={{ ...at(24, 190), fontSize: 22, lineHeight: '26px' }}>Rock Climbing Hall</h2>
        <p className="fl-sheet-sub" style={at(24, 222)}><span className="fl-cn" lang="zh">攀岩馆</span> · Sports Island · Bouldering Lv 1–7 · max 12 / slot</p>
        <div className="fl-days" style={at(24, 252)} role="group" aria-label="Day" data-tour="fl-days">
          {DAYS.map((x, i) => (
            <button key={x.day} type="button" aria-pressed={i === day} onClick={() => { setDay(i); const s = slotsFor(i); if (s.find((k) => k.start === start)?.status === 'waitlist') setStart(s.find((k) => k.status === 'free')!.start); }}>
              <span>{x.dow}</span><b>{x.day}</b><i data-dot={x.dot} aria-hidden />
            </button>
          ))}
        </div>
        <p className="fl-sessions" style={at(24, 330, 354)}><b>Sessions · 1 h 30 min</b><span><i data-dot="free" />Free<i data-dot="few" />Few<i data-dot="wait" />Waitlist</span></p>
        <div className="fl-slots" style={at(24, 358, 354)} role="group" aria-label="Session" data-tour="fl-slots">
          {slots.map((s) => (
            <button key={s.start} type="button" data-status={s.status} aria-pressed={s.start === slot.start} onClick={() => { setStart(s.start); onEvent('slot'); }}>
              <b>{s.start}</b><span>{s.status === 'waitlist' ? 'Waitlist' : `${s.left} left`}</span>
            </button>
          ))}
        </div>
        <div className="fl-options" style={at(24, 558, 354, 104)}>
          <p><span>People</span>
            <span className="fl-stepper">
              <button type="button" onClick={() => setPeople((p) => Math.max(1, p - 1))} aria-label="Fewer people">–</button>
              <output aria-live="polite">{people}</output>
              <button type="button" onClick={() => setPeople((p) => Math.min(4, p + 1))} aria-label="More people">+</button>
            </span>
          </p>
          <p><span>Add coach <small>Jesus M. · +MOP {PRICE.coach}</small></span>
            <button type="button" role="switch" aria-checked={coach} className="fl-switch" onClick={() => setCoach((c) => !c)} aria-label="Add coach"><i /></button>
          </p>
        </div>
        <footer className="fl-sheet-foot">
          <p><b>{d.dow[0] + d.dow.slice(1).toLowerCase()} {d.day} · {slot.start}–{end}</b><span>MOP {price} · {people} {people === 1 ? 'person' : 'people'}{coach ? ' · coach' : ''}</span>
            <em>{waiting ? 'You only pay if a place frees up' : `Free cancel until ${addMinutes(slot.start, -120)}`}</em></p>
          <button type="button" className="fl-btn fl-btn-accent fl-btn-l" data-tour="fl-book"
            onClick={() => onBook({
              island: 'Sports Island', venue: 'Rock Climbing Hall', date: d.long, time: `${slot.start}–${end}`, module: 'B3 · gate 2',
              people: `${people} · ${coach ? 'with coach' : 'no coach'}`, gate: 'gate 2', opens: addMinutes(slot.start, -10), heldUntil: addMinutes(slot.start, 10), climbers: people,
            })}>
            {waiting ? 'Join waitlist' : `Book · MOP ${price}`}
          </button>
        </footer>
        <i className="fl-homebar" aria-hidden />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- booked
function Booked({ b, onDone, onView, onToast }: { b: Booking; onDone: () => void; onView: () => void; onToast: (s: string) => void }) {
  const booked = 20 + (b.climbers ?? 0);
  const away = Math.max(0, 24 - booked);
  const rows: [string, string][] = [['ISLAND', b.island], ['VENUE', b.venue], ['DATE', b.date], ['TIME', b.time], ['MODULE', b.module], ['PEOPLE', b.people]];
  return (
    <div className="fl-screen fl-enter">
      <StatusBar />
      <button type="button" className="fl-done" style={at(337, 64)} onClick={onDone}>Done</button>
      <i className="fl-check" style={at(24, 100, 56, 56)} aria-hidden><Stroke d={PATH.check} size={26} w={2.4} color="#141414" /></i>
      <h1 className="fl-display" style={{ ...at(24, 170), fontSize: 30, lineHeight: '36px' }}>You&apos;re booked.</h1>
      <p className="fl-sheet-sub" style={{ ...at(24, 212), fontSize: 14 }}><span className="fl-cn" lang="zh">已预约</span> · spot held until {b.heldUntil}</p>
      <section className="fl-ticket" style={at(24, 250, 354, 316)}>
        <dl>{rows.map(([k, v]) => <div key={k}><dt className="fl-kicker fl-kicker-m">{k}</dt><dd>{v}</dd></div>)}</dl>
        <i className="fl-notch" /><i className="fl-notch fl-notch-r" /><hr />
        <img src={`${IMG}/qr.png`} alt="Entry QR code (demo)" width={104} height={104} />
        <p><b>Scan at {b.gate}</b><span>or tap your phone on the NFC reader at the module door.</span><em className="fl-kicker fl-kicker-m">OPENS {b.opens}</em></p>
      </section>
      {b.climbers !== undefined && (
        <section className="fl-impact" style={at(24, 584, 354, 156)} data-tour="fl-impact">
          <p className="fl-kicker fl-kicker-m">YOUR BOOKING SHAPES NEXT WEEK</p>
          <b>{away > 0 ? `Climbing is ${away} ${away === 1 ? 'booking' : 'bookings'} away from a 3rd module next Monday.` : 'That did it: climbing gets a 3rd module next Monday.'}</b>
          <i className="fl-progress"><i style={{ width: `${Math.min(100, (booked / 24) * 100)}%` }} /></i>
          <p className="fl-impact-scale"><span className="fl-kicker fl-kicker-m">{booked} BOOKED</span><span className="fl-kicker fl-kicker-m">24 → +1 MODULE</span></p>
          <small>Layout locks Fri 18:00 · staff reconfigure Sat 08–12</small>
        </section>
      )}
      <button type="button" className="fl-btn fl-btn-l" style={at(24, 760, 170)} onClick={() => onToast('Calendar export is not wired in this prototype.')}>Add to calendar</button>
      <button type="button" className="fl-btn fl-btn-dark fl-btn-l" style={at(208, 760, 170)} onClick={onView}>View booking</button>
      <i className="fl-homebar" aria-hidden />
    </div>
  );
}

// ---------------------------------------------------------------- ask (AI)
function Ask({ onBack, onHold, onToast, onMap }: { onBack: () => void; onHold: (b: Booking) => void; onToast: (s: string) => void; onMap: () => void }) {
  const [typed, setTyped] = useState(reduced() ? ASK.query.length : 0);
  useEffect(() => {
    if (typed >= ASK.query.length) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 26);
    return () => window.clearTimeout(id);
  }, [typed]);
  const ready = typed >= ASK.query.length;
  const hold = (id: string) => {
    if (id === 'wait') return onToast('You’re on the waitlist. It books itself if a place frees up.');
    const flex = id === 'flex';
    onHold({
      island: flex ? 'Sports Island' : 'Plaza Island', venue: flex ? 'Flex Court A' : 'Plaza Court 1', date: 'Sat 26 Oct', time: flex ? '20:00–21:30' : '19:30–21:00',
      module: flex ? 'L3 · court A' : 'Ground · court 1', people: '2 · no coach', gate: flex ? 'the L3 door' : 'the court gate', opens: flex ? '19:50' : '19:20', heldUntil: flex ? '20:10' : '19:40',
    });
  };
  return (
    <div className="fl-screen fl-enter">
      <StatusBar />
      <BackButton onClick={onBack} />
      <p className="fl-askfield" style={at(72, 58, 310, 44)}><Spark />{ASK.query.slice(0, typed)}{!ready && <i className="fl-caret" aria-hidden />}</p>
      <div className="fl-ask-body" data-ready={ready || undefined} aria-busy={!ready}>
        <p className="fl-kicker fl-kicker-m" style={at(24, 122)}>UNDERSTOOD AS</p>
        <button type="button" className="fl-link-accent" style={at(354, 118)} onClick={() => onToast('Editing the understood request chip by chip is not wired in this prototype.')}>Edit</button>
        <div className="fl-intent" style={at(24, 140)} data-tour="fl-intent">{ASK.chips.map((c) => <span key={c}>{c}</span>)}</div>
        <h2 className="fl-h2" style={at(24, 190)}>Three ways to play tonight</h2>
        <ul className="fl-options-list" style={at(24, 222, 354)} data-tour="fl-ask-options">
          {ASK.options.map((o, i) => (
            <li key={o.id} data-best={o.best || undefined} style={{ '--i': i } as CSSProperties}>
              <b>{o.title}</b>{o.best && <em>Best match</em>}
              <span>{o.where}</span>
              <strong>{o.time}</strong>
              <p><Spark />{o.why}</p>
              <button type="button" className={`fl-btn ${o.best ? 'fl-btn-accent' : ''}`} onClick={() => hold(o.id)} data-tour={o.best ? 'fl-hold' : undefined}>{o.action}</button>
            </li>
          ))}
        </ul>
        <p className="fl-sub" style={at(24, 656)}>Ranked by walk time, crowding and price.</p>
        <button type="button" className="fl-link" style={at(24, 678)} onClick={onMap}>Browse the map instead</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- swap offer (AI)
function Swap({ onBack, onToast, onEvent }: { onBack: () => void; onToast: (s: string) => void; onEvent: (e: string) => void }) {
  const [answer, setAnswer] = useState<null | 'swap' | 'keep' | 'cancel'>(null);
  const choose = (a: 'swap' | 'keep' | 'cancel') => { setAnswer(a); onEvent('swap'); };
  const done = { swap: 'Swapped to Flex Court A, 15:00', keep: 'Kept Plaza · Court 1, now 16:30', cancel: 'Cancelled · MOP 40 refunded' };
  return (
    <div className="fl-screen fl-enter">
      <StatusBar />
      <BackButton onClick={onBack} />
      <p className="fl-kicker fl-kicker-m" style={at(72, 60)}>BOOKINGS / SAT 14 NOV</p>
      <h1 className="fl-display" style={{ ...at(72, 74), fontSize: 21, lineHeight: '25px' }}>Layout change</h1>
      <section className="fl-notice" style={at(24, 120, 354, 116)}>
        <p className="fl-kicker fl-kicker-m">YOUR BOOKING IS AFFECTED</p>
        <b>Plaza Court 2 is closed Sat 14:00–22:00 for the Winter Night Market.</b>
        <span>Approved layout B · 9 bookings moved</span>
      </section>
      <h2 className="fl-h2" style={{ ...at(24, 256), fontSize: 15 }}>Best swap</h2>
      <section className="fl-offer" style={at(24, 282, 354, 176)} data-tour="fl-offer">
        <b>Flex Court A · Sports Island</b>
        <span>Sat 15:00–16:30 · same time · same price</span>
        <p><Spark />Same sport and time, 4 min further along the ring.</p>
        {answer ? (
          <p className="fl-answer" role="status"><i aria-hidden><Stroke d="M4 9.5L7.5 13L14 5.5" /></i>{done[answer]}<button type="button" className="fl-link" onClick={() => setAnswer(null)}>Undo</button></p>
        ) : (
          <div>
            <button type="button" className="fl-btn fl-btn-accent" onClick={() => choose('swap')} data-tour="fl-accept">Accept swap</button>
            <button type="button" className="fl-btn" onClick={() => onToast('Other times are not wired in this prototype.')}>Other times</button>
          </div>
        )}
      </section>
      <p className="fl-kicker fl-kicker-m" style={at(24, 480)}>OR</p>
      <ul className="fl-alts" style={at(24, 500, 354)}>
        <li><button type="button" onClick={() => choose('keep')} disabled={!!answer}>Keep Plaza · Court 1 at 16:30<Stroke d={PATH.chevron} size={16} w={1.6} color="#9a9a9a" /></button></li>
        <li><button type="button" onClick={() => choose('cancel')} disabled={!!answer}>Cancel and refund MOP 40<Stroke d={PATH.chevron} size={16} w={1.6} color="#9a9a9a" /></button></li>
      </ul>
      <p className="fl-sub" style={at(24, 624, 354)}>Nothing changes until you choose. Unanswered swaps are refunded when the layout locks, Friday 18:00.</p>
    </div>
  );
}

// ---------------------------------------------------------------- app
export const FloatopiaPrototype = forwardRef<PrototypeHandle, Props>(function FloatopiaPrototype({ onEvent }, handle) {
  const [screen, setScreen] = useState<Screen>('home');
  const [zooming, setZooming] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const emit = (e: string) => onEvent?.(e);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const go = (s: Screen) => { setSheet(false); setZooming(false); setScreen(s); };
  const demoBooking: Booking = { island: 'Sports Island', venue: 'Rock Climbing Hall', date: 'Sat 26 Oct', time: '18:30–20:00', module: 'B3 · gate 2', people: '1 · no coach', gate: 'gate 2', opens: '18:20', heldUntil: '18:40', climbers: 1 };

  useImperativeHandle(handle, () => ({
    goto(scene) {
      timers.current.forEach(clearTimeout);
      setToast(null);
      if (scene === 'sheet') { setZooming(false); setScreen('exploded'); setSheet(true); return; }
      if (scene === 'booked') setBooking(demoBooking);
      go(scene as Screen);
    },
  }));

  const openIsland = () => {
    emit('island');
    if (reduced()) return go('island');
    setZooming(true);
    later(() => go('island'), 520);
  };
  const openVenue = (v: Venue) => {
    if (v.id === 'climbing') { setSheet(true); emit('sheet'); }
    else if (v.status === 'open') setToast('Elevated Runway is open 06:00–23:00. No booking needed.');
    else setToast(`Booking is built for Rock Climbing Hall in this prototype. ${v.name} uses the same sheet.`);
  };
  const tab: Tab = screen === 'swap' ? 'bookings' : 'explore';
  const onTab = (t: Tab) => {
    if (t === 'explore') go('home');
    else if (t === 'bookings') { go('swap'); emit('bookings'); }
    else setToast('Profile is outside this prototype.');
  };
  const withTabs = screen === 'home' || screen === 'island' || screen === 'ask' || screen === 'swap';

  return (
    <div className="fl-root" data-screen={screen}>
      {screen === 'home' && <Home zooming={zooming} onIsland={openIsland} onOther={(n) => setToast(`${n} is on the map. Sports Island is the one built out in this prototype.`)} onAsk={() => { go('ask'); emit('ask'); }} onPan={() => emit('pan')} />}
      {screen === 'island' && <IslandScreen onBack={() => go('home')} onExpand={() => { go('exploded'); emit('expand'); }} onVenue={openVenue} />}
      {screen === 'exploded' && <Exploded onCollapse={() => go('island')} onSlots={openVenue} onEvent={emit} />}
      {screen === 'booked' && booking && <Booked b={booking} onDone={() => go('home')} onView={() => onTab('bookings')} onToast={setToast} />}
      {screen === 'ask' && <Ask onBack={() => go('home')} onHold={(b) => { setBooking(b); go('booked'); emit('hold'); }} onToast={setToast} onMap={() => go('home')} />}
      {screen === 'swap' && <Swap onBack={() => go('home')} onToast={setToast} onEvent={emit} />}
      {withTabs && <TabBar tab={tab} onTab={onTab} />}
      {sheet && <VenueSheet onClose={() => setSheet(false)} onEvent={emit} onBook={(b) => { setBooking(b); go('booked'); emit('book'); }} />}
      {toast && <p className="fl-toast" role="status">{toast}</p>}
    </div>
  );
});
