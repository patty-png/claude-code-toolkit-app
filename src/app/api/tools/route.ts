import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Cursor helpers ─────────────────────────────────────────
// Cursor is base64(JSON) of the last row's sort keys + id.
// Shape depends on sort mode. Always includes id as tie-breaker.
type Cursor =
  | { sort: 'stars'; stars: number; id: number }
  | { sort: 'installs'; installs: number; id: number }
  | { sort: 'recent'; createdAt: string; id: number }
  | { sort: 'alpha'; name: string; id: number }

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url')
}
function decodeCursor(s: string | null): Cursor | null {
  if (!s) return null
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')) as Cursor
  } catch {
    return null
  }
}

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
  const cursor = decodeCursor(searchParams.get('cursor'))

  const supabase = await createClient()
  let query = supabase.from('tools').select(SELECT_COLS).limit(limit + 1) // +1 to detect next page

  // Category filter
  if (cat && cat !== 'all') query = query.eq('category_id', cat)

  // Search mode: when a query is present we use text filter and rank client-side
  // (covers at most `limit` rows — users rarely infinite-scroll search results)
  if (q) {
    const safe = q.replace(/[%_,]/g, '')
    query = query
      .or(`name.ilike.%${safe}%,blurb.ilike.%${safe}%,tag.ilike.%${safe}%,publisher.ilike.%${safe}%`)
      .order('is_featured', { ascending: false })
      .order('github_stars', { ascending: false, nullsFirst: false })
      .order('id', { ascending: true })
  } else {
    // Browse mode: cursor-paginated sort
    switch (sort) {
      case 'installs':
        if (cursor && cursor.sort === 'installs') {
          query = query.or(
            `installs_count.lt.${cursor.installs},and(installs_count.eq.${cursor.installs},id.gt.${cursor.id})`
          )
        }
        query = query
          .order('installs_count', { ascending: false, nullsFirst: false })
          .order('id', { ascending: true })
        break
      case 'recent':
        if (cursor && cursor.sort === 'recent') {
          query = query.or(
            `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
          )
        }
        query = query
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: true })
        break
      case 'alpha':
        if (cursor && cursor.sort === 'alpha') {
          query = query.or(
            `name.gt.${cursor.name},and(name.eq.${cursor.name},id.gt.${cursor.id})`
          )
        }
        query = query.order('name', { ascending: true }).order('id', { ascending: true })
        break
      case 'stars':
      default:
        if (cursor && cursor.sort === 'stars') {
          query = query.or(
            `github_stars.lt.${cursor.stars},and(github_stars.eq.${cursor.stars},id.gt.${cursor.id})`
          )
        }
        query = query
          .order('github_stars', { ascending: false, nullsFirst: false })
          .order('id', { ascending: true })
    }
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as unknown as ToolRow[]

  // Client-side search ranking (when q present)
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

  // Detect next page: we asked for limit+1. If we got limit+1, there's more.
  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items

  // Build next cursor only in browse mode (not search)
  let nextCursor: string | null = null
  if (!q && hasMore) {
    const last = page[page.length - 1]
    switch (sort) {
      case 'installs':
        nextCursor = encodeCursor({ sort: 'installs', installs: last.installs_count ?? 0, id: last.id })
        break
      case 'recent':
        nextCursor = encodeCursor({ sort: 'recent', createdAt: last.created_at ?? new Date(0).toISOString(), id: last.id })
        break
      case 'alpha':
        nextCursor = encodeCursor({ sort: 'alpha', name: last.name, id: last.id })
        break
      case 'stars':
      default:
        nextCursor = encodeCursor({ sort: 'stars', stars: last.github_stars ?? 0, id: last.id })
    }
  }

  return NextResponse.json({
    items: page,
    nextCursor,
    count: page.length,
  })
}
