'use client'

// Strictly based on Public/Project1/Title+Video.svg (viewBox: 1398 × 840)
//
// SVG measurements:
//   Title image:      /Project1/Title.png — replaces text, aligned to bar top/bottom
//   Vertical bar:     x=800–806, y=702–794  (h=92 = 10.95% of H, bottom 5.48%)
//   Subtitle:         x=827–1354, 28px, centered to bar
//
// Video: Cloudinary CDN

const W = 1398
const H = 840

const pw = (x: number) => `${((x / W) * 100).toFixed(3)}%`
const ph = (y: number) => `${((y / H) * 100).toFixed(3)}%`

const TAGS = [
  { label: 'Information Design', x: 783,     w: 257.35  },
  { label: 'Product Design',     x: 1061.6,  w: 193.575 },
  { label: 'UI / UX',           x: 1276.54, w: 101.457 },
]

const TAG_Y = 20
const TAG_H = 39

export function Project1TitleVideo() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 'clamp(12px, 2.15%, 30px)',
        overflow: 'hidden',
        background: '#111',
      }}
    >
      {/* ── Video ── */}
      {/* suppressHydrationWarning: video attributes (autoPlay/muted) differ SSR vs client */}
      <video
        autoPlay
        muted
        loop
        playsInline
        suppressHydrationWarning
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        <source
          src="https://res.cloudinary.com/dye5jmqez/video/upload/q_auto,f_auto/v1774235434/HeadVideo1_pkao8s.mp4"
          type="video/mp4"
        />
      </video>

      {/* ── Tag pills (upper-right) ── */}
      {TAGS.map(({ label, x, w }) => (
        <div
          key={label}
          style={{
            position: 'absolute',
            left: pw(x),
            top: ph(TAG_Y),
            width: pw(w),
            height: ph(TAG_H),
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.3)',
            border: '1.5px solid rgba(255,255,255,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 'clamp(9px, 1.3vw, 18px)',
            fontWeight: 500,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
          }}
        >
          {label}
        </div>
      ))}

      {/* ── Bottom row: reference container = bar region ──
          bottom: (840-794)/840 = 5.48%,  height: 92/840 = 10.95%
          Title image and subtitle use top:50%+translateY(-50%) to center.
          Bar spans top:0 → bottom:0 (full height of this container).          */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '5.48%',
          height: '10.95%',
        }}
      >
        {/* Title image — top & bottom aligned to bar (height: 100% of container) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Project1/Title.png"
          alt="CONFIO+"
          style={{
            position: 'absolute',
            left: pw(47),
            top: 0,
            bottom: 0,
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'left center',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Vertical bar — spans full height of container */}
        <div
          style={{
            position: 'absolute',
            left: pw(800),
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'white',
          }}
        />

        {/* Subtitle — centered vertically */}
        <div
          style={{
            position: 'absolute',
            left: pw(827),
            right: pw(44),
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.92)',
            fontSize: 'clamp(12px, 2vw, 28px)',
            fontWeight: 400,
            lineHeight: 1.35,
            letterSpacing: '0.005em',
          }}
        >
          An AI-driven maritime control interface &amp; lever operation optimization
        </div>
      </div>
    </div>
  )
}
