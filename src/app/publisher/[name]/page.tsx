import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/Header'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 300

type RouteProps = { params: Promise<{ name: string }> }

function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { name } = await params
  const publisher = decodeURIComponent(name)
  return {
    title: `${publisher} — Publisher · Claude Code Toolkit`,
    description: `All Claude Code tools, skills, MCPs, and hooks published by ${publisher}.`,
  }
}

export default async function PublisherPage({ params }: RouteProps) {
  const { name } = await params
  const publisher = decodeURIComponent(name)

  const supabase = createAdminClient()

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, slug, name, category_id, tag, blurb, url, github_url, github_stars, installs_count, publisher, repo_name, upvotes, downvotes')
    .eq('publisher', publisher)
    .order('github_stars', { ascending: false, nullsFirst: false })
    .limit(200)

  if (error || !tools || tools.length === 0) notFound()

  const toolList: any[] = tools
  const totalStars = toolList.reduce((s, t) => s + (t.github_stars ?? 0), 0)
  const totalInstalls = toolList.reduce((s, t) => s + (t.installs_count ?? 0), 0)
  const totalUpvotes = toolList.reduce((s, t) => s + (t.upvotes ?? 0), 0)

  // Category breakdown
  const byCat: Record<string, number> = {}
  toolList.forEach(t => {
    if (t.category_id) byCat[t.category_id] = (byCat[t.category_id] ?? 0) + 1
  })

  const { data: cats } = await supabase.from('categories').select('id, label').in('id', Object.keys(byCat))
  const catLabels: Record<string, string> = {}
  ;(cats ?? []).forEach((c: any) => { catLabels[c.id] = c.label })

  return (
    <div className="view-app">
      <Header />

      <main>
        <nav className="detail-breadcrumb">
          <Link href="/marketplaces">Marketplaces</Link>
          <span className="sep">/</span>
          <span className="current">{publisher}</span>
        </nav>

        <div className="publisher-hero">
          <div className="publisher-hero-identity">
            <div className="publisher-avatar publisher-avatar-lg" aria-hidden="true">
              {publisher.slice(0, 2).toLowerCase()}
            </div>
            <div>
              <h1 className="publisher-hero-name">{publisher}</h1>
              <p className="publisher-hero-sub">
                {toolList.length} tool{toolList.length === 1 ? '' : 's'} published
              </p>
            </div>
          </div>
          <div className="publisher-hero-stats">
            <div className="publisher-hero-stat">
              <div className="stat-label">Tools</div>
              <div className="stat-value">{toolList.length}</div>
            </div>
            <div className="publisher-hero-stat">
              <div className="stat-label">Total Stars</div>
              <div className="stat-value">{compact(totalStars)}</div>
            </div>
            <div className="publisher-hero-stat">
              <div className="stat-label">Total Installs</div>
              <div className="stat-value">{compact(totalInstalls)}</div>
            </div>
            {totalUpvotes > 0 && (
              <div className="publisher-hero-stat">
                <div className="stat-label">Upvotes</div>
                <div className="stat-value">{totalUpvotes}</div>
              </div>
            )}
          </div>
        </div>

        {Object.keys(byCat).length > 1 && (
          <div className="publisher-cats">
            <span className="publisher-cats-label">Categories</span>
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([id, count]) => (
              <Link key={id} href={`/explore?cat=${id}`} className="chip">
                {catLabels[id] ?? id} · {count}
              </Link>
            ))}
          </div>
        )}

        <div className="directory">
          {toolList.map((t) => (
            <Link key={t.id} href={`/explore/${t.slug}`} className="dir-card dir-card-link-card">
              <div className="dir-card-head">
                <div className="dir-card-title">
                  <strong>{t.name}</strong>
                  {t.tag && <span className="dir-card-tag">{t.tag}</span>}
                </div>
                <p className="dir-card-blurb">{t.blurb}</p>
                {(t.github_stars > 0 || t.installs_count > 0 || t.upvotes > 0) && (
                  <div className="dir-card-stats">
                    {t.upvotes > 0 && <span className="stat stat-votes"><span className="stat-icon">▲</span>{t.upvotes}</span>}
                    {t.installs_count > 0 && <span className="stat"><span className="stat-icon">↓</span>{compact(t.installs_count)}</span>}
                    {t.github_stars > 0 && <span className="stat stat-stars"><span className="stat-icon">★</span>{compact(t.github_stars)}</span>}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with Next.js + Supabase · <a href="https://github.com/patty-png/claude-code-toolkit-app">View source</a>
        </p>
      </footer>
    </div>
  )
}
