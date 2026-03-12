import { Header } from '@/components'
import { siteConfig } from '@/data/site'

export default function InfoPage() {
  return (
    <div className="w-screen min-h-screen bg-board-surface flex flex-col">
      <Header />

      <main className="flex-1 mx-9 mb-9 animate-fadeIn">
        <div className="bg-board-card border-[1.5px] border-[#B0B0B0] rounded-board p-8 shadow-card max-w-3xl">
          <h2 className="text-[32px] font-black tracking-tight font-display mb-6">
            About
          </h2>

          {siteConfig.bio.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.85] text-[#444] mb-4">
              {p}
            </p>
          ))}

          {/* Education */}
          <div className="mt-8 pt-6 border-t border-[#E0E0E0]">
            <h3 className="text-[13px] font-bold text-[#999] uppercase tracking-widest mb-4">
              Education
            </h3>
            <div className="flex gap-6">
              {siteConfig.education.map(edu => (
                <div key={edu.abbr} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                    <span className="text-white text-[12px] font-black font-display">
                      {edu.abbr}
                    </span>
                  </div>
                  <span className="text-[14px] font-medium text-[#333]">
                    {edu.full}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact - 你可以在这里加联系方式 */}
          <div className="mt-8 pt-6 border-t border-[#E0E0E0]">
            <h3 className="text-[13px] font-bold text-[#999] uppercase tracking-widest mb-4">
              Contact
            </h3>
            <p className="text-[14px] text-[#555]">
              {/* 替换成你的真实联系方式 */}
              zeyi.cheng@aalto.fi&nbsp;&nbsp;/&nbsp;&nbsp;+358 449503079
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
