'use client'

import { useState } from 'react'

// SVG canvas dimensions
const SVG_W = 2960
const SVG_H = 10924

// Convert SVG pixel coordinates to CSS percentage strings
const px = (val: number, base: number) => `${(val / base * 100).toFixed(4)}%`

// ── Interactive element coordinates (from Project1-Overview.svg) ─────────────
// Button 1 — Zero-Emission Mode (active/blue):  x=591  y=4791  w=736  h=109  rx=28
// Button 2 — Alarm Listing Mode (inactive):     x=1648 y=4791  w=736  h=109  rx=28
// Screen placeholder area:                      x=72   y=4944  w=2831 h=1602
// ─────────────────────────────────────────────────────────────────────────────

const BTN = { y: 4791, w: 736, h: 109, rx: 28 }
const BTN1_X = 591
const BTN2_X = 1648
const SCREEN = { x: 72, y: 4944, w: 2831, h: 1602 }


const energySlides = [
  '/svg/Project1/Energy1.png',
  '/svg/Project1/Energy2.png',
  '/svg/Project1/Energy3.png',
  '/svg/Project1/Energy4.png',
]

const alarmPadSlides = [
  '/svg/Project1/Alarm-Pad-1.png',
  '/svg/Project1/Alarm-Pad-2.png',
  '/svg/Project1/Alarm-Pad-3.png',
  '/svg/Project1/Alarm-Pad-4.png',
]

const alarmPhoneSlides = [
  '/svg/Project1/Alarm-Phone-1.png',
  '/svg/Project1/Alarm-Phone-2.png',
  '/svg/Project1/Alarm-Phone-3.png',
]

function wrap(i: number, n: number) {
  return (i + n) % n
}

type Mode = 'energy' | 'alarm'

function Pager({
  index,
  total,
  onPrev,
  onNext,
}: {
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3%', flexShrink: 0 }}>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous"
        style={{
          width: '2.4em', height: '2.4em', borderRadius: '50%',
          border: '1.5px solid #B7C6D7', background: 'white', color: '#1E4F84',
          fontSize: 'clamp(14px, 1.6vw, 28px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >‹</button>

      <div style={{ display: 'flex', gap: '0.5em' }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{
            width: '0.55em', height: '0.55em', borderRadius: '50%', display: 'inline-block',
            background: i === index ? '#1E4F84' : '#C7D5E3',
          }} />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next"
        style={{
          width: '2.4em', height: '2.4em', borderRadius: '50%',
          border: '1.5px solid #B7C6D7', background: 'white', color: '#1E4F84',
          fontSize: 'clamp(14px, 1.6vw, 28px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >›</button>
    </div>
  )
}

export function Project1Detail() {
  const [mode, setMode] = useState<Mode>('energy')
  const [energyIdx, setEnergyIdx] = useState(0)
  const [padIdx, setPadIdx] = useState(0)
  const [phoneIdx, setPhoneIdx] = useState(0)

  // Common button style
  const btnStyle = (active: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: px(BTN.y, SVG_H),
    width: px(BTN.w, SVG_W),
    height: px(BTN.h, SVG_H),
    borderRadius: 'clamp(6px, 0.7vw, 12px)',
    border: '2px solid #1661AB',
    background: active ? '#1661AB' : 'white',
    color: active ? 'white' : '#1661AB',
    fontSize: 'clamp(10px, 1.35vw, 26px)',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.25s, color 0.25s',
  })

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${SVG_W} / ${SVG_H}` }}>

      {/* ── Background SVG ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/svg/Project1/Project1-Overview.svg"
        alt="Project 1 overview"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
        aria-hidden
      />

      {/* ── Button 1: Zero-Emission Mode ── */}
      <button type="button" onClick={() => setMode('energy')} style={{ ...btnStyle(mode === 'energy'), left: px(BTN1_X, SVG_W) }}>
        Zero-Emission Mode
      </button>

      {/* ── Button 2: Alarm Listing Mode ── */}
      <button type="button" onClick={() => setMode('alarm')} style={{ ...btnStyle(mode === 'alarm'), left: px(BTN2_X, SVG_W) }}>
        Alarm Listing Mode
      </button>

      {/* ── Screen area — always opaque, cross-fade content layers inside ── */}
      <div style={{
        position: 'absolute',
        left: px(SCREEN.x, SVG_W),
        top: px(SCREEN.y, SVG_H),
        width: px(SCREEN.w, SVG_W),
        height: px(SCREEN.h, SVG_H),
        background: '#D8D8D8',
        overflow: 'hidden',
      }}>

        {/* Energy layer */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: mode === 'energy' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: mode === 'energy' ? 'auto' : 'none',
          display: 'flex', flexDirection: 'column',
          padding: '2% 2.1% 1.5%', boxSizing: 'border-box',
        }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={energySlides[energyIdx]}
              alt={`Energy UI page ${energyIdx + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>
          <Pager
            index={energyIdx}
            total={energySlides.length}
            onPrev={() => setEnergyIdx(i => wrap(i - 1, energySlides.length))}
            onNext={() => setEnergyIdx(i => wrap(i + 1, energySlides.length))}
          />
        </div>

        {/* Alarm layer — phone col ~2.5× wider than before (58% vs 23%) */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: mode === 'alarm' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: mode === 'alarm' ? 'auto' : 'none',
          display: 'grid', gridTemplateColumns: '72.9% 23.3%', gap: '4%',
          padding: '2% 2.1% 1.5%', boxSizing: 'border-box',
        }}>
          {/* Tablet */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alarmPadSlides[padIdx]}
                alt={`Alarm pad UI page ${padIdx + 1}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
            <Pager
              index={padIdx}
              total={alarmPadSlides.length}
              onPrev={() => setPadIdx(i => wrap(i - 1, alarmPadSlides.length))}
              onNext={() => setPadIdx(i => wrap(i + 1, alarmPadSlides.length))}
            />
          </div>

          {/* Phone — 2× zoom via scale(2), overflow:hidden clips to column bounds */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={alarmPhoneSlides[phoneIdx]}
                alt={`Alarm phone UI page ${phoneIdx + 1}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', transform: 'scale(3.3)', transformOrigin: 'center center' }}
              />
            </div>
            <Pager
              index={phoneIdx}
              total={alarmPhoneSlides.length}
              onPrev={() => setPhoneIdx(i => wrap(i - 1, alarmPhoneSlides.length))}
              onNext={() => setPhoneIdx(i => wrap(i + 1, alarmPhoneSlides.length))}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
