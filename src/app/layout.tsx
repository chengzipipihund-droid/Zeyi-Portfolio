import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zeyi Cheng — Portfolio',
  description: 'Interdisciplinary designer based in Helsinki, Finland. Service design, system design, sustainability, architecture.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer style={{
          width: '100%',
          textAlign: 'center',
          padding: '20px',
          fontSize: '11px',
          color: '#aaa',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}>
          © 2026 Zeyi Cheng. All rights reserved. Non-commercial use only.
        </footer>
      </body>
    </html>
  )
}
