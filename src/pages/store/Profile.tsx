import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Upload, Clock, MapPin, LocateFixed } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useMyStore, useStoreMutations } from '@/features/stores/hooks'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/constants'
import { getCurrentPosition } from '@/utils/geo'
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

  const [hasHours, setHasHours] = useState(false)
  const [opensAt, setOpensAt] = useState('10:00')
  const [closesAt, setClosesAt] = useState('23:00')

  const [hasServiceArea, setHasServiceArea] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [serviceRadiusKm, setServiceRadiusKm] = useState('10')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (store) {
      setName(store.name)
      setDescription(store.description ?? '')
      setPhone(store.phone ?? '')
      setAddress(store.address ?? '')
      setDeliveryFee(String(store.delivery_fee))
      setImageUrl(store.image_url)

      setHasHours(Boolean(store.opens_at && store.closes_at))
      if (store.opens_at) setOpensAt(store.opens_at.slice(0, 5))
      if (store.closes_at) setClosesAt(store.closes_at.slice(0, 5))

      setHasServiceArea(Boolean(store.latitude && store.longitude && store.service_radius_km))
      setLatitude(store.latitude)
      setLongitude(store.longitude)
      if (store.service_radius_km) setServiceRadiusKm(String(store.service_radius_km))
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

  async function handleLocate() {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      setLatitude(pos.coords.latitude)
      setLongitude(pos.coords.longitude)
      toast.success('تم تحديد موقع المتجر')
    } catch {
      toast.error('تعذر تحديد الموقع، تأكد من السماح بالوصول للموقع من المتصفح')
    } finally {
      setLocating(false)
    }
  }

  async function handleSave() {
    if (!store) return
    const feeNum = Number(deliveryFee)
    if (deliveryFee === '' || Number.isNaN(feeNum) || feeNum < 0) {
      toast.error('يرجى إدخال رسوم توصيل صحيحة (رقم أكبر من أو يساوي صفر)')
      return
    }
    if (hasHours && (!opensAt || !closesAt)) {
      toast.error('يرجى تحديد وقتي الفتح والغلق، أو إلغاء تفعيل مواعيد العمل')
      return
    }
    const radiusNum = Number(serviceRadiusKm)
    if (hasServiceArea && (!latitude || !longitude)) {
      toast.error('يرجى تحديد موقع المتجر أولًا لتفعيل منطقة الخدمة')
      return
    }
    if (hasServiceArea && (!radiusNum || radiusNum <= 0)) {
      toast.error('يرجى إدخال نطاق خدمة صحيح (كم) أكبر من صفر')
      return
    }

    try {
      await update.mutateAsync({
        id: store.id,
        payload: {
          name,
          description,
          phone,
          address,
          image_url: imageUrl,
          delivery_fee: feeNum,
          opens_at: hasHours ? opensAt : null,
          closes_at: hasHours ? closesAt : null,
          latitude: hasServiceArea ? latitude : null,
          longitude: hasServiceArea ? longitude : null,
          service_radius_km: hasServiceArea ? radiusNum : null,
        },
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
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock size={16} className="text-brand-700" /> مواعيد العمل
          </span>
          <input type="checkbox" checked={hasHours} onChange={(e) => setHasHours(e.target.checked)} className="size-5 accent-brand-700" />
        </label>
        {hasHours ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label="وقت الفتح" type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
            <Input label="وقت الغلق" type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </div>
        ) : (
          <p className="text-xs text-muted">المتجر مفتوح طوال الوقت حاليًا (بدون مواعيد محددة).</p>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <label className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MapPin size={16} className="text-brand-700" /> منطقة خدمة التوصيل
          </span>
          <input
            type="checkbox"
            checked={hasServiceArea}
            onChange={(e) => setHasServiceArea(e.target.checked)}
            className="size-5 accent-brand-700"
          />
        </label>
        {hasServiceArea ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted">
              حدد موقع متجرك ثم نطاق الخدمة بالكيلومتر — أي عميل خارج هذا النطاق سيتم تنبيهه أنه خارج منطقة التوصيل قبل إتمام الطلب.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={handleLocate} loading={locating} className="self-start">
              <LocateFixed size={15} /> {latitude && longitude ? 'تحديث موقع المتجر' : 'تحديد موقع المتجر الحالي'}
            </Button>
            {latitude && longitude && <p className="text-xs text-success">✓ تم تحديد موقع المتجر</p>}
            <Input
              label="نطاق الخدمة (كم)"
              type="number"
              min="0.1"
              step="0.1"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(e.target.value)}
            />
          </div>
        ) : (
          <p className="text-xs text-muted">لا يوجد تقييد جغرافي حاليًا — المتجر يستقبل طلبات من أي مكان.</p>
        )}
      </Card>

      <Button onClick={handleSave} loading={update.isPending} className="self-start">
        حفظ كل التغييرات
      </Button>

      <ChangePasswordCard />
    </div>
  )
}