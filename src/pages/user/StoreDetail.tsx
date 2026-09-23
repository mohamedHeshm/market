import { useParams } from 'react-router-dom'
import { Store as StoreIcon, Phone, MapPin, Clock } from 'lucide-react'
import { useStore, useStoreRating } from '@/features/stores/hooks'
import { useProducts } from '@/features/products/hooks'
import { useStoreReviews } from '@/features/reviews/hooks'
import { RatingStars } from '@/components/common/RatingStars'
import { ProductCard } from '@/components/common/ProductCard'
import { ProductCardSkeleton, EmptyState, ErrorState } from '@/components/common/States'
import { Skeleton } from '@/components/common/States'
import { Badge } from '@/components/ui/primitives'
import { isStoreOpenNow, formatTime } from '@/utils/hours'

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: store, isLoading, isError } = useStore(id)
  const { data: rating } = useStoreRating(id)
  const { data: productData, isLoading: productsLoading } = useProducts({ storeId: id })
  const { data: reviews } = useStoreReviews(id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    )
  }

  if (isError || !store) return <ErrorState message="تعذر تحميل بيانات المتجر" />

  if (!store.is_active) {
    return <EmptyState title="هذا المتجر غير متاح حاليًا" description="يمكنك تصفح متاجر أخرى نشطة." />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center gap-4 p-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
            {store.image_url ? (
              <img src={store.image_url} alt={store.name} className="size-full object-cover" />
            ) : (
              <StoreIcon className="text-brand-600" size={28} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-ink">{store.name}</h1>
              {store.opens_at && store.closes_at && (
                <Badge tone={isStoreOpenNow(store) ? 'success' : 'danger'}>
                  {isStoreOpenNow(store) ? 'مفتوح الآن' : 'مغلق الآن'}
                </Badge>
              )}
            </div>
            {store.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{store.description}</p>}
            {rating && rating.count > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <RatingStars value={rating.average} />
                <span className="text-xs text-muted">
                  {rating.average.toFixed(1)} ({rating.count} تقييم)
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-line px-4 py-3 text-xs text-muted">
          {store.phone && (
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {store.phone}
            </span>
          )}
          {store.address && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {store.address}
            </span>
          )}
          {store.opens_at && store.closes_at && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {formatTime(store.opens_at)} - {formatTime(store.closes_at)}
            </span>
          )}
        </div>
      </div>

      {store.opens_at && store.closes_at && !isStoreOpenNow(store) && (
        <div className="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          هذا المتجر مغلق حاليًا. مواعيد العمل: {formatTime(store.opens_at)} - {formatTime(store.closes_at)}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">المنتجات</h2>
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : productData && productData.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {productData.items.map((p) => (
              <ProductCard key={p.id} product={p} storeName={store.name} />
            ))}
          </div>
        ) : (
          <EmptyState title="لا توجد منتجات" description="لم يقم هذا المتجر بإضافة منتجات بعد." />
        )}
      </section>

      {reviews && reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink">التقييمات</h2>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-card border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{(r as unknown as { user: { name: string } }).user?.name ?? 'عميل'}</span>
                  <RatingStars value={r.rating} size={13} />
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-ink-soft">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}