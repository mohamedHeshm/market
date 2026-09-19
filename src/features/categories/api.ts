import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export async function listCategories(opts: { includeInactive?: boolean } = {}) {
  let query = supabase.from('categories').select('*').order('name', { ascending: true })
  if (!opts.includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data as Category[]
}

export async function getCategory(id: string) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()
  if (error) throw error
  return data as Category
}

export async function createCategory(payload: Pick<Category, 'name' | 'description' | 'image_url'>) {
  const { data, error } = await supabase.from('categories').insert(payload).select().single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, payload: Partial<Category>) {
  const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
