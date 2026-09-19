import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { Product } from '@/types'

export function useProducts(opts: {
  storeId?: string
  categoryId?: string
  search?: string
  includeInactive?: boolean
  page?: number
  pageSize?: number
} = {}) {
  return useQuery({
    queryKey: ['products', opts],
    queryFn: () => api.listProducts(opts),
  })
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.getProduct(id as string),
    enabled: Boolean(id),
  })
}

export function useProductMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] })

  const create = useMutation({ mutationFn: (payload: Partial<Product>) => api.createProduct(payload), onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) => api.updateProduct(id, payload),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: string) => api.deleteProduct(id), onSuccess: invalidate })

  return { create, update, remove }
}
