import { PackageSearch, MapPin, Phone } from 'lucide-react'
import { useAvailableOrders, useAcceptOrder } from '@/features/delivery/hooks'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'
import { EmptyState } from '@/components/common/States'

export default function DeliveryAvailableOrdersPage() {
  const { data: orders, isLoading } = useAvailableOrders()
  const accept = useAcceptOrder()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">الطلبات المتاحة</h1>

      {isLoading ? null : !orders || orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات متاحة حاليًا" description="سيتم تحديث القائمة تلقائيًا عند توفر طلبات جديدة." icon={<PackageSearch size={22} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Card key={order.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">
                  {(order as unknown as { store: { name: string } | null }).store?.name ?? 'متجر'}
                </p>
                <span className="text-sm font-bold text-brand-800">{order.total.toFixed(2)} ج.م</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {(order as unknown as { store: { address: string } | null }).store?.address ?? '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone size={13} /> {order.phone}
                </span>
              </div>
              <Button onClick={() => accept.mutate(order.id)} loading={accept.isPending}>
                استلام الطلب
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
