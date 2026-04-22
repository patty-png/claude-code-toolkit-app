import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { QueryProvider } from '@/components/QueryProvider'
import { SiteFooter } from '@/components/newsletter/SiteFooter'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  style: ['normal', 'italic'],
})

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex',
  weight: ['400', '500', '600', '700'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.claudecodestack.com'),
  title: 'Claude Code Stack',
  description: '2,400+ curated MCPs, skills, agents, and SaaS tools for Claude Code — searchable, with one-line install commands. Track your stack.',
  openGraph: {
    title: 'Claude Code Stack',
    description: 'The definitive directory for Claude Code power users. Track your stack.',
    type: 'website',
    url: 'https://www.claudecodestack.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable} ${mono.variable}`}>
      <body>
        <QueryProvider>
          {children}
          <SiteFooter />
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
