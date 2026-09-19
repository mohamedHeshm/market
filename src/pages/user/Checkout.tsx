import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, Plus, Wallet, Banknote } from 'lucide-react'
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

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState('')
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

  if (cart.items.length === 0) {
    return <EmptyState title="السلة فارغة" description="أضف منتجات إلى السلة قبل إتمام الطلب." />
  }

  async function handleAddAddress() {
    if (!newAddress.trim()) return
    const addr = await createAddress.mutateAsync({ address: newAddress, is_default: activeAddresses.length === 0 })
    setSelectedAddressId(addr.id)
    setNewAddress('')
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
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-bold text-ink">إتمام الطلب</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">عنوان التوصيل</h2>
        {addressesLoading ? null : activeAddresses.length === 0 && !showNewAddress ? (
          <ErrorState message="لا توجد عناوين محفوظة، أضف عنوانًا للمتابعة" />
        ) : (
          <div className="flex flex-col gap-2">
            {activeAddresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={cn(
                  'flex items-start gap-2 rounded-card border p-3 text-start text-sm',
                  effectiveAddressId === addr.id ? 'border-brand-700 bg-brand-50' : 'border-line bg-surface'
                )}
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand-700" />
                <span>
                  {addr.title && <span className="block font-medium text-ink">{addr.title}</span>}
                  <span className="text-ink-soft">{addr.address}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {showNewAddress ? (
          <div className="mt-3 flex flex-col gap-2">
            <Textarea placeholder="اكتب عنوانك بالتفصيل" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
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

      <Button size="lg" onClick={handleSubmit} loading={submitting}>
        تأكيد الطلب
      </Button>
    </div>
  )
}
