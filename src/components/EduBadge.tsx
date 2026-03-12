import { siteConfig } from '@/data/site'

export function EduBadge() {
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl"
      style={{
        width: 80,
        height: 96,
        background: '#1A1A1A',
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
      }}
    >
      {/* Corner screw holes */}
      {[
        { top: 8, left: 8 },
        { top: 8, right: 8 },
        { bottom: 8, left: 8 },
        { bottom: 8, right: 8 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-[7px] h-[7px] rounded-full bg-[#333] border border-[#444]"
          style={pos}
        />
      ))}

      {siteConfig.education.map((edu) => (
        <span
          key={edu.abbr}
          className="text-white text-[16px] font-black font-display"
        >
          ({edu.abbr})
        </span>
      ))}
    </div>
  )
}
