'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function voteOnTool(toolId: number, value: 1 | -1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  // Check existing vote
  const { data: existing } = await supabase
    .from('tool_votes')
    .select('id, value')
    .eq('tool_id', toolId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.value === value) {
      // Same click again → remove the vote
      await supabase.from('tool_votes').delete().eq('id', existing.id)
    } else {
      // Flip the vote
      await supabase.from('tool_votes').update({ value }).eq('id', existing.id)
    }
  } else {
    await supabase.from('tool_votes').insert({ tool_id: toolId, user_id: user.id, value })
  }

  revalidatePath(`/explore`, 'layout')
  return { ok: true }
}

export async function addToStackFromDetail(toolId: number, projectId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  // If no project specified, use (or create) a default "My Stack" project
  let targetProjectId = projectId
  if (!targetProjectId) {
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existing) {
      targetProjectId = existing.id
    } else {
      const { data: created } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name: 'My Stack', description: 'Default project' })
        .select('id')
        .single()
      if (!created) return { ok: false, error: 'project_create_failed' }
      targetProjectId = created.id
    }
  }

  // Avoid duplicate add
  const { data: already } = await supabase
    .from('stack_items')
    .select('id')
    .eq('project_id', targetProjectId)
    .eq('tool_id', toolId)
    .maybeSingle()
  if (already) return { ok: true, already: true }

  await supabase.from('stack_items').insert({ project_id: targetProjectId, tool_id: toolId, fields: {} })
  revalidatePath('/stack')
  return { ok: true, projectId: targetProjectId }
}
