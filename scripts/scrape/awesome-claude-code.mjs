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

// Map section headings → our category ids
const SECTION_CATEGORY = [
  { match: /mcp|model context protocol/i, cat: 'mcp' },
  { match: /skill/i,                       cat: 'skill' },
  { match: /agent|subagent/i,              cat: 'agent' },
  { match: /hook|observ/i,                 cat: 'auto' },
  { match: /plugin|marketplace/i,          cat: 'tool' },
  { match: /integration|saas|service/i,    cat: 'saas' },
  { match: /learn|tutorial|video|course/i, cat: 'learn' },
]

function categorizeBySection(heading) {
  for (const { match, cat } of SECTION_CATEGORY) {
    if (match.test(heading)) return cat
  }
  return 'tool'  // fallback
}

async function fetchReadme() {
  for (const url of README_URLS) {
    const res = await fetch(url, { headers: { 'User-Agent': 'claude-code-toolkit-scraper' } })
    if (res.ok) return res.text()
  }
  throw new Error('Could not fetch awesome-claude-code README')
}

// Match markdown list items: - [Name](url) — description  OR  * [Name](url): description
const ENTRY_RE = /^\s*[-*]\s*\[([^\]]+?)\]\(([^)]+?)\)(?:\s*[—–\-:]\s*(.+))?$/

function parseEntries(md) {
  const lines = md.split('\n')
  const entries = []
  let currentSection = 'Tools'

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')

    // Track the closest section heading
    const heading = line.match(/^#{2,4}\s+(.+?)\s*$/)
    if (heading) { currentSection = heading[1].replace(/[*`]/g, '').trim(); continue }

    const m = line.match(ENTRY_RE)
    if (!m) continue

    const [, name, url, desc] = m
    const gh = parseGitHubUrl(url)

    entries.push({
      name: name.trim(),
      url: url.trim(),
      github_url: gh ? `https://github.com/${gh.owner}/${gh.repo}` : null,
      blurb: desc?.trim() || null,
      category_hint: categorizeBySection(currentSection),
      tag: currentSection,
      raw: { section: currentSection, line: rawLine },
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
