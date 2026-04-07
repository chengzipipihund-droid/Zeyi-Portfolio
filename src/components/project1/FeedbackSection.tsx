'use client'

const COLUMNS = ['Visitors', 'Users', 'Sponsor']

export function FeedbackSection() {
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
          Section 08
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Feedback
        </h2>

        {/* ── Three columns ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '32px',
        }}>
          {COLUMNS.map((col) => (
            <div key={col} style={{ textAlign: 'center' }}>
              {/* Accent line */}
              <div style={{
                width: '32px',
                height: '2px',
                background: '#e5e7eb',
                margin: '0 auto 16px',
              }} />

              {/* Column heading */}
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#374151',
                marginBottom: '12px',
              }}>
                {col}
              </p>

              {/* Placeholder */}
              <p style={{
                fontSize: '13px',
                color: '#d1d5db',
                fontStyle: 'italic',
                lineHeight: 1.6,
              }}>
                Feedback to be added
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
