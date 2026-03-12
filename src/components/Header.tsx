'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'WORKs', href: '/' },
  { label: 'INFO',  href: '/info' },
  { label: 'EXP.',  href: '/experience' },
]

export function Header() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    // Header zone — mirrors Overview.svg header proportions (381 / 2319 ≈ 16% of full canvas)
    <header className="relative flex items-start" style={{ padding: '2.2rem 2.8rem 1.8rem' }}>

      {/* Logo dot */}
      <div className="flex items-start flex-shrink-0">
        <Link href="/" aria-label="Home">
          <div
            className="rounded-full bg-black flex-shrink-0 hover:scale-105 transition-transform"
            style={{ width: 56, height: 56, marginTop: 4 }}
          />
        </Link>
      </div>

      {/* Spacer pushes title+nav to the right */}
      <div className="flex-1" />

      {/* Right block: ZEYI CHENG title + divider lines + nav */}
      <div className="flex flex-col items-end">
        {/* Display title — matches Title.svg large letter paths */}
        <h1
          className="font-black leading-none text-black select-none m-0 p-0 font-display"
          style={{
            fontSize: 'clamp(2.8rem, 6vw, 7rem)',
            fontStyle: 'italic',
            letterSpacing: '-0.04em',
          }}
        >
          ZEYI CHENG
        </h1>

        <div style={{ width: '100%', marginTop: '0.5rem', height: 3, background: 'black' }} />

        {/* Nav — WORKs / INFO / EXP. */}
        <nav className="flex gap-8 mt-3">
          {NAV_ITEMS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="transition-all duration-200 text-black font-display"
              style={{
                fontSize: 'clamp(0.8rem, 1.2vw, 1.1rem)',
                fontWeight: isActive(href) ? 700 : 400,
                opacity: isActive(href) ? 1 : 0.5,
                letterSpacing: '0.01em',
                borderBottom: isActive(href) ? '2px solid black' : '2px solid transparent',
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
