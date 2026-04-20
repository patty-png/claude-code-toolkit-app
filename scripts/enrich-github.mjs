/* eslint-disable */
// Phase 6: enrich tools with GitHub metadata (stars, forks, README, publisher, license, last_commit).
// - Reads tools from Supabase where url matches github.com/owner/repo
// - Extracts owner/repo, derives publisher + repo_name + identity_key
// - Hits GitHub REST API for repo stats + README markdown
// - Updates the row with github_* fields, readme_md, skill_md (if found), claude_md (if found)
//
// Env:
//   GITHUB_TOKEN  (optional but recommended — 5000 req/hour vs 60 unauth)
//
// Usage:
//   node scripts/enrich-github.mjs                  # all tools
//   node scripts/enrich-github.mjs --limit 10       # first 10
//   node scripts/enrich-github.mjs --only-missing   # only tools without enriched_at

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = process.argv.slice(2)
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : 999
const ONLY_MISSING = args.includes('--only-missing')
const GH_TOKEN = process.env.GITHUB_TOKEN

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const ghHeaders = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'claude-code-toolkit-enricher',
  ...(GH_TOKEN ? { 'Authorization': `Bearer ${GH_TOKEN}` } : {}),
}

const GH_URL_RE = /github\.com\/([^\/\s#?]+)\/([^\/\s#?]+?)(?:\.git|\/|$|#|\?)/i

function parseGitHubUrl(url) {
  if (!url) return null
  const m = url.match(GH_URL_RE)
  if (!m) return null
  const owner = m[1]
  const repo = m[2].replace(/\.git$/, '')
  return { owner, repo }
}

function identityKey(owner, repo) {
  return `github.com/${owner.toLowerCase()}/${repo.toLowerCase()}`
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchRepo(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders })
  if (res.status === 404) return { notFound: true }
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    if (remaining === '0') throw new Error('GitHub rate limit hit — set GITHUB_TOKEN in .env.local')
  }
  if (!res.ok) throw new Error(`repo fetch ${res.status}`)
  return res.json()
}

async function fetchReadme(owner, repo) {
  // GitHub's readme endpoint auto-finds README.md, readme.md, README.rst, etc.
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { ...ghHeaders, 'Accept': 'application/vnd.github.raw' },
  })
  if (!res.ok) return null
  const text = await res.text()
  return text.slice(0, 100_000)   // cap at 100KB
}

async function fetchRootFile(owner, repo, filename, defaultBranch = 'main') {
  // Try main, then master
  for (const branch of [defaultBranch, 'master']) {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`,
      { headers: { 'User-Agent': 'claude-code-toolkit-enricher' } }
    )
    if (res.ok) {
      const text = await res.text()
      return text.slice(0, 100_000)
    }
  }
  return null
}

async function enrichOne(tool) {
  const urlToTry = tool.github_url || tool.url
  const parsed = parseGitHubUrl(urlToTry)
  if (!parsed) return { tool, skipped: 'no-github-url' }

  const { owner, repo } = parsed

  try {
    const repoData = await fetchRepo(owner, repo)
    if (repoData.notFound) return { tool, skipped: '404' }

    const [readme, skillMd, claudeMd] = await Promise.all([
      fetchReadme(owner, repo),
      fetchRootFile(owner, repo, 'SKILL.md', repoData.default_branch ?? 'main'),
      fetchRootFile(owner, repo, 'CLAUDE.md', repoData.default_branch ?? 'main'),
    ])

    const update = {
      github_url: `https://github.com/${owner}/${repo}`,
      github_stars: repoData.stargazers_count ?? 0,
      github_forks: repoData.forks_count ?? 0,
      github_last_commit: repoData.pushed_at ?? null,
      license: repoData.license?.spdx_id ?? null,
      primary_language: repoData.language ?? null,
      publisher: owner,
      repo_name: repo,
      identity_key: identityKey(owner, repo),
      readme_md: readme,
      skill_md: skillMd,
      claude_md: claudeMd,
      enriched_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('tools').update(update).eq('id', tool.id)
    if (error) return { tool, error: error.message }
    return { tool, stars: update.github_stars, hasReadme: !!readme, hasSkill: !!skillMd, hasClaude: !!claudeMd }
  } catch (err) {
    return { tool, error: err.message }
  }
}

// ── Main ──
let query = supabase
  .from('tools')
  .select('id, name, url, github_url, enriched_at')
  .order('is_featured', { ascending: false })
  .order('id')
  .limit(LIMIT)

if (ONLY_MISSING) query = query.is('enriched_at', null)

const { data: tools, error } = await query
if (error) { console.error('✗', error.message); process.exit(1) }

if (!GH_TOKEN) {
  console.warn('⚠ No GITHUB_TOKEN set — limited to 60 requests/hour (each tool = ~3 requests)')
  console.warn('  Create one at https://github.com/settings/tokens (public_repo scope)')
  console.warn('  Add to .env.local: GITHUB_TOKEN=ghp_...')
}

console.log(`→ Enriching ${tools.length} tools${ONLY_MISSING ? ' (only missing)' : ''}\n`)

let ok = 0, skipped = 0, errored = 0, hasGh = 0
for (let i = 0; i < tools.length; i++) {
  const t = tools[i]
  const res = await enrichOne(t)
  if (res.skipped) {
    process.stdout.write(`  ${String(i + 1).padStart(3)}/${tools.length}  ~ ${t.name.padEnd(40).slice(0, 40)}  [${res.skipped}]\n`)
    skipped++
  } else if (res.error) {
    process.stdout.write(`  ${String(i + 1).padStart(3)}/${tools.length}  ✗ ${t.name.padEnd(40).slice(0, 40)}  ${res.error}\n`)
    errored++
  } else {
    hasGh++
    const flags = [res.hasReadme && 'R', res.hasSkill && 'S', res.hasClaude && 'C'].filter(Boolean).join('')
    process.stdout.write(`  ${String(i + 1).padStart(3)}/${tools.length}  ✓ ${t.name.padEnd(40).slice(0, 40)}  ★${String(res.stars).padStart(6)}  ${flags}\n`)
    ok++
  }
  // Rate limit: without token = ~1 req/sec (60/hr / 60 = 1/sec but we need 3 reqs per tool)
  // With token = 5000/hr = plenty of headroom, still pause to be polite
  await sleep(GH_TOKEN ? 200 : 3500)
}

console.log(`\n✓ Done. ${ok} enriched · ${skipped} skipped · ${errored} errored`)
console.log(`  R = README, S = SKILL.md, C = CLAUDE.md`)
