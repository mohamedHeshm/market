import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Store as StoreIcon } from 'lucide-react'
import { useStores, useStoreMutations } from '@/features/stores/hooks'
import { useUsers, useUserMutations } from '@/features/users/hooks'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge, Card, Select } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/common/States'
import type { Store } from '@/types'

export default function AdminStoresPage() {
  const { data: stores, isLoading } = useStores('', true)
  const { data: storeRoleUsers } = useUsers('STORE')
  const { data: regularUsers } = useUsers('USER')
  const { create, update, remove } = useStoreMutations()
  const { setRole } = useUserMutations()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [form, setForm] = useState({ name: '', description: '', phone: '', address: '', owner_id: '' })
  const [toDelete, setToDelete] = useState<string | null>(null)

  const ownerCandidates = [...(storeRoleUsers ?? []), ...(regularUsers ?? [])]

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', phone: '', address: '', owner_id: '' })
    setShowForm(true)
  }

  function openEdit(store: Store) {
    setEditing(store)
    setForm({
      name: store.name,
      description: store.description ?? '',
      phone: store.phone ?? '',
      address: store.address ?? '',
      owner_id: store.owner_id ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('اسم المتجر مطلوب')
      return
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload: form })
        toast.success('تم تحديث بيانات المتجر')
      } else {
        await create.mutateAsync({ ...form, is_active: true })
        toast.success('تم إنشاء المتجر')
      }
      if (form.owner_id) {
        const owner = ownerCandidates.find((u) => u.id === form.owner_id)
        if (owner && owner.role !== 'STORE') {
          await setRole.mutateAsync({ id: form.owner_id, role: 'STORE' })
        }
      }
      setShowForm(false)
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">المتاجر</h1>
        <Button size="sm" onClick={openNew}>
          <Plus size={15} /> متجر جديد
        </Button>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-3 p-4">
          <Input label="اسم المتجر" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">صاحب المتجر</label>
            <Select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
              <option value="">بدون تعيين حاليًا</option>
              {ownerCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.role === 'STORE' ? '(متجر بالفعل)' : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={create.isPending || update.isPending}>
              حفظ
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? null : !stores || stores.length === 0 ? (
        <EmptyState title="لا توجد متاجر" icon={<StoreIcon size={22} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {stores.map((store) => (
            <div key={store.id} className="flex items-center justify-between rounded-card border border-line bg-surface p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{store.name}</p>
                <p className="truncate text-xs text-muted">{store.address ?? 'بدون عنوان'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={store.is_active ? 'success' : 'danger'}>{store.is_active ? 'نشط' : 'معطل'}</Badge>
                <Button size="sm" variant="outline" onClick={() => openEdit(store)}>
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update.mutate({ id: store.id, payload: { is_active: !store.is_active } })}
                >
                  {store.is_active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setToDelete(store.id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المتجر"
        description="سيتم حذف المتجر وكل منتجاته المرتبطة به. هذا الإجراء لا يمكن التراجع عنه."
        danger
        confirmLabel="حذف نهائي"
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
