import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: tool } = await supabase
    .from('tools')
    .select('name, blurb, publisher, github_stars, installs_count, category_id')
    .eq('slug', slug)
    .maybeSingle()

  const t: any = tool ?? { name: 'Claude Code Stack', blurb: '', publisher: null }

  const compact = (n: number | null | undefined) => {
    if (!n || n <= 0) return '0'
    if (n < 1000) return String(n)
    if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
    return `${(n / 1_000_000).toFixed(1)}M`
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f7f3ea 0%, #f0eee6 55%, #e8e4d8 100%)',
          padding: 72,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44, height: 44,
              background: '#141413',
              color: '#cc785c',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'monospace',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            &gt;_
          </div>
          <div style={{ fontSize: 22, color: '#7a736b', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Claude Code Stack
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {t.publisher && (
            <div style={{ fontSize: 28, color: '#7a736b', fontFamily: 'monospace', marginBottom: 14 }}>
              {t.publisher}
            </div>
          )}
          <div style={{ fontSize: 96, color: '#141413', lineHeight: 1, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {String(t.name).slice(0, 40)}
          </div>
          {t.blurb && (
            <div style={{ fontSize: 30, color: '#2b2926', marginTop: 28, lineHeight: 1.35, maxWidth: 980 }}>
              {String(t.blurb).slice(0, 140)}{String(t.blurb).length > 140 ? '…' : ''}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 28, fontSize: 28, color: '#7a736b', alignItems: 'center' }}>
          {t.github_stars > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#cc785c', fontSize: 34 }}>★</span>
              {compact(t.github_stars)} stars
            </div>
          )}
          {t.installs_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#cc785c', fontSize: 34 }}>↓</span>
              {compact(t.installs_count)} installs
            </div>
          )}
          <div style={{ marginLeft: 'auto', color: '#cc785c' }}>www.claudecodestack.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
