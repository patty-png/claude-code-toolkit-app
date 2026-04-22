import { createAdminClient } from '@/lib/supabase/admin'
import { LearnTabs } from '@/components/learn/LearnTabs'
import { Header } from '@/components/Header'

export const revalidate = 300

export default async function LearnPage() {
  const supabase = createAdminClient()
  const [resRes, cRes] = await Promise.all([
    supabase.from('learn_resources').select('*').order('is_featured', { ascending: false }).order('id', { ascending: true }),
    supabase.from('courses').select('*').order('id'),
  ])

  return (
    <div className="view-app">
      <Header />

      <main>
        <div className="section-head">
          <div className="section-num">Education</div>
          <h1 className="serif">Get up to speed, <em>fast.</em></h1>
          <p className="section-lede">
            Curated videos from Anthropic + creators, official documentation, research, courses with
            certificates, and a 2-week roadmap to go from first install to confident power user.
          </p>
        </div>

        <LearnTabs resources={(resRes.data ?? []) as any} courses={(cRes.data ?? []) as any} />
      </main>
    </div>
  )
}
