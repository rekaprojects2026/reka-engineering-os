import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReKa Engineering OS',
  description: 'Internal operating system for engineering project management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
