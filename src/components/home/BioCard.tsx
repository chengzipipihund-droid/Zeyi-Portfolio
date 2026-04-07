import { Peg } from './Peg'
import { siteConfig } from '@/data/site'

export function BioCard() {
  return (
    <div className="relative bg-board-card border-[1.5px] border-[#B0B0B0] rounded-card p-4 shadow-card">
      {/* Two pegs at top */}
      <Peg style={{ top: -5, left: 14 }} />
      <Peg style={{ top: -5, right: 14 }} />

      {/* Decorative dots */}
      <div className="flex justify-between mb-3 border-b border-[#D0D0D0] pb-2.5">
        <div className="w-[5px] h-[5px] rounded-full bg-black" />
        <div className="w-[5px] h-[5px] rounded-full bg-black" />
      </div>

      {/* Bio text */}
      {siteConfig.bio.map((paragraph, i) => (
        <p
          key={i}
          className="text-[12.5px] leading-[1.75] text-[#444] font-normal text-justify"
          style={{ margin: i < siteConfig.bio.length - 1 ? '0 0 10px' : 0 }}
        >
          {paragraph}
        </p>
      ))}
    </div>
  )
}
