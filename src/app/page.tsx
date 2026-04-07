import { Header } from '@/components/shared/Header'
import { Pegboard } from '@/components/home/Pegboard'

export default function Home() {
  return (
    <div className="w-screen bg-white p-5 flex flex-col gap-0">
      {/* Board — black border, rounded, board-bg fill */}
      <div
        className="flex flex-col bg-white"
        style={{
          border: '4px solid black',
          borderRadius: '2.2rem',
        }}
      >
        <Header />
        {/* Separator line */}
        <div style={{ height: 2, background: 'black', flexShrink: 0 }} />
        <Pegboard />
      </div>

      {/* Below-board section */}
      <div
        className="flex flex-col"
        style={{ padding: '6vw 3vw 4vw', marginTop: '100px' }}
      >
        {/* Main row: tagline center, hammer right */}
        <div className="flex items-end justify-center relative" style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontStyle: 'normal',
              fontWeight: 250,
              fontSize: 'clamp(1.5rem, 3vw, 3.5rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: 'black',
              textAlign: 'center',
            }}
          >
            Pin. Arrange. Rearrange.
          </p>

          {/* Hammer SVG — 180×483 native, displayed tall */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/Hammer.svg"
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              right: 70,
              top: -30,
              bottom: 100,
              width: 'clamp(60px, 7vw, 120px)',
              height: 'auto',
            }}
          />
        </div>

        {/* Contact info */}
        <div
          style={{
            marginTop: '6vw',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)',
            fontWeight: 400,
            color: 'black',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          Zeyi.cheng@aalto.fi&nbsp;&nbsp;/&nbsp;&nbsp;+358 449503079
        </div>
      </div>
    </div>
  )
}
