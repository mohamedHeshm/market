import { useState } from 'react'
import { toast } from 'sonner'
import { Bike, Info } from 'lucide-react'
import { useUsers, useUserMutations } from '@/features/users/hooks'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/common/States'

export default function AdminDeliveryPage() {
  const { data: deliveryUsers, isLoading } = useUsers('DELIVERY')
  const { data: candidateUsers } = useUsers('USER')
  const { setActive, setRole, remove } = useUserMutations()
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [promoteId, setPromoteId] = useState('')

  function handlePromote() {
    if (!promoteId) return
    setRole.mutate(
      { id: promoteId, role: 'DELIVERY' },
      {
        onSuccess: () => {
          toast.success('تم منح صلاحية مندوب توصيل')
          setPromoteId('')
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">مندوبو التوصيل</h1>

      <div className="flex items-start gap-2 rounded-card border border-brand-100 bg-brand-50 p-3 text-xs text-brand-800">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>لإضافة مندوب جديد، اطلب منه إنشاء حساب عادي من صفحة التسجيل أولًا، ثم امنحه صلاحية مندوب توصيل من هنا.</p>
      </div>

      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">اختر مستخدمًا لترقيته إلى مندوب</label>
          <select
            value={promoteId}
            onChange={(e) => setPromoteId(e.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-sm outline-none focus:border-brand-600"
          >
            <option value="">اختر مستخدم...</option>
            {candidateUsers?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.phone ?? 'بدون هاتف'}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handlePromote} disabled={!promoteId}>
          <Bike size={16} /> تعيين كمندوب
        </Button>
      </div>

      {isLoading ? null : !deliveryUsers || deliveryUsers.length === 0 ? (
        <EmptyState title="لا يوجد مندوبو توصيل بعد" icon={<Bike size={22} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {deliveryUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-card border border-line bg-surface p-3.5">
              <div>
                <p className="text-sm font-semibold text-ink">{u.name}</p>
                <p className="text-xs text-muted">{u.phone ?? 'بدون هاتف'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'مفعل' : 'معطل'}</Badge>
                <Button size="sm" variant="outline" onClick={() => setActive.mutate({ id: u.id, isActive: !u.is_active })}>
                  {u.is_active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setToDelete(u.id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المندوب"
        description="هل أنت متأكد من حذف حساب هذا المندوب؟"
        danger
        confirmLabel="حذف"
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
