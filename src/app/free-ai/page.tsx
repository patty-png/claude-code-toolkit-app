import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Free AI Tools — Claude Code Toolkit',
  description: 'Curated free AI websites — chatbots, image generators, video tools, and more. All with free tiers.',
}

type Tool = {
  id: number
  slug: string
  name: string
  url: string
  description: string
  tool_summary: string | null
  use_cases: string | null
  category: string
  is_free: boolean
  has_free_tier: boolean
}

const CATEGORY_META: Record<string, { label: string; emoji: string; description: string }> = {
  chatbot:      { label: 'Chatbots',     emoji: '💬', description: 'Conversational AI assistants.' },
  design:       { label: 'Design & Image', emoji: '🎨', description: 'Image generation, editing, design tools.' },
  video:        { label: 'Video',        emoji: '🎬', description: 'AI video generation and editing.' },
  audio:        { label: 'Audio & Music', emoji: '🎵', description: 'Voice synthesis and music generation.' },
  writing:      { label: 'Writing',      emoji: '✍️', description: 'Writing assistants and research tools.' },
  coding:       { label: 'Coding',       emoji: '💻', description: 'AI coding assistants and no-code builders.' },
  research:     { label: 'Research',     emoji: '🔬', description: 'Academic and scientific research tools.' },
  data:         { label: 'Data',         emoji: '📊', description: 'Data analysis and chart generation.' },
  productivity: { label: 'Productivity', emoji: '⚡', description: 'Workspace and knowledge-management AI.' },
}

export default async function FreeAIPage() {
  const supabase = createAdminClient()

  const { data: tools } = await supabase
    .from('free_ai_tools')
    .select('*')
    .order('sort_order')

  const toolList = (tools ?? []) as Tool[]

  // Group by category
  const byCategory: Record<string, Tool[]> = {}
  toolList.forEach(t => {
    byCategory[t.category] = byCategory[t.category] ?? []
    byCategory[t.category].push(t)
  })
  const sortedCategories = Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length)

  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">Claude Code <em>Toolkit</em></div>
          <nav style={{ display: 'flex', gap: 16, fontSize: '0.82rem' }}>
            <Link href="/explore" className="app-home">Explore</Link>
            <Link href="/marketplaces" className="app-home">Marketplaces</Link>
            <Link href="/learn" className="app-home">Learn</Link>
            <Link href="/stack" className="app-home">My Stack</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="section-head">
          <div className="section-num">Free AI tools</div>
          <h2 className="serif">
            The best <em>free AI websites</em> on the internet.
          </h2>
          <p className="section-lede">
            Hand-picked web tools with generous free tiers — chatbots, image + video generators, research
            assistants, and more. Click to open in a new tab. Nothing to install.
          </p>
        </div>

        {toolList.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⌕</div>
            <div>
              No free AI tools yet. Run <code>migrations/004_free_ai_tools.sql</code> then{' '}
              <code>node scripts/seed-free-ai-tools.mjs</code>.
            </div>
          </div>
        ) : (
          <>
            {/* Category anchor nav */}
            <div className="freeai-cats-nav">
              {sortedCategories.map(cat => {
                const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '•', description: '' }
                return (
                  <a key={cat} href={`#${cat}`} className="chip">
                    {meta.emoji} {meta.label} · {byCategory[cat].length}
                  </a>
                )
              })}
            </div>

            {sortedCategories.map(cat => {
              const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '•', description: '' }
              return (
                <section key={cat} id={cat} className="freeai-section">
                  <div className="freeai-section-head">
                    <h3>
                      <span className="freeai-emoji" aria-hidden="true">{meta.emoji}</span>
                      {meta.label}
                    </h3>
                    <p>{meta.description}</p>
                  </div>
                  <div className="freeai-grid">
                    {byCategory[cat].map(t => (
                      <a
                        key={t.id}
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="freeai-card"
                      >
                        <div className="freeai-card-head">
                          <h4>{t.name}</h4>
                          <div className="freeai-badges">
                            {t.is_free && <span className="badge free">Free</span>}
                            {!t.is_free && t.has_free_tier && <span className="badge cert">Free tier</span>}
                            {!t.is_free && !t.has_free_tier && <span className="badge paid">Paid</span>}
                          </div>
                        </div>
                        <p className="freeai-desc">{t.description}</p>
                        {t.tool_summary && (
                          <div className="freeai-block">
                            <div className="freeai-block-label">The tool</div>
                            <p>{t.tool_summary}</p>
                          </div>
                        )}
                        {t.use_cases && (
                          <div className="freeai-block">
                            <div className="freeai-block-label">How it helps</div>
                            <p>{t.use_cases}</p>
                          </div>
                        )}
                        <div className="freeai-link">
                          Open <span>{new URL(t.url).hostname.replace('www.', '')}</span> ↗
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )
            })}
          </>
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
