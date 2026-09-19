import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as api from './api'
import type { OrderStatus } from '@/types'

export function useMyOrders(userId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`orders-user-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ['orders', 'mine', userId] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, qc])

  return useQuery({
    queryKey: ['orders', 'mine', userId],
    queryFn: () => api.listMyOrders(userId as string),
    enabled: Boolean(userId),
  })
}

export function useOrder(orderId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!orderId) return
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => qc.invalidateQueries({ queryKey: ['orders', orderId] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, qc])

  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => api.getOrder(orderId as string),
    enabled: Boolean(orderId),
  })
}

export function useStoreOrders(storeId?: string, status?: OrderStatus) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!storeId) return
    const channel = supabase
      .channel(`orders-store-${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
        () => qc.invalidateQueries({ queryKey: ['orders', 'store', storeId] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, qc])

  return useQuery({
    queryKey: ['orders', 'store', storeId, status],
    queryFn: () => api.listStoreOrders(storeId as string, status),
    enabled: Boolean(storeId),
  })
}

export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['orders', 'admin', status],
    queryFn: () => api.listAdminOrders(status),
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useAdvanceOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => api.advanceOrderStatus(orderId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useSubmitPaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, ref, proofUrl }: { orderId: string; ref: string; proofUrl: string }) =>
      api.submitPaymentProof(orderId, ref, proofUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })
}
