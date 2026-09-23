import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Store as StoreIcon, Clock, MapPin, LocateFixed, BarChart3 } from 'lucide-react'
import { useStores, useStoreMutations, useStoreSales } from '@/features/stores/hooks'
import { useUsers, useUserMutations } from '@/features/users/hooks'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge, Card, Select } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState, Skeleton } from '@/components/common/States'
import { getCurrentPosition } from '@/utils/geo'
import { formatCurrency } from '@/utils/pricing'
import type { Store } from '@/types'

const emptyForm = {
  name: '',
  description: '',
  phone: '',
  address: '',
  owner_id: '',
  delivery_fee: '15',
  hasHours: false,
  opens_at: '10:00',
  closes_at: '23:00',
  hasServiceArea: false,
  latitude: null as number | null,
  longitude: null as number | null,
  service_radius_km: '10',
}

function StoreSalesPanel({ storeId }: { storeId: string }) {
  const { data: sales, isLoading } = useStoreSales(storeId)

  if (isLoading) return <Skeleton className="h-24 w-full rounded-card" />
  if (!sales) return null

  const rows: Array<{ label: string; revenue: number; orders: number }> = [
    { label: 'اليوم', revenue: sales.today.revenue, orders: sales.today.orders },
    { label: 'هذا الشهر', revenue: sales.month.revenue, orders: sales.month.orders },
    { label: 'هذه السنة', revenue: sales.year.revenue, orders: sales.year.orders },
  ]

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-lg bg-bg p-3">
          <p className="text-xs text-muted">{r.label}</p>
          <p className="mt-1 text-base font-bold text-ink">{formatCurrency(r.revenue)}</p>
          <p className="text-xs text-muted">{r.orders} طلب مكتمل</p>
        </div>
      ))}
    </div>
  )
}

export default function AdminStoresPage() {
  const { data: stores, isLoading } = useStores('', true)
  const { data: storeRoleUsers } = useUsers('STORE')
  const { data: regularUsers } = useUsers('USER')
  const { create, update, remove } = useStoreMutations()
  const { setRole } = useUserMutations()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Store | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [locating, setLocating] = useState(false)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const [salesFor, setSalesFor] = useState<string | null>(null)

  const ownerCandidates = [...(storeRoleUsers ?? []), ...(regularUsers ?? [])]

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
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
      delivery_fee: String(store.delivery_fee),
      hasHours: Boolean(store.opens_at && store.closes_at),
      opens_at: store.opens_at?.slice(0, 5) ?? '10:00',
      closes_at: store.closes_at?.slice(0, 5) ?? '23:00',
      hasServiceArea: Boolean(store.latitude && store.longitude && store.service_radius_km),
      latitude: store.latitude,
      longitude: store.longitude,
      service_radius_km: store.service_radius_km ? String(store.service_radius_km) : '10',
    })
    setShowForm(true)
  }

  async function handleLocate() {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }))
      toast.success('تم تحديد الموقع')
    } catch {
      toast.error('تعذر تحديد الموقع، تأكد من السماح بالوصول للموقع من المتصفح')
    } finally {
      setLocating(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('اسم المتجر مطلوب')
      return
    }
    const feeNum = Number(form.delivery_fee)
    if (Number.isNaN(feeNum) || feeNum < 0) {
      toast.error('رسوم توصيل غير صحيحة')
      return
    }
    const radiusNum = Number(form.service_radius_km)
    if (form.hasServiceArea && (!form.latitude || !form.longitude)) {
      toast.error('يرجى تحديد الموقع لتفعيل منطقة الخدمة')
      return
    }
    if (form.hasServiceArea && (!radiusNum || radiusNum <= 0)) {
      toast.error('نطاق خدمة غير صحيح')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      phone: form.phone,
      address: form.address,
      owner_id: form.owner_id || null,
      delivery_fee: feeNum,
      opens_at: form.hasHours ? form.opens_at : null,
      closes_at: form.hasHours ? form.closes_at : null,
      latitude: form.hasServiceArea ? form.latitude : null,
      longitude: form.hasServiceArea ? form.longitude : null,
      service_radius_km: form.hasServiceArea ? radiusNum : null,
    }

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload })
        toast.success('تم تحديث بيانات المتجر')
      } else {
        await create.mutateAsync({ ...payload, is_active: true })
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
          <Input
            label="رسوم التوصيل (ج.م)"
            type="number"
            min="0"
            step="0.01"
            value={form.delivery_fee}
            onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
          />
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

          <div className="rounded-lg border border-line p-3">
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <Clock size={15} className="text-brand-700" /> مواعيد العمل
              </span>
              <input
                type="checkbox"
                checked={form.hasHours}
                onChange={(e) => setForm({ ...form, hasHours: e.target.checked })}
                className="size-5 accent-brand-700"
              />
            </label>
            {form.hasHours && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Input label="وقت الفتح" type="time" value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} />
                <Input label="وقت الغلق" type="time" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-line p-3">
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <MapPin size={15} className="text-brand-700" /> منطقة خدمة التوصيل
              </span>
              <input
                type="checkbox"
                checked={form.hasServiceArea}
                onChange={(e) => setForm({ ...form, hasServiceArea: e.target.checked })}
                className="size-5 accent-brand-700"
              />
            </label>
            {form.hasServiceArea && (
              <div className="mt-3 flex flex-col gap-3">
                <Button type="button" variant="outline" size="sm" onClick={handleLocate} loading={locating} className="self-start">
                  <LocateFixed size={14} /> {form.latitude && form.longitude ? 'تحديث الموقع' : 'تحديد الموقع الحالي'}
                </Button>
                {form.latitude && form.longitude && <p className="text-xs text-success">✓ تم تحديد الموقع</p>}
                <Input
                  label="نطاق الخدمة (كم)"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.service_radius_km}
                  onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
                />
              </div>
            )}
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
            <div key={store.id} className="rounded-card border border-line bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{store.name}</p>
                  <p className="truncate text-xs text-muted">{store.address ?? 'بدون عنوان'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <Badge tone={store.is_active ? 'success' : 'danger'}>{store.is_active ? 'نشط' : 'معطل'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setSalesFor(salesFor === store.id ? null : store.id)}>
                    <BarChart3 size={13} /> المبيعات
                  </Button>
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
              {salesFor === store.id && (
                <div className="mt-3 border-t border-line pt-3">
                  <StoreSalesPanel storeId={store.id} />
                </div>
              )}
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