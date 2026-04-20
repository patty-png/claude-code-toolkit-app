import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ToolRow = {
  id: number
  slug: string
  name: string
  category_id: string | null
  tag: string | null
  blurb: string
  url: string | null
  install_command: string | null
  is_featured: boolean | null
  feature_rank: number | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const cat = searchParams.get('cat')?.trim() ?? ''
  const limit = Math.min(Number(searchParams.get('limit') ?? 60), 200)

  const supabase = await createClient()
  let query = supabase
    .from('tools')
    .select('id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank')
    .limit(limit)

  if (cat && cat !== 'all') query = query.eq('category_id', cat)

  if (q) {
    const safe = q.replace(/[%_,]/g, '')
    query = query.or(`name.ilike.%${safe}%,blurb.ilike.%${safe}%,tag.ilike.%${safe}%`)
  } else {
    query = query.order('is_featured', { ascending: false }).order('name')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as ToolRow[]
  const lq = q.toLowerCase()

  const ranked = q
    ? rows
        .map((t) => {
          const name = t.name.toLowerCase()
          let score = 0
          if (name === lq) score += 1000
          else if (name.startsWith(lq)) score += 500
          else if (name.includes(lq)) score += 200
          if ((t.tag ?? '').toLowerCase().includes(lq)) score += 80
          if ((t.blurb ?? '').toLowerCase().includes(lq)) score += 40
          return { ...t, _score: score }
        })
        .sort((a, b) => b._score - a._score)
    : rows

  return NextResponse.json({ results: ranked, count: ranked.length })
}
