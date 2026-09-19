import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useCart } from '@/features/cart/CartContext'
import { useStore } from '@/features/stores/hooks'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/common/States'
import { PriceTag } from '@/components/common/PriceTag'
import { DELIVERY_FEE_DEFAULT } from '@/constants'
import { formatCurrency } from '@/utils/pricing'

export default function CartPage() {
  const { cart, increment, decrement, removeItem, subtotal, clear } = useCart()
  const navigate = useNavigate()
  // Delivery fee is set per-store by the store owner. Fall back to the
  // platform default only while the store is still loading.
  const { data: store } = useStore(cart.storeId ?? undefined)
  const deliveryFee = store?.delivery_fee ?? DELIVERY_FEE_DEFAULT

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="السلة فارغة"
        description="أضف منتجات من متجرك المفضل لتبدأ طلبك."
        icon={<ShoppingCart size={24} />}
        action={
          <Link to="/stores">
            <Button variant="outline">تصفح المتاجر</Button>
          </Link>
        }
      />
    )
  }

  const totalSavings = cart.items.reduce((sum, i) => sum + (i.originalPrice - i.price) * i.quantity, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">السلة</h1>
        <button onClick={clear} className="text-sm font-medium text-danger hover:underline">
          إفراغ السلة
        </button>
      </div>
      {cart.storeName && <p className="text-sm text-muted">من متجر {cart.storeName}</p>}

      <div className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <PriceTag className="mt-0.5" size="sm" originalPrice={item.originalPrice} finalPrice={item.price} showBadge={false} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-line px-2 py-1">
                <button onClick={() => decrement(item.productId)} aria-label="تقليل">
                  <Minus size={14} />
                </button>
                <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => increment(item.productId)} aria-label="زيادة">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-danger" aria-label="حذف">
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex justify-between text-sm text-ink-soft">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="mt-1.5 flex justify-between text-sm text-success">
            <span>إجمالي التوفير من الخصومات</span>
            <span>- {formatCurrency(totalSavings)}</span>
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-sm text-ink-soft">
          <span>رسوم التوصيل</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
          <span>الإجمالي</span>
          <span>{formatCurrency(subtotal + deliveryFee)}</span>
        </div>
      </div>

      <Button size="lg" onClick={() => navigate('/checkout')}>
        متابعة إلى الدفع
      </Button>
    </div>
  )
}
