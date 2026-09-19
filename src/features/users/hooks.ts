import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { Address, UserRole } from '@/types'

export function useAddresses(userId?: string) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => api.listAddresses(userId as string),
    enabled: Boolean(userId),
  })
}

export function useAddressMutations(userId?: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses', userId] })

  const create = useMutation({
    mutationFn: (payload: Partial<Address> & { address: string }) =>
      api.createAddress({ ...payload, user_id: userId as string }),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Address> }) =>
      api.updateAddress(id, userId as string, payload),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: string) => api.deleteAddress(id), onSuccess: invalidate })

  return { create, update, remove }
}

export function useUsers(role?: UserRole, search?: string) {
  return useQuery({
    queryKey: ['admin-users', role, search],
    queryFn: () => api.listUsers({ role, search }),
  })
}

export function useUserMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] })

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setUserActive(id, isActive),
    onSuccess: invalidate,
  })
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.setUserRole(id, role),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: (id: string) => api.deleteUser(id), onSuccess: invalidate })

  return { setActive, setRole, remove }
}
