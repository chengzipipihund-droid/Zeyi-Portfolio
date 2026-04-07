'use client'

import { useEffect, useRef, useState } from 'react'

// AdvisoryIndex.svg — 1440 × 1138
// Three panels:
//   Left  (energy): x=37–435,  y=569–1100  → 2.6%–30.2% width
//   Center (main):  x=508–926, y=569–1100  → 35.3%–64.3% width
//   Right (alarm):  x=984–1382,y=569–1100  → 68.3%–96%   width
//
// Blue semicircle: center x=50%, y=68.3% (777/1138), radius=53.96% of width
// Scroll fade: white circle overlay fades IN as element scrolls past → semicircle disappears

const DETAIL_ID = 'project1-detail'

function scrollToDetail() {
  document.getElementById(DETAIL_ID)?.scrollIntoView({ behavior: 'smooth' })
}

// Clickable panel overlay — invisible, just a hit area
function PanelHit({ left, width, label }: { left: string; width: string; label: string }) {
  return (
    <div
      onClick={scrollToDetail}
      aria-label={`Go to ${label} section`}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && scrollToDetail()}
      style={{
        position: 'absolute',
        top: '50%',          // roughly y=569/1138
        left,
        width,
        height: '46.7%',    // 531/1138
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        zIndex: 2,
      }}
    />
  )
}

export function Project1AdvisoryIndex() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current) return
      const { top } = wrapRef.current.getBoundingClientRect()
      // Fade starts after ~4 scroll ticks (≈400px) past the element top, over the next 400px
      const progress = Math.max(0, Math.min(1, (-top - 400) / 400))
      setFade(progress)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
    >
      {/* ── Background SVG ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Project1/AdvisoryIndex.svg"
        alt="Advisory Index — energy and alarm overview"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        draggable={false}
      />

      {/* ── White circle overlay — covers the blue semicircle on scroll ──
          SVG semicircle: center x=50%, y=777/1138=68.3%, radius=777/1440=53.96% of width
          CSS: width=108% (2×radius), aspect-ratio 1/1, border-radius 50%              */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '68.28%',
          width: '108%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: 'white',
          transform: 'translate(-50%, -50%)',
          opacity: fade,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── Clickable panel: Left (energy) ── */}
      <PanelHit left="2.6%" width="27.7%" label="energy" />

      {/* ── Clickable panel: Right (alarm) ── */}
      <PanelHit left="68.3%" width="27.8%" label="alarm" />
    </div>
  )
}
