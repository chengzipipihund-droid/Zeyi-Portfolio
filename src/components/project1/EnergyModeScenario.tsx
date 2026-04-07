'use client'

import { useState } from 'react'

const MODES = [
  {
    id: 'fullspeed',
    label: 'Full Speed',
    labelZh: '全速',
    color: '#C95023',
    colorLight: '#FAECE7',
    colorText: '#993C1D',
    file: 'User Scenario - Fullspeed.svg',
    trigger: '"We\'re going to miss the port window."',
    triggerZh: '「我们要误港了。」',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    labelZh: '混合',
    color: '#D0882B',
    colorLight: '#FAEEDA',
    colorText: '#854F0B',
    file: 'User Scenario - Hybrid.svg',
    trigger: '"Just another day at sea."',
    triggerZh: '「今天就是普通的一天。」',
  },
  {
    id: 'smartcruise',
    label: 'Smart Cruise',
    labelZh: '智能巡航',
    color: '#2968B6',
    colorLight: '#E6F1FB',
    colorText: '#185FA5',
    file: 'User Scenario - SmartNav.svg',
    trigger: '"Long haul. Battery\'s full. Smooth sailing."',
    triggerZh: '「长途航行，电量充足，前方平稳。」',
  },
  {
    id: 'eco',
    label: 'Eco Mode',
    labelZh: '节能模式',
    color: '#7CC237',
    colorLight: '#EAF3DE',
    colorText: '#3B6D11',
    file: 'User Scenario - Eco.svg',
    trigger: '"We\'re early — and heading into a restricted zone."',
    triggerZh: '「我们提前了，而且快进排放控制区了。」',
  },
]

const BASE_PATH = '/Project1/UserScenario/'

export function EnergyModeScenario({ className = '' }: { className?: string }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const activeMode = MODES.find((m) => m.id === hovered) ?? null

  return (
    <div
      className={className}
      style={{ fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif', width: '100%' }}
    >
      {/* ── Mode tabs ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', width: '90%', marginLeft: 0, marginRight: 'auto' }}>
        {MODES.map((mode) => {
          const isActive = hovered === mode.id
          return (
            <button
              key={mode.id}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 16px',
                border: `1.5px solid ${isActive ? mode.color : '#D1D0C8'}`,
                borderRadius: '10px',
                background: isActive ? mode.colorLight : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                minWidth: '130px',
                flex: '1 1 130px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: mode.color,
                  marginBottom: '6px',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? mode.colorText : '#3d3d3a',
                  lineHeight: 1.2,
                  marginBottom: '2px',
                  letterSpacing: '-0.01em',
                }}
              >
                {mode.label}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: isActive ? mode.colorText : '#888780',
                  opacity: isActive ? 0.85 : 1,
                  lineHeight: 1.3,
                }}
              >
                {mode.labelZh}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Trigger quote strip ── */}
      <div
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          marginBottom: '12px',
          transition: 'opacity 0.25s ease',
          opacity: activeMode ? 1 : 0,
          width: '90%',
          marginLeft: 0,
          marginRight: 'auto',
        }}
      >
        {activeMode && (
          <div style={{ borderLeft: `3px solid ${activeMode.color}`, paddingLeft: '12px' }}>
            <div
              style={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: activeMode.colorText,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {activeMode.trigger}
            </div>
            <div
              style={{ fontSize: '11px', color: activeMode.colorText, opacity: 0.75, marginTop: '2px' }}
            >
              {activeMode.triggerZh}
            </div>
          </div>
        )}
      </div>

      {/* ── Diagram ── */}
      <div
        style={{
          position: 'relative',
          width: '90%',
          marginLeft: 0,
          marginRight: 'auto',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#fff',
          border: '0.5px solid #D1D0C8',
          aspectRatio: '4439 / 2824',
        }}
      >
        {/* Base SVG — always visible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE_PATH}User Scenario 1.svg`}
          alt="Energy mode scenario overview"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
          draggable={false}
        />

        {/* Highlighted SVGs — each fades in on hover */}
        {MODES.map((mode) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={mode.id}
            src={`${BASE_PATH}${mode.file}`}
            alt={`${mode.label} scenario highlighted`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              opacity: hovered === mode.id ? 1 : 0,
              transition: 'opacity 0.28s ease',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        ))}

        {/* Invisible hover zones mapped to each mode's vertical band on the 4439×2824 canvas */}
        {MODES.map((mode, i) => {
          const topPct = ((490 + i * 610) / 2824) * 100
          const heightPct = (610 / 2824) * 100
          return (
            <div
              key={mode.id}
              onMouseEnter={() => setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: 0,
                top: `${topPct}%`,
                width: '100%',
                height: `${heightPct}%`,
                cursor: 'pointer',
                zIndex: 10,
              }}
              aria-label={`Hover to highlight ${mode.label} scenario`}
            />
          )
        })}
      </div>

    </div>
  )
}
