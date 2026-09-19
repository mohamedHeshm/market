import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Store,
  Bike,
  ClipboardList,
  Clock,
  CheckCircle2,
  Wallet,
} from 'lucide-react'

import { fetchAdminStats } from '@/features/users/adminStats'
import { StatCard } from '@/components/common/StatCard'
import { Skeleton } from '@/components/common/States'
import { supabase } from '@/lib/supabase'

export default function AdminDashboardPage() {
    console.log('🔥 ADMIN DASHBOARD LOADED')
  // اختبار مؤقت للتأكد من الحساب الحالي وصلاحية Admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase.auth.getUser()

      console.log('CURRENT AUTH USER ID:', data.user?.id)
      console.log('CURRENT AUTH EMAIL:', data.user?.email)
      console.log('AUTH ERROR:', error)

      const { data: isAdmin, error: adminError } =
        await supabase.rpc('is_admin')

      console.log('IS ADMIN:', isAdmin)
      console.log('ADMIN ERROR:', adminError)
    }

    checkAdmin()
  }, [])

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
  })

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-ink">
        نظرة عامة
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-20 rounded-card"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="إجمالي العملاء"
            value={stats?.totalUsers ?? 0}
            icon={<Users size={18} />}
          />

          <StatCard
            label="إجمالي المتاجر"
            value={stats?.totalStores ?? 0}
            icon={<Store size={18} />}
          />

          <StatCard
            label="مندوبو التوصيل"
            value={stats?.totalDelivery ?? 0}
            icon={<Bike size={18} />}
          />

          <StatCard
            label="إجمالي الطلبات"
            value={stats?.totalOrders ?? 0}
            icon={<ClipboardList size={18} />}
          />

          <StatCard
            label="طلبات قيد التنفيذ"
            value={stats?.pendingOrders ?? 0}
            icon={<Clock size={18} />}
          />

          <StatCard
            label="طلبات مكتملة"
            value={stats?.completedOrders ?? 0}
            icon={<CheckCircle2 size={18} />}
          />

          <StatCard
            label="الإيرادات"
            value={`${(stats?.revenue ?? 0).toFixed(0)} ج.م`}
            icon={<Wallet size={18} />}
          />
        </div>
      )}
    </div>
  )
}