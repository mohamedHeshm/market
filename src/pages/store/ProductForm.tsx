import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore } from '@/features/stores/hooks'
import { useCategories } from '@/features/categories/hooks'
import { useProduct, useProductMutations } from '@/features/products/hooks'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, Card } from '@/components/ui/primitives'
import { PriceTag } from '@/components/common/PriceTag'
import { getPricing } from '@/utils/pricing'

export default function StoreProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id) && id !== 'new'
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: store } = useMyStore(session?.user.id)
  const { data: categories } = useCategories()
  const { data: existing } = useProduct(isEditing ? id : undefined)
  const { create, update } = useProductMutations()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountValue, setDiscountValue] = useState('')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description ?? '')
      setPrice(String(existing.price))
      setCategoryId(existing.category_id ?? '')
      setImageUrl(existing.image_url)
      setHasDiscount(existing.discount_type === 'PERCENTAGE')
      setDiscountValue(existing.discount_value != null ? String(existing.discount_value) : '')
    }
  }, [existing])

  async function handleImage(file: File | null) {
    if (!file || !store) return
    setUploading(true)
    try {
      const path = `${store.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from(STORAGE_BUCKETS.products).upload(path, file, { upsert: true })
      if (error) throw error
      setImageUrl(supabase.storage.from(STORAGE_BUCKETS.products).getPublicUrl(path).data.publicUrl)
    } catch {
      toast.error('تعذر رفع الصورة')
    } finally {
      setUploading(false)
    }
  }

  const priceNum = Number(price) || 0
  const discountValueNum = hasDiscount ? Number(discountValue) || 0 : 0
  const preview = getPricing({
    price: priceNum,
    discount_type: hasDiscount ? 'PERCENTAGE' : null,
    discount_value: hasDiscount ? discountValueNum : null,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!store) return
    if (!name.trim() || !priceNum || priceNum < 0) {
      toast.error('يرجى إدخال اسم وسعر صحيحين')
      return
    }
    if (hasDiscount && (!discountValueNum || discountValueNum <= 0 || discountValueNum > 100)) {
      toast.error('نسبة الخصم يجب أن تكون بين 1 و100')
      return
    }
    const payload = {
      store_id: store.id,
      name,
      description,
      price: priceNum,
      category_id: categoryId || null,
      image_url: imageUrl,
      // final_price is computed by the database — never sent from here.
      discount_type: hasDiscount ? ('PERCENTAGE' as const) : null,
      discount_value: hasDiscount ? discountValueNum : null,
    }
    try {
      if (isEditing && id) {
        await update.mutateAsync({ id, payload })
        toast.success('تم تحديث المنتج')
      } else {
        await create.mutateAsync({ ...payload, is_active: true })
        toast.success('تم إضافة المنتج')
      }
      navigate('/store/products')
    } catch {
      toast.error('حدث خطأ أثناء الحفظ')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">{isEditing ? 'تعديل المنتج' : 'منتج جديد'}</h1>
      <Card className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="اسم المنتج" required value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="السعر الأصلي (ج.م)" type="number" step="0.01" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">القسم</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بدون قسم</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-lg border border-line p-3.5">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">هل يوجد خصم على المنتج؟</span>
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
                className="size-5 accent-brand-700"
              />
            </label>

            {hasDiscount && (
              <div className="mt-3 flex flex-col gap-3">
                <Input
                  label="نسبة الخصم (%)"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="مثال: 20"
                />
                {priceNum > 0 && discountValueNum > 0 && (
                  <div className="rounded-lg bg-bg p-3">
                    <p className="mb-1.5 text-xs text-muted">معاينة السعر النهائي</p>
                    <PriceTag originalPrice={preview.originalPrice} finalPrice={preview.finalPrice} discountLabel={preview.discountLabel} size="lg" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">صورة المنتج</label>
            <div className="flex items-center gap-3">
              {imageUrl && <img src={imageUrl} alt="" className="size-16 rounded-lg object-cover" />}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-brand-400">
                <Upload size={14} />
                {uploading ? 'جارٍ الرفع...' : 'اختر صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={create.isPending || update.isPending}>
              حفظ المنتج
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/store/products')}>
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
