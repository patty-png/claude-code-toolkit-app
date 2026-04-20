/* eslint-disable */
// Runs a SQL migration file against Supabase using service role key.
// Usage: node scripts/run-migration.mjs migrations/002_phase6_tool_metadata.sql

import { config } from 'dotenv'
import postgres from 'postgres'
import fs from 'node:fs'
import path from 'node:path'

config({ path: '.env.local' })

const file = process.argv[2]
if (!file) { console.error('Usage: node scripts/run-migration.mjs <path/to.sql>'); process.exit(1) }
const absPath = path.resolve(file)
if (!fs.existsSync(absPath)) { console.error(`✗ Not found: ${absPath}`); process.exit(1) }

const sql = fs.readFileSync(absPath, 'utf8')
const connString = process.env.DATABASE_URL
if (!connString) { console.error('✗ DATABASE_URL not set in .env.local'); process.exit(1) }

const client = postgres(connString, { prepare: false, max: 1 })

try {
  console.log(`→ Running ${path.basename(absPath)} (${sql.length} bytes)…`)
  await client.unsafe(sql)
  console.log(`✓ Migration applied`)
} catch (err) {
  console.error(`✗ Migration failed:`, err.message)
  process.exit(1)
} finally {
  await client.end()
}
