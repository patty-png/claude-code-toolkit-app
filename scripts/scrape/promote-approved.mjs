/* eslint-disable */
// Promote staging_tools rows with status='approved' into the live tools table.
// Dedupes by identity_key: if a tool already exists, updates missing fields only.
// After promotion, marks staging row status='merged'.

import { supabase, slugify } from './_lib.mjs'

const { data: staged, error } = await supabase
  .from('staging_tools')
  .select('*')
  .eq('status', 'approved')

if (error) { console.error('✗', error.message); process.exit(1) }

console.log(`→ ${staged.length} approved staging rows to promote\n`)

let created = 0, updated = 0, skipped = 0

for (const s of staged) {
  // Does a live tool with this identity_key already exist?
  const { data: existing } = await supabase
    .from('tools')
    .select('id, slug, blurb, github_url, publisher, repo_name')
    .eq('identity_key', s.identity_key)
    .maybeSingle()

  if (existing) {
    // Merge: only fill in nulls on the existing row
    const merge = {}
    if (!existing.github_url && s.github_url) merge.github_url = s.github_url
    if (!existing.publisher && s.publisher)   merge.publisher = s.publisher
    if (!existing.repo_name && s.repo_name)   merge.repo_name = s.repo_name
    if (!existing.blurb && s.blurb)           merge.blurb = s.blurb
    merge.last_seen_at = new Date().toISOString()

    if (Object.keys(merge).length > 1) {
      await supabase.from('tools').update(merge).eq('id', existing.id)
      updated++
    } else {
      skipped++
    }
  } else {
    // Create new tool row
    let slug = slugify(s.name)
    let n = 1
    // Ensure slug uniqueness
    while (true) {
      const { data: clash } = await supabase.from('tools').select('id').eq('slug', slug).maybeSingle()
      if (!clash) break
      slug = `${slugify(s.name)}-${++n}`
    }

    const insert = {
      slug,
      name: s.name,
      category_id: s.category_hint ?? 'tool',
      tag: s.tag,
      blurb: s.blurb || s.name,     // blurb is NOT NULL — fallback to name
      url: s.url ?? s.github_url,
      install_command: s.install_command,
      github_url: s.github_url,
      publisher: s.publisher,
      repo_name: s.repo_name,
      identity_key: s.identity_key,
      source: s.source,
      last_seen_at: new Date().toISOString(),
    }

    const { error: insErr } = await supabase.from('tools').insert(insert)
    if (insErr) {
      console.warn(`  ✗ ${s.name}: ${insErr.message}`)
      continue
    }
    created++
  }

  await supabase.from('staging_tools').update({ status: 'merged', reviewed_at: new Date().toISOString() }).eq('id', s.id)
}

console.log(`\n✓ Promoted: ${created} new · ${updated} merged · ${skipped} already had everything\n`)

const { count: total } = await supabase.from('tools').select('*', { count: 'exact', head: true })
console.log(`  Live tools total: ${total}`)
