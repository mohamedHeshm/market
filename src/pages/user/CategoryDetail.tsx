import { useParams } from 'react-router-dom'
import { useCategory } from '@/features/categories/hooks'
import { useProducts } from '@/features/products/hooks'
import { useStores } from '@/features/stores/hooks'
import { ProductCard } from '@/components/common/ProductCard'
import { ProductCardSkeleton, EmptyState, ErrorState } from '@/components/common/States'

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: category, isError: catError } = useCategory(id)
  const { data: productData, isLoading } = useProducts({ categoryId: id })
  const { data: stores } = useStores()

  const storeNameFor = (storeId: string) => stores?.find((s) => s.id === storeId)?.name ?? ''

  if (catError) return <ErrorState message="تعذر تحميل القسم" />

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">{category?.name ?? '...'}</h1>
      {category?.description && <p className="text-sm text-muted">{category.description}</p>}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : productData && productData.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {productData.items.map((p) => (
            <ProductCard key={p.id} product={p} storeName={storeNameFor(p.store_id)} />
          ))}
        </div>
      ) : (
        <EmptyState title="لا توجد منتجات في هذا القسم حاليًا" />
      )}
    </div>
  )
}
