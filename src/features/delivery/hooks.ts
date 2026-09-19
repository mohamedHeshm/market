import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import * as api from './api'
import { toast } from 'sonner'

export function useAvailableOrders() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('orders-available')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () =>
        qc.invalidateQueries({ queryKey: ['delivery', 'available'] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  return useQuery({
    queryKey: ['delivery', 'available'],
    queryFn: api.listAvailableOrders,
    refetchInterval: 15000,
  })
}

export function useMyDeliveryOrders(deliveryId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!deliveryId) return
    const channel = supabase
      .channel(`delivery-orders-${deliveryId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `delivery_id=eq.${deliveryId}` },
        () => qc.invalidateQueries({ queryKey: ['delivery', 'mine', deliveryId] })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [deliveryId, qc])

  return useQuery({
    queryKey: ['delivery', 'mine', deliveryId],
    queryFn: () => api.listMyDeliveryOrders(deliveryId as string),
    enabled: Boolean(deliveryId),
  })
}

export function useAcceptOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => api.acceptOrder(orderId),
    onSuccess: () => {
      toast.success('تم استلام الطلب بنجاح')
      qc.invalidateQueries({ queryKey: ['delivery'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'تعذر استلام الطلب'
      if (message.includes('already assigned')) {
        toast.error('تم استلام هذا الطلب من مندوب آخر قبلك')
      } else {
        toast.error('حدث خطأ أثناء محاولة استلام الطلب')
      }
      qc.invalidateQueries({ queryKey: ['delivery', 'available'] })
    },
  })
}
