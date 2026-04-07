'use client'

const ROWS = [
  { track: 'Energy', features: 'Flow Optimizer / Lever Positioning' },
  { track: 'Alarm',  features: 'Grouping / Advice'                  },
]

export function JTBDSection() {
  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(64px, 10vw, 96px) clamp(16px, 4vw, 64px)',
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>

        {/* ── Section title ── */}
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#6b7280',
          marginBottom: '8px',
        }}>
          Section 07
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          JTBD (Features)
        </h2>

        {/* ── Row list ── */}
        <div style={{ maxWidth: '40rem' }}>
          {ROWS.map(({ track, features }, i) => (
            /* TODO: expand to show feature detail / demo */
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 0',
                borderBottom: i < ROWS.length - 1
                  ? '1px solid #f3f4f6'
                  : 'none',
                cursor: 'pointer',
              }}
            >
              {/* Track label */}
              <span style={{
                flexShrink: 0,
                width: '72px',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                {track}
              </span>

              {/* Dashed connector line */}
              <div style={{
                flex: 1,
                height: 0,
                borderTop: '1px dashed #e5e7eb',
              }} />

              {/* Feature label */}
              <span style={{
                flexShrink: 0,
                color: '#6b7280',
                fontSize: '14px',
                textAlign: 'right',
              }}>
                {features}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
