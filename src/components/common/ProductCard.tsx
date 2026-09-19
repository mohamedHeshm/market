import { Link } from 'react-router-dom'
import { Plus, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import { useCart } from '@/features/cart/CartContext'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { PriceTag } from '@/components/common/PriceTag'
import { getPricing } from '@/utils/pricing'
import { useState } from 'react'

export function ProductCard({ product, storeName }: { product: Product; storeName: string }) {
  const { addItem, replaceWith } = useCart()
  const [conflict, setConflict] = useState(false)
  const pricing = getPricing(product)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem(
      {
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: pricing.finalPrice,
        originalPrice: pricing.originalPrice,
        imageUrl: product.image_url,
        quantity: 1,
      },
      storeName,
      () => setConflict(true)
    )
    if (!conflict) toast.success('تمت إضافة المنتج إلى السلة')
  }

  function handleReplace() {
    replaceWith(
      {
        productId: product.id,
        storeId: product.store_id,
        name: product.name,
        price: pricing.finalPrice,
        originalPrice: pricing.originalPrice,
        imageUrl: product.image_url,
        quantity: 1,
      },
      storeName
    )
    setConflict(false)
    toast.success('تم تفريغ السلة وإضافة المنتج الجديد')
  }

  return (
    <>
      <Link to={`/product/${product.id}`} className="group flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-card bg-brand-50">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="size-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex size-full items-center justify-center text-brand-300">
              <Package size={28} />
            </div>
          )}
          {pricing.hasDiscount && pricing.discountLabel && (
            <span className="absolute start-2 top-2 rounded-full bg-amber-accent px-2 py-0.5 text-[11px] font-bold text-ink shadow-sm">
              {pricing.discountLabel}
            </span>
          )}
          <button
            onClick={handleAdd}
            className="absolute bottom-2 end-2 flex size-9 items-center justify-center rounded-full bg-brand-800 text-white shadow-md transition-transform active:scale-90"
            aria-label="إضافة إلى السلة"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-medium text-ink">{product.name}</p>
        <PriceTag
          className="mt-0.5"
          size="sm"
          originalPrice={pricing.originalPrice}
          finalPrice={pricing.finalPrice}
          discountLabel={pricing.discountLabel}
          showBadge={false}
        />
      </Link>

      <ConfirmDialog
        open={conflict}
        title="السلة تحتوي على منتجات من متجر آخر"
        description="هل تريد تفريغ السلة وإضافة المنتج الجديد؟"
        confirmLabel="تفريغ وإضافة"
        onConfirm={handleReplace}
        onCancel={() => setConflict(false)}
      />
    </>
  )
}
