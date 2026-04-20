/* eslint-disable */
// Shared helpers for scrapers — dedupe key, supabase staging insert, github-url extraction.

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const GH_RE = /github\.com\/([a-z0-9][\w.-]*)\/([a-z0-9][\w.-]*?)(?:\.git)?(?:[\/#?]|$)/i

export function parseGitHubUrl(url) {
  if (!url) return null
  const m = url.match(GH_RE)
  if (!m) return null
  const owner = m[1]
  const repo = m[2].replace(/\.git$/, '')
  return { owner, repo }
}

export function identityKeyFromUrl(url) {
  const p = parseGitHubUrl(url)
  if (p) return `github.com/${p.owner.toLowerCase()}/${p.repo.toLowerCase()}`
  if (!url) return null
  // fallback: normalize host + path
  try {
    const u = new URL(url)
    return `${u.hostname.toLowerCase().replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`
  } catch { return url.toLowerCase() }
}

export function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// Batch upsert into staging_tools — scraper output goes here first for review
export async function stageBatch(rows, source) {
  if (rows.length === 0) return { inserted: 0 }
  const withKeys = rows.map(r => {
    const gh = parseGitHubUrl(r.github_url || r.url)
    return {
      identity_key: r.identity_key || identityKeyFromUrl(r.github_url || r.url) || slugify(r.name),
      name: r.name,
      category_hint: r.category_hint ?? null,
      tag: r.tag ?? null,
      blurb: r.blurb ?? null,
      url: r.url ?? null,
      github_url: r.github_url ?? null,
      install_command: r.install_command ?? null,
      publisher: gh?.owner ?? null,
      repo_name: gh?.repo ?? null,
      source,
      raw: r.raw ?? null,
      status: 'pending',
    }
  })

  // Chunk in groups of 100
  let inserted = 0
  for (let i = 0; i < withKeys.length; i += 100) {
    const chunk = withKeys.slice(i, i + 100)
    const { error, count } = await supabase.from('staging_tools').insert(chunk, { count: 'exact' })
    if (error) { console.error('staging insert:', error.message); continue }
    inserted += count ?? chunk.length
  }
  return { inserted }
}

// One source can be re-run safely by wiping its previous staging rows first
export async function resetStagingForSource(source) {
  const { error } = await supabase.from('staging_tools').delete().eq('source', source).eq('status', 'pending')
  if (error) console.warn('reset staging:', error.message)
}
