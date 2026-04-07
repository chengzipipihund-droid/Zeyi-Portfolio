'use client'

export function PersonaSection() {
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
          Section 02
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Persona
        </h2>

        {/* ── Persona card ── */}
        <div style={{
          maxWidth: '56rem',
          margin: '0 auto',
          minHeight: '320px',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          background: '#f9fafb',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>

          {/* Avatar — top-right */}
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* Simple person icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Placeholder */}
          <p style={{
            color: '#d1d5db',
            fontSize: '14px',
            fontStyle: 'italic',
          }}>
            Persona content to be added
          </p>

        </div>
      </div>
    </section>
  )
}
