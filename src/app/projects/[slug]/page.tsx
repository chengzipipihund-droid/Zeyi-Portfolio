// Page structure: Video → Research → Persona → Scope → Benchmarking → Recap → Scenario → JTBD → Feedback → DEV

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { projects, getProjectBySlug } from '@/data/projects'
import { ProjectHeader, Project1Header } from '@/components'
import { ArchitecturePdfViewer } from '@/components/project7/ArchitecturePdfViewer'
import { ResearchSection } from '@/components/project1/ResearchSection'
import { PersonaSection } from '@/components/project1/PersonaSection'
import { ScopeDefining } from '@/components/project1/ScopeDefining'
import { BenchmarkingSection } from '@/components/project1/BenchmarkingSection'
import { RecapSection } from '@/components/project1/RecapSection'
import { UserScenarioSection } from '@/components/project1/UserScenarioSection'
import { JTBDSection } from '@/components/project1/JTBDSection'
import { FeedbackSection } from '@/components/project1/FeedbackSection'
import { DevSection } from '@/components/project1/DevSection'

// ssr:false — prevents SSR/client structural mismatch (hydration error)
const Project1TitleVideo = dynamic(
  () => import('@/components/project1/Project1TitleVideo').then(m => ({ default: m.Project1TitleVideo })),
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

  if (project.slug === 'atlas-of-unseen') {
    return (
      <div style={{ background: '#ECEAE4', minHeight: '100vh', padding: 'clamp(12px, 2vw, 20px)' }}>
        <div style={{ background: 'white', border: '4px solid black', borderRadius: '2.2rem', overflow: 'hidden' }}>
          <ProjectHeader title="Atlas of Unseen" themeColor="#ECEAE4" />
          <main style={{ padding: 'clamp(24px, 4vw, 52px)' }}>

            {/* Back link */}
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: '#888', textDecoration: 'none',
                fontWeight: 500, marginBottom: '40px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Board
            </Link>

            {/* Project identity */}
            <div style={{ marginBottom: '40px' }}>
              <span style={{
                fontSize: '11px', color: '#999', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                PROJECT 04
              </span>
              <h1 style={{
                fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900,
                fontStyle: 'italic', letterSpacing: '-0.02em',
                lineHeight: 1.05, margin: '6px 0 18px',
              }}>
                Atlas of Unseen
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {project.tags.map(tag => (
                  <span key={tag} style={{
                    background: '#f0f0f0', color: '#555', fontSize: '11px',
                    fontWeight: 600, padding: '4px 12px', borderRadius: '999px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Volume note + Video */}
            <div style={{ marginBottom: '56px' }}>
              <p style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', color: '#555', marginBottom: '14px',
                background: '#f5f4f0', border: '1px solid #e0ddd8',
                padding: '8px 16px', borderRadius: '99px', fontWeight: 500,
              }}>
                🔊 Please turn on the volume when you watch it!
              </p>
              <video
                src="https://res.cloudinary.com/dye5jmqez/video/upload/v1774371408/%E5%BA%8F%E5%88%97_01_2_dfwsuc.mp4"
                controls
                playsInline
                style={{ width: '100%', borderRadius: '16px', display: 'block' }}
              />
            </div>

            {/* Two-column text sections */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '40px',
              marginBottom: '64px',
            }}>
              <div>
                <h3 style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: '#111', marginBottom: '14px',
                  paddingBottom: '10px', borderBottom: '1.5px solid #e0ddd8',
                }}>
                  User-Centric Research
                </h3>
                <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444' }}>
                  Spearheaded field research and conducted 25 in-depth interviews to uncover unmet
                  needs and behavioral patterns of &ldquo;informal&rdquo; urban space utilization
                  in high-density areas.
                </p>
              </div>
              <div>
                <h3 style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: '#111', marginBottom: '14px',
                  paddingBottom: '10px', borderBottom: '1.5px solid #e0ddd8',
                }}>
                  End-to-End Product Design
                </h3>
                <p style={{ fontSize: '15px', lineHeight: 1.85, color: '#444' }}>
                  Structured a comprehensive Information Architecture (IA) and designed a
                  high-fidelity mobile app UI, successfully transforming abstract urban data
                  into an intuitive, accessible digital solution.
                </p>
              </div>
            </div>

            {/* Main visual output */}
            <div style={{ marginBottom: '40px' }}>
              <p style={{
                fontSize: '10px', color: '#aaa', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px',
              }}>
                Visual Output
              </p>
              <img
                src="/Project4/Visual.jpg"
                alt="Atlas of Unseen — Visual Output"
                style={{ width: '100%', borderRadius: '14px', display: 'block' }}
              />
            </div>

            {/* Process image */}
            <div style={{ marginBottom: '12px' }}>
              <p style={{
                fontSize: '10px', color: '#aaa', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px',
              }}>
                Process
              </p>
              <img
                src="/Project4/image.png"
                alt="Atlas of Unseen — Process"
                style={{ width: '100%', borderRadius: '14px', display: 'block' }}
              />
            </div>

          </main>
        </div>
      </div>
    )
  }

  if (project.slug === 'architecture-works') {
    return (
      <div style={{ background: '#ECEAE4', minHeight: '100vh', padding: 'clamp(12px, 2vw, 20px)' }}>
        <div style={{ background: 'white', border: '4px solid black', borderRadius: '2.2rem', overflow: 'hidden' }}>
          <ProjectHeader title="Architecture Works" themeColor="#ECEAE4" />

          {/* Slim toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px clamp(20px, 3vw, 40px)',
            borderBottom: '1.5px solid #e8e6e0',
          }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: '#888', textDecoration: 'none', fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Board
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px', color: '#aaa', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                PROJECT 07
              </span>
              <span style={{ color: '#ddd' }}>·</span>
              <span style={{
                fontSize: '13px', fontWeight: 800, fontStyle: 'italic', color: '#111',
                letterSpacing: '-0.01em',
              }}>
                Architecture Works
              </span>
            </div>

            {/* right spacer to balance the back-link on the left */}
            <div style={{ width: 100 }} />
          </div>

          <ArchitecturePdfViewer />
        </div>
      </div>
    )
  }

  if (project.slug === 'beyond-visibility') {
    return (
      <div style={{ background: '#ffffff', minHeight: '100vh' }}>
        <Project1Header />

        {/* ── 1. Hero Video ── */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(64px, 10vw, 96px) clamp(16px, 4vw, 64px)',
        }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto', width: '100%' }}>
            <Project1TitleVideo />
            <p style={{
              marginTop: '24px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '14px',
              lineHeight: 1.6,
              maxWidth: '28rem',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              This project is based on PDP course in Aalto and sponsored by Wärtsilä,
              and the general scope is to explore how to control the vessel in the future.
            </p>
          </div>
        </section>

        {/* ── 2. Research ── */}
        <ResearchSection />

        {/* ── 3. Persona ── */}
        <PersonaSection />

        {/* ── 4. Scope Defining ── */}
        <ScopeDefining />

        {/* ── 5. Benchmarking ── */}
        <BenchmarkingSection />

        {/* ── 6. Recap ── */}
        <RecapSection />

        {/* ── 7. User Scenario ── */}
        <UserScenarioSection />

        {/* ── 8. JTBD Features ── */}
        <JTBDSection />

        {/* ── 9. Feedback ── */}
        <FeedbackSection />

        {/* ── 10. DEV ── */}
        <DevSection />
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
