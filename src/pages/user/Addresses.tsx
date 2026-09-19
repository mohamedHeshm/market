import { useState } from 'react'
import { MapPin, Trash2, Star, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { useAddresses, useAddressMutations } from '@/features/users/hooks'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/common/States'
import { ConfirmDialog } from '@/components/ui/Dialog'

export default function AddressesPage() {
  const { session } = useAuth()
  const { data: addresses, isLoading } = useAddresses(session?.user.id)
  const { create, update, remove } = useAddressMutations(session?.user.id)

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [toDelete, setToDelete] = useState<string | null>(null)

  async function handleAdd() {
    if (!address.trim()) return
    await create.mutateAsync({ title: title || undefined, address, phone: phone || undefined, is_default: (addresses?.length ?? 0) === 0 })
    setTitle('')
    setAddress('')
    setPhone('')
    setShowForm(false)
    toast.success('تم إضافة العنوان')
  }

  async function handleDefault(id: string) {
    await update.mutateAsync({ id, payload: { is_default: true } })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">عناويني</h1>
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
          <Plus size={15} /> إضافة
        </Button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <Input label="اسم العنوان (اختياري)" placeholder="المنزل، العمل..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="العنوان بالتفصيل" required value={address} onChange={(e) => setAddress(e.target.value)} />
          <Input label="هاتف التوصيل (اختياري)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button onClick={handleAdd} loading={create.isPending}>
            حفظ العنوان
          </Button>
        </div>
      )}

      {isLoading ? null : !addresses || addresses.length === 0 ? (
        <EmptyState title="لا توجد عناوين محفوظة" icon={<MapPin size={22} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-start gap-3 rounded-card border border-line bg-surface p-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-700" />
              <div className="min-w-0 flex-1">
                {addr.title && <p className="text-sm font-semibold text-ink">{addr.title}</p>}
                <p className="text-sm text-ink-soft">{addr.address}</p>
                {addr.is_default && <span className="mt-1 inline-block text-xs font-medium text-brand-700">العنوان الافتراضي</span>}
              </div>
              <div className="flex flex-col items-center gap-2">
                {!addr.is_default && (
                  <button onClick={() => handleDefault(addr.id)} aria-label="تعيين كافتراضي" className="text-muted hover:text-amber-accent-dark">
                    <Star size={16} />
                  </button>
                )}
                <button onClick={() => setToDelete(addr.id)} aria-label="حذف" className="text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف العنوان"
        description="هل أنت متأكد من حذف هذا العنوان؟"
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
