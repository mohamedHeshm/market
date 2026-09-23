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
  const { data, error } = await supabase.from('stores').update(payload).eq('id', id).select().single()
  if (error) throw error
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

export interface StoreSalesSummary {
  today: { revenue: number; orders: number }
  month: { revenue: number; orders: number }
  year: { revenue: number; orders: number }
}

/**
 * Sales totals for a store, bucketed by day/month/year. Only counts
 * DELIVERED orders (completed sales), consistent with how revenue is
 * computed elsewhere in the dashboards (admin/store stat cards).
 */
export async function getStoreSales(storeId: string): Promise<StoreSalesSummary> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

  const bucket = (from: string) =>
    supabase.from('orders_view').select('total').eq('store_id', storeId).eq('status', 'DELIVERED').gte('created_at', from)

  const [dayRes, monthRes, yearRes] = await Promise.all([bucket(startOfDay), bucket(startOfMonth), bucket(startOfYear)])

  for (const res of [dayRes, monthRes, yearRes]) {
    if (res.error) throw res.error
  }

  const summarize = (rows: { total: number }[] | null) => ({
    revenue: (rows ?? []).reduce((sum, r) => sum + Number(r.total), 0),
    orders: rows?.length ?? 0,
  })

  return {
    today: summarize(dayRes.data),
    month: summarize(monthRes.data),
    year: summarize(yearRes.data),
  }
}