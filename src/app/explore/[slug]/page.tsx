import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/Header'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { renderMarkdown, stripMarkdown } from '@/lib/markdown'
import { SITE_URL } from '@/lib/site'
import { VoteButtons } from '@/components/detail/VoteButtons'
import { AddToStackButton } from '@/components/detail/AddToStackButton'
import { InstallCommand } from '@/components/detail/InstallCommand'

export const revalidate = 300  // ISR: regenerate every 5 min

type RouteProps = { params: Promise<{ slug: string }> }

function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// Static params — prerender the top 200 tools at build, lazy-generate rest on first hit
export async function generateStaticParams() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tools')
    .select('slug')
    .order('github_stars', { ascending: false, nullsFirst: false })
    .limit(200)
  return (data ?? []).map((t: any) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: tool } = await supabase
    .from('tools')
    .select('name, blurb, publisher, readme_md')
    .eq('slug', slug)
    .maybeSingle()
  if (!tool) return { title: 'Not found' }
  const t: any = tool
  const desc = t.blurb || stripMarkdown(t.readme_md || '', 160)
  const title = t.publisher ? `${t.name} · ${t.publisher}` : t.name
  return {
    title: `${title} — Claude Code Stack`,
    description: desc,
    alternates: { canonical: `${SITE_URL}/explore/${slug}` },
    openGraph: {
      title,
      description: desc,
      type: 'article',
    },
  }
}

