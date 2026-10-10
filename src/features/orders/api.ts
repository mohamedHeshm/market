import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus, PaymentMethod } from '@/types'

export interface CreateOrderInput {
  storeId: string
  addressId: string
  phone: string
  items: Array<{ product_id: string; quantity: number }>
  paymentMethod: PaymentMethod
  notes?: string
}

export async function createOrder(input: CreateOrderInput) {
  const { data, error } = await supabase.rpc('create_order', {
    p_store_id: input.storeId,
    p_address_id: input.addressId,
    p_phone: input.phone,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_notes: input.notes ?? null,
  })
  if (error) throw error
  return data as Order
}

export async function listMyOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders_view')
    .select('*, store:stores(id, name, image_url), items:order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders_view')
    .select('*, store:stores(id, name, image_url, phone), items:order_items(*, product:products(name)), address:addresses(*)')
    .eq('id', orderId)
    .single()
  if (error) throw error
  return data
}

export async function listStoreOrders(storeId: string, status?: OrderStatus) {
  let query = supabase
    .from('orders_view')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listAdminOrders(status?: OrderStatus) {
  let query = supabase
    .from('orders_view')
    .select('*, store:stores(name), user:profiles!orders_user_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function advanceOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { data, error } = await supabase.rpc('advance_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  })
  if (error) throw error
  return data as Order
}

export async function submitPaymentProof(orderId: string, transactionReference: string, proofUrl: string) {
  const { data, error } = await supabase.rpc('submit_payment_proof', {
    p_order_id: orderId,
    p_transaction_reference: transactionReference,
    p_proof_url: proofUrl,
  })
  if (error) throw error
  return data as Order
}

export interface OrderItemDetail {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  original_price: number
  total: number
  product_name: string | null
  product_image_url: string | null
  product: { name: string; image_url: string | null } | null
}

/**
 * Every line of one order, straight from order_items (the source of truth
 * for quantity and the price charged), joined to products only as a
 * fallback for old rows that predate the name/image snapshot columns.
 * RLS decides who may read them: the order's customer, the store that owns
 * the order, the assigned courier, and admins — no one else.
 */
export async function listOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select(
      'id, order_id, product_id, quantity, price, original_price, total, product_name, product_image_url, product:products(name, image_url)'
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as OrderItemDetail[]
}