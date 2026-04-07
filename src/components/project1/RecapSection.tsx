'use client'

export function RecapSection() {
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
          color: '#9ca3af',
          marginBottom: '8px',
        }}>
          Section 05
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Recap
        </h2>

        {/* ── Two cards ── */}
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          {['Energy', 'Alarm'].map((label) => (
            <div
              key={label}
              style={{
                flex: '1 1 260px',
                minHeight: '200px',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ color: '#d1d5db', fontSize: '14px', fontStyle: 'italic' }}>
                {label} recap
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
