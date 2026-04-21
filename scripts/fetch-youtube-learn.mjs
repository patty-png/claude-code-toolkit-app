/* eslint-disable */
// Fetches real, verified YouTube videos via YouTube Data API v3.
// Queries specific channels + search terms, filters for Claude Code relevance,
// and inserts into learn_resources with accurate metadata.
//
// Requires: YOUTUBE_API_KEY in .env.local (YouTube Data API v3 enabled)
//
// Quota: search.list = 100 units, videos.list = 1 unit per batch
// Default quota = 10,000 units/day → plenty of headroom for this script

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const API_KEY = process.env.YOUTUBE_API_KEY
if (!API_KEY) {
  console.error('✗ YOUTUBE_API_KEY not set in .env.local')
  console.error('  Get one at https://console.cloud.google.com/apis/credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const slug = (s, suffix = '') => {
  const base = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
  return suffix ? `${base}-${suffix}` : base
}

// ── YouTube API helpers ─────────────────────────────────────
async function yt(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  url.searchParams.set('key', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YouTube API ${res.status}: ${text}`)
  }
  return res.json()
}

// Resolve a handle like "@AnthropicAI" to a channelId
async function resolveChannel(handle) {
  const clean = handle.replace(/^@/, '')
  const { items } = await yt('search', {
    part: 'snippet',
    q: clean,
    type: 'channel',
    maxResults: 1,
  })
  if (!items || items.length === 0) return null
  return items[0].snippet.channelId
}

// Search videos within a channel
async function searchChannelVideos(channelId, query, maxResults = 15) {
  const { items } = await yt('search', {
    part: 'snippet',
    channelId,
    q: query,
    type: 'video',
    order: 'relevance',
    maxResults,
  })
  return (items ?? []).map((i) => ({
    id: i.id.videoId,
    title: i.snippet.title,
    description: i.snippet.description,
    thumbnail: i.snippet.thumbnails?.high?.url ?? i.snippet.thumbnails?.default?.url,
    publishedAt: i.snippet.publishedAt,
    channelTitle: i.snippet.channelTitle,
  }))
}

// Batch-fetch video details (duration + view count)
async function videoDetails(ids) {
  if (ids.length === 0) return []
  const chunks = []
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))
  const out = []
  for (const c of chunks) {
    const { items } = await yt('videos', {
      part: 'contentDetails,statistics,snippet',
      id: c.join(','),
    })
    out.push(...(items ?? []))
  }
  return out
}

function parseDurationMin(iso) {
  // ISO 8601: PT#H#M#S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const h = Number(m[1] ?? 0)
  const min = Number(m[2] ?? 0)
  const s = Number(m[3] ?? 0)
  return h * 60 + min + (s >= 30 ? 1 : 0)
}

function inferSkill(title, desc) {
  const t = `${title} ${desc}`.toLowerCase()
  if (/\b(intro|getting started|beginner|quickstart|first|basics)\b/.test(t)) return 'beginner'
  if (/\b(advanced|deep dive|expert|mastery|production|pro tips)\b/.test(t)) return 'advanced'
  return 'intermediate'
}

function inferTopic(title, desc) {
  const t = `${title} ${desc}`.toLowerCase()
  if (/\bmcp\b|model context protocol/.test(t)) return 'mcp'
  if (/\bskill/.test(t)) return 'skills'
  if (/\bhook|observ|status ?line/.test(t)) return 'hooks'
  if (/\bsubagent|multi.?agent|agent team|parallel/.test(t)) return 'subagents'
  if (/\bclaude\.?md|memory|context file/.test(t)) return 'claudemd'
  if (/\bplugin|marketplace/.test(t)) return 'plugins'
  if (/\bworkflow|production|real.?world|build|tutorial/.test(t)) return 'workflow'
  return 'overview'
}

// ── Target definitions ──────────────────────────────────────
// Each entry: handle/channel + search query inside that channel
const TARGETS = [
  // Anthropic official — all Claude Code content from their channel
  { handle: '@AnthropicAI', queries: ['Claude Code'], source_type: 'anthropic_official', source_name: 'Anthropic', maxPer: 10, is_featured: true },

  // Known Claude Code creators
  { handle: '@AIJasonZ',         queries: ['Claude Code'], source_type: 'creator', source_name: 'AI Jason',         maxPer: 5 },
  { handle: '@matthew_berman',   queries: ['Claude Code', 'MCP'], source_type: 'creator', source_name: 'Matt Berman', maxPer: 5 },
  { handle: '@Fireship',         queries: ['Claude Code'], source_type: 'creator', source_name: 'Fireship',         maxPer: 3 },
  { handle: '@t3dotgg',          queries: ['Claude Code'], source_type: 'creator', source_name: 'Theo - t3.gg',     maxPer: 5 },
  { handle: '@indydevdan',       queries: ['Claude Code', 'CLAUDE.md'], source_type: 'creator', source_name: 'Indy Dev Dan', maxPer: 6 },
  { handle: '@nicksaraev',       queries: ['Claude Code'], source_type: 'creator', source_name: 'Nick Saraev',      maxPer: 5 },
  { handle: '@colebemis',        queries: ['Claude Code'], source_type: 'creator', source_name: 'Cole Medin',       maxPer: 4 },
  { handle: '@AICodeKing',       queries: ['Claude Code'], source_type: 'creator', source_name: 'AI Code King',     maxPer: 4 },
  { handle: '@aiadvantage',      queries: ['Claude Code'], source_type: 'creator', source_name: 'The AI Advantage', maxPer: 4 },
  { handle: '@WesRothMoney',     queries: ['Claude Code'], source_type: 'creator', source_name: 'Wes Roth',         maxPer: 3 },
  { handle: '@mreflow',          queries: ['Claude Code'], source_type: 'creator', source_name: "Matt Wolfe",       maxPer: 3 },
]

// ── Main ────────────────────────────────────────────────────
console.log('→ Resolving channel IDs…')
const resolved = []
for (const t of TARGETS) {
  try {
    const cid = await resolveChannel(t.handle)
    if (!cid) { console.warn(`  ⚠ could not resolve ${t.handle}`); continue }
    resolved.push({ ...t, channelId: cid })
    console.log(`  ✓ ${t.handle.padEnd(22)} → ${cid}`)
  } catch (err) {
    console.warn(`  ✗ ${t.handle}: ${err.message}`)
  }
}

console.log(`\n→ Searching each channel for Claude Code content…`)
const allVideos = []
for (const r of resolved) {
  for (const q of r.queries) {
    try {
      const vids = await searchChannelVideos(r.channelId, q, r.maxPer)
      vids.forEach(v => allVideos.push({ ...v, _target: r, _query: q }))
    } catch (err) {
      console.warn(`  ✗ ${r.handle} / "${q}": ${err.message}`)
    }
  }
}

// Dedupe by video id
const seen = new Set()
const unique = allVideos.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true })
console.log(`  Found ${allVideos.length} videos (${unique.length} unique)`)

// Fetch details for duration + views
console.log('\n→ Fetching video details (duration, views)…')
const details = await videoDetails(unique.map(v => v.id))
const detailMap = new Map(details.map(d => [d.id, d]))

// Build rows
const rows = []
for (const v of unique) {
  const d = detailMap.get(v.id)
  if (!d) continue
  const duration = parseDurationMin(d.contentDetails?.duration ?? '')
  // Skip shorts < 3 min unless from Anthropic official
  if (duration !== null && duration < 3 && v._target.source_type !== 'anthropic_official') continue
  // Relevance filter: title or description must mention Claude Code
  const haystack = `${v.title} ${v.description}`.toLowerCase()
  if (!haystack.includes('claude code') && !haystack.includes('claude') && v._target.source_type !== 'anthropic_official') continue

  rows.push({
    slug: slug(v.title, v.id),
    resource_type: 'video',
    source_type: v._target.source_type,
    source_name: v._target.source_name,
    source_handle: v._target.handle,
    source_url: `https://www.youtube.com/${v._target.handle.replace(/^@?/, '@')}`,
    title: v.title,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    youtube_id: v.id,
    thumbnail_url: v.thumbnail,
    description: v.description ? v.description.slice(0, 300) : null,
    duration_min: duration,
    skill_level: inferSkill(v.title, v.description ?? ''),
    topic: inferTopic(v.title, v.description ?? ''),
    published_at: v.publishedAt ? v.publishedAt.slice(0, 10) : null,
    is_featured: v._target.is_featured === true && v._target.source_type === 'anthropic_official',
  })
}

