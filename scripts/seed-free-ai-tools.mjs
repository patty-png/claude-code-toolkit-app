/* eslint-disable */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const TOOLS = [
  // ── Chatbots ──
  {
    name: 'ChatGPT', url: 'https://chat.openai.com', category: 'chatbot',
    description: "OpenAI's flagship conversational AI — the original AI chatbot that kicked off the modern AI era.",
    tool_summary: 'General-purpose LLM chat with GPT-4 / GPT-5, web browsing, image generation (DALL-E), and code execution.',
    use_cases: 'Writing, brainstorming, coding help, research summaries, translation. Free tier includes GPT-4 with limits.',
    has_free_tier: true,
  },
  {
    name: 'Claude', url: 'https://claude.ai', category: 'chatbot',
    description: "Anthropic's conversational AI, known for long-context reasoning and careful, nuanced responses.",
    tool_summary: 'Chat with Claude Sonnet 4.6 / Opus, upload PDFs, create Projects with shared context, use MCP tools.',
    use_cases: 'Long-form writing, code review, document analysis, research, anything needing careful reasoning.',
    has_free_tier: true,
  },
  {
    name: 'Gemini', url: 'https://gemini.google.com', category: 'chatbot',
    description: "Google's AI assistant, integrated with Google Workspace (Docs, Sheets, Gmail).",
    tool_summary: 'Chat with Gemini 2.5 Pro, image generation, deep research mode, code execution.',
    use_cases: 'Research with live web access, Google Workspace integration, free image generation.',
    has_free_tier: true,
  },
  {
    name: 'Perplexity', url: 'https://perplexity.ai', category: 'chatbot',
    description: 'AI-powered search engine that cites sources for every claim — the "answer engine".',
    tool_summary: 'Search + LLM chat hybrid. Every answer includes numbered citations to real web sources.',
    use_cases: 'Research, fact-checking, quick answers with verifiable sources. Great ChatGPT alternative for research.',
    has_free_tier: true,
  },
  {
    name: 'Poe', url: 'https://poe.com', category: 'chatbot',
    description: "Quora's multi-model AI platform — access GPT, Claude, Gemini, and 100+ bots in one interface.",
    tool_summary: 'Chat with multiple AI models side-by-side, create custom bots, share conversations.',
    use_cases: 'Compare responses across models, try specialized bots, one subscription for many models.',
    has_free_tier: true,
  },

  // ── Image generation ──
  {
    name: 'Midjourney', url: 'https://midjourney.com', category: 'design',
    description: 'Flagship AI image generator known for artistic, high-quality outputs.',
    tool_summary: 'Text-to-image generation via web UI or Discord. V7 model supports style references, moodboards.',
    use_cases: 'Illustrations, concept art, mood boards, social media visuals, book covers.',
    has_free_tier: false,
  },
  {
    name: 'Krea', url: 'https://krea.ai', category: 'design',
    description: 'Real-time AI design canvas — image, video, and 3D generation with live feedback.',
    tool_summary: 'Draw on a canvas and watch AI enhance in real-time. Includes image, video, 3D models, upscaling.',
    use_cases: 'Live design iteration, concept exploration, quick visual prototypes. Free tier available.',
    has_free_tier: true,
  },
  {
    name: 'Ideogram', url: 'https://ideogram.ai', category: 'design',
    description: 'AI image generator that actually renders text inside images correctly.',
    tool_summary: 'Text-to-image with specialty in typography, logos, and text-heavy graphics.',
    use_cases: 'Posters, logos, t-shirts, memes, any graphic that needs readable text.',
    has_free_tier: true,
  },
  {
    name: 'Flux (Black Forest Labs)', url: 'https://blackforestlabs.ai', category: 'design',
    description: 'Open-weight image model powering many top AI image apps.',
    tool_summary: 'Flux Pro, Dev, Schnell models for text-to-image. Often used via fal.ai or Replicate.',
    use_cases: 'Photorealistic images, fast generation with Flux Schnell, professional quality with Flux Pro.',
    has_free_tier: true,
  },
  {
    name: 'Leonardo.ai', url: 'https://leonardo.ai', category: 'design',
    description: 'AI image generator with game-asset-focused models and a generous free tier.',
    tool_summary: 'Text-to-image with style presets, image-to-image, upscaling, and Canvas for iterative edits.',
    use_cases: 'Game art, character design, concept art. 150 free tokens daily.',
    has_free_tier: true,
  },

  // ── Video / audio ──
  {
    name: 'Runway', url: 'https://runwayml.com', category: 'video',
    description: 'AI-powered video editing and generation suite used by professional filmmakers.',
    tool_summary: 'Gen-4 video generation, motion brush, green screen removal, AI editing tools.',
    use_cases: 'Short films, music videos, product videos, B-roll generation, rotoscoping.',
    has_free_tier: true,
  },
  {
    name: 'Pika', url: 'https://pika.art', category: 'video',
    description: 'AI video generator with character consistency and expressive animations.',
    tool_summary: 'Text-to-video, image-to-video, Pikaffects (cake explosion, squish, melt, etc.)',
    use_cases: 'Social media content, quick video prototypes, playful animations.',
    has_free_tier: true,
  },
  {
    name: 'Luma Dream Machine', url: 'https://lumalabs.ai/dream-machine', category: 'video',
    description: "Luma's AI video generator, known for smooth, photorealistic motion.",
    tool_summary: 'Text-to-video and image-to-video with end-frame control and loop support.',
    use_cases: 'Cinematic clips, product showcases, animated concept art.',
    has_free_tier: true,
  },
  {
    name: 'HeyGen', url: 'https://heygen.com', category: 'video',
    description: 'AI avatar video generator — create talking-head videos from text.',
    tool_summary: 'Custom AI avatars, 40+ languages, voice cloning, video translation.',
    use_cases: 'Training videos, product demos, localized marketing, explainer videos.',
    has_free_tier: true,
  },
  {
    name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'audio',
    description: 'Best-in-class AI voice generation and cloning.',
    tool_summary: 'Text-to-speech with 30+ languages, voice cloning, voice changer, sound effects.',
    use_cases: 'Podcasts, audiobooks, video voiceovers, game dialogue, accessibility.',
    has_free_tier: true,
  },
  {
    name: 'Suno', url: 'https://suno.com', category: 'audio',
    description: 'AI music generator — create full songs with vocals from a text prompt.',
    tool_summary: 'Generate complete songs with lyrics, vocals, and instrumentation. V4 model.',
    use_cases: 'Background music, jingles, custom songs, demos. 10 free songs/day.',
    has_free_tier: true,
  },

  // ── Writing ──
  {
    name: 'NotebookLM', url: 'https://notebooklm.google.com', category: 'writing',
    description: "Google's AI research assistant — ground answers in YOUR sources, not the open web.",
    tool_summary: 'Upload PDFs, docs, websites, audio. Chat with them, generate briefing docs, audio overviews.',
    use_cases: 'Research synthesis, study guides, podcast-style audio summaries from your notes.',
    has_free_tier: true,
  },
  {
    name: 'Grammarly', url: 'https://grammarly.com', category: 'writing',
    description: 'AI writing assistant — grammar, tone, clarity, and suggestions.',
    tool_summary: 'Real-time grammar and style checking in the browser, docs, email.',
    use_cases: 'Professional writing, emails, essays, blog posts. Free tier covers basics.',
    has_free_tier: true,
  },

  // ── Productivity ──
  {
    name: 'Notion AI', url: 'https://notion.so/product/ai', category: 'productivity',
    description: "AI features built into Notion's workspace — writing, summarization, Q&A across your docs.",
    tool_summary: 'AI writer, Q&A across workspace, translation, to-do generation. Built into the Notion app.',
    use_cases: 'Meeting notes, doc drafting, searching team knowledge, content generation.',
    has_free_tier: false,
  },

  // ── Coding assistants (non-Claude Code) ──
  {
    name: 'v0 by Vercel', url: 'https://v0.dev', category: 'coding',
    description: "Vercel's AI web designer — generate React + Tailwind UI from text prompts.",
    tool_summary: 'Chat-based UI generation. Outputs shadcn/ui components + Next.js code.',
    use_cases: 'Rapid prototyping, landing pages, dashboard design, copy-paste React components.',
    has_free_tier: true,
  },
  {
    name: 'Bolt.new', url: 'https://bolt.new', category: 'coding',
    description: "StackBlitz's AI full-stack builder — generates entire apps in-browser.",
    tool_summary: 'Prompts build full Node.js / Vite / Next.js apps with live preview in WebContainer.',
    use_cases: 'Rapid full-stack prototypes, MVPs, learning by example. Deploy directly.',
    has_free_tier: true,
  },
  {
    name: 'Lovable', url: 'https://lovable.dev', category: 'coding',
    description: 'AI app builder that generates full-stack React apps with Supabase backend.',
    tool_summary: 'Natural-language app generation with GitHub sync and Supabase integration built-in.',
    use_cases: 'MVP apps, internal tools, quick SaaS prototypes.',
    has_free_tier: true,
  },
  {
    name: 'Replit Agent', url: 'https://replit.com', category: 'coding',
    description: "Replit's AI agent that builds, tests, and deploys apps autonomously.",
    tool_summary: 'Agent creates multi-file projects, runs them, iterates based on errors — all in the browser.',
    use_cases: 'Learning projects, quick demos, non-coder app prototyping.',
    has_free_tier: true,
  },

  // ── Research ──
  {
    name: 'Elicit', url: 'https://elicit.com', category: 'research',
    description: 'AI research assistant for academic literature — find papers, summarize, extract data.',
    tool_summary: 'Search 200M+ papers, summarize findings, extract methodology/results into tables.',
    use_cases: 'Literature reviews, systematic reviews, staying current with research.',
    has_free_tier: true,
  },
  {
    name: 'Consensus', url: 'https://consensus.app', category: 'research',
    description: "AI-powered search across research papers — get evidence-based answers.",
    tool_summary: 'Ask a yes/no question, see what peer-reviewed studies actually say.',
    use_cases: 'Health decisions, policy questions, grounded research on specific claims.',
    has_free_tier: true,
  },

  // ── Data / analytics ──
  {
    name: 'Julius AI', url: 'https://julius.ai', category: 'data',
    description: 'AI data analyst — upload a spreadsheet, ask questions in natural language.',
    tool_summary: 'Chat with your data (CSV, Excel, Sheets). Generates charts, runs stats, writes Python.',
    use_cases: 'Non-SQL data exploration, business intelligence, quick chart generation.',
    has_free_tier: true,
  },

  // ── Image editing ──
  {
    name: 'Photopea', url: 'https://photopea.com', category: 'design',
    description: 'Free Photoshop-like image editor in the browser with AI features.',
    tool_summary: 'Full image editor, layers, filters. Free, no signup, works offline.',
    use_cases: 'Quick image edits without Photoshop, free alternative for students.',
    has_free_tier: true,
  },
  {
    name: 'Remove.bg', url: 'https://remove.bg', category: 'design',
    description: 'One-click background removal for any image.',
    tool_summary: 'AI background removal, outputs transparent PNG.',
    use_cases: 'Product photos, profile pictures, graphic design assets.',
    has_free_tier: true,
  },
  {
    name: 'Clipdrop', url: 'https://clipdrop.co', category: 'design',
    description: "Stability AI's suite of image tools — upscale, remove bg, relight, sketch to image.",
    tool_summary: 'Background removal, upscaling, cleanup, text-to-image with Stable Diffusion.',
    use_cases: 'Product photography enhancement, social content, image cleanup.',
    has_free_tier: true,
  },
]

const rows = TOOLS.map((t, i) => ({
  ...t,
  slug: slug(t.name),
  sort_order: i + 1,
}))

// Wipe + insert for idempotent re-runs
await supabase.from('free_ai_tools').delete().gt('id', 0)
const { error } = await supabase.from('free_ai_tools').insert(rows)
if (error) { console.error('✗', error.message); process.exit(1) }

const { count } = await supabase.from('free_ai_tools').select('*', { count: 'exact', head: true })
console.log(`✓ Seeded ${rows.length} free AI tools`)
console.log(`→ ${count} in DB`)

// Category breakdown
const byCat = {}
rows.forEach(r => byCat[r.category] = (byCat[r.category] ?? 0) + 1)
console.log('\nBy category:')
Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log(`  ${String(v).padStart(3)}  ${k}`)
)
