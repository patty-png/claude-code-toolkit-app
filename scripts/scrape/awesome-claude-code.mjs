/* eslint-disable */
// Scraper: awesome-claude-code
// Source: https://github.com/hesreallyhim/awesome-claude-code (and forks)
// Method: fetch raw README.md, parse markdown for `[name](url) — description` entries
// Output: stages to `staging_tools` for moderation

import { stageBatch, resetStagingForSource, parseGitHubUrl } from './_lib.mjs'

const SOURCE = 'awesome-claude-code'
const README_URLS = [
  'https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/main/README.md',
  'https://raw.githubusercontent.com/hesreallyhim/awesome-claude-code/master/README.md',
]

// Map section headings → our category ids (checked in order, first match wins)
const SECTION_CATEGORY = [
  { match: /mcp|model context protocol/i,              cat: 'mcp' },
  { match: /agent skill|\bskill/i,                     cat: 'skill' },
  { match: /slash[- ]?command|claude\.md|workflow/i,   cat: 'skill' },
  { match: /hook|status[- ]?line|observ|monitor/i,     cat: 'auto' },
  { match: /subagent|\bagent\b/i,                      cat: 'agent' },
  { match: /plugin|marketplace|alternative client/i,   cat: 'tool' },
  { match: /integration|saas|service/i,                cat: 'saas' },
  { match: /learn|tutorial|video|course|documentation/i, cat: 'learn' },
  { match: /tooling|ide|orchestrator|config manager/i, cat: 'tool' },
]

function categorize(h2, h3) {
  // Prefer H2 (broad category), fall back to H3 if H2 is generic
  for (const { match, cat } of SECTION_CATEGORY) {
    if (h2 && match.test(h2)) return cat
  }
  for (const { match, cat } of SECTION_CATEGORY) {
    if (h3 && match.test(h3)) return cat
  }
  return 'tool'
}

async function fetchReadme() {
  for (const url of README_URLS) {
    const res = await fetch(url, { headers: { 'User-Agent': 'claude-code-toolkit-scraper' } })
    if (res.ok) return res.text()
  }
  throw new Error('Could not fetch awesome-claude-code README')
}

// Match: - [Name](url) ...rest-of-line
// "rest" may include "by [author](url)", em-dash, or plain dash separators.
const ENTRY_RE = /^\s*[-*]\s*\[([^\]]+?)\]\(([^)]+?)\)\s*(.*)$/
// Strip leading "by [author](url)" from the description remainder.
const BY_AUTHOR_RE = /^(?:by\s+\[[^\]]+?\]\([^)]+?\))\s*/i
// Trim a leading separator (em-dash, en-dash, hyphen, colon) and surrounding whitespace.
const SEPARATOR_RE = /^\s*[—–\-:]\s*/

function parseEntries(md) {
  const lines = md.split('\n')
  const entries = []
  let h2 = 'Tools', h3 = ''

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')

    // Track H2 and H3 separately so we can prefer broader categories
    const h2m = line.match(/^##\s+(.+?)\s*$/)
    if (h2m) { h2 = h2m[1].replace(/[*`]/g, '').trim(); h3 = ''; continue }
    const h3m = line.match(/^###\s+(.+?)\s*$/)
    if (h3m) { h3 = h3m[1].replace(/[*`]/g, '').trim(); continue }

    const m = line.match(ENTRY_RE)
    if (!m) continue

    const [, rawName, url, rest = ''] = m
    const cleanUrl = url.trim()

    // Skip anchor links, relative paths, mailto, and internal TOC references
    if (cleanUrl.startsWith('#')) continue
    if (cleanUrl.startsWith('mailto:')) continue
    if (!cleanUrl.match(/^https?:\/\//i)) continue

    // Skip if the URL points back to the awesome-claude-code repo itself
    if (/hesreallyhim\/awesome-claude-code/i.test(cleanUrl)) continue

    // Skip the "Latest Additions" section — entries repeat elsewhere
    if (/latest addition/i.test(h2)) continue

    // Clean description: strip "by [author](url)" and separator
    let blurb = rest.replace(BY_AUTHOR_RE, '').replace(SEPARATOR_RE, '').trim()
    // Remove any lingering markdown links from the description start
    if (!blurb) blurb = null

    const gh = parseGitHubUrl(cleanUrl)

    entries.push({
      name: rawName.trim(),
      url: cleanUrl,
      github_url: gh ? `https://github.com/${gh.owner}/${gh.repo}` : null,
      blurb,
      category_hint: categorize(h2, h3),
      tag: h3 || h2,
      raw: { h2, h3, line: rawLine },
    })
  }
  return entries
}

// ── main ──
console.log('→ Fetching awesome-claude-code README…')
const md = await fetchReadme()
console.log(`  ${md.length} bytes`)

const entries = parseEntries(md)
console.log(`→ Parsed ${entries.length} link entries`)

// Dedupe within this run (same URL appearing in multiple sections)
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

console.log(`  Review: select count(*), category_hint from staging_tools where source='${SOURCE}' group by category_hint;`)
console.log(`  Approve all: update staging_tools set status='approved' where source='${SOURCE}';`)
