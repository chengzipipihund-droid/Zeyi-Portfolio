import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { projects, getProjectBySlug } from '@/data/projects'
import { ProjectHeader, Project1Header } from '@/components'
import { Project1Detail } from '@/components/Project1Detail'

// ssr:false — prevents SSR/client structural mismatch (hydration error)
const Project1TitleVideo = dynamic(
  () => import('@/components/Project1TitleVideo').then(m => ({ default: m.Project1TitleVideo })),
  { ssr: false }
)

const Project1AdvisoryIndex = dynamic(
  () => import('@/components/Project1AdvisoryIndex').then(m => ({ default: m.Project1AdvisoryIndex })),
  { ssr: false }
)

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
      <div style={{ background: 'white', minHeight: '100vh', padding: '0 20px' }}>
        <Project1Header />

        {/* Video — 100px below header */}
        <div style={{ marginTop: 'clamp(40px, 7vw, 100px)' }}>
          <Project1TitleVideo />
        </div>

        {/* AdvisoryIndex — 50px below video, 100px before detail */}
        <div style={{ marginTop: 'clamp(20px, 3.5vw, 50px)' }}>
          <Project1AdvisoryIndex />
        </div>

        {/* Project1Detail (zero-emission / alarm) — 100px below AdvisoryIndex */}
        <div id="project1-detail" style={{ marginTop: 'clamp(40px, 7vw, 100px)' }}>
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