// Cap Anthropic videos as featured (top 3 most-viewed)
const anthropicByViews = rows
  .filter(r => r.source_type === 'anthropic_official')
  .sort((a, b) => (Number(detailMap.get(a.youtube_id)?.statistics?.viewCount ?? 0)) < (Number(detailMap.get(b.youtube_id)?.statistics?.viewCount ?? 0)) ? 1 : -1)
rows.forEach(r => { r.is_featured = false })
anthropicByViews.slice(0, 3).forEach(r => { r.is_featured = true })

console.log(`\n→ ${rows.length} verified videos to insert (${rows.filter(r => r.source_type === 'anthropic_official').length} from Anthropic, ${rows.filter(r => r.source_type === 'creator').length} from creators)`)

// Wipe existing videos (not docs/research) and replace
console.log('\n→ Replacing existing video rows in learn_resources…')
await supabase.from('learn_resources').delete().eq('resource_type', 'video')

// Insert in batches of 50
let inserted = 0
for (let i = 0; i < rows.length; i += 50) {
  const chunk = rows.slice(i, i + 50)
  const { error, count } = await supabase.from('learn_resources').insert(chunk, { count: 'exact' })
  if (error) {
    console.error('  ✗ Batch failed:', error.message)
    continue
  }
  inserted += count ?? chunk.length
}
console.log(`✓ Inserted ${inserted} verified YouTube videos\n`)

// Summary
const bySource = {}
rows.forEach(r => { bySource[r.source_name] = (bySource[r.source_name] ?? 0) + 1 })
console.log('By source:')
Object.entries(bySource).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`))