export default async function ToolDetailPage({ params }: RouteProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: toolData, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !toolData) notFound()
  const tool: any = toolData

  // Fetch category label
  const { data: cat } = tool.category_id
    ? await supabase.from('categories').select('label').eq('id', tool.category_id).maybeSingle()
    : { data: null }

  // Related tools: same category, exclude self, ordered by stars
  const { data: related } = await supabase
    .from('tools')
    .select('slug, name, blurb, publisher, github_stars, installs_count')
    .eq('category_id', tool.category_id)
    .neq('id', tool.id)
    .order('github_stars', { ascending: false, nullsFirst: false })
    .limit(6)

  // Current user's vote on this tool
  const { data: { user } } = await supabase.auth.getUser()
  let userVote: number | null = null
  if (user) {
    const { data: vote } = await supabase
      .from('tool_votes')
      .select('value')
      .eq('tool_id', tool.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (vote) userVote = (vote as any).value
  }

  // Render README to HTML (server-side)
  const readmeHtml = await renderMarkdown(tool.readme_md ?? '')
  const skillHtml = await renderMarkdown(tool.skill_md ?? '')
  const claudeHtml = await renderMarkdown(tool.claude_md ?? '')

  // JSON-LD structured data
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.blurb,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    url: `${SITE_URL}/explore/${tool.slug}`,
    ...(tool.github_stars && tool.github_stars > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Math.min(5, Math.max(1, Math.log10(tool.github_stars + 1))),
            ratingCount: Math.max(1, tool.github_stars),
            bestRating: 5,
          },
        }
      : {}),
    ...(tool.publisher ? { author: { '@type': 'Person', name: tool.publisher } } : {}),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: `${SITE_URL}/explore` },
      ...(tool.category_id
        ? [{ '@type': 'ListItem', position: 2, name: (cat as any)?.label ?? tool.category_id, item: `${SITE_URL}/explore?cat=${tool.category_id}` }]
        : []),
      { '@type': 'ListItem', position: tool.category_id ? 3 : 2, name: tool.name, item: `${SITE_URL}/explore/${tool.slug}` },
    ],
  }

  return (
    <div className="view-app">
      <script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />

      <main className="detail-main">
        <nav className="detail-breadcrumb">
          <Link href="/explore">Explore</Link>
          <span className="sep">/</span>
          {cat && tool.category_id && (
            <>
              <Link href={`/explore?cat=${tool.category_id}`}>{(cat as any).label}</Link>
              <span className="sep">/</span>
            </>
          )}
          {tool.publisher && (
            <>
              <Link href={`/publisher/${encodeURIComponent(tool.publisher)}`} className="publisher">{tool.publisher}</Link>
              <span className="sep">/</span>
            </>
          )}
          <span className="current">{tool.name}</span>
        </nav>

        <div className="detail-layout">
          {/* Main column */}
          <div className="detail-col-main">
            <div className="detail-header">
              <h1 className="detail-title">{tool.name}</h1>
              {tool.publisher && (
                <div className="detail-publisher">
                  <Link href={`/publisher/${encodeURIComponent(tool.publisher)}`}>{tool.publisher}</Link>
                  {tool.repo_name && <span className="slash">/{tool.repo_name}</span>}
                </div>
              )}
              {tool.blurb && <p className="detail-blurb">{tool.blurb}</p>}
            </div>

            {tool.install_command && <InstallCommand command={tool.install_command} />}

            {skillHtml && (
              <details className="detail-md-wrap" open>
                <summary>SKILL.md</summary>
                <article className="detail-md" dangerouslySetInnerHTML={{ __html: skillHtml }} />
              </details>
            )}

            {claudeHtml && (
              <details className="detail-md-wrap">
                <summary>CLAUDE.md</summary>
                <article className="detail-md" dangerouslySetInnerHTML={{ __html: claudeHtml }} />
              </details>
            )}

            {readmeHtml && (
              <details className="detail-md-wrap" open={!skillHtml}>
                <summary>README.md</summary>
                <article className="detail-md" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
              </details>
            )}

            {!readmeHtml && !skillHtml && !claudeHtml && (
              <div className="detail-empty-readme">
                <div className="empty-icon">∅</div>
                <p>No README available yet. Visit the source to see full docs.</p>
                {tool.github_url && (
                  <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="hero-ghost">
                    View on GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="detail-sidebar">
            <div className="detail-card">
              <VoteButtons
                toolId={tool.id}
                initialUpvotes={tool.upvotes ?? 0}
                initialDownvotes={tool.downvotes ?? 0}
                initialUserVote={userVote}
              />
              <AddToStackButton toolId={tool.id} />
            </div>

            <div className="detail-card">
              <h3>Stats</h3>
              <ul className="detail-stats">
                <li>
                  <span className="stat-label">Installs</span>
                  <span className="stat-value">{compact(tool.installs_count)}</span>
                </li>
                <li>
                  <span className="stat-label">GitHub Stars</span>
                  <span className="stat-value">{compact(tool.github_stars)}</span>
                </li>
                <li>
                  <span className="stat-label">Forks</span>
                  <span className="stat-value">{compact(tool.github_forks)}</span>
                </li>
                {tool.primary_language && (
                  <li>
                    <span className="stat-label">Language</span>
                    <span className="stat-value">{tool.primary_language}</span>
                  </li>
                )}
                {tool.license && (
                  <li>
                    <span className="stat-label">License</span>
                    <span className="stat-value">{tool.license}</span>
                  </li>
                )}
                <li>
                  <span className="stat-label">Last commit</span>
                  <span className="stat-value">{formatDate(tool.github_last_commit)}</span>
                </li>
              </ul>
            </div>

            {cat && tool.category_id && (
              <div className="detail-card">
                <h3>Category</h3>
                <div className="detail-categories">
                  <Link href={`/explore?cat=${tool.category_id}`} className="category-badge">
                    {(cat as any).label}
                  </Link>
                </div>
              </div>
            )}

            <div className="detail-card">
              <h3>Links</h3>
              <ul className="detail-links">
                {tool.github_url && (
                  <li><a href={tool.github_url} target="_blank" rel="noopener noreferrer">View on GitHub ↗</a></li>
                )}
                {tool.url && tool.url !== tool.github_url && (
                  <li><a href={tool.url} target="_blank" rel="noopener noreferrer">Website ↗</a></li>
                )}
              </ul>
            </div>
          </aside>
        </div>

        {related && related.length > 0 && (
          <section className="detail-related">
            <h2 className="serif">Related in <em>{cat ? (cat as any).label : 'this category'}</em></h2>
            <div className="directory">
              {related.map((r: any) => (
                <Link key={r.slug} href={`/explore/${r.slug}`} className="dir-card dir-card-link-card">
                  <div className="dir-card-title">
                    <strong>{r.name}</strong>
                  </div>
                  {r.publisher && <div className="dir-card-publisher">{r.publisher}</div>}
                  {r.blurb && <p className="dir-card-blurb">{r.blurb}</p>}
                  <div className="dir-card-stats">
                    {r.github_stars > 0 && <span className="stat stat-stars"><span className="stat-icon">★</span>{compact(r.github_stars)}</span>}
                    {r.installs_count > 0 && <span className="stat"><span className="stat-icon">↓</span>{compact(r.installs_count)}</span>}
                  </div>
                </Link>
              ))}
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
