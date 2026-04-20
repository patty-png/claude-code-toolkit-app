/* eslint-disable */
// Scraper: awesome-mcp-servers
// Source: https://github.com/punkpeye/awesome-mcp-servers
// Method: fetch README.md, parse `- [name](url) - description` entries, always category 'mcp'
//
// Output: stages to `staging_tools` with category_hint='mcp'

import { stageBatch, resetStagingForSource, parseGitHubUrl } from './_lib.mjs'

const SOURCE = 'awesome-mcp-servers'
const README_URLS = [
  'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/main/README.md',
  'https://raw.githubusercontent.com/punkpeye/awesome-mcp-servers/master/README.md',
]

const ENTRY_RE = /^\s*[-*]\s*\[([^\]]+?)\]\(([^)]+?)\)\s*(.*)$/
const BY_AUTHOR_RE = /^(?:by\s+\[[^\]]+?\]\([^)]+?\))\s*/i
const SEPARATOR_RE = /^\s*[—–\-:]\s*/

async function fetchReadme() {
  for (const url of README_URLS) {
    const res = await fetch(url, { headers: { 'User-Agent': 'claude-code-toolkit-scraper' } })
    if (res.ok) return res.text()
  }
  throw new Error('Could not fetch awesome-mcp-servers README')
}

function parseEntries(md) {
  const lines = md.split('\n')
  const entries = []
  let h2 = '', h3 = '', inList = false

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')

    const h2m = line.match(/^##\s+(.+?)\s*$/)
    if (h2m) { h2 = h2m[1].replace(/[*`]/g, '').trim(); h3 = ''; inList = !!h2; continue }
    const h3m = line.match(/^###\s+(.+?)\s*$/)
    if (h3m) { h3 = h3m[1].replace(/[*`]/g, '').trim(); continue }

    const m = line.match(ENTRY_RE)
    if (!m) continue

    const [, rawName, url, rest = ''] = m
    const cleanUrl = url.trim()

    if (cleanUrl.startsWith('#')) continue
    if (!cleanUrl.match(/^https?:\/\//i)) continue

    // Skip common non-tool sections: TOC, table of contents, contributors, legal
    if (/table of contents|contents|contributing|contributor|legal|license|what is|tutorial|disclaimer|news|book|clients|framework/i.test(h2)) continue

    let blurb = rest.replace(BY_AUTHOR_RE, '').replace(SEPARATOR_RE, '').trim()
    if (!blurb) blurb = null

    const gh = parseGitHubUrl(cleanUrl)

    entries.push({
      name: rawName.trim(),
      url: cleanUrl,
      github_url: gh ? `https://github.com/${gh.owner}/${gh.repo}` : null,
      blurb,
      category_hint: 'mcp',        // entire list is MCPs
      tag: h2,                       // preserve the sub-category as the tag (e.g. "Databases", "Cloud", "Communication")
      raw: { h2, h3, line: rawLine },
    })
  }
  return entries
}

console.log('→ Fetching awesome-mcp-servers README…')
const md = await fetchReadme()
console.log(`  ${md.length} bytes`)

const entries = parseEntries(md)
console.log(`→ Parsed ${entries.length} link entries`)

const seen = new Set()
const unique = entries.filter(e => {
  const key = (e.github_url || e.url).toLowerCase()
  if (seen.has(key)) return false
  seen.add(key)
  return true
})
console.log(`  ${unique.length} unique after dedupe`)

console.log('→ Resetting previous pending staging rows for this source…')
await resetStagingForSource(SOURCE)

console.log('→ Staging…')
const { inserted } = await stageBatch(unique, SOURCE)
console.log(`✓ Staged ${inserted} candidates in staging_tools (status=pending)\n`)

const { supabase } = await import('./_lib.mjs')
const { data: byTag } = await supabase
  .from('staging_tools')
  .select('tag')
  .eq('source', SOURCE)
const tagCount = {}
byTag.forEach(r => tagCount[r.tag] = (tagCount[r.tag] || 0) + 1)
console.log('Top sub-categories (tag):')
Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) =>
  console.log(`  ${String(v).padStart(4)}  ${k}`)
)
