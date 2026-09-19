import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'

export function usePaymentSettings() {
  return useQuery({ queryKey: ['payment-settings'], queryFn: api.getPaymentSettings })
}

export function useUpdatePaymentSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ walletEnabled, walletPhone }: { walletEnabled: boolean; walletPhone: string | null }) =>
      api.updatePaymentSettings(walletEnabled, walletPhone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-settings'] }),
  })
}

export function usePendingPayments() {
  return useQuery({ queryKey: ['payments', 'pending'], queryFn: api.listPendingPayments })
}

/** Signed URL for viewing/downloading one payment proof image, refreshed every time it's needed. */
export function usePaymentProofUrl(path?: string | null) {
  return useQuery({
    queryKey: ['payments', 'proof-url', path],
    queryFn: () => api.getPaymentProofSignedUrl(path as string),
    enabled: Boolean(path),
    staleTime: 5 * 60 * 1000, // signed URL is valid for 10 min server-side; refetch well before it expires
  })
}

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, approve }: { orderId: string; approve: boolean }) => api.verifyPayment(orderId, approve),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}