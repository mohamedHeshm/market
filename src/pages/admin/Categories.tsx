import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Upload } from 'lucide-react'
import { useCategories, useCategoryMutations } from '@/features/categories/hooks'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge, Card } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/common/States'
import type { Category } from '@/types'

async function uploadCategoryImage(file: File) {
  const path = `${crypto.randomUUID()}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from(STORAGE_BUCKETS.categories).upload(path, file, { upsert: true })
  if (error) throw error
  return supabase.storage.from(STORAGE_BUCKETS.categories).getPublicUrl(path).data.publicUrl
}

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories(true)
  const { create, update, remove } = useCategoryMutations()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<string | null>(null)

  function openNew() {
    setEditing(null)
    setName('')
    setDescription('')
    setImageUrl(null)
    setShowForm(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setImageUrl(cat.image_url)
    setShowForm(true)
  }

  async function handleImage(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadCategoryImage(file)
      setImageUrl(url)
    } catch {
      toast.error('تعذر رفع الصورة')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('اسم القسم مطلوب')
      return
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload: { name, description, image_url: imageUrl } })
        toast.success('تم تحديث القسم')
      } else {
        await create.mutateAsync({ name, description, image_url: imageUrl })
        toast.success('تم إنشاء القسم')
      }
      setShowForm(false)
    } catch {
      toast.error('يوجد قسم بنفس الاسم بالفعل')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">الأقسام</h1>
        <Button size="sm" onClick={openNew}>
          <Plus size={15} /> قسم جديد
        </Button>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-3 p-4">
          <Input label="اسم القسم" required value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">صورة القسم</label>
            <div className="flex items-center gap-3">
              {imageUrl && <img src={imageUrl} alt="" className="size-14 rounded-lg object-cover" />}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-brand-400">
                <Upload size={14} />
                {uploading ? 'جارٍ الرفع...' : 'اختر صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0] ?? null)} />
              </label>
            </div>
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

      {isLoading ? null : !categories || categories.length === 0 ? (
        <EmptyState title="لا توجد أقسام" />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {cat.image_url && <img src={cat.image_url} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{cat.name}</p>
                  <Badge tone={cat.is_active ? 'success' : 'danger'} className="mt-0.5">
                    {cat.is_active ? 'مفعل' : 'معطل'}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                  تعديل
                </Button>
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: cat.id, payload: { is_active: !cat.is_active } })}>
                  {cat.is_active ? 'تعطيل' : 'تفعيل'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setToDelete(cat.id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف القسم"
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
