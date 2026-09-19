import { Link } from 'react-router-dom'
import { Store as StoreIcon } from 'lucide-react'
import type { Store } from '@/types'
import { RatingStars } from '@/components/common/RatingStars'
import { useStoreRating } from '@/features/stores/hooks'

export function StoreCard({ store }: { store: Store }) {
  const { data: rating } = useStoreRating(store.id)
  return (
    <Link
      to={`/stores/${store.id}`}
      className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-brand-300"
    >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
        {store.image_url ? (
          <img src={store.image_url} alt={store.name} className="size-full object-cover" />
        ) : (
          <StoreIcon className="text-brand-600" size={24} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
        {store.description && <p className="mt-0.5 truncate text-xs text-muted">{store.description}</p>}
        {rating && rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <RatingStars value={rating.average} size={12} />
            <span className="text-[11px] text-muted">({rating.count})</span>
          </div>
        )}
      </div>
    </Link>
  )
}
