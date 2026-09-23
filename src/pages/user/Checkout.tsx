import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Plus, Wallet, Banknote, LocateFixed, Clock, AlertTriangle } from 'lucide-react'
import { useCart } from '@/features/cart/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useAddresses, useAddressMutations } from '@/features/users/hooks'
import { usePaymentSettings } from '@/features/payments/hooks'
import { useCreateOrder } from '@/features/orders/hooks'
import { useStore } from '@/features/stores/hooks'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { EmptyState, ErrorState } from '@/components/common/States'
import { cn } from '@/lib/cn'
import { DELIVERY_FEE_DEFAULT, PAYMENT_METHOD_LABELS } from '@/constants'
import { formatCurrency } from '@/utils/pricing'
import { checkServiceArea, getCurrentPosition } from '@/utils/geo'
import { isStoreOpenNow, formatTime } from '@/utils/hours'
import type { PaymentMethod } from '@/types'

export default function CheckoutPage() {
  const { cart, subtotal, clear } = useCart()
  const { profile, session } = useAuth()
  const { data: addresses, isLoading: addressesLoading } = useAddresses(session?.user.id)
  const { create: createAddress } = useAddressMutations(session?.user.id)
  const { data: paymentSettings } = usePaymentSettings()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  // Delivery fee is set per-store by the store owner. Fall back to the
  // platform default only while the store is still loading.
  const { data: store } = useStore(cart.storeId ?? undefined)
  const deliveryFee = store?.delivery_fee ?? DELIVERY_FEE_DEFAULT
  const storeClosed = Boolean(store && store.opens_at && store.closes_at && !isStoreOpenNow(store))

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newLat, setNewLat] = useState<number | null>(null)
  const [newLng, setNewLng] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [notes, setNotes] = useState('')
  // Cash on Delivery needs no setup at all, so it's always the sensible
  // default; the wallet option is offered alongside it whenever the admin
  // has it enabled, and the existing wallet flow is otherwise unchanged.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY')
  const [submitting, setSubmitting] = useState(false)

  const totalSavings = cart.items.reduce((sum, i) => sum + (i.originalPrice - i.price) * i.quantity, 0)

  const activeAddresses = addresses ?? []
  const effectiveAddressId = selectedAddressId || activeAddresses.find((a) => a.is_default)?.id || activeAddresses[0]?.id
  const effectiveAddress = activeAddresses.find((a) => a.id === effectiveAddressId)
  const effectiveAreaCheck = store && effectiveAddress ? checkServiceArea(store, effectiveAddress) : null
  const outsideServiceArea = effectiveAreaCheck?.withinArea === false

  if (cart.items.length === 0) {
    return <EmptyState title="السلة فارغة" description="أضف منتجات إلى السلة قبل إتمام الطلب." />
  }

  async function handleLocate() {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      setNewLat(pos.coords.latitude)
      setNewLng(pos.coords.longitude)
      toast.success('تم تحديد موقعك')
    } catch {
      toast.error('تعذر تحديد الموقع، تأكد من السماح بالوصول للموقع من المتصفح')
    } finally {
      setLocating(false)
    }
  }

  async function handleAddAddress() {
    if (!newAddress.trim()) return
    const addr = await createAddress.mutateAsync({
      address: newAddress,
      latitude: newLat,
      longitude: newLng,
      is_default: activeAddresses.length === 0,
    })
    setSelectedAddressId(addr.id)
    setNewAddress('')
    setNewLat(null)
    setNewLng(null)
    setShowNewAddress(false)
  }

  async function handleSubmit() {
    if (!effectiveAddressId) {
      toast.error('يرجى اختيار عنوان التوصيل')
      return
    }
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف')
      return
    }
    if (!cart.storeId) return
    if (storeClosed) {
      toast.error('المتجر مغلق حاليًا، لا يمكن إتمام الطلب الآن')
      return
    }
    if (outsideServiceArea) {
      toast.error('أنت خارج نطاق خدمة هذا المتجر، يرجى اختيار عنوان آخر داخل النطاق')
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrder.mutateAsync({
        storeId: cart.storeId,
        addressId: effectiveAddressId,
        phone,
        items: cart.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        paymentMethod,
        notes: notes || undefined,
      })
      clear()
      toast.success('تم إنشاء طلبك بنجاح')
      navigate(`/orders/${order.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Store is currently closed')) {
        toast.error('المتجر مغلق حاليًا، لا يمكن إتمام الطلب الآن')
      } else if (message.includes('outside store service area')) {
        toast.error('أنت خارج نطاق خدمة هذا المتجر')
      } else {
        toast.error('حدث خطأ أثناء إنشاء الطلب')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-ink">إتمام الطلب</h1>

      {storeClosed && store?.opens_at && store?.closes_at && (
        <div className="flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          <Clock size={16} className="mt-0.5 shrink-0" />
          <span>
            هذا المتجر مغلق حاليًا. مواعيد العمل: {formatTime(store.opens_at)} - {formatTime(store.closes_at)}
          </span>
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">عنوان التوصيل</h2>
        {addressesLoading ? null : activeAddresses.length === 0 && !showNewAddress ? (
          <ErrorState message="لا توجد عناوين محفوظة، أضف عنوانًا للمتابعة" />
        ) : (
          <div className="flex flex-col gap-2">
            {activeAddresses.map((addr) => {
              const areaCheck = store ? checkServiceArea(store, addr) : null
              const isOutside = areaCheck?.withinArea === false
              return (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    'flex items-start gap-2 rounded-card border p-3 text-start text-sm',
                    effectiveAddressId === addr.id ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface'
                  )}
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand-700" />
                  <span className="min-w-0 flex-1">
                    {addr.title && <span className="block font-medium text-ink">{addr.title}</span>}
                    <span className="text-ink-soft">{addr.address}</span>
                    {isOutside && (
                      <span className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                        <AlertTriangle size={12} /> أنت خارج نطاق خدمة هذا المتجر
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {showNewAddress ? (
          <div className="mt-3 flex flex-col gap-2">
            <Textarea placeholder="اكتب عنوانك بالتفصيل" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
            <div>
              <Button type="button" variant="outline" size="sm" onClick={handleLocate} loading={locating}>
                <LocateFixed size={15} /> {newLat && newLng ? 'تم تحديد موقعك ✓' : 'تحديد موقعي الحالي'}
              </Button>
              <p className="mt-1.5 text-xs text-muted">اختياري، لكنه يساعد في التأكد من أن عنوانك داخل نطاق خدمة المتجر.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddAddress} loading={createAddress.isPending}>
                حفظ العنوان
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewAddress(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewAddress(true)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-700"
          >
            <Plus size={15} /> إضافة عنوان جديد
          </button>
        )}

        {outsideServiceArea && (
          <div className="mt-3 flex items-center gap-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm font-medium text-danger">
            <AlertTriangle size={16} className="shrink-0" />
            أنت خارج نطاق خدمة هذا المتجر، يرجى اختيار عنوان آخر داخل منطقة التوصيل.
          </div>
        )}
      </section>

      <Input label="رقم الهاتف" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Textarea label="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: اترك الطلب عند الباب" />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">طريقة الدفع</h2>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
            className={cn(
              'flex items-center gap-3 rounded-card border p-3 text-start text-sm',
              paymentMethod === 'CASH_ON_DELIVERY' ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface'
            )}
          >
            <Banknote size={18} className="text-brand-700" />
            <span>
              <span className="block font-medium text-ink">{PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY}</span>
              <span className="text-xs text-muted">ادفع نقدًا للمندوب عند استلام طلبك</span>
            </span>
          </button>

          {paymentSettings?.wallet_enabled && (
            <button
              onClick={() => setPaymentMethod('CASH_WALLET')}
              className={cn(
                'flex items-center gap-3 rounded-card border p-3 text-start text-sm',
                paymentMethod === 'CASH_WALLET' ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface'
              )}
            >
              <Wallet size={18} className="text-brand-700" />
              <span className="font-medium text-ink">{PAYMENT_METHOD_LABELS.CASH_WALLET}</span>
            </button>
          )}
        </div>
      </section>

      <Card className="p-4">
        <div className="flex justify-between text-sm text-ink-soft">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="mt-1.5 flex justify-between text-sm text-success">
            <span>إجمالي التوفير من الخصومات</span>
            <span>- {formatCurrency(totalSavings)}</span>
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-sm text-ink-soft">
          <span>رسوم التوصيل</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
          <span>الإجمالي</span>
          <span>{formatCurrency(subtotal + deliveryFee)}</span>
        </div>
      </Card>

      <Button size="lg" onClick={handleSubmit} loading={submitting} disabled={storeClosed || outsideServiceArea}>
        تأكيد الطلب
      </Button>
    </div>
  )
}