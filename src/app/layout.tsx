import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Discrimination Monitoring Dashboard',
  description: 'Real-time monitoring system for tracking AI-related discrimination incidents affecting disability, racial, religious communities, and general AI discrimination concerns.',
  keywords: ['AI', 'discrimination', 'monitoring', 'civil rights', 'Michigan', 'dashboard'],
  authors: [{ name: 'Michigan Department of Civil Rights' }],
  robots: 'noindex, nofollow', // Prevent indexing during development
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}