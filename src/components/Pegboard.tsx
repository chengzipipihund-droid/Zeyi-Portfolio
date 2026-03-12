'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Layout measurements from Overview.svg ────────────────────────────────
//
//  Board content area (below separator line): 3045 × 1718 px baseline
//  All left/top/width values are expressed as % of those baseline dims.
//
//  Source positions (board-relative, content-relative):
//   Tag 1 : x=155, y=127  w=495 h=271   → rows 0
//   Tag 2 : x=955, y=127  w=495 h=271
//   BioCard: x=1935, y=125 w=984 h=502
//   Tag 3 : x=155, y=719  w=495 h=271   → row 1
//   Tag 4 : x=956, y=719  w=495 h=271
//   EduBadge: x=1801, y=863 w=178 h=257
//   Tag 5 : x=151, y=1247 w=350 h=238   → row 2
//   Tag 6 : x=1099,y=1247 w=350 h=238
//   Tag 7 : x=1904,y=1246 w=350 h=238
//   Tag 8 : x=2600,y=1246 w=350 h=238
// ──────────────────────────────────────────────────────────────────────────

const W = 3045  // board width baseline
const H = 1718  // board content height baseline

const pct = (px: number, base: number) => `${(px / base * 100).toFixed(3)}%`

// Tags 1–4 have hover-state SVG replacements; 1 and 2 also have a detail info card
const HOVER_TAGS: Record<number, string> = {
  1: '/svg/HoverTags/1.svg',
  2: '/svg/HoverTags/2.svg',
  3: '/svg/HoverTags/3.svg',
  4: '/svg/HoverTags/4.svg',
}

// Detail info bars — positioned to the RIGHT of their parent tag (tag right edge + gap)
const DETAIL_CARDS: Record<number, { x: number; y: number; w: number }> = {
  1: { x: 665,  y: 127, w: 1909 },  // Tag 1 right edge ≈ 650,  +15 gap
  2: { x: 1465, y: 127, w: 1314 },  // Tag 2 right edge ≈ 1450, +15 gap
  4: { x: 1466, y: 719, w: 1514 },  // Tag 4 right edge ≈ 1451, +15 gap
}

// Project cards (each wraps an SVG image in a Link)
const CARDS = [
  { id: 1, slug: 'beyond-visibility',   svg: '/svg/Tags/1.svg', x: 155,  y: 127,  w: 495 },
  { id: 2, slug: 'floatopia',           svg: '/svg/Tags/2.svg', x: 955,  y: 127,  w: 495 },
  { id: 3, slug: 'land-of-snow',        svg: '/svg/Tags/3.svg', x: 155,  y: 719,  w: 495 },
  { id: 4, slug: 'atlas-of-unseen',     svg: '/svg/Tags/4.svg', x: 956,  y: 719,  w: 495 },
  { id: 5, slug: 'hydrogen-cycle',      svg: '/svg/Tags/5.svg', x: 151,  y: 1247, w: 350 },
  { id: 6, slug: 'photo-album',         svg: '/svg/Tags/6.svg', x: 1099, y: 1247, w: 350 },
  { id: 7, slug: 'architecture-works',  svg: '/svg/Tags/7.svg', x: 1904, y: 1246, w: 350 },
  { id: 8, slug: 'other-works',         svg: '/svg/Tags/8.svg', x: 2600, y: 1246, w: 350 },
]

// ─── SVG data-URI for the staggered pegboard slot pattern ─────────────────
//  Column pitch: 62px   Row pitch: 98px   Tile: 62 × 196px
//  → ~22-23 columns, 8 rows at 1440px viewport
//  Slot: 17 × 42, rx=7, centred in tile (x=22.5, y=28 for row A, y=126 for row B)
//  Row B is offset +31px horizontally for stagger

const SLOT_A = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='62' height='196'>` +
  `<rect x='22.5' y='28' width='17' height='42' rx='7' ` +
  `fill='none' stroke='black' stroke-width='1' stroke-opacity='0.18'/>` +
  `</svg>`
)

const SLOT_B = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='62' height='196'>` +
  `<rect x='22.5' y='126' width='17' height='42' rx='7' ` +
  `fill='none' stroke='black' stroke-width='1' stroke-opacity='0.18'/>` +
  `</svg>`
)

