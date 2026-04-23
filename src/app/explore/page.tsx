import { createClient } from '@/lib/supabase/server'
import { ExploreView } from '@/components/directory/ExploreView'
import { TopFive } from '@/components/directory/TopFive'
import { TrendingStrip } from '@/components/directory/TrendingStrip'
import { Header } from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Explore All Tools — Claude Code Stack',
  description: 'Browse 2,435 Claude Code tools, skills, MCPs, and hooks. Filter by category, sort by stars, install with one command.',
  alternates: { canonical: `${SITE_URL}/explore` },
  openGraph: {
    title: 'Explore All Tools — Claude Code Stack',
    description: 'Browse 2,435 Claude Code tools, filter by category.',
    url: `${SITE_URL}/explore`,
    type: 'website',
  },
}

const SELECT_COLS =
  'id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank, github_url, github_stars, publisher, repo_name, installs_count, upvotes, downvotes, created_at'

export default async function ExplorePage() {
  const supabase = await createClient()

  const [initialToolsRes, catsRes, featuredRes, totalRes, trendingRes, pubCountRes] = await Promise.all([
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
    supabase.from('tools').select('publisher', { count: 'exact', head: true }).not('publisher', 'is', null),
  ])

  const initialTools = (initialToolsRes.data ?? []) as any[]
  const allCategories = catsRes.data ?? []
  const featured = featuredRes.data ?? []
  const totalCount = totalRes.count ?? 0
  const trending = (trendingRes.data ?? []) as any[]
  const publisherCount = pubCountRes.count ?? 0

  // Count per category via parallel HEAD queries
  const catCounts = await Promise.all(
    allCategories.map(async (c: any) => {
      const { count } = await supabase
        .from('tools')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', c.id)
      return { id: c.id, label: c.label, count: count ?? 0 }
    })
  )
  const nonEmpty = new Set(catCounts.filter((c) => c.count > 0).map((c) => c.id))
  const categories = allCategories.filter((c: any) => nonEmpty.has(c.id))
  const byId: Record<string, number> = {}
  catCounts.forEach((c) => { byId[c.id] = c.count })

  const skillCount = byId['skill'] ?? 0
  const mcpCount = byId['mcp'] ?? 0
  const agentCount = byId['agent'] ?? 0

  // Distinct publishers (approximate — count of rows with publisher ≠ total publishers, but good enough for hero)
  // Better: use the publisher_stats view row count
  const { count: distinctPubs } = await supabase.from('publisher_stats').select('*', { count: 'exact', head: true })

  return (
    <div className="view-app">
      <Header />

      <main>
        {/* ═══ Hero ═══ */}
        <section className="explore-hero">
          <div className="section-num">The directory</div>
          <h1 className="display-lg">
            Every plugin, skill, and MCP server for <em>Claude Code.</em>
          </h1>
          <p className="lede">
            The largest directory of Claude Code extensions. Discover tools used by thousands of developers,
            sorted by installs and GitHub stars. Hand-curated from top publishers and community scrapers.
          </p>
          <div className="explore-hero-stats">
            <span><strong>{skillCount.toLocaleString()}</strong> skills</span>
            <span><strong>{mcpCount.toLocaleString()}</strong> MCP servers</span>
            <span><strong>{(distinctPubs ?? publisherCount).toLocaleString()}</strong> publishers</span>
            <span><strong>{totalCount.toLocaleString()}</strong> total tools</span>
          </div>
        </section>

        {/* ═══ Browse cards ═══ */}
        <section className="browse-section">
          <div className="section-num">Browse</div>
          <div className="browse-grid">
            <Link href="/skills" className="browse-card">
              <div className="browse-card-head">
                <h3>Agent Skills</h3>
                <span className="browse-count">{skillCount.toLocaleString()}</span>
              </div>
              <p>
                Reusable instructions that teach your agent specific tasks.
                Install with a single command.
              </p>
              <span className="browse-cta">{skillCount.toLocaleString()} skills →</span>
            </Link>

            <Link href="/marketplaces" className="browse-card">
              <div className="browse-card-head">
                <h3>Marketplaces</h3>
                <span className="browse-count">{(distinctPubs ?? publisherCount).toLocaleString()}</span>
              </div>
              <p>
                Curated GitHub organizations and publishers shipping
                collections of plugins, skills, and tools for Claude Code.
              </p>
              <span className="browse-cta">{(distinctPubs ?? publisherCount).toLocaleString()} publishers →</span>
            </Link>

            <Link href="/explore?cat=mcp" className="browse-card">
              <div className="browse-card-head">
                <h3>MCP Servers</h3>
                <span className="browse-count">{mcpCount.toLocaleString()}</span>
              </div>
              <p>
                Extend your agent with additional tools, APIs, and integrations
                via the Model Context Protocol.
              </p>
              <span className="browse-cta">{mcpCount.toLocaleString()} servers →</span>
            </Link>
          </div>
        </section>

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
