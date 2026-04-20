import { createClient } from '@/lib/supabase/server'
import { ExploreView } from '@/components/directory/ExploreView'
import { TopFive } from '@/components/directory/TopFive'
import { TrendingStrip } from '@/components/directory/TrendingStrip'
import Link from 'next/link'

export const revalidate = 60

const SELECT_COLS =
  'id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank, github_url, github_stars, publisher, repo_name, installs_count, upvotes, downvotes, created_at'

export default async function ExplorePage() {
  const supabase = await createClient()

  const [initialToolsRes, catsRes, featuredRes, totalRes, trendingRes] = await Promise.all([
    supabase
      .from('tools')
      .select(SELECT_COLS)
      .order('github_stars', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true })
      .limit(50),
    supabase.from('categories').select('id, label, short_label, emoji').order('sort_order'),
    supabase
      .from('tools')
      .select('id, name, tag, blurb, url, install_command, feature_rank')
      .eq('is_featured', true)
      .order('feature_rank')
      .limit(5),
    supabase.from('tools').select('*', { count: 'exact', head: true }),
    supabase
      .from('tools')
      .select('slug, name, publisher, github_stars, blurb')
      .gt('github_stars', 500)
      .order('github_stars', { ascending: false, nullsFirst: false })
      .limit(10),
  ])

  const initialTools = (initialToolsRes.data ?? []) as any[]
  const allCategories = catsRes.data ?? []
  const featured = featuredRes.data ?? []
  const totalCount = totalRes.count ?? 0
  const trending = (trendingRes.data ?? []) as any[]

  // Hide categories with no tools (quick distinct-category query)
  const { data: distinctCats } = await supabase.from('tools').select('category_id').limit(10000)
  const activeCategoryIds = new Set((distinctCats ?? []).map((t: any) => t.category_id).filter(Boolean))
  const categories = allCategories.filter((c: any) => activeCategoryIds.has(c.id))

  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">Claude Code <em>Toolkit</em></div>
          <nav style={{ display: 'flex', gap: 16, fontSize: '0.82rem' }}>
            <Link href="/marketplaces" className="app-home">Marketplaces</Link>
            <Link href="/learn" className="app-home">Learn</Link>
            <Link href="/stack" className="app-home">My Stack</Link>
          </nav>
        </div>
      </header>

      <main>
        {featured.length > 0 && <TopFive tools={featured} />}

        {trending.length > 0 && <TrendingStrip items={trending} />}

        <section id="directory">
          <ExploreView
            initialTools={initialTools}
            categories={categories}
            totalCount={totalCount}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Built with Next.js + Supabase · <a href="https://github.com/patty-png/claude-code-toolkit-app">View source</a>
        </p>
      </footer>
    </div>
  )
}
