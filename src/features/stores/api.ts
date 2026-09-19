import { supabase } from '@/lib/supabase'
import type { Store } from '@/types'

export async function listStores(opts: { search?: string; includeInactive?: boolean } = {}) {
  let query = supabase.from('stores').select('*').order('name', { ascending: true })
  if (!opts.includeInactive) query = query.eq('is_active', true)
  if (opts.search) query = query.ilike('name', `%${opts.search}%`)
  const { data, error } = await query
  if (error) throw error
  return data as Store[]
}

export async function getStore(id: string) {
  const { data, error } = await supabase.from('stores').select('*').eq('id', id).single()
  if (error) throw error
  return data as Store
}

export async function getMyStore(ownerId: string) {
  const { data, error } = await supabase.from('stores').select('*').eq('owner_id', ownerId).maybeSingle()
  if (error) throw error
  return data as Store | null
}

export async function createStore(payload: Partial<Store>) {
  const { data, error } = await supabase.from('stores').insert(payload).select().single()
  if (error) throw error
  return data as Store
}

export async function updateStore(id: string, payload: Partial<Store>) {
  console.log('UPDATE STORE ID:', id)
  console.log('UPDATE STORE PAYLOAD:', payload)

  const { data, error } = await supabase
    .from('stores')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  console.log('UPDATE STORE DATA:', data)
  console.log('UPDATE STORE ERROR:', error)

  if (error) {
    console.error('UPDATE STORE ERROR DETAILS:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    throw error
  }

  return data as Store
}
export async function deleteStore(id: string) {
  const { error } = await supabase.from('stores').delete().eq('id', id)
  if (error) throw error
}

export async function storeRating(storeId: string) {
  const { data, error } = await supabase.from('reviews').select('rating').eq('store_id', storeId)
  if (error) throw error
  const ratings = (data ?? []).map((r) => r.rating)
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
  return { average: avg, count: ratings.length }
}