const HOLE_BG = {
  backgroundImage: `url("data:image/svg+xml,${SLOT_A}"), url("data:image/svg+xml,${SLOT_B}")`,
  backgroundSize: '62px 196px',
  backgroundPosition: '0px 0px, 31px 0px',
  backgroundRepeat: 'repeat',
}

export function Pegboard() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    // Board content — position:relative container with board-content aspect ratio
    <div className="relative flex-1 overflow-hidden" style={HOLE_BG}>
      {/*
        Inner wrapper preserves the 3045:1718 aspect ratio so that
        percentage-based absolute positions stay faithful to the SVG.
        At wide viewports the board fills the height; on narrow it shrinks.
      */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        {/* ── Project cards (Tags 1–8) ──────────────────────────────────── */}
        {CARDS.map(({ id, slug, svg, x, y, w }) => {
          const hoverSvg = HOVER_TAGS[id]
          const isHovered = hoveredCard === id
          return (
            <Link
              key={id}
              href={`/projects/${slug}`}
              className="absolute block transition-transform duration-200 hover:-translate-y-0.5 hover:drop-shadow-xl"
              style={{ left: pct(x, W), top: pct(y, H), width: pct(w, W) }}
              onMouseEnter={() => hoverSvg && setHoveredCard(id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={isHovered && hoverSvg ? hoverSvg : svg}
                alt={`Project ${id}`}
                className="w-full h-auto block"
                draggable={false}
              />
            </Link>
          )
        })}

        {/* ── Detail info bars (Tags 1, 2 & 4) — float in on hover ────────── */}
        {([1, 2, 4] as const).map(id => {
          const pos = DETAIL_CARDS[id]
          const isHovered = hoveredCard === id
          return (
            <div
              key={`detail-${id}`}
              className="absolute pointer-events-none"
              style={{
                left: pct(pos.x, W),
                top: pct(pos.y, H),
                width: pct(pos.w, W),
                zIndex: 20,
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.22s ease, transform 0.22s ease',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/svg/HoverTags/${id}-card.svg`} alt="" className="w-full h-auto block" draggable={false} />
            </div>
          )
        })}

        {/* ── BioCard ────────────────────────────────────────────────────── */}
        <div
          className="absolute"
          style={{ left: pct(1935, W), top: pct(125, H), width: pct(984, W) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/Tags/BioCard.svg" alt="Bio" className="w-full h-auto block" draggable={false} />
        </div>

        {/* ── EduBadge ───────────────────────────────────────────────────── */}
        <div
          className="absolute"
          style={{ left: pct(1801, W), top: pct(863, H), width: pct(178, W) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/Tags/EduBadge.svg" alt="Education" className="w-full h-auto block" draggable={false} />
        </div>

        {/* ── Decorative tools — positions traced from Overview.svg ─────── */}
        {/*
          All positions derived from Overview.svg by matching unique path/rect
          coordinates in each tool SVG to their counterparts in Overview.
          Content coords = Overview coords − (62, 439).
        */}

        {/* ruler — 676×263, placed between card rows 0 and 1 (left-center) */}
        <div className="absolute" style={{ left: pct(388, W), top: pct(451, H), width: pct(676, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/ruler.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>

        {/* pliers — 221×496, tall portrait, middle-left of board */}
        <div className="absolute" style={{ left: pct(712, W), top: pct(958, H), width: pct(221, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/pliers.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>

        {/* tape measure — 166×150, lower-left area */}
        <div className="absolute" style={{ left: pct(184, W), top: pct(1094, H), width: pct(166, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/tape measure.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>

        {/* wrench — 346×394, lower-center area */}
        <div className="absolute" style={{ left: pct(1521, W), top: pct(1388, H), width: pct(346, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/wrench.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>

        {/* screwdriver — 436×73, right area, upper instance */}
        <div className="absolute" style={{ left: pct(2476, W), top: pct(840, H), width: pct(436, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/screwdriver.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>

        {/* screwdriver — 436×73, right area, lower instance */}
        <div className="absolute" style={{ left: pct(2275, W), top: pct(1026, H), width: pct(436, W) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/svg/screwdriver.svg" alt="" className="w-full h-auto block" draggable={false} />
        </div>
      </div>
    </div>
  )
}
