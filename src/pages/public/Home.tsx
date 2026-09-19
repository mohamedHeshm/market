import { Link, Navigate } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { useCategories } from '@/features/categories/hooks'
import { useStores } from '@/features/stores/hooks'
import { StoreCard } from '@/components/common/StoreCard'
import { Skeleton, StoreCardSkeleton } from '@/components/common/States'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_HOME_ROUTE } from '@/constants'

export default function HomePage() {
  const { profile } = useAuth()
  const { data: categories, isLoading: catsLoading } = useCategories()
  const { data: stores, isLoading: storesLoading } = useStores()

  // ADMIN / STORE / DELIVERY accounts have no business browsing the public
  // shopping home page — send them straight to their own dashboard.
  if (profile && profile.role !== 'USER') {
    return <Navigate to={ROLE_HOME_ROUTE[profile.role]} replace />
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-card bg-brand-900 px-6 py-9 text-white">
        <h1 className="text-2xl font-bold leading-snug md:text-3xl">
          كل اللي بيتك محتاجه،
          <br />
          على وصلة وحدة.
        </h1>
        <p className="mt-2 max-w-md text-sm text-brand-100">
          اطلب من مطاعمك ومتاجرك المفضلة، وتابع طلبك لحظة بلحظة لحد ما يوصلك.
        </p>
        <Link
          to="/stores"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-ink"
        >
          <Search size={16} />
          تصفح المتاجر
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-ink">الأقسام</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {catsLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-card" />)
            : categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.id}`}
                  className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-3 text-center transition-colors hover:border-brand-300"
                >
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-brand-50">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="size-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-brand-700">{cat.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="line-clamp-1 text-xs font-medium text-ink-soft">{cat.name}</span>
                </Link>
              ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">متاجر مقترحة</h2>
          <Link to="/stores" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            عرض الكل <ArrowLeft size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {storesLoading
            ? Array.from({ length: 4 }).map((_, i) => <StoreCardSkeleton key={i} />)
            : stores?.slice(0, 6).map((store) => <StoreCard key={store.id} store={store} />)}
        </div>
      </section>
    </div>
  )
}
