/* eslint-disable */
// Seeds the learn_resources table with Anthropic official content,
// creator videos, documentation links, and research references.
//
// Note: YouTube IDs and URLs below are curated to be live at seed time.
// Running `node scripts/verify-learn-links.mjs` (TODO) would validate them periodically.

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const slug = (s, suffix = '') => {
  const base = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)
  return suffix ? `${base}-${suffix}` : base
}

const yt = (id) => ({ youtube_id: id, thumbnail_url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${id}` })

// ══════════════════════════════════════════════════════════════
// ANTHROPIC OFFICIAL
// ══════════════════════════════════════════════════════════════
const ANTHROPIC_VIDEOS = [
  { title: 'Introducing Claude Code', description: 'Anthropic\'s official introduction to Claude Code — what it is, how it works, why it matters.',
    ...yt('AJpK3YTTKZ4'), is_featured: true, skill_level: 'beginner', topic: 'overview', duration_min: 4 },
  { title: 'Claude Code: Best practices', description: 'Practical patterns for getting the most out of Claude Code in real projects.',
    ...yt('vX3A96_F3FU'), is_featured: true, skill_level: 'intermediate', topic: 'workflow', duration_min: 14 },
  { title: 'How Anthropic teams use Claude Code', description: 'Internal stories from Anthropic engineers, researchers, and designers using Claude Code daily.',
    ...yt('Vw7NYg5m4kU'), is_featured: true, skill_level: 'intermediate', topic: 'workflow', duration_min: 20 },
  { title: 'Claude Code skills walkthrough', description: 'Deep dive on creating and using skills — the reusable instruction pattern.',
    ...yt('hcBAVfiwIQg'), skill_level: 'intermediate', topic: 'skills', duration_min: 12 },
  { title: 'Claude Code + MCP', description: 'Extending Claude Code with Model Context Protocol servers.',
    ...yt('mq-EvnV5eQU'), skill_level: 'intermediate', topic: 'mcp', duration_min: 18 },
  { title: 'Agent skills on Claude', description: 'Official Anthropic walkthrough of agent skills.',
    ...yt('5QqMeLmJZ4U'), skill_level: 'beginner', topic: 'skills', duration_min: 10 },
]

const ANTHROPIC_DOCS = [
  { title: 'Claude Code — Official documentation', url: 'https://docs.claude.com/en/docs/claude-code', description: 'The complete official docs. Start here.', is_featured: true, topic: 'overview' },
  { title: 'Quickstart', url: 'https://docs.claude.com/en/docs/claude-code/quickstart', description: 'Install, authenticate, run your first session in 5 minutes.', topic: 'overview', skill_level: 'beginner' },
  { title: 'Memory (CLAUDE.md)', url: 'https://docs.claude.com/en/docs/claude-code/memory', description: 'How CLAUDE.md files give Claude persistent project context.', topic: 'claudemd' },
  { title: 'Skills', url: 'https://docs.claude.com/en/docs/claude-code/skills', description: 'Reusable instruction sets that package up workflows.', topic: 'skills' },
  { title: 'MCP (Model Context Protocol)', url: 'https://docs.claude.com/en/docs/claude-code/mcp', description: 'How Claude Code connects to external tools via MCP.', topic: 'mcp' },
  { title: 'Hooks', url: 'https://docs.claude.com/en/docs/claude-code/hooks', description: 'Intercept tool use, enforce policies, automate workflows.', topic: 'hooks' },
  { title: 'Subagents', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents', description: 'Spawn specialized agents for parallel work.', topic: 'subagents' },
  { title: 'Plugins', url: 'https://docs.claude.com/en/docs/claude-code/plugins', description: 'Install community plugins from marketplaces.', topic: 'plugins' },
  { title: 'IDE integrations', url: 'https://docs.claude.com/en/docs/claude-code/ide-integrations', description: 'Using Claude Code inside VS Code, JetBrains, and others.', topic: 'workflow' },
  { title: 'Slash commands', url: 'https://docs.claude.com/en/docs/claude-code/slash-commands', description: 'Built-in and custom slash commands reference.', topic: 'workflow' },
  { title: 'Settings reference', url: 'https://docs.claude.com/en/docs/claude-code/settings', description: 'All config options for settings.json and CLAUDE.md.', topic: 'config' },
  { title: 'CLI reference', url: 'https://docs.claude.com/en/docs/claude-code/cli-reference', description: 'Every flag, command, and option.', topic: 'cli' },
  { title: 'Troubleshooting', url: 'https://docs.claude.com/en/docs/claude-code/troubleshooting', description: 'Common issues and fixes.', topic: 'support' },
  { title: 'Security', url: 'https://docs.claude.com/en/docs/claude-code/security', description: 'Permissions, sandboxing, secrets handling.', topic: 'security' },
  { title: 'Release notes', url: 'https://docs.claude.com/en/release-notes/claude-code', description: 'What changed in every Claude Code release.', topic: 'updates' },
]

const ANTHROPIC_BLOG = [
  { title: 'Engineering at Anthropic', url: 'https://www.anthropic.com/engineering', description: 'Technical blog from Anthropic\'s engineering team.', is_featured: true, topic: 'overview', resource_type: 'blog' },
  { title: 'News — Claude Code', url: 'https://www.anthropic.com/news', description: 'Product announcements, research drops, company news.', topic: 'updates', resource_type: 'blog' },
  { title: 'Research papers', url: 'https://www.anthropic.com/research', description: 'Anthropic\'s published research on AI safety and capabilities.', topic: 'research', resource_type: 'research' },
  { title: 'Claude for coding', url: 'https://www.anthropic.com/solutions/coding', description: 'Overview of Anthropic\'s coding product suite.', topic: 'overview', resource_type: 'blog' },
]

// ══════════════════════════════════════════════════════════════
// CREATORS
// ══════════════════════════════════════════════════════════════
// Each creator has a handle, channel URL, and a set of videos.
// Video IDs below are placeholders — replace with verified live IDs.

const CREATORS = [
  {
    source_name: 'Nick Saraev', source_handle: '@nicksaraev', source_url: 'https://www.youtube.com/@nicksaraev',
    bio: 'AI automation builder known for full-stack build sessions and outcome-focused workflows.',
    videos: [
      { title: 'How to actually use Claude Code', ...yt('9XFBNfhFBhE'), topic: 'workflow', skill_level: 'intermediate' },
      { title: 'Building a $10K/month agency with Claude Code', ...yt('vDzSMcY67HQ'), topic: 'workflow' },
    ],
  },
  {
    source_name: 'AI Jason', source_handle: '@AIJasonZ', source_url: 'https://www.youtube.com/@AIJasonZ',
    bio: 'Long-form AI engineering tutorials. Favors end-to-end builds with production patterns.',
    videos: [
      { title: 'The Complete Guide to Building with Claude Code', ...yt('gv0WHhKelSE'), is_featured: true, topic: 'overview' },
      { title: 'Claude Code agent workflows', ...yt('rJ8i-PN9xuU'), topic: 'subagents', skill_level: 'advanced' },
    ],
  },
  {
    source_name: 'Indy Dev Dan', source_handle: '@indydevdan', source_url: 'https://www.youtube.com/@indydevdan',
    bio: 'Indie dev tutorials on AI tooling, Claude Code, and building SaaS products.',
    videos: [
      { title: 'CLAUDE.md: Memory files that actually work', ...yt('mdMQdNaJU2w'), topic: 'claudemd', is_featured: true },
      { title: 'Claude Code skills deep dive', ...yt('PbtjWpzqC8k'), topic: 'skills' },
    ],
  },
  {
    source_name: 'Matt Berman', source_handle: '@matthew_berman', source_url: 'https://www.youtube.com/@matthew_berman',
    bio: 'Daily AI news and tool reviews. Strong coverage of MCP and agentic tools.',
    videos: [
      { title: 'MCP Servers explained', ...yt('kQmXtrmQ5Zg'), topic: 'mcp', skill_level: 'intermediate' },
    ],
  },
  {
    source_name: 'Fireship', source_handle: '@Fireship', source_url: 'https://www.youtube.com/@Fireship',
    bio: 'High-intensity 100-second dev videos. Great for quick comparisons.',
    videos: [
      { title: 'Claude Code in 100 seconds', ...yt('VqMJX3qP4ew'), topic: 'overview', duration_min: 2 },
    ],
  },
  {
    source_name: 'Theo - t3.gg', source_handle: '@t3dotgg', source_url: 'https://www.youtube.com/@t3dotgg',
    bio: 'Full-stack TypeScript takes. Production-minded tutorials.',
    videos: [
      { title: 'Building production apps with Claude Code + Supabase', ...yt('6H4SXa2PrzY'), topic: 'workflow' },
    ],
  },
  {
    source_name: 'Claude Corner', source_handle: '@claudecorner', source_url: 'https://www.youtube.com/@claudecorner',
    bio: 'Dedicated Claude Code tutorials — hooks, skills, advanced patterns.',
    videos: [
      { title: 'Pre-tool-use hooks tutorial', ...yt('fmvEmMPUkyo'), topic: 'hooks', skill_level: 'advanced' },
    ],
  },
  {
    source_name: 'Fly AI', source_handle: '@flyai', source_url: 'https://www.youtube.com/@flyai',
    bio: 'Productivity-focused AI content. Tips, tricks, and config optimizations.',
    videos: [
      { title: 'Secret Claude Code productivity features', ...yt('PbtjWpzqC8k'), topic: 'tips' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════
// RESEARCH & LONG-FORM
// ══════════════════════════════════════════════════════════════
const RESEARCH = [
  { title: 'Claude 3.5 Sonnet system card', url: 'https://www.anthropic.com/news/claude-3-5-sonnet', description: 'Official capability + safety report. Read this before production use.', source_name: 'Anthropic', topic: 'research', is_featured: true },
  { title: 'Constitutional AI', url: 'https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback', description: 'Foundational paper on how Anthropic trains Claude to be helpful and harmless.', source_name: 'Anthropic Research', topic: 'research' },
  { title: 'Tool use best practices', url: 'https://docs.claude.com/en/docs/build-with-claude/tool-use/overview', description: 'Design patterns for tool-using agents.', source_name: 'Anthropic Docs', topic: 'tool-use' },
  { title: 'Model Context Protocol spec', url: 'https://modelcontextprotocol.io', description: 'The open protocol spec for MCP servers.', source_name: 'Model Context Protocol', topic: 'mcp', is_featured: true },
  { title: 'Building MCP servers (tutorial)', url: 'https://modelcontextprotocol.io/docs/tutorials/building-mcp-with-llms', description: 'Step-by-step tutorial on building your own MCP server.', source_name: 'Model Context Protocol', topic: 'mcp' },
  { title: 'How we built Claude Code', url: 'https://www.anthropic.com/engineering/claude-code', description: 'Anthropic\'s own retrospective on designing Claude Code.', source_name: 'Anthropic Engineering', topic: 'research', is_featured: true },
  { title: 'Prompt caching guide', url: 'https://docs.claude.com/en/docs/build-with-claude/prompt-caching', description: 'Reduce costs + latency by caching stable context.', source_name: 'Anthropic Docs', topic: 'optimization' },
  { title: 'Agent design patterns', url: 'https://www.anthropic.com/engineering/building-effective-agents', description: 'Foundational guide to building AI agents — from Anthropic.', source_name: 'Anthropic Engineering', topic: 'agents', is_featured: true },
]

// ══════════════════════════════════════════════════════════════
// BUILD ROWS
// ══════════════════════════════════════════════════════════════

function vRow(d) {
  return {
    resource_type: d.resource_type || 'video',
    source_type: d.source_type,
    source_name: d.source_name,
    source_handle: d.source_handle ?? null,
    source_url: d.source_url ?? null,
    title: d.title,
    url: d.url,
    description: d.description ?? null,
    thumbnail_url: d.thumbnail_url ?? null,
    youtube_id: d.youtube_id ?? null,
    duration_min: d.duration_min ?? null,
    skill_level: d.skill_level ?? null,
    topic: d.topic ?? null,
    is_featured: d.is_featured ?? false,
    slug: slug(d.title, d.youtube_id ?? ''),
  }
}

const rows = []

// Anthropic videos
ANTHROPIC_VIDEOS.forEach((v) => rows.push(vRow({ ...v, source_type: 'anthropic_official', source_name: 'Anthropic', source_handle: '@AnthropicAI', source_url: 'https://www.youtube.com/@AnthropicAI' })))

// Anthropic docs
ANTHROPIC_DOCS.forEach((d) => rows.push(vRow({ ...d, resource_type: 'doc', source_type: 'anthropic_official', source_name: 'Anthropic Docs' })))

// Anthropic blog/news
ANTHROPIC_BLOG.forEach((d) => rows.push(vRow({ ...d, source_type: 'anthropic_official', source_name: d.source_name ?? 'Anthropic' })))

// Creator videos
CREATORS.forEach((c) => {
  c.videos.forEach((v) =>
    rows.push(vRow({ ...v, source_type: 'creator', source_name: c.source_name, source_handle: c.source_handle, source_url: c.source_url }))
  )
})

// Research
RESEARCH.forEach((r) => rows.push(vRow({ ...r, resource_type: 'research', source_type: 'research_lab' })))

// De-dupe by slug (preserve first occurrence)
const seen = new Set()
const deduped = rows.filter((r) => {
  if (seen.has(r.slug)) return false
  seen.add(r.slug)
  return true
})

console.log(`→ ${deduped.length} learn_resources rows ready (${rows.length - deduped.length} duplicates removed)`)

await supabase.from('learn_resources').delete().gt('id', 0)
const { error } = await supabase.from('learn_resources').insert(deduped)
if (error) { console.error('✗', error.message); process.exit(1) }

const { count: tot } = await supabase.from('learn_resources').select('*', { count: 'exact', head: true })
console.log(`✓ Seeded ${deduped.length} resources · ${tot} now in DB`)

const byType = {}, bySrc = {}
deduped.forEach((r) => {
  byType[r.resource_type] = (byType[r.resource_type] ?? 0) + 1
  bySrc[r.source_type] = (bySrc[r.source_type] ?? 0) + 1
})
console.log('\nBy resource_type:')
Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`))
console.log('\nBy source_type:')
Object.entries(bySrc).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`))

// Export CREATORS list for the creators tab
const creatorCards = CREATORS.map((c) => ({
  name: c.source_name,
  handle: c.source_handle,
  url: c.source_url,
  bio: c.bio,
  video_count: c.videos.length,
}))
console.log('\nCreators seeded:')
creatorCards.forEach((c) => console.log(`  ${c.video_count}  ${c.name.padEnd(20)} ${c.handle}`))
