import { useState } from 'react'
import { Package } from 'lucide-react'
import { useOrderItems } from '@/features/orders/hooks'
import { Skeleton } from '@/components/common/States'
import { formatCurrency } from '@/utils/pricing'
import type { OrderItemDetail } from '@/features/orders/api'

function ItemImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-300 sm:size-20" aria-label="لا توجد صورة">
        <Package size={22} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-16 shrink-0 rounded-lg bg-brand-50 object-cover sm:size-20"
    />
  )
}

function ItemRow({ item }: { item: OrderItemDetail }) {
  // Historical snapshot first (what the customer actually bought); the live
  // product row is only a fallback for old orders created before snapshots.
  const name = item.product_name ?? item.product?.name ?? 'منتج غير متاح'
  const image = item.product_image_url ?? item.product?.image_url ?? null
  const hadDiscount = item.original_price > item.price

  return (
    <li className="flex items-center gap-3 py-3">
      <ItemImage src={image} alt={name} />

      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-ink">{name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span>سعر الوحدة: {formatCurrency(item.price)}</span>
          {hadDiscount && <span className="line-through">{formatCurrency(item.original_price)}</span>}
        </p>
        <p className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-800">
          الكمية: {item.quantity}
        </p>
      </div>

      <div className="shrink-0 text-end">
        <p className="text-[11px] text-muted">الإجمالي</p>
        <p className="text-sm font-bold text-ink">{formatCurrency(item.price * item.quantity)}</p>
      </div>
    </li>
  )
}

interface OrderItemsListProps {
  orderId: string
  subtotal: number
  deliveryFee: number
  total: number
}

/**
 * Full breakdown of one order, loaded from the database by order id:
 * every product on its own row with its image, name, quantity, unit price
 * and line subtotal, followed by the item count and order totals.
 */
export function OrderItemsList({ orderId, subtotal, deliveryFee, total }: OrderItemsListProps) {
  const { data: items, isLoading, isError } = useOrderItems(orderId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="py-3 text-sm text-danger">تعذر تحميل منتجات هذا الطلب، حاول مرة أخرى.</p>
  }

  if (!items || items.length === 0) {
    return <p className="py-3 text-sm text-muted">لا توجد منتجات مسجلة لهذا الطلب.</p>
  }

  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>

      <dl className="mt-1 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between text-ink-soft">
          <dt>عدد المنتجات ({items.length} صنف)</dt>
          <dd className="font-medium text-ink">{totalUnits} قطعة</dd>
        </div>
        <div className="flex justify-between text-ink-soft">
          <dt>المجموع الفرعي</dt>
          <dd>{formatCurrency(subtotal)}</dd>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-ink-soft">
            <dt>رسوم التوصيل</dt>
            <dd>{formatCurrency(deliveryFee)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
          <dt>الإجمالي النهائي</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>
    </div>
  )
}