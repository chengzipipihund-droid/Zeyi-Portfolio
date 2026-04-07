'use client'

const LINE = { stroke: 'rgba(0,0,0,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }

function Pill({ x, y, text, muted = false }: {
  x: number; y: number; text: string; muted?: boolean
}) {
  const w = 120, h = 32
  return (
    <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%', borderRadius: '999px',
        border: `1px solid ${muted ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)'}`,
        background: muted ? 'transparent' : '#f9fafb',
        color: muted ? '#d1d5db' : '#374151',
        fontSize: '12px', fontWeight: muted ? 400 : 500,
        fontFamily: '"DM Sans", sans-serif', whiteSpace: 'nowrap',
      }}>
        {text}
      </div>
    </foreignObject>
  )
}

function CircleNode({ cx, cy, r, label }: { cx: number; cy: number; r: number; label: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#f9fafb" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 4" />
      <foreignObject x={cx - r} y={cy - 12} width={r * 2} height={24}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#374151', fontSize: '14px', fontWeight: 500,
          fontFamily: '"DM Sans", sans-serif',
        }}>
          {label}
        </div>
      </foreignObject>
    </>
  )
}

function EnergyGroup() {
  const cx = 320, cy = 140, r = 52
  const nodes = [
    { x: 100, y: 60,  label: 'Deep-Sea'    },
    { x: 540, y: 60,  label: 'Open-Bridge' },
    { x: 540, y: 200, label: 'Kongsberg'   },
  ]
  return (
    <svg viewBox="0 0 640 280" style={{ width: '100%', overflow: 'visible' }}>
      {nodes.map(n => {
        const dx = n.x - cx, dy = n.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const sx = cx + (dx / dist) * r, sy = cy + (dy / dist) * r
        return <line key={n.label} x1={sx} y1={sy} x2={n.x} y2={n.y} {...LINE} />
      })}
      <CircleNode cx={cx} cy={cy} r={r} label="Energy" />
      {nodes.map(n => <Pill key={n.label} x={n.x} y={n.y} text={n.label} />)}
    </svg>
  )
}

function AlarmGroup() {
  const cx = 320, cy = 140, r = 52
  const nodes = [
    { x: 540, y: 80,  label: 'Others',    muted: false },
    { x: 540, y: 200, label: 'Wärtsilä?', muted: false },
    { x: 80,  y: 80,  label: '...',       muted: true  },
    { x: 80,  y: 200, label: '...',       muted: true  },
  ]
  return (
    <svg viewBox="0 0 640 280" style={{ width: '100%', overflow: 'visible' }}>
      {nodes.map(n => {
        const dx = n.x - cx, dy = n.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const sx = cx + (dx / dist) * r, sy = cy + (dy / dist) * r
        return <line key={n.label + n.x} x1={sx} y1={sy} x2={n.x} y2={n.y} {...LINE} />
      })}
      <CircleNode cx={cx} cy={cy} r={r} label="Alarm" />
      {nodes.map(n => <Pill key={n.label + n.x} x={n.x} y={n.y} text={n.label} muted={n.muted} />)}
    </svg>
  )
}

export function BenchmarkingSection() {
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
          Section 04
        </p>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800,
          fontStyle: 'italic', letterSpacing: '-0.02em',
          color: '#111827', marginBottom: 'clamp(40px, 6vw, 64px)',
        }}>
          Benchmarking
        </h2>

        <div style={{ marginBottom: 'clamp(48px, 8vw, 80px)' }}>
          <p style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#9ca3af', marginBottom: '24px',
          }}>Energy</p>
          <EnergyGroup />
        </div>

        <div style={{ height: 1, background: '#f3f4f6', marginBottom: 'clamp(48px, 8vw, 80px)' }} />

        <div>
          <p style={{
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#9ca3af', marginBottom: '24px',
          }}>Alarm</p>
          <AlarmGroup />
        </div>

      </div>
    </section>
  )
}
