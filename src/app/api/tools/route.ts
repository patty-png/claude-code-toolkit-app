import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Legacy no-op (kept for signature compatibility during transition)
function decodeCursor(_s: string | null): null { return null }

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
  github_url: string | null
  github_stars: number | null
  github_forks: number | null
  publisher: string | null
  repo_name: string | null
  installs_count: number | null
  upvotes: number | null
  downvotes: number | null
  created_at: string | null
}

const SELECT_COLS =
  'id, slug, name, category_id, tag, blurb, url, install_command, is_featured, feature_rank, ' +
  'github_url, github_stars, github_forks, publisher, repo_name, installs_count, upvotes, downvotes, created_at'

const VALID_SORT = new Set(['stars', 'installs', 'recent', 'alpha'])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const cat = (searchParams.get('cat') ?? '').trim()
  const sortRaw = (searchParams.get('sort') ?? 'stars').trim()
  const sort = VALID_SORT.has(sortRaw) ? sortRaw : 'stars'
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
  const offsetParam = Number(searchParams.get('offset') ?? 0)
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0
  const cursor = decodeCursor(searchParams.get('cursor'))

  const supabase = await createClient()

  // Total count for this filter (for display, only sent on first page)
  let totalInFilter: number | null = null
  if (offset === 0 && !cursor) {
    let countQuery = supabase.from('tools').select('*', { count: 'exact', head: true })
    if (cat && cat !== 'all') countQuery = countQuery.eq('category_id', cat)
    if (q) {
      const safe = q.replace(/[%_,]/g, '')
      countQuery = countQuery.or(
        `name.ilike.%${safe}%,blurb.ilike.%${safe}%,tag.ilike.%${safe}%,publisher.ilike.%${safe}%`
      )
    }
    const { count } = await countQuery
    totalInFilter = count ?? 0
  }

  let query = supabase.from('tools').select(SELECT_COLS).range(offset, offset + limit) // +1 row to detect next page

  // Category filter
  if (cat && cat !== 'all') query = query.eq('category_id', cat)

  // Search: match across name/blurb/tag/publisher
  if (q) {
    const safe = q.replace(/[%_,]/g, '')
    query = query.or(
      `name.ilike.%${safe}%,blurb.ilike.%${safe}%,tag.ilike.%${safe}%,publisher.ilike.%${safe}%`
    )
  }

  // Sort
  switch (sort) {
    case 'installs':
      query = query
        .order('installs_count', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
      break
    case 'recent':
      query = query
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
      break
    case 'alpha':
      query = query.order('name', { ascending: true }).order('id', { ascending: true })
      break
    case 'stars':
    default:
      query = query
        .order('is_featured', { ascending: false, nullsFirst: false })
        .order('github_stars', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as unknown as ToolRow[]

  // Client-side ranking boost for search: elevate name matches above blurb matches
  let items = rows
  if (q) {
    const lq = q.toLowerCase()
    items = rows
      .map((t) => {
        const name = t.name.toLowerCase()
        let score = 0
        if (name === lq) score += 1000
        else if (name.startsWith(lq)) score += 500
        else if (name.includes(lq)) score += 200
        if ((t.publisher ?? '').toLowerCase().includes(lq)) score += 120
        if ((t.tag ?? '').toLowerCase().includes(lq)) score += 80
        if ((t.blurb ?? '').toLowerCase().includes(lq)) score += 40
        return { ...t, _score: score }
      })
      .sort((a, b) => b._score - a._score)
  }

  // Detect next page: we asked for limit+1. Trim to limit, flag hasMore.
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items

  return NextResponse.json({
    items: page,
    nextOffset: hasMore ? offset + limit : null,
    count: page.length,
    totalInFilter,
  })
}
