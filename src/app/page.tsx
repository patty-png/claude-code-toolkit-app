import { TerminalStage } from '@/components/landing/TerminalStage'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Claude Code Stack — 2,435 Tools, Skills, MCPs & Hooks',
  description: 'The complete directory of tools, skills, MCPs, and hooks for Claude Code. Install commands, reviews, and use cases — all searchable.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Claude Code Stack',
    description: 'The complete directory of tools, skills, MCPs, and hooks for Claude Code.',
    url: SITE_URL,
    siteName: 'Claude Code Stack',
    type: 'website',
  },
}

export default async function Home() {
  const supabase = createAdminClient()

  const [toolsRes, catsRes, pubRes] = await Promise.all([
    supabase.from('tools').select('*', { count: 'exact', head: true }),
    supabase.from('tools').select('category_id', { count: 'exact', head: true }).not('category_id', 'is', null),
    supabase.from('tools').select('publisher', { count: 'exact', head: true }).not('publisher', 'is', null),
  ])

  // Count distinct categories that actually have tools
  const { data: usedCats } = await supabase
    .from('tools')
    .select('category_id')
    .not('category_id', 'is', null)
    .limit(5000)
  const distinctCats = new Set((usedCats ?? []).map((r: any) => r.category_id))

  return (
    <TerminalStage
      toolCount={toolsRes.count ?? 0}
      categoryCount={distinctCats.size}
      publisherCount={pubRes.count ?? 0}
    />
  )
}
