'use client'

function Bubble({ label }: { label: string }) {
  return (
    <div style={{
      width: '144px',
      height: '144px',
      borderRadius: '50%',
      border: '1.5px dashed #d1d5db',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{
        color: '#374151',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}>
        {label}
      </span>
    </div>
  )
}

export function ScopeDefining() {
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
          Section 03
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: 800,
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
          color: '#111827',
          marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Scope Defining
        </h2>

        {/* ── Two bubbles with connecting line ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
        }}>
          <Bubble label="Energy" />

          {/* Dashed connector line */}
          <div style={{
            width: 'clamp(48px, 8vw, 96px)',
            height: '1px',
            borderTop: '1.5px dashed #e5e7eb',
            flexShrink: 0,
          }} />

          <Bubble label="Alarm" />
        </div>

      </div>
    </section>
  )
}
