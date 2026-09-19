import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types'

export async function listStoreReviews(storeId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, user:profiles(name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReview(payload: { user_id: string; store_id: string; order_id: string; rating: number; comment?: string }) {
  const { data, error } = await supabase.from('reviews').insert(payload).select().single()
  if (error) throw error
  return data as Review
}

export function useStoreReviews(storeId?: string) {
  return useQuery({
    queryKey: ['reviews', storeId],
    queryFn: () => listStoreReviews(storeId as string),
    enabled: Boolean(storeId),
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createReview,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews', vars.store_id] })
      qc.invalidateQueries({ queryKey: ['stores', vars.store_id, 'rating'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
