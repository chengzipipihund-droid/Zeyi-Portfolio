import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projects, getProjectBySlug } from '@/data/projects'
import { ProjectHeader } from '@/components'
import { Project1Detail } from '@/components/Project1Detail'

// Generate static params for all projects
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = getProjectBySlug(slug)

  if (!project) notFound()

  if (project.slug === 'beyond-visibility') {
    return (
      <div className="w-screen min-h-screen p-5" style={{ background: project.themeColor ?? '#1661AB' }}>
        <div className="flex flex-col overflow-hidden">
          <ProjectHeader
            title={project.name}
            themeColor={project.themeColor ?? '#1661AB'}
            logoPath={project.logoPath}
          />
          <Project1Detail />
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen min-h-screen p-5" style={{ background: project.themeColor ?? '#ECEAE4' }}>
      <div
        className="flex flex-col bg-white overflow-hidden"
        style={{
          border: '4px solid black',
          borderRadius: '2.2rem',
        }}
      >
        <ProjectHeader
          title={project.name}
          themeColor={project.themeColor ?? '#ECEAE4'}
          logoPath={project.logoPath}
        />
        <main className="flex-1 mx-9 mb-9 mt-8 animate-fadeIn">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-[#888] hover:text-black
                     transition-colors mb-6 font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Board
        </Link>

        {/* Project content area */}
        <div className="bg-board-card border-[1.5px] border-[#B0B0B0] rounded-board p-8 shadow-card">
          {/* Project header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-[13px] text-[#999] font-semibold">
                PROJECT {project.id}
              </span>
              <h2 className="text-[40px] font-black tracking-tight leading-tight mt-1 font-display">
                {project.name}
              </h2>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-8">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="bg-[#f0f0f0] text-[#555] text-[11px] font-semibold
                           px-3 py-1 rounded-full uppercase tracking-wide"
              >
                {tag.replace('-', ' ')}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-[15px] leading-[1.8] text-[#444] max-w-2xl mb-8">
            {project.description}
          </p>

          {/*
            ╔══════════════════════════════════════════════╗
            ║  在这里放你的项目详情内容                        ║
            ║  - 导入你的 SVG: <img src="/svg/xxx.svg" />   ║
            ║  - 项目图片: <img src="/images/projects/..." />║
            ║  - 或者用 Next.js Image 组件优化加载             ║
            ╚══════════════════════════════════════════════╝
          */}
          <div className="w-full h-[400px] rounded-xl bg-gradient-to-br from-[#f5f5f5] to-[#e8e8e8]
                          flex items-center justify-center text-[#bbb] text-[14px]">
            Project content — Coming Soon
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}
