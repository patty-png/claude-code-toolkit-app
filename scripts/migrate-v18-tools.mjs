/* eslint-disable */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

config({ path: '.env.local' })

const V18_PATH = path.resolve('../claude-code-toolkit/index.html')

if (!fs.existsSync(V18_PATH)) {
  console.error(`✗ v18 index.html not found at ${V18_PATH}`)
  process.exit(1)
}

const html = fs.readFileSync(V18_PATH, 'utf8')

// Extract TOOLS = [...]
const toolsMatch = html.match(/const TOOLS = (\[[\s\S]*?\n\]);/)
if (!toolsMatch) {
  console.error('✗ Could not locate TOOLS array in v18 index.html')
  process.exit(1)
}

const sandbox = {}
vm.createContext(sandbox)
vm.runInContext(`TOOLS = ${toolsMatch[1]}`, sandbox)
const V18_TOOLS = sandbox.TOOLS

console.log(`→ Parsed ${V18_TOOLS.length} tools from v18`)

// v18 granular categories → our 8 seeded category ids
const CAT_MAP = {
  // MCPs (any flavor)
  'official-mcp': 'mcp',
  'community-mcp': 'mcp',
  'browser-mcp': 'mcp',
  'db-mcp': 'mcp',
  'devops-mcp': 'mcp',
  'mcp': 'mcp',
  // Skills
  'skill': 'skill',
  // Agents / subagents / multi-agent frameworks / companions
  'subagent': 'agent',
  'framework': 'agent',
  'companion': 'agent',
  'agent': 'agent',
  // Hooks & observability
  'hook': 'auto',
  'obs': 'auto',
  'usage': 'auto',
  'marketplace': 'auto',
  'auto': 'auto',
  // Editors & local tooling
  'terminal': 'tool',
  'local': 'tool',
  'knowledge': 'tool',
  'tool': 'tool',
  // SaaS / web
  'saas': 'saas',
  // Research (nothing in v18 yet, reserved)
  'res': 'res',
  'research': 'res',
  // Learning (reserved for Phase 4)
  'learn': 'learn',
  // Custom (user-added via My Stack) — bucket into tools
  'custom': 'tool',
}

const slugify = (s) =>
  s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const seen = new Set()

const rows = V18_TOOLS.map((t, idx) => {
  let slug = slugify(t.name)
  while (seen.has(slug)) slug = `${slug}-${idx}`
  seen.add(slug)
  const cat = t.cat ?? t.category ?? 'tool'
  return {
    slug,
    name: t.name,
    category_id: CAT_MAP[cat] ?? 'tool',
    tag: t.tag ?? null,
    blurb: t.blurb ?? '',
    url: t.url ?? null,
    install_command: t.install ?? null,
    install_notes: t.installNotes ?? null,
    is_featured: idx < 5,
    feature_rank: idx < 5 ? idx + 1 : null,
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Batch insert 50 at a time
const BATCH = 50
let inserted = 0
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH)
  const { error } = await supabase.from('tools').upsert(chunk, { onConflict: 'slug' })
  if (error) {
    console.error(`✗ Batch ${i / BATCH + 1} failed:`, error.message)
    process.exit(1)
  }
  inserted += chunk.length
  process.stdout.write(`\r→ ${inserted}/${rows.length} tools inserted`)
}

const { count } = await supabase.from('tools').select('*', { count: 'exact', head: true })
console.log(`\n✓ Done. ${count} tools in DB`)

const { data: featured } = await supabase.from('tools').select('name, feature_rank').eq('is_featured', true).order('feature_rank')
console.log('\nTop 5 featured:')
featured?.forEach(f => console.log(`  ${f.feature_rank}. ${f.name}`))
