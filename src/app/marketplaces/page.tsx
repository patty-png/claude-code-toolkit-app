import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Marketplaces — Claude Code Toolkit',
  description: 'Publishers and organizations shipping Claude Code tools, skills, and MCPs.',
}

function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

type PublisherRow = {
  publisher: string
  tool_count: number
  total_stars: number
  max_stars: number
  total_installs: number
  total_upvotes: number
  categories: string[] | null
  top_tool_names: string[] | null
  last_commit: string | null
}

export default async function MarketplacesPage() {
  const supabase = createAdminClient()

  // Query the view — falls back to GROUP BY if view doesn't exist yet
  let publishers: PublisherRow[] = []
  try {
    const { data } = await supabase
      .from('publisher_stats')
      .select('*')
      .order('tool_count', { ascending: false })
      .limit(200)
    publishers = (data as any) ?? []
  } catch {
    // View not created yet — show empty with a hint
  }

  const totalPublishers = publishers.length
  const totalTools = publishers.reduce((sum, p) => sum + p.tool_count, 0)
  const totalStars = publishers.reduce((sum, p) => sum + p.total_stars, 0)

  // Split into "featured" (any published by known orgs) and the long tail
  const FEATURED_ORGS = new Set([
    'anthropics', 'anthropic', 'modelcontextprotocol', 'vercel-labs', 'supabase',
    'google-gemini', 'openai', 'microsoft', 'obra', 'stripe', 'remotion-dev',
    'shadcn-ui', 'shadcn', 'langchain-ai', 'punkpeye', 'hesreallyhim',
  ])
  const featured = publishers.filter(p => FEATURED_ORGS.has(p.publisher.toLowerCase()))
  const topByTools = publishers.filter(p => !FEATURED_ORGS.has(p.publisher.toLowerCase())).slice(0, 100)

  return (
    <div className="view-app">
      <Header />

      <main>
        <div className="section-head">
          <div className="section-num">Marketplaces</div>
          <h2 className="serif">
            {totalPublishers.toLocaleString()} publishers shipping <em>Claude Code tools.</em>
          </h2>
          <p className="section-lede">
            Organizations and builders behind {totalTools.toLocaleString()} tools with{' '}
            {compact(totalStars)} combined GitHub stars. Click any publisher to see their full catalog.
          </p>
        </div>

        {publishers.length === 0 && (
          <div className="empty">
            <div className="empty-icon">⌕</div>
            <div>No publisher stats yet. Run the Phase 8 view migration in Supabase.</div>
          </div>
        )}

        {featured.length > 0 && (
          <section className="marketplaces-section">
            <div className="marketplaces-heading">
              <h3>Official & Featured</h3>
              <p>Anthropic, Vercel Labs, Supabase, and other established publishers.</p>
            </div>
            <div className="publisher-grid">
              {featured.map((p) => <PublisherCard key={p.publisher} p={p} featured />)}
            </div>
          </section>
        )}

        {topByTools.length > 0 && (
          <section className="marketplaces-section">
            <div className="marketplaces-heading">
              <h3>Top publishers by tool count</h3>
              <p>Independent builders and communities with the most published tools.</p>
            </div>
            <div className="publisher-grid">
              {topByTools.map((p) => <PublisherCard key={p.publisher} p={p} />)}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built with Next.js + Supabase · <a href="https://github.com/patty-png/claude-code-toolkit-app">View source</a>
        </p>
      </footer>
    </div>
  )
}

function PublisherCard({ p, featured = false }: { p: PublisherRow; featured?: boolean }) {
  return (
    <Link href={`/publisher/${encodeURIComponent(p.publisher)}`} className={`publisher-card ${featured ? 'featured' : ''}`}>
      <div className="publisher-card-head">
        <div className="publisher-avatar" aria-hidden="true">
          {p.publisher.slice(0, 2).toLowerCase()}
        </div>
        <div className="publisher-identity">
          <h4 className="publisher-name">{p.publisher}</h4>
          <div className="publisher-sub">{p.tool_count} tool{p.tool_count === 1 ? '' : 's'}</div>
        </div>
      </div>
      <div className="publisher-stats">
        {p.total_stars > 0 && (
          <span className="stat stat-stars"><span className="stat-icon">★</span>{compact(p.total_stars)}</span>
        )}
        {p.total_installs > 0 && (
          <span className="stat"><span className="stat-icon">↓</span>{compact(p.total_installs)}</span>
        )}
      </div>
      {p.top_tool_names && p.top_tool_names.length > 0 && (
        <ul className="publisher-tops">
          {p.top_tool_names.slice(0, 3).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </Link>
  )
}
