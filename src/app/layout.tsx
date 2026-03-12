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
      <body>{children}</body>
    </html>
  )
}
