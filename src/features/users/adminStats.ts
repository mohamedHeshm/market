import { supabase } from '@/lib/supabase'

export async function fetchAdminStats() {
  const [users, stores, delivery, orders, pendingOrders, deliveredOrders] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'USER'),
    supabase.from('stores').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'DELIVERY'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'ASSIGNED', 'ON_THE_WAY']),
    supabase.from('orders').select('total').eq('status', 'DELIVERED'),
  ])

  const revenue = (deliveredOrders.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)

  return {
    totalUsers: users.count ?? 0,
    totalStores: stores.count ?? 0,
    totalDelivery: delivery.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    completedOrders: deliveredOrders.data?.length ?? 0,
    revenue,
  }
}
