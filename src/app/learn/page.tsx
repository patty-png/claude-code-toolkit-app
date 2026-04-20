import { createClient } from '@/lib/supabase/server'
import { LearnTabs } from '@/components/learn/LearnTabs'
import { Header } from '@/components/Header'
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
      <Header />

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
