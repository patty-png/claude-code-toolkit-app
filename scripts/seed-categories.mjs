/* eslint-disable */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const CATEGORIES = [
  { id: 'mcp',    label: 'MCPs',             short_label: 'MCP',      emoji: '🔌', sort_order: 1 },
  { id: 'skill',  label: 'Skills',           short_label: 'Skill',    emoji: '✨', sort_order: 2 },
  { id: 'agent',  label: 'Agents',           short_label: 'Agent',    emoji: '🤖', sort_order: 3 },
  { id: 'auto',   label: 'Hooks & Obs',      short_label: 'Hooks',    emoji: '🪝', sort_order: 4 },
  { id: 'tool',   label: 'Editors & Tools',  short_label: 'Editors',  emoji: '🛠️',  sort_order: 5 },
  { id: 'saas',   label: 'Web & SaaS',       short_label: 'SaaS',     emoji: '☁️',  sort_order: 6 },
  { id: 'res',    label: 'Research',         short_label: 'Research', emoji: '🔬', sort_order: 7 },
  { id: 'learn',  label: 'Learning',         short_label: 'Learn',    emoji: '📚', sort_order: 8 },
]

const { error } = await supabase.from('categories').upsert(CATEGORIES, { onConflict: 'id' })

if (error) {
  console.error('✗ Seed failed:', error.message)
  process.exit(1)
}

const { count } = await supabase.from('categories').select('*', { count: 'exact', head: true })
console.log(`✓ Seeded ${CATEGORIES.length} categories`)
console.log(`→ ${count} categories in DB`)
