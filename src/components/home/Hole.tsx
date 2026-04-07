export function Hole({ size = 14 }: { size?: number }) {
  return (
    <div
      className="flex-shrink-0 rounded-full border border-board-hole"
      style={{
        width: size,
        height: size * 1.6,
        borderRadius: size,
        background: '#F0EFED',
      }}
    />
  )
}

export function HoleRow({ count = 26, size = 14, gap = 14 }: {
  count?: number
  size?: number
  gap?: number
}) {
  return (
    <div className="flex justify-center px-2" style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Hole key={i} size={size} />
      ))}
    </div>
  )
}
