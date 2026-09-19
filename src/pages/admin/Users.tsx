import { useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { useUsers, useUserMutations } from '@/features/users/hooks'
import { Select } from '@/components/ui/primitives'
import { Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { ROLE_LABELS } from '@/constants'
import type { UserRole } from '@/types'
import { EmptyState } from '@/components/common/States'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const { data: users, isLoading } = useUsers(role || undefined, search || undefined)
  const { setActive, setRole: setRoleMutation, remove } = useUserMutations()
  const [toDelete, setToDelete] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">المستخدمون</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم..."
            className="h-11 w-full rounded-lg border border-line bg-surface ps-3.5 pe-10 text-sm outline-none focus:border-brand-600"
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value as UserRole | '')} className="sm:w-48">
          <option value="">كل الأدوار</option>
          {Object.entries(ROLE_LABELS).map(([r, label]) => (
            <option key={r} value={r}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? null : !users || users.length === 0 ? (
        <EmptyState title="لا يوجد مستخدمون مطابقون" />
      ) : (
        <div className="overflow-x-auto scroll-thin rounded-card border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs text-muted">
                <th className="px-4 py-3 text-start font-medium">الاسم</th>
                <th className="px-4 py-3 text-start font-medium">الهاتف</th>
                <th className="px-4 py-3 text-start font-medium">الدور</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onChange={(e) => setRoleMutation.mutate({ id: u.id, role: e.target.value as UserRole })}
                      className="h-9 w-32 text-xs"
                    >
                      {Object.entries(ROLE_LABELS).map(([r, label]) => (
                        <option key={r} value={r}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'مفعل' : 'معطل'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActive.mutate({ id: u.id, isActive: !u.is_active })
                          toast.success(u.is_active ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
                        }}
                      >
                        {u.is_active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setToDelete(u.id)}>
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المستخدم"
        description="سيتم حذف بيانات هذا المستخدم نهائيًا. هذا الإجراء لا يمكن التراجع عنه."
        danger
        confirmLabel="حذف نهائي"
        onConfirm={async () => {
          if (toDelete) {
            await remove.mutateAsync(toDelete)
            toast.success('تم حذف المستخدم')
          }
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
