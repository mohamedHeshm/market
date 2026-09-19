import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useStores } from '@/features/stores/hooks'
import { StoreCard } from '@/components/common/StoreCard'
import { StoreCardSkeleton } from '@/components/common/States'
import { EmptyState } from '@/components/common/States'

export default function StoresPage() {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 350)
    return () => clearTimeout(t)
  }, [term])

  const { data: stores, isLoading } = useStores(debounced)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">المتاجر</h1>
      <div className="relative">
        <Search className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن متجر..."
          className="h-11 w-full rounded-lg border border-line bg-surface ps-3.5 pe-11 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      ) : stores && stores.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <EmptyState title="لا توجد متاجر" description="لم نعثر على متاجر مطابقة لبحثك." />
      )}
    </div>
  )
}
