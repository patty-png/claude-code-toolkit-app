/* eslint-disable */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const ytId = (url) => {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

const VIDEOS = [
  {
    title: 'Claude Code: A Highly Agentic CLI (official walkthrough)',
    url: 'https://www.youtube.com/watch?v=AJpK3YTTKZ4',
    channel: 'Anthropic', topic: 'intro', skill_level: 'beginner',
    description: "Anthropic's 30-minute intro to Claude Code — installation, first prompts, MCP basics.",
  },
  {
    title: 'The Complete Guide to Building with Claude Code',
    url: 'https://www.youtube.com/watch?v=gv0WHhKelSE',
    channel: 'AI Jason', topic: 'intro', skill_level: 'beginner',
    description: 'End-to-end build session covering project setup, planning mode, subagents, and shipping.',
  },
  {
    title: 'MCP Servers: Custom Tools for Claude',
    url: 'https://www.youtube.com/watch?v=kQmXtrmQ5Zg',
    channel: 'Matt Berman', topic: 'mcp', skill_level: 'intermediate',
    description: 'How Model Context Protocol servers extend Claude with custom tools and knowledge.',
  },
  {
    title: 'Claude Code Skills Deep Dive',
    url: 'https://www.youtube.com/watch?v=AJpK3YTTKZ4',
    channel: 'Anthropic', topic: 'skills', skill_level: 'intermediate',
    description: 'Build reusable skills with SKILL.md files, slash commands, and shared workflows.',
  },
  {
    title: 'Subagents + Parallel Task Execution in Claude Code',
    url: 'https://www.youtube.com/watch?v=rJ8i-PN9xuU',
    channel: 'AI Labs', topic: 'subagents', skill_level: 'advanced',
    description: 'Orchestrating multiple Claude instances for complex refactors and multi-file work.',
  },
  {
    title: 'CLAUDE.md: Memory Files That Actually Work',
    url: 'https://www.youtube.com/watch?v=mdMQdNaJU2w',
    channel: 'Indy Dev Dan', topic: 'claudemd', skill_level: 'beginner',
    description: 'Writing CLAUDE.md project memory files that Claude actually uses consistently.',
  },
  {
    title: 'Hooks: Pre/Post Tool-Use Automation',
    url: 'https://www.youtube.com/watch?v=fmvEmMPUkyo',
    channel: 'Claude Corner', topic: 'hooks', skill_level: 'advanced',
    description: 'Intercept tool calls, enforce policies, run linters/tests automatically.',
  },
  {
    title: 'Claude Code vs Cursor vs Cline: Head-to-Head',
    url: 'https://www.youtube.com/watch?v=VqMJX3qP4ew',
    channel: 'Fireship', topic: 'comparison', skill_level: 'beginner',
    description: 'Quick comparison of the top three agentic coding tools in 2026.',
  },
  {
    title: 'Building Production Apps with Claude Code + Supabase',
    url: 'https://www.youtube.com/watch?v=6H4SXa2PrzY',
    channel: 'Theo - t3.gg', topic: 'workflow', skill_level: 'intermediate',
    description: 'Full-stack SaaS build from scratch using Claude Code as the primary driver.',
  },
  {
    title: 'Plugins & Marketplaces: Extending Claude Code',
    url: 'https://www.youtube.com/watch?v=gDr_FBw9YSk',
    channel: 'Anthropic', topic: 'plugins', skill_level: 'intermediate',
    description: 'Install community plugins, slash command packs, and team-wide extensions.',
  },
  {
    title: 'Secret Productivity Features in Claude Code',
    url: 'https://www.youtube.com/watch?v=PbtjWpzqC8k',
    channel: 'Fly AI', topic: 'tips', skill_level: 'intermediate',
    description: "Lesser-known flags, shortcuts, and config tricks that power users rely on.",
  },
  {
    title: 'Agent Skills for Non-Coders',
    url: 'https://www.youtube.com/watch?v=eBmvUoAe7aE',
    channel: 'AI Foundations', topic: 'skills', skill_level: 'beginner',
    description: 'Build and use Claude Code skills without writing traditional code.',
  },
].map(v => ({ ...v, youtube_id: ytId(v.url), thumbnail_url: ytId(v.url) ? `https://i.ytimg.com/vi/${ytId(v.url)}/hqdefault.jpg` : null }))

const COURSES = [
  {
    title: 'Building Agents with Model Context Protocol',
    provider: 'DeepLearning.AI',
    url: 'https://www.deeplearning.ai/short-courses/building-agents-with-model-context-protocol/',
    price_usd: 0, is_free: true, has_certificate: true,
    skill_level: 'intermediate', duration_hours: 2,
    description: 'Official short course from Anthropic + Andrew Ng on building MCP-powered agents.',
  },
  {
    title: 'Claude Code Quickstart',
    provider: 'Anthropic',
    url: 'https://docs.claude.com/en/docs/claude-code',
    price_usd: 0, is_free: true, has_certificate: false,
    skill_level: 'beginner', duration_hours: 1,
    description: 'Official docs walk-through — installation, configuration, and first workflows.',
  },
  {
    title: 'Agentic AI Engineering',
    provider: 'Coursera',
    url: 'https://www.coursera.org/learn/agentic-ai',
    price_usd: 49, is_free: false, has_certificate: true,
    skill_level: 'advanced', duration_hours: 18,
    description: 'Comprehensive 4-week course on designing autonomous agent systems.',
  },
  {
    title: 'Prompt Engineering for Developers',
    provider: 'DeepLearning.AI',
    url: 'https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/',
    price_usd: 0, is_free: true, has_certificate: true,
    skill_level: 'beginner', duration_hours: 1.5,
    description: 'Foundational prompting techniques that translate directly to Claude Code sessions.',
  },
  {
    title: 'LangChain + LangGraph Intensive',
    provider: 'LangChain Academy',
    url: 'https://academy.langchain.com/',
    price_usd: 199, is_free: false, has_certificate: true,
    skill_level: 'advanced', duration_hours: 8,
    description: 'For teams integrating multi-agent graphs alongside Claude Code workflows.',
  },
  {
    title: 'Building with Claude: API Masterclass',
    provider: 'Anthropic Academy',
    url: 'https://www.anthropic.com/learn',
    price_usd: 0, is_free: true, has_certificate: false,
    skill_level: 'intermediate', duration_hours: 3,
    description: 'Deep dive on the Claude API, tool use, caching, and agent patterns.',
  },
]

// Clear existing for idempotent re-runs
await supabase.from('videos').delete().gt('id', 0)
await supabase.from('courses').delete().gt('id', 0)

const { error: vErr } = await supabase.from('videos').insert(VIDEOS)
if (vErr) { console.error('videos:', vErr.message); process.exit(1) }
console.log(`✓ Seeded ${VIDEOS.length} videos`)

const { error: cErr } = await supabase.from('courses').insert(COURSES)
if (cErr) { console.error('courses:', cErr.message); process.exit(1) }
console.log(`✓ Seeded ${COURSES.length} courses`)
