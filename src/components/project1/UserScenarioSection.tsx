'use client'

import { EnergyModeScenario } from './EnergyModeScenario'

const ROWS = [
  { track: 'Energy', detail: '4 Modes',      hasScenario: true  },
  { track: 'Alarm',  detail: 'Grouping',      hasScenario: false },
  { track: 'Alarm',  detail: 'Flow + Story',  hasScenario: false },
]

export function UserScenarioSection() {
  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(64px, 10vw, 96px) clamp(16px, 4vw, 64px)',
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>

        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px',
        }}>
          Section 06
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800,
          fontStyle: 'italic', letterSpacing: '-0.02em',
          color: '#111827', marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          User Scenario
        </h2>

        {/* Row list */}
        <div style={{ maxWidth: '32rem', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          {ROWS.map(({ track, detail }, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr',
              alignItems: 'center', padding: '12px 0',
              borderBottom: i < ROWS.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>
                {track}
              </span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                {detail}
              </span>
            </div>
          ))}
        </div>

        {/* Energy scenario diagram */}
        <EnergyModeScenario />

      </div>
    </section>
  )
}
