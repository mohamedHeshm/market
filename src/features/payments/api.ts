import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/constants'
import type { PaymentSettings } from '@/types'

export async function getPaymentSettings() {
  const { data, error } = await supabase.from('payment_settings').select('*').limit(1).single()
  if (error) throw error
  return data as PaymentSettings
}

export async function updatePaymentSettings(walletEnabled: boolean, walletPhone: string | null) {
  const { data, error } = await supabase.rpc('update_payment_settings', {
    p_wallet_enabled: walletEnabled,
    p_wallet_phone: walletPhone,
  })
  if (error) throw error
  return data as PaymentSettings
}

export async function uploadPaymentProof(userId: string, orderId: string, file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${orderId}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.paymentProofs).upload(path, file, { upsert: true })
  if (error) throw error
  // payment-proofs is a PRIVATE bucket on purpose (payment screenshots are
  // sensitive). We store the storage PATH, not a public URL — a public
  // URL simply doesn't resolve for a private bucket. Whoever is allowed
  // to view it (the order's own customer or an admin, per the bucket's
  // storage policies) fetches a short-lived signed URL on demand via
  // getPaymentProofSignedUrl() below.
  return path
}

/**
 * Orders whose payment proof was uploaded before this fix have a full
 * (and, for a private bucket, non-functional) public URL stored in
 * payment_proof_url instead of a bare storage path. This extracts the
 * real object path from either format, so old and new uploads both work
 * without needing to touch any existing data.
 */
function toStoragePath(stored: string): string {
  const marker = `/${STORAGE_BUCKETS.paymentProofs}/`
  const idx = stored.indexOf(marker)
  return idx === -1 ? stored : stored.slice(idx + marker.length)
}

/** Generates a short-lived, authorized URL to view/download a payment proof image. */
export async function getPaymentProofSignedUrl(pathOrLegacyUrl: string) {
  const path = toStoragePath(pathOrLegacyUrl)
  const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.paymentProofs).createSignedUrl(path, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function listPendingPayments() {
  const { data, error } = await supabase
    .from('orders_view')
    .select('*, store:stores(name), user:profiles!orders_user_id_fkey(name, phone)')
    .eq('payment_status', 'WAITING_VERIFICATION')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function verifyPayment(orderId: string, approve: boolean) {
  const { data, error } = await supabase.rpc('verify_payment', { p_order_id: orderId, p_approve: approve })
  if (error) throw error
  return data
}