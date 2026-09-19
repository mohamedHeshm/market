import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'

export async function listProducts(opts: {
  storeId?: string
  categoryId?: string
  search?: string
  includeInactive?: boolean
  page?: number
  pageSize?: number
} = {}) {
  const page = opts.page ?? 0
  const pageSize = opts.pageSize ?? 20
  let query = supabase.from('products').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (!opts.includeInactive) query = query.eq('is_active', true)
  if (opts.storeId) query = query.eq('store_id', opts.storeId)
  if (opts.categoryId) query = query.eq('category_id', opts.categoryId)
  if (opts.search) query = query.ilike('name', `%${opts.search}%`)

  query = query.range(page * pageSize, page * pageSize + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { items: data as Product[], count: count ?? 0 }
}

export async function getProduct(id: string) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw error
  return data as Product
}

export async function createProduct(payload: Partial<Product>) {
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
