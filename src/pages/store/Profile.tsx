import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore, useStoreMutations } from '@/features/stores/hooks'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { ChangePasswordCard } from '@/features/auth/ChangePasswordCard'

export default function StoreProfilePage() {
  const { session } = useAuth()
  const { data: store } = useMyStore(session?.user.id)
  const { update } = useStoreMutations()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (store) {
      setName(store.name)
      setDescription(store.description ?? '')
      setPhone(store.phone ?? '')
      setAddress(store.address ?? '')
      setDeliveryFee(String(store.delivery_fee))
      setImageUrl(store.image_url)
    }
  }, [store])

  async function handleImage(file: File | null) {
    if (!file || !store) return
    setUploading(true)
    try {
      const path = `${store.id}/logo-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from(STORAGE_BUCKETS.stores).upload(path, file, { upsert: true })
      if (error) throw error
      setImageUrl(supabase.storage.from(STORAGE_BUCKETS.stores).getPublicUrl(path).data.publicUrl)
    } catch {
      toast.error('تعذر رفع الصورة')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!store) return
    const feeNum = Number(deliveryFee)
    if (deliveryFee === '' || Number.isNaN(feeNum) || feeNum < 0) {
      toast.error('يرجى إدخال رسوم توصيل صحيحة (رقم أكبر من أو يساوي صفر)')
      return
    }
    try {
      await update.mutateAsync({
        id: store.id,
        payload: { name, description, phone, address, image_url: imageUrl, delivery_fee: feeNum },
      })
      toast.success('تم حفظ بيانات المتجر')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ')
    }
  }

  if (!store) return <p className="text-sm text-muted">لم يتم ربط حسابك بمتجر بعد.</p>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">بيانات المتجر</h1>
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">شعار المتجر</label>
          <div className="flex items-center gap-3">
            <div className="size-16 overflow-hidden rounded-lg bg-brand-50">
              {imageUrl && <img src={imageUrl} alt="" className="size-full object-cover" />}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-brand-400">
              <Upload size={14} />
              {uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <Input label="اسم المتجر" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="الوصف" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Textarea label="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input
          label="رسوم التوصيل (ج.م)"
          type="number"
          min="0"
          step="0.01"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          hint="الرسوم التي يدفعها العميل مقابل توصيل الطلب من متجرك"
        />
        <Button onClick={handleSave} loading={update.isPending} className="self-start">
          حفظ التغييرات
        </Button>
      </Card>

      <ChangePasswordCard />
    </div>
  )
}
