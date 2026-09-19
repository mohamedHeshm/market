import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

export async function listAvailableOrders() {
  const { data, error } = await supabase
    .from('orders_view')
    .select('*, store:stores(name, address, phone)')
    .eq('status', 'READY_FOR_DELIVERY')
    .is('delivery_id', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function listMyDeliveryOrders(deliveryId: string) {
  const { data, error } = await supabase
    .from('orders_view')
    .select('*, store:stores(name, address, phone), address:addresses(*)')
    .eq('delivery_id', deliveryId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function acceptOrder(orderId: string) {
  const { data, error } = await supabase.rpc('accept_order', { p_order_id: orderId })
  if (error) throw error
  return data as Order
}
