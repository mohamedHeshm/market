import { toast } from 'sonner'
import { ClipboardList, Banknote, Clock } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore } from '@/features/stores/hooks'
import { useStoreOrders, useAdvanceOrderStatus } from '@/features/orders/hooks'
import { Badge, Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/common/States'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants'
import { formatCurrency } from '@/utils/pricing'
import type { Order, OrderStatus, PaymentMethod } from '@/types'

const simpleNextActions: Partial<Record<OrderStatus, Array<{ label: string; status: OrderStatus; danger?: boolean }>>> = {
  CONFIRMED: [{ label: 'بدء التجهيز', status: 'PREPARING' }],
  PREPARING: [{ label: 'جاهز للتوصيل', status: 'READY_FOR_DELIVERY' }],
}

export default function StoreOrdersPage() {
  const { session } = useAuth()
  const { data: store } = useMyStore(session?.user.id)
  const { data: orders, isLoading } = useStoreOrders(store?.id)
  const advance = useAdvanceOrderStatus()

  async function handleAdvance(orderId: string, status: OrderStatus) {
    try {
      await advance.mutateAsync({ orderId, status })
      toast.success('تم تحديث حالة الطلب')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      toast.error(message.includes('Payment not verified') ? 'لا يمكن قبول الطلب قبل تأكيد الدفع من الإدارة' : 'تعذر تحديث حالة الطلب')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">طلبات المتجر</h1>

      {isLoading ? null : !orders || orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات" icon={<ClipboardList size={22} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {(orders as Order[]).map((order) => {
            // Wallet orders must be verified by the admin before the store
            // can accept them; Cash on Delivery is never gated this way.
            const awaitingPaymentVerification =
              order.status === 'PENDING' && order.payment_method === 'CASH_WALLET' && order.payment_status !== 'PAID'

            return (
              <Card key={order.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">طلب #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted">{new Date(order.created_at).toLocaleString('ar-EG')}</p>
                  </div>
                  <Badge tone="brand">{ORDER_STATUS_LABELS[order.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-ink-soft">
                  <span>
                    {(order as unknown as { items: Array<{ id: string; quantity: number }> }).items?.length ?? 0} منتج ·{' '}
                    {formatCurrency(order.total)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs">
                    <Banknote size={13} />
                    {PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod] ?? '—'}
                  </span>
                </div>

                {awaitingPaymentVerification ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-accent/15 px-3 py-2 text-xs font-medium text-amber-accent-dark">
                      <Clock size={14} />
                      بانتظار تأكيد الإدارة لعملية الدفع قبل إمكانية قبول الطلب
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleAdvance(order.id, 'REJECTED')}
                      loading={advance.isPending}
                      className="self-start"
                    >
                      رفض الطلب
                    </Button>
                  </div>
                ) : order.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAdvance(order.id, 'CONFIRMED')} loading={advance.isPending}>
                      تأكيد الطلب
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleAdvance(order.id, 'REJECTED')} loading={advance.isPending}>
                      رفض الطلب
                    </Button>
                  </div>
                ) : (
                  simpleNextActions[order.status] && (
                    <div className="flex gap-2">
                      {simpleNextActions[order.status]!.map((action) => (
                        <Button key={action.status} size="sm" onClick={() => handleAdvance(order.id, action.status)} loading={advance.isPending}>
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}