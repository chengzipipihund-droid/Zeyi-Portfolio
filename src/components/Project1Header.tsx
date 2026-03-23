'use client'

import Link from 'next/link'

// SVG viewBox: 1398 × 84
// Element x-positions (SVG units):
//   Back circle:   cx=28.5, r=27.5   → x 0–58
//   WORKs. + ∨:   x 109–272
//   INFO:          x 319–400
//   EXP.:          x 428–500
//   (right logos need no links)
const W = 1398

function x(px: number) {
  return `${(px / W) * 100}%`
}

export function Project1Header() {
  return (
    <header style={{ position: 'relative', width: '100%', display: 'block' }}>
      {/* Visual layer — the exact SVG design */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Heading Project1.svg"
        alt="Page header"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        draggable={false}
      />

      {/* Invisible interactive overlays — positions match SVG coordinates */}

      {/* Back button (blue circle, x 0–58) */}
      <Link
        href="/"
        aria-label="Back to works"
        style={{
          position: 'absolute',
          inset: '0',
          width: x(62),
          cursor: 'pointer',
        }}
      />

      {/* WORKs. + chevron (x 109–272) */}
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: x(100),
          width: x(178),
          cursor: 'pointer',
        }}
      />

      {/* INFO (x 319–400) */}
      <Link
        href="/info"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: x(310),
          width: x(100),
          cursor: 'pointer',
        }}
      />

      {/* EXP. (x 428–500) */}
      <Link
        href="/experience"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: x(418),
          width: x(90),
          cursor: 'pointer',
        }}
      />
    </header>
  )
}
