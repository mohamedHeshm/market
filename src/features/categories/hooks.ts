import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { Category } from '@/types'

export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['categories', { includeInactive }],
    queryFn: () => api.listCategories({ includeInactive }),
  })
}

export function useCategory(id?: string) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => api.getCategory(id as string),
    enabled: Boolean(id),
  })
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const create = useMutation({
    mutationFn: (payload: Pick<Category, 'name' | 'description' | 'image_url'>) => api.createCategory(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Category> }) => api.updateCategory(id, payload),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
