import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Unified search endpoint for the My Stack add-tool picker.
// Queries both `tools` (Claude Code tools) and `free_ai_tools` (web SaaS AI tools)
// and returns a single merged list.
//
// Query params:
//   q   : search query (optional)
//   cat : category filter
//         - 'all'                   → both tables, no filter
//         - 'free_ai'               → only free_ai_tools
//         - <category_id from tools>→ only that category from tools
//   limit : max results per source (default 30)

type Item = {
  source: 'tools' | 'free_ai'
  id: number
  name: string
  blurb: string
  url: string | null
  category_id: string | null
  tag: string | null
  publisher: string | null
  github_stars: number | null
  install_command: string | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const cat = (searchParams.get('cat') ?? 'all').trim()
  const limit = Math.min(Number(searchParams.get('limit') ?? 30), 50)

  const supabase = await createClient()
  const safe = q.replace(/[%_,]/g, '')

  const results: Item[] = []

  // --- Query tools table (unless cat is 'free_ai') ---
  if (cat !== 'free_ai') {
    let toolsQ = supabase
      .from('tools')
      .select('id, name, blurb, url, category_id, tag, publisher, github_stars, install_command')
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('github_stars', { ascending: false, nullsFirst: false })
      .order('name')
      .limit(limit)

    if (cat && cat !== 'all') toolsQ = toolsQ.eq('category_id', cat)
    if (q) {
      toolsQ = toolsQ.or(
        `name.ilike.%${safe}%,blurb.ilike.%${safe}%,tag.ilike.%${safe}%,publisher.ilike.%${safe}%`
      )
    }

    const { data: tools } = await toolsQ
    ;(tools ?? []).forEach((t: any) => {
      results.push({
        source: 'tools',
        id: t.id,
        name: t.name,
        blurb: t.blurb,
        url: t.url,
        category_id: t.category_id,
        tag: t.tag,
        publisher: t.publisher,
        github_stars: t.github_stars,
        install_command: t.install_command,
      })
    })
  }

  // --- Query free_ai_tools (unless cat is a specific non-free category) ---
  if (cat === 'all' || cat === 'free_ai') {
    let freeQ = supabase
      .from('free_ai_tools')
      .select('id, name, description, url, category, is_best')
      .order('is_best', { ascending: false, nullsFirst: false })
      .order('sort_order')
      .limit(limit)

    if (q) {
      freeQ = freeQ.or(
        `name.ilike.%${safe}%,description.ilike.%${safe}%,tool_summary.ilike.%${safe}%`
      )
    }

    const { data: free } = await freeQ
    ;(free ?? []).forEach((t: any) => {
      results.push({
        source: 'free_ai',
        id: t.id,
        name: t.name,
        blurb: t.description,
        url: t.url,
        category_id: t.category,
        tag: 'Free AI',
        publisher: null,
        github_stars: null,
        install_command: null,
      })
    })
  }

  // Rank name matches to the top when searching
  if (q) {
    const lq = q.toLowerCase()
    results.sort((a, b) => {
      const aScore = a.name.toLowerCase().startsWith(lq) ? 2 : a.name.toLowerCase().includes(lq) ? 1 : 0
      const bScore = b.name.toLowerCase().startsWith(lq) ? 2 : b.name.toLowerCase().includes(lq) ? 1 : 0
      return bScore - aScore
    })
  }

  return NextResponse.json({ items: results.slice(0, limit * 2), count: results.length })
}
