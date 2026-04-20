import { createClient } from '@/lib/supabase/server'
import { DirectoryView } from '@/components/directory/DirectoryView'
import { TopFive } from '@/components/directory/TopFive'
import Link from 'next/link'

export const revalidate = 60

export default async function ExplorePage() {
  const supabase = await createClient()

  const [toolsRes, catsRes, featuredRes] = await Promise.all([
    supabase
      .from('tools')
      .select('id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank')
      .order('is_featured', { ascending: false })
      .order('name')
      .limit(300),
    supabase.from('categories').select('id, label, short_label, emoji').order('sort_order'),
    supabase
      .from('tools')
      .select('id, name, tag, blurb, url, install_command, feature_rank')
      .eq('is_featured', true)
      .order('feature_rank'),
  ])

  const tools = toolsRes.data ?? []
  const allCategories = catsRes.data ?? []
  const featured = featuredRes.data ?? []

  // Hide empty categories from chip bar (Research + Learning have no tools yet)
  const activeCategoryIds = new Set(tools.map(t => t.category_id).filter(Boolean))
  const categories = allCategories.filter(c => activeCategoryIds.has(c.id))

  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">
            Claude Code <em>Toolkit</em>
          </div>
          <nav style={{ display: 'flex', gap: 16, fontSize: '0.82rem' }}>
            <Link href="/learn" className="app-home">Learn</Link>
            <Link href="/stack" className="app-home">My Stack</Link>
          </nav>
        </div>
      </header>

      <main>
        {featured.length > 0 && <TopFive tools={featured} />}

        <section id="directory">
          <DirectoryView initialTools={tools} categories={categories} />
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
