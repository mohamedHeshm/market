import { Link } from 'react-router-dom'
import { PackageSearch, Bike } from 'lucide-react'
import { useAvailableOrders } from '@/features/delivery/hooks'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyDeliveryOrders } from '@/features/delivery/hooks'
import { StatCard } from '@/components/common/StatCard'

export default function DeliveryDashboardPage() {
  const { session } = useAuth()
  const { data: available } = useAvailableOrders()
  const { data: mine } = useMyDeliveryOrders(session?.user.id)

  const active = mine?.filter((o) => o.status === 'ASSIGNED' || o.status === 'ON_THE_WAY').length ?? 0
  const delivered = mine?.filter((o) => o.status === 'DELIVERED').length ?? 0

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-ink">مرحبًا بك</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="طلبات متاحة الآن" value={available?.length ?? 0} icon={<PackageSearch size={18} />} />
        <StatCard label="طلبات نشطة لدي" value={active} icon={<Bike size={18} />} />
        <StatCard label="طلبات تم تسليمها" value={delivered} icon={<Bike size={18} />} />
      </div>
      <Link
        to="/delivery/available"
        className="flex items-center justify-center rounded-card bg-brand-800 px-5 py-4 text-center text-sm font-semibold text-white"
      >
        عرض الطلبات المتاحة للتوصيل
      </Link>
    </div>
  )
}
