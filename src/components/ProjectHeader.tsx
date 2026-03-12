'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'WORKs', href: '/' },
  { label: 'INFO', href: '/info' },
  { label: 'EXP.', href: '/experience' },
]

export function ProjectHeader({
  title,
  themeColor,
  logoPath,
}: {
  title: string
  themeColor: string
  logoPath?: string
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/projects') : pathname.startsWith(href)

  return (
    <header
      className="relative flex items-start text-white"
      style={{
        padding: '2.2rem 2.8rem 1.8rem',
        background: themeColor,
      }}
    >
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link href="/" aria-label="Home">
          <div
            className="rounded-full bg-white flex-shrink-0 hover:scale-105 transition-transform"
            style={{ width: 56, height: 56 }}
          />
        </Link>

        {logoPath ? (
          <div className="relative flex-shrink-0" style={{ width: 236, height: 116 }}>
            <Image
              src={logoPath}
              alt={`${title} logo`}
              fill
              sizes="236px"
              className="object-contain object-left-center"
            />
          </div>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-end">
        <h1
          className="font-black leading-none select-none m-0 p-0 font-display"
          style={{
            fontSize: 'clamp(2.2rem, 5.3vw, 6rem)',
            fontStyle: 'italic',
            letterSpacing: '-0.04em',
          }}
        >
          {title}
        </h1>

        <div style={{ width: '100%', marginTop: '0.5rem', height: 3, background: 'white' }} />

        <nav className="flex gap-8 mt-3">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="transition-all duration-200 font-display"
              style={{
                fontSize: 'clamp(0.8rem, 1.2vw, 1.1rem)',
                fontWeight: isActive(href) ? 700 : 400,
                opacity: isActive(href) ? 1 : 0.6,
                letterSpacing: '0.01em',
                borderBottom: isActive(href) ? '2px solid white' : '2px solid transparent',
                paddingBottom: 2,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}