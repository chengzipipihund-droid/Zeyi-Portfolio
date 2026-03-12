interface PegProps {
  color?: string
  className?: string
  style?: React.CSSProperties
}

/** Small metal peg that holds cards */
export function Peg({ color = '#D4D0C8', className = '', style }: PegProps) {
  return (
    <div
      className={`absolute z-10 rounded-full ${className}`}
      style={{
        width: 10,
        height: 10,
        background: color,
        border: '1.5px solid #AAA',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        ...style,
      }}
    />
  )
}

/** Decorative colored peg */
export function ColorPeg({ color, className = '', style }: PegProps) {
  return (
    <div
      className={`absolute z-[8] rounded-full ${className}`}
      style={{
        width: 16,
        height: 16,
        background: color,
        border: '2px solid rgba(0,0,0,0.08)',
        boxShadow: `0 2px 6px ${color}44, 0 1px 2px rgba(0,0,0,0.1)`,
        ...style,
      }}
    />
  )
}
