'use client'

import type { CSSProperties, ReactNode } from 'react'

const NODE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 16px',
  borderRadius: '999px',
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#f3f4f6',
  color: '#374151',
  fontSize: '13px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const FINDING: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 14px',
  borderRadius: '999px',
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#2563eb',
  fontSize: '12px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
}

const METHOD: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '5px 14px',
  borderRadius: '999px',
  border: '1px solid rgba(0,0,0,0.08)',
  background: '#f9fafb',
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: 400,
  whiteSpace: 'nowrap',
}

function HLine({ width = 24 }: { width?: number }) {
  return (
    <div style={{ width, height: 1, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
  )
}

function Fork({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 0, top: '12px', bottom: '12px',
        width: 1, background: 'rgba(0,0,0,0.1)',
      }} />
      {children}
    </div>
  )
}

function Arm({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <div style={{ width: 20, height: 1, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
      {children}
    </div>
  )
}

function Track({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        <div style={{ ...NODE, flexShrink: 0 }}>{label}</div>
        <HLine width={20} />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  )
}

export function ResearchSection() {
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
          Section 01
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800,
          fontStyle: 'italic', letterSpacing: '-0.02em',
          color: '#111827', marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Research
        </h2>

        <div style={{
          display: 'flex', flexDirection: 'row',
          gap: 'clamp(32px, 6vw, 64px)', flexWrap: 'wrap',
          marginBottom: 'clamp(48px, 8vw, 80px)', alignItems: 'flex-start',
        }}>
          <Track label="User · Crew">
            <Fork>
              <Arm>
                <HLine width={16} />
                <div style={{ ...METHOD }}>Interview</div>
                <HLine width={16} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={FINDING}>Alarm / Info Load</div>
                  <div style={FINDING}>Communication Barrier</div>
                </div>
              </Arm>
              <Arm>
                <HLine width={16} />
                <div style={{ ...METHOD }}>Observation</div>
              </Arm>
            </Fork>
          </Track>

          <div style={{ width: 1, alignSelf: 'stretch', background: '#f3f4f6', flexShrink: 0 }} />

          <Track label="User · Company">
            <Fork>
              <Arm>
                <HLine width={16} />
                <div style={FINDING}>Sustainable Goal</div>
              </Arm>
              <Arm>
                <HLine width={16} />
                <div style={FINDING}>AI Implementing</div>
              </Arm>
            </Fork>
          </Track>
        </div>

        {/* Photo row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 'clamp(8px, 1.5vw, 16px)', marginBottom: '14px',
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: '4 / 3', borderRadius: '10px',
              background: '#f3f4f6', border: '1px solid #e5e7eb',
            }} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', letterSpacing: '0.02em' }}>
          Simulation Day · Vessel Visit
        </p>

      </div>
    </section>
  )
}
