import { useQuery } from '@tanstack/react-query'
import { Package, PackageCheck, Clock, CheckCircle2, Wallet } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore } from '@/features/stores/hooks'
import { supabase } from '@/lib/supabase'
import { StatCard } from '@/components/common/StatCard'
import { Skeleton } from '@/components/common/States'

async function fetchStoreStats(storeId: string) {
  const [totalProducts, activeProducts, pendingOrders, deliveredOrders] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('store_id', storeId).in('status', ['PENDING', 'CONFIRMED', 'PREPARING']),
    supabase.from('orders').select('total').eq('store_id', storeId).eq('status', 'DELIVERED'),
  ])
  const revenue = (deliveredOrders.data ?? []).reduce((sum, o) => sum + Number(o.total), 0)
  return {
    totalProducts: totalProducts.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    completedOrders: deliveredOrders.data?.length ?? 0,
    revenue,
  }
}

export default function StoreDashboardPage() {
  const { session } = useAuth()
  const { data: store } = useMyStore(session?.user.id)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['store-stats', store?.id],
    queryFn: () => fetchStoreStats(store!.id),
    enabled: Boolean(store?.id),
  })

  if (!store) {
    return <p className="text-sm text-muted">لم يتم ربط حسابك بمتجر بعد، يرجى التواصل مع إدارة المنصة.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-ink">مرحبًا، {store.name}</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="إجمالي المنتجات" value={stats?.totalProducts ?? 0} icon={<Package size={18} />} />
          <StatCard label="منتجات نشطة" value={stats?.activeProducts ?? 0} icon={<PackageCheck size={18} />} />
          <StatCard label="طلبات قيد التنفيذ" value={stats?.pendingOrders ?? 0} icon={<Clock size={18} />} />
          <StatCard label="طلبات مكتملة" value={stats?.completedOrders ?? 0} icon={<CheckCircle2 size={18} />} />
          <StatCard label="الإيرادات" value={`${(stats?.revenue ?? 0).toFixed(0)} ج.م`} icon={<Wallet size={18} />} />
        </div>
      )}
    </div>
  )
}
