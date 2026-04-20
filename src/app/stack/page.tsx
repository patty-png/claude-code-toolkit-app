import { createClient } from '@/lib/supabase/server'
import { StackView } from '@/components/stack/StackView'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StackPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const params = await searchParams

  const [projectsRes, profileRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  const projects = projectsRes.data ?? []
  const activeId = params.project && projects.find(p => p.id === params.project) ? params.project : projects[0]?.id ?? null

  let items: any[] = []
  let toolMap = new Map<number, any>()
  if (activeId) {
    const { data: stackItems } = await supabase
      .from('stack_items')
      .select('*')
      .eq('project_id', activeId)
      .order('added_at', { ascending: true })
    items = stackItems ?? []

    const toolIds = items.map(i => i.tool_id).filter((x): x is number => x != null)
    if (toolIds.length) {
      const { data: toolRows } = await supabase
        .from('tools')
        .select('id, name, tag, blurb, url, category_id, install_command')
        .in('id', toolIds)
      toolRows?.forEach(t => toolMap.set(t.id, t))
    }
  }

  const { data: allTools } = await supabase
    .from('tools')
    .select('id, name, tag, blurb, category_id')
    .order('name')
    .limit(400)

  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">My <em>Stack</em></div>
          <nav style={{ display: 'flex', gap: 16, fontSize: '0.82rem', alignItems: 'center' }}>
            <Link href="/explore" className="app-home">Explore</Link>
            <Link href="/learn" className="app-home">Learn</Link>
            <span className="user-badge">
              {profileRes.data?.display_name ?? profileRes.data?.username ?? user.email}
            </span>
          </nav>
        </div>
      </header>

      <main>
        <StackView
          projects={projects}
          activeId={activeId}
          items={items.map(i => ({ ...i, tool: i.tool_id ? toolMap.get(i.tool_id) : null }))}
          allTools={allTools ?? []}
        />
      </main>
    </div>
  )
}
