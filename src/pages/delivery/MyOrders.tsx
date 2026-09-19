import { Link } from 'react-router-dom'
import { Bike } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyDeliveryOrders } from '@/features/delivery/hooks'
import { Badge } from '@/components/ui/primitives'
import { EmptyState } from '@/components/common/States'
import { ORDER_STATUS_LABELS } from '@/constants'
import type { OrderStatus } from '@/types'

export default function DeliveryMyOrdersPage() {
  const { session } = useAuth()
  const { data: orders, isLoading } = useMyDeliveryOrders(session?.user.id)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">طلباتي</h1>

      {isLoading ? null : !orders || orders.length === 0 ? (
        <EmptyState title="لم تستلم أي طلبات بعد" icon={<Bike size={22} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/delivery/orders/${order.id}`}
              className="flex items-center justify-between rounded-card border border-line bg-surface p-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  {(order as unknown as { store: { name: string } | null }).store?.name ?? 'متجر'}
                </p>
                <p className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
              <Badge tone={order.status === 'DELIVERED' ? 'success' : 'amber'}>{ORDER_STATUS_LABELS[order.status as OrderStatus]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
