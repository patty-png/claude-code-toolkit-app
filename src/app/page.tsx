import { TerminalStage } from '@/components/landing/TerminalStage'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 300

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
