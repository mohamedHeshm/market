import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Package } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore } from '@/features/stores/hooks'
import { useProducts, useProductMutations } from '@/features/products/hooks'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, ProductCardSkeleton } from '@/components/common/States'
import { PriceTag } from '@/components/common/PriceTag'
import { getPricing } from '@/utils/pricing'

export default function StoreProductsPage() {
  const { session } = useAuth()
  const { data: store } = useMyStore(session?.user.id)
  const { data: productData, isLoading } = useProducts({ storeId: store?.id, includeInactive: true, pageSize: 100 })
  const { update, remove } = useProductMutations()
  const [toDelete, setToDelete] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">منتجاتي</h1>
        <Link to="/store/products/new">
          <Button size="sm">
            <Plus size={15} /> منتج جديد
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !productData || productData.items.length === 0 ? (
        <EmptyState title="لا توجد منتجات بعد" description="ابدأ بإضافة أول منتج لمتجرك." icon={<Package size={22} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {productData.items.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                <PriceTag className="mt-0.5" size="sm" {...getPricing(p)} />
              </div>
              <Badge tone={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'نشط' : 'معطل'}</Badge>
              <div className="flex shrink-0 gap-1.5">
                <Link to={`/store/products/${p.id}`}>
                  <Button size="sm" variant="outline">
                    تعديل
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: p.id, payload: { is_active: !p.is_active } })}>
                  {p.is_active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setToDelete(p.id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المنتج"
        danger
        confirmLabel="حذف"
        onConfirm={async () => {
          if (toDelete) {
            await remove.mutateAsync(toDelete)
            toast.success('تم حذف المنتج')
          }
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
