'use client'

import { useRef } from 'react'

export function ArchitecturePdfViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handlePrint = () => {
    try {
      iframeRef.current?.contentWindow?.focus()
      iframeRef.current?.contentWindow?.print()
    } catch {
      window.print()
    }
  }

  return (
    <div style={{ padding: '20px clamp(20px, 3vw, 48px) 48px' }}>

      {/* Print button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={handlePrint}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: '#555', fontWeight: 600,
            background: '#f0ede8', border: '1px solid #dedad4',
            padding: '6px 14px', borderRadius: '99px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4 4V2.5A.5.5 0 014.5 2h5a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="4" y="7.5" width="6" height="1" rx=".5" fill="currentColor"/>
            <rect x="4" y="9.5" width="4" height="1" rx=".5" fill="currentColor"/>
          </svg>
          Print
        </button>
      </div>

      {/* PDF frame — 3:4 portrait, centred, shadow */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        aspectRatio: '4 / 3',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 6px 32px rgba(0,0,0,0.13)',
      }}>
        <iframe
          ref={iframeRef}
          src="/Architecture/Architecture.pdf#toolbar=0&navpanes=0&scrollbar=1&view=FitH"
          title="Architecture Works"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>

      {/* Hint */}
      <p style={{
        textAlign: 'center', marginTop: '14px',
        fontSize: '11px', color: '#bbb', letterSpacing: '0.03em',
      }}>
        Scroll inside the frame to navigate pages · Ctrl + scroll to zoom
      </p>

    </div>
  )
}
