'use client'

export function DevSection() {
  return (
    <section style={{
      background: '#ffffff',
      padding: 'clamp(64px, 10vw, 96px) clamp(16px, 4vw, 64px)',
    }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto' }}>

        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#9ca3af',
          marginBottom: '8px',
        }}>
          Section 09
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: '24px',
        }}>
          DEV
        </h2>

        <p style={{ fontSize: '14px', color: '#d1d5db', fontStyle: 'italic' }}>
          Development details coming soon.
        </p>

      </div>
    </section>
  )
}
