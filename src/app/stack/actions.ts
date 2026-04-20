'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  return { supabase, user }
}

export async function createProject(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  if (!name) return
  const { supabase, user } = await requireUser()
  await supabase.from('projects').insert({ user_id: user.id, name, description })
  revalidatePath('/stack')
}

export async function renameProject(id: string, name: string) {
  const { supabase } = await requireUser()
  await supabase.from('projects').update({ name }).eq('id', id)
  revalidatePath('/stack')
}

export async function deleteProject(id: string) {
  const { supabase } = await requireUser()
  await supabase.from('projects').delete().eq('id', id)
  revalidatePath('/stack')
}

export async function addToolToProject(projectId: string, toolId: number) {
  const { supabase } = await requireUser()
  await supabase.from('stack_items').insert({ project_id: projectId, tool_id: toolId, fields: {} })
  revalidatePath('/stack')
}

export async function addCustomTool(projectId: string, name: string, url: string | null) {
  const { supabase } = await requireUser()
  await supabase.from('stack_items').insert({
    project_id: projectId,
    custom_tool_name: name,
    custom_tool_url: url,
    fields: {},
  })
  revalidatePath('/stack')
}

export async function removeStackItem(itemId: string) {
  const { supabase } = await requireUser()
  await supabase.from('stack_items').delete().eq('id', itemId)
  revalidatePath('/stack')
}

export async function updateFields(itemId: string, fields: Record<string, string>) {
  const { supabase } = await requireUser()
  await supabase.from('stack_items').update({ fields }).eq('id', itemId)
  revalidatePath('/stack')
}

export async function signOut() {
  const { supabase } = await requireUser()
  await supabase.auth.signOut()
  redirect('/')
}
