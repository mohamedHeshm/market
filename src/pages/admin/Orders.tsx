import { useState } from 'react'
import { useAdminOrders } from '@/features/orders/hooks'
import { Badge, Select } from '@/components/ui/primitives'
import { EmptyState } from '@/components/common/States'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants'
import { formatCurrency } from '@/utils/pricing'
import type { OrderStatus, PaymentMethod } from '@/types'

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const { data: orders, isLoading } = useAdminOrders(status || undefined)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">الطلبات</h1>

      <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')} className="sm:w-64">
        <option value="">كل الحالات</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([s, label]) => (
          <option key={s} value={s}>
            {label}
          </option>
        ))}
      </Select>

      {isLoading ? null : !orders || orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات" />
      ) : (
        <div className="overflow-x-auto scroll-thin rounded-card border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="px-4 py-3 text-start font-medium">العميل</th>
                <th className="px-4 py-3 text-start font-medium">المتجر</th>
                <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                <th className="px-4 py-3 text-start font-medium">طريقة الدفع</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{(o as unknown as { user: { name: string } | null }).user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{(o as unknown as { store: { name: string } | null }).store?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3 text-ink-soft">{PAYMENT_METHOD_LABELS[o.payment_method as PaymentMethod] ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
