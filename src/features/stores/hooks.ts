import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { Store } from '@/types'

export function useStores(search = '', includeInactive = false) {
  return useQuery({
    queryKey: ['stores', { search, includeInactive }],
    queryFn: () => api.listStores({ search, includeInactive }),
  })
}

export function useStore(id?: string) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => api.getStore(id as string),
    enabled: Boolean(id),
  })
}

export function useMyStore(ownerId?: string) {
  return useQuery({
    queryKey: ['stores', 'mine', ownerId],
    queryFn: () => api.getMyStore(ownerId as string),
    enabled: Boolean(ownerId),
  })
}

export function useStoreRating(storeId?: string) {
  return useQuery({
    queryKey: ['stores', storeId, 'rating'],
    queryFn: () => api.storeRating(storeId as string),
    enabled: Boolean(storeId),
  })
}

export function useStoreMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['stores'] })

  const create = useMutation({ mutationFn: (payload: Partial<Store>) => api.createStore(payload), onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Store> }) => api.updateStore(id, payload),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: string) => api.deleteStore(id), onSuccess: invalidate })

  return { create, update, remove }
}
