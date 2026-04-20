import { createClient } from '@/lib/supabase/server'
import { LearnTabs } from '@/components/learn/LearnTabs'
import Link from 'next/link'

export const revalidate = 300

export default async function LearnPage() {
  const supabase = await createClient()
  const [vRes, cRes] = await Promise.all([
    supabase.from('videos').select('*').order('id'),
    supabase.from('courses').select('*').order('id'),
  ])

  return (
    <div className="view-app">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/" className="app-home">← Home</Link>
          <div className="app-title">
            Claude Code <em>Toolkit</em>
          </div>
          <nav style={{ display: 'flex', gap: 16, fontSize: '0.82rem' }}>
            <Link href="/explore" className="app-home">Explore</Link>
            <Link href="/marketplaces" className="app-home">Marketplaces</Link>
            <Link href="/stack" className="app-home">My Stack</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="section-head">
          <div className="section-num">Education</div>
          <h2 className="serif">Get up to speed, <em>fast.</em></h2>
          <p className="section-lede">
            Curated videos, official courses with certificates, and a 2-week roadmap to go from
            first install to confident power user.
          </p>
        </div>

        <LearnTabs videos={vRes.data ?? []} courses={cRes.data ?? []} />
      </main>
    </div>
  )
}
