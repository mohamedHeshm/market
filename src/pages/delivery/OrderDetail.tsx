import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Phone, User } from 'lucide-react'
import { useOrder, useAdvanceOrderStatus } from '@/features/orders/hooks'
import { StatusTimeline } from '@/components/common/StatusTimeline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'
import { ErrorState, Skeleton } from '@/components/common/States'

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(id)
  const advance = useAdvanceOrderStatus()

  if (isLoading) return <Skeleton className="h-64 w-full rounded-card" />
  if (isError || !order) return <ErrorState message="تعذر تحميل الطلب" />

  const store = (order as unknown as { store: { name: string; phone?: string } | null }).store
  const address = (order as unknown as { address: { address: string } | null }).address

  async function handleNext(status: 'ON_THE_WAY' | 'DELIVERED') {
    if (!order) return
    try {
      await advance.mutateAsync({ orderId: order.id, status })
      toast.success('تم تحديث حالة الطلب')
    } catch {
      toast.error('تعذر تحديث الحالة')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-ink">طلب من {store?.name}</h1>

      <Card className="p-4">
        <StatusTimeline status={order.status} />
      </Card>

      <Card className="flex flex-col gap-2 p-4 text-sm">
        <p className="flex items-center gap-2 text-ink-soft">
          <User size={15} /> العميل
        </p>
        <p className="flex items-center gap-2 text-ink-soft">
          <Phone size={15} /> {order.phone}
        </p>
        <p className="flex items-center gap-2 text-ink-soft">
          <MapPin size={15} /> {address?.address ?? '—'}
        </p>
      </Card>

      {order.status === 'ASSIGNED' && (
        <Button onClick={() => handleNext('ON_THE_WAY')} loading={advance.isPending}>
          بدء التوصيل
        </Button>
      )}
      {order.status === 'ON_THE_WAY' && (
        <Button onClick={() => handleNext('DELIVERED')} loading={advance.isPending}>
          تم التسليم
        </Button>
      )}
    </div>
  )
}
