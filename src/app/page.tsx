import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  let dbStatus = 'not connected'
  let toolCount: number | null = null
  let catCount: number | null = null

  try {
    const supabase = await createClient()
    const [tools, cats] = await Promise.all([
      supabase.from('tools').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ])
    if (!tools.error && !cats.error) {
      dbStatus = 'connected'
      toolCount = tools.count
      catCount = cats.count
    }
  } catch {
    dbStatus = 'add .env.local to connect'
  }

  const checks = [
    ['✓', 'Framework', 'Next.js 16 App Router + TypeScript'],
    ['✓', 'Fonts', 'Fraunces + IBM Plex Sans + JetBrains Mono'],
    ['✓', 'Styling', 'Tailwind CSS + Claude brand CSS vars'],
    ['✓', 'Auth', 'Supabase SSR proxy wired'],
    ['✓', 'ORM', 'Drizzle schema — 10 tables typed'],
    [dbStatus === 'connected' ? '✓' : '⚠', 'Database', dbStatus + (catCount !== null ? ` — ${catCount} categories, ${toolCount} tools` : '')],
  ]

  return (
    <main style={{ fontFamily: 'var(--font-mono), monospace', background: 'var(--term-bg)', color: 'var(--term-text)', minHeight: '100vh', padding: '48px 32px' }}>
      <div style={{ maxWidth: 640 }}>
        <div style={{ color: 'var(--term-accent)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
          Claude Code Toolkit — Phase 0 Checkpoint
        </div>

        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', color: 'var(--term-text)', marginBottom: 32, fontStyle: 'italic', fontWeight: 400 }}>
          Scaffold complete.
        </h1>

        <pre style={{ fontSize: '0.78rem', lineHeight: 2, background: 'transparent', padding: 0 }}>
          {checks.map(([icon, label, value]) => (
            <div key={label}>
              <span style={{ color: icon === '✓' ? 'var(--term-green)' : 'var(--term-yellow)' }}>{icon} </span>
              <span style={{ color: 'var(--term-dim)' }}>{label.padEnd(12)}</span>
              <span>{value}</span>
            </div>
          ))}
        </pre>

        <div style={{ marginTop: 40, padding: '16px 20px', background: '#1e1c1a', borderRadius: 8, fontSize: '0.74rem', lineHeight: 1.9 }}>
          <div style={{ color: 'var(--term-dim)', marginBottom: 8 }}>PHASES COMPLETE</div>
          <div><span style={{ color: 'var(--term-green)' }}>✓</span> Phase 0 — Scaffold Next.js + Supabase + Vercel</div>
          <div><span style={{ color: 'var(--term-green)' }}>✓</span> Phase 1 — Drizzle schema + 8 seeded categories</div>
          <div><span style={{ color: 'var(--term-yellow)' }}>→</span> Phase 2 — Migrate 284 tools from v18 <span style={{ color: 'var(--term-dim)' }}>(up next)</span></div>
          <div><span style={{ color: 'var(--term-dim)' }}>  </span><span style={{ color: 'var(--term-dim)' }}>Phase 3 — Directory UI + search + Top 5</span></div>
          <div><span style={{ color: 'var(--term-dim)' }}>  </span><span style={{ color: 'var(--term-dim)' }}>Phase 4 — Education hub</span></div>
          <div><span style={{ color: 'var(--term-dim)' }}>  </span><span style={{ color: 'var(--term-dim)' }}>Phase 5 — Auth + synced My Stack</span></div>
        </div>

        <div style={{ marginTop: 40, borderTop: '1px solid var(--term-line)', paddingTop: 24, fontSize: '0.72rem' }}>
          <div style={{ color: 'var(--term-dim)', letterSpacing: '0.1em', marginBottom: 12 }}>ROUTES — PHASE 3</div>
          {[['/explore', 'Tool directory + search'], ['/learn', 'Education hub'], ['/stack', 'My Stack (auth required)'], ['/auth/sign-in', 'GitHub OAuth + magic link']].map(([path, desc]) => (
            <div key={path} style={{ marginBottom: 6 }}>
              <span style={{ color: 'var(--term-accent)' }}>{path}</span>
              <span style={{ color: 'var(--term-dim)' }}> — {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
