import { Header } from '@/components'

// 你可以把经历数据也提到 src/data/ 下单独管理
const experiences = [
  {
    period: '2024 — Present',
    role: 'Designer / PM',
    company: 'Your Company',
    description: 'AI implementation in Industrial Operating System & Digital Platform Optimization.',
  },
  {
    period: '2023 — 2024',
    role: 'Design Intern',
    company: 'Another Company',
    description: 'Brand design and product management.',
  },
  // 添加更多经历...
]

export default function ExperiencePage() {
  return (
    <div className="w-screen min-h-screen bg-board-surface flex flex-col">
      <Header />

      <main className="flex-1 mx-9 mb-9 animate-fadeIn">
        <div className="bg-board-card border-[1.5px] border-[#B0B0B0] rounded-board p-8 shadow-card max-w-3xl">
          <h2 className="text-[32px] font-black tracking-tight font-display mb-8">
            Experience
          </h2>

          <div className="flex flex-col gap-0">
            {experiences.map((exp, i) => (
              <div
                key={i}
                className={`py-5 ${i > 0 ? 'border-t border-[#E8E8E8]' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-[16px] font-bold text-black font-display">
                      {exp.role}
                    </h3>
                    <span className="text-[13px] text-[#888] font-medium">
                      {exp.company}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#999] font-medium tracking-wide whitespace-nowrap">
                    {exp.period}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.7] text-[#555] mt-1">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
