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
// Diagram5 overlay (right side):                x=1354 y=7232  w=1395 h=1045
// ─────────────────────────────────────────────────────────────────────────────

const BTN = { y: 4791, w: 736, h: 109, rx: 28 }
const BTN1_X = 591
const BTN2_X = 1648
const SCREEN = { x: 72, y: 4944, w: 2831, h: 1602 }

// Arrow button: diameter in SVG px, centered at given xCenter, at screen vertical midpoint
const AB = 96
const SC_MID_Y = SCREEN.y + SCREEN.h / 2  // 5745

// Alarm mode arrow x positions (all in SVG px)
// tablet col ends ≈2109; phone col: 2217–2849
const PAD_RIGHT_X    = 2040   // tablet right arrow (moved left of column edge)
const PHONE_LEFT_X   = 2200   // phone left arrow
const PHONE_RIGHT_X  = 2820   // phone right arrow (moved left of screen edge)

function arrowBtnStyle(xCenter: number): React.CSSProperties {
  return {
    position: 'absolute',
    left: px(xCenter - AB / 2, SVG_W),
    top: px(SC_MID_Y - AB / 2, SVG_H),
    width: px(AB, SVG_W),
    height: px(AB, SVG_H),
    borderRadius: '50%',
    border: '1.5px solid #B7C6D7',
    background: 'white',
    color: '#1E4F84',
    fontSize: 'clamp(18px, 2vw, 36px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    zIndex: 20,
  }
}

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

// Dot indicators — shown just below the screen, centered
function Dots({ index, total }: { index: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '0.45em', alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: '0.5em', height: '0.5em', borderRadius: '50%', display: 'inline-block',
          background: i === index ? '#1E4F84' : '#C7D5E3',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  )
}

export function Project1Detail() {
  const [mode, setMode] = useState<Mode>('energy')
  const [energyIdx, setEnergyIdx] = useState(0)
  const [padIdx, setPadIdx] = useState(0)
  const [phoneIdx, setPhoneIdx] = useState(0)

  const handleEnergyPrev = () => setEnergyIdx(i => wrap(i - 1, energySlides.length))
  const handleEnergyNext = () => setEnergyIdx(i => wrap(i + 1, energySlides.length))

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

  // Dot bar below screen — centered horizontally over screen, at a fixed y below screen bottom
  const dotsBarStyle: React.CSSProperties = {
    position: 'absolute',
    left: px(SCREEN.x, SVG_W),
    top: px(SCREEN.y + SCREEN.h + 28, SVG_H),
    width: px(SCREEN.w, SVG_W),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(10px, 1.2vw, 20px)',
    zIndex: 15,
  }

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

      {/* ── Screen area ── */}
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2% 2.1%', boxSizing: 'border-box',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={energySlides[energyIdx]}
            alt={`Energy UI page ${energyIdx + 1}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Alarm layer */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: mode === 'alarm' ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: mode === 'alarm' ? 'auto' : 'none',
          display: 'grid', gridTemplateColumns: '72.9% 23.3%', gap: '4%',
          padding: '2% 2.1%', boxSizing: 'border-box',
        }}>
          {/* Tablet */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={alarmPadSlides[padIdx]}
              alt={`Alarm pad UI page ${padIdx + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Phone — image only, arrows are outside the screen div below */}
          <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={alarmPhoneSlides[phoneIdx]}
              alt={`Alarm phone UI page ${phoneIdx + 1}`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', transform: 'scale(3.3)', transformOrigin: 'center center' }}
            />
          </div>
        </div>

      </div>

      {/* ── Energy mode: left + right arrows at screen edges ── */}
      {mode === 'energy' && <>
        <button type="button" onClick={handleEnergyPrev} aria-label="Previous"
          style={arrowBtnStyle(SCREEN.x)}>‹</button>
        <button type="button" onClick={handleEnergyNext} aria-label="Next"
          style={arrowBtnStyle(SCREEN.x + SCREEN.w)}>›</button>
      </>}

      {/* ── Alarm mode: pad arrows + phone arrows, all same size ── */}
      {mode === 'alarm' && <>
        {/* Pad prev */}
        <button type="button" onClick={() => setPadIdx(i => wrap(i - 1, alarmPadSlides.length))}
          aria-label="Pad previous" style={arrowBtnStyle(SCREEN.x)}>‹</button>
        {/* Pad next */}
        <button type="button" onClick={() => setPadIdx(i => wrap(i + 1, alarmPadSlides.length))}
          aria-label="Pad next" style={arrowBtnStyle(PAD_RIGHT_X)}>›</button>
        {/* Phone prev */}
        <button type="button" onClick={() => setPhoneIdx(i => wrap(i - 1, alarmPhoneSlides.length))}
          aria-label="Phone previous" style={arrowBtnStyle(PHONE_LEFT_X)}>‹</button>
        {/* Phone next */}
        <button type="button" onClick={() => setPhoneIdx(i => wrap(i + 1, alarmPhoneSlides.length))}
          aria-label="Phone next" style={arrowBtnStyle(PHONE_RIGHT_X)}>›</button>
      </>}

      {/* ── Dot indicators below screen ── */}
      <div style={dotsBarStyle}>
        {mode === 'energy'
          ? <Dots index={energyIdx} total={energySlides.length} />
          : <Dots index={padIdx} total={alarmPadSlides.length} />}
      </div>

      {/* ── Diagram5 overlay — white bg covers SVG's baked-in content at this position ── */}
      <div style={{
        position: 'absolute',
        left: px(1354, SVG_W),
        top: px(7232, SVG_H),
        width: px(1395, SVG_W),
        height: px(1045, SVG_H),
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/Project1/Diagram5.png"
          alt="Diagram 5"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    </div>
  )
}
