import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Package, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useProduct } from '@/features/products/hooks'
import { useStore } from '@/features/stores/hooks'
import { useCart } from '@/features/cart/CartContext'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/States'
import { PriceTag } from '@/components/common/PriceTag'
import { getPricing, formatCurrency } from '@/utils/pricing'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, isError } = useProduct(id)
  const { data: store } = useStore(product?.store_id)
  const { addItem, replaceWith } = useCart()
  const [qty, setQty] = useState(1)
  const [conflict, setConflict] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-square w-full rounded-card" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    )
  }

  if (isError || !product) return <ErrorState message="تعذر تحميل المنتج" />

  const pricing = getPricing(product)

  function handleAdd() {
    if (!product) return
    addItem(
      {
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: pricing.finalPrice,
        originalPrice: pricing.originalPrice,
        imageUrl: product.image_url,
        quantity: qty,
      },
      store?.name ?? '',
      () => setConflict(true)
    )
    if (!conflict) toast.success('تمت إضافة المنتج إلى السلة')
  }

  function handleReplace() {
    if (!product) return
    replaceWith(
      {
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: pricing.finalPrice,
        originalPrice: pricing.originalPrice,
        imageUrl: product.image_url,
        quantity: qty,
      },
      store?.name ?? ''
    )
    setConflict(false)
    toast.success('تم تفريغ السلة وإضافة المنتج الجديد')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-brand-50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-brand-300">
            <Package size={40} />
          </div>
        )}
        {pricing.hasDiscount && pricing.discountLabel && (
          <span className="absolute start-3 top-3 rounded-full bg-amber-accent px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
            {pricing.discountLabel}
          </span>
        )}
      </div>

      <div>
        {store && (
          <Link to={`/stores/${store.id}`} className="text-xs font-medium text-brand-700 hover:underline">
            {store.name}
          </Link>
        )}
        <h1 className="mt-1 text-xl font-bold text-ink">{product.name}</h1>
        <PriceTag
          className="mt-2"
          size="lg"
          originalPrice={pricing.originalPrice}
          finalPrice={pricing.finalPrice}
          discountLabel={pricing.discountLabel}
        />
        {product.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{product.description}</p>}
      </div>

      {!product.is_active ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">هذا المنتج غير متاح حاليًا</p>
      ) : (
        <div className="sticky bottom-20 flex items-center gap-3 rounded-card border border-line bg-surface p-3 shadow-sm md:bottom-4">
          <div className="flex items-center gap-3 rounded-lg border border-line px-2 py-1.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="تقليل" className="text-ink-soft">
              <Minus size={16} />
            </button>
            <span className="w-5 text-center text-sm font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="زيادة" className="text-ink-soft">
              <Plus size={16} />
            </button>
          </div>
          <Button onClick={handleAdd} className="flex-1">
            إضافة إلى السلة · {formatCurrency(pricing.finalPrice * qty)}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={conflict}
        title="السلة تحتوي على منتجات من متجر آخر"
        description="هل تريد تفريغ السلة وإضافة المنتج الجديد؟"
        confirmLabel="تفريغ وإضافة"
        onConfirm={handleReplace}
        onCancel={() => setConflict(false)}
      />
    </div>
  )
}
