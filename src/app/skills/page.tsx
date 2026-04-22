import { createAdminClient } from '@/lib/supabase/admin'
import { Header } from '@/components/Header'
import { ExploreView } from '@/components/directory/ExploreView'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Claude Code Skills — Stack',
  description: 'Reusable instructions that teach your agent specific tasks. Install with a single command.',
  alternates: { canonical: `${SITE_URL}/skills` },
  openGraph: {
    title: 'Claude Code Skills — Stack',
    description: 'Reusable instructions that teach your agent specific tasks. Install with a single command.',
    url: `${SITE_URL}/skills`,
    siteName: 'Claude Code Stack',
    type: 'website',
  },
}

function compact(n: number | null | undefined): string {
  if (!n || n <= 0) return '0'
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

const SELECT_COLS =
  'id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank, github_url, github_stars, publisher, repo_name, installs_count, upvotes, downvotes, created_at'

export default async function SkillsPage() {
  const supabase = createAdminClient()

  const [totalRes, starredRes, initialRes, tagsRes] = await Promise.all([
    supabase.from('tools').select('*', { count: 'exact', head: true }).eq('category_id', 'skill'),
    supabase.from('tools').select('*', { count: 'exact', head: true }).eq('category_id', 'skill').gt('github_stars', 0),
    supabase
      .from('tools')
      .select(SELECT_COLS)
      .eq('category_id', 'skill')
      .order('github_stars', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true })
      .limit(50),
    supabase.from('tools').select('tag').eq('category_id', 'skill').not('tag', 'is', null).limit(500),
  ])

  const skillCount = totalRes.count ?? 0
  const starredCount = starredRes.count ?? 0
  const initialTools = (initialRes.data ?? []) as any[]

  // Tag frequencies — use as sub-categories
  const tagCounts: Record<string, number> = {}
  ;(tagsRes.data ?? []).forEach((r: any) => {
    if (r.tag) tagCounts[r.tag] = (tagCounts[r.tag] ?? 0) + 1
  })
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  // Top skill hero highlights
  const heroSkills = initialTools.slice(0, 3)

  return (
    <div className="view-app">
      <Header />

      <main>
        {/* Hero */}
        <section className="skills-hero">
          <div className="skills-hero-copy">
            <div className="section-num">Claude Code Skills</div>
            <h1 className="display-lg">
              Reusable instructions that <em>teach your agent.</em>
            </h1>
            <p className="lede">
              Browse {skillCount.toLocaleString()} skills — slash commands, workflows, knowledge guides, and
              specialized prompts. Install any skill with a single command, share your own with the community.
            </p>
            <div className="hero-stats" style={{ marginTop: 24 }}>
              <span className="hero-stat"><strong>{skillCount.toLocaleString()}</strong> skills</span>
              <span className="hero-stat"><strong>{starredCount.toLocaleString()}</strong> with stars</span>
              <span className="hero-stat"><strong>{topTags.length}</strong> sub-categories</span>
            </div>
          </div>
        </section>

        {/* Quickstart */}
        <section className="skills-quickstart">
          <div className="quickstart-head">
            <div className="section-num">Quick start</div>
            <p>Get any skill running in seconds. Requires the Claude Code CLI.</p>
          </div>
          <div className="quickstart-steps">
            <div className="quickstart-step">
              <div className="step-label">Step 1</div>
              <div className="step-desc">Initialize skills in your project (once per project)</div>
              <pre><code>npx skills init</code></pre>
            </div>
            <div className="quickstart-step">
              <div className="step-label">Step 2</div>
              <div className="step-desc">Install any skill from this directory</div>
              <pre><code>npx skills add https://github.com/&lt;org&gt;/&lt;repo&gt; --skill &lt;name&gt;</code></pre>
            </div>
          </div>
        </section>

        {/* Featured hero skills */}
        {heroSkills.length > 0 && (
          <section className="skills-featured">
            <div className="section-head">
              <div className="section-num">Featured</div>
              <h2 className="serif">Top starred <em>skills right now.</em></h2>
            </div>
            <div className="skills-featured-grid">
              {heroSkills.map((s) => (
                <Link key={s.id} href={`/explore/${s.slug}`} className="skill-featured-card">
                  <div className="skill-featured-head">
                    <h3>{s.name}</h3>
                    {s.github_stars > 0 && (
                      <span className="stat stat-stars"><span className="stat-icon">★</span>{compact(s.github_stars)}</span>
                    )}
                  </div>
                  {s.publisher && (
                    <div className="skill-featured-pub">{s.publisher}{s.repo_name && <span>/{s.repo_name}</span>}</div>
                  )}
                  <p className="skill-featured-blurb">{s.blurb}</p>
                  <div className="skill-featured-cta">View skill →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sub-categories (tags) */}
        {topTags.length > 0 && (
          <section className="skills-subcats">
            <div className="section-head">
              <div className="section-num">Browse by topic</div>
              <h2 className="serif">Sub-categories <em>within skills.</em></h2>
            </div>
            <div className="skills-tag-grid">
              {topTags.map(([tag, count]) => (
                <Link
                  key={tag}
                  href={`/explore?cat=skill&q=${encodeURIComponent(tag)}`}
                  className="skill-tag-card"
                >
                  <span className="tag-name">{tag}</span>
                  <span className="tag-count">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Full directory (scoped to skills) */}
        <section id="directory" style={{ marginTop: 48 }}>
          <div className="section-head">
            <div className="section-num">All skills</div>
            <h2 className="serif">{skillCount.toLocaleString()} skills, <em>browse freely.</em></h2>
          </div>
          <Suspense fallback={null}>
            <ExploreView
              initialTools={initialTools}
              categories={[]}
              totalCount={skillCount}
              fixedCategory="skill"
            />
          </Suspense>
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
