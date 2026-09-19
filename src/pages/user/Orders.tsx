import { Link } from 'react-router-dom'
import { ClipboardList, Store as StoreIcon } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyOrders } from '@/features/orders/hooks'
import { EmptyState } from '@/components/common/States'
import { Badge } from '@/components/ui/primitives'
import { ORDER_STATUS_LABELS } from '@/constants'
import type { OrderStatus } from '@/types'

const statusTone: Record<OrderStatus, 'brand' | 'success' | 'danger' | 'amber' | 'neutral'> = {
  PENDING: 'neutral',
  CONFIRMED: 'brand',
  PREPARING: 'brand',
  READY_FOR_DELIVERY: 'amber',
  ASSIGNED: 'amber',
  ON_THE_WAY: 'amber',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REJECTED: 'danger',
}

export default function OrdersPage() {
  const { session } = useAuth()
  const { data: orders, isLoading } = useMyOrders(session?.user.id)

  if (!isLoading && (!orders || orders.length === 0)) {
    return <EmptyState title="لا توجد طلبات" description="ابدأ بطلب من متجرك المفضل الآن." icon={<ClipboardList size={24} />} />
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">طلباتي</h1>
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-card bg-black/5" />)
          : orders?.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <StoreIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {(order as unknown as { store: { name: string } | null }).store?.name ?? 'متجر'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone={statusTone[order.status as OrderStatus]}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
                  <span className="text-sm font-semibold text-ink">{order.total.toFixed(2)} ج.م</span>
                </div>
              </Link>
            ))}
      </div>
    </div>
  )
}
