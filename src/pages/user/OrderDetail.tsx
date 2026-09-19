import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Upload, Star, Banknote } from 'lucide-react'
import { useOrder, useSubmitPaymentProof } from '@/features/orders/hooks'
import { usePaymentSettings } from '@/features/payments/hooks'
import { useAuth } from '@/features/auth/AuthContext'
import { uploadPaymentProof } from '@/features/payments/api'
import { useCreateReview } from '@/features/reviews/hooks'
import { StatusTimeline } from '@/components/common/StatusTimeline'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, Badge } from '@/components/ui/primitives'
import { RatingInput } from '@/components/common/RatingStars'
import { ErrorState, Skeleton } from '@/components/common/States'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants'
import { formatCurrency } from '@/utils/pricing'
import type { OrderStatus, PaymentMethod } from '@/types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(id)
  const { data: paymentSettings } = usePaymentSettings()
  const { session } = useAuth()
  const submitProof = useSubmitPaymentProof()
  const createReview = useCreateReview()

  const [reference, setReference] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    )
  }
  if (isError || !order) return <ErrorState message="تعذر تحميل الطلب" />

  const store = (order as unknown as { store: { name: string; phone?: string } | null }).store
  const items = (order as unknown as {
    items: Array<{ id: string; quantity: number; price: number; original_price: number; total: number; product?: { name: string } }>
  }).items ?? []

  async function handleSubmitProof() {
    if (!session?.user.id || !order || !file) {
      toast.error('يرجى اختيار صورة إثبات التحويل')
      return
    }
    setUploading(true)
    try {
      const url = await uploadPaymentProof(session.user.id, order.id, file)
      await submitProof.mutateAsync({ orderId: order.id, ref: reference, proofUrl: url })
      toast.success('تم إرسال إثبات الدفع، بانتظار مراجعة الإدارة')
    } catch {
      toast.error('حدث خطأ أثناء رفع إثبات الدفع')
    } finally {
      setUploading(false)
    }
  }

  async function handleReview() {
    if (!session?.user.id || !order) return
    try {
      await createReview.mutateAsync({
        user_id: session.user.id,
        store_id: order.store_id,
        order_id: order.id,
        rating,
        comment: comment || undefined,
      })
      toast.success('شكرًا لتقييمك')
    } catch {
      toast.error('لا يمكن إضافة أكثر من تقييم لنفس الطلب')
    }
  }

  const needsProof = order.payment_method === 'CASH_WALLET' && order.payment_status === 'WAITING_VERIFICATION' && !order.payment_proof_url

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-ink">طلب من {store?.name ?? 'المتجر'}</h1>
        <p className="text-sm text-muted">{new Date(order.created_at).toLocaleString('ar-EG')}</p>
      </div>

      <Card className="flex items-center gap-2 p-4">
        <Banknote size={16} className="text-brand-700" />
        <span className="text-sm text-ink-soft">طريقة الدفع:</span>
        <Badge tone="brand">{PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod] ?? '—'}</Badge>
      </Card>

      <Card className="p-4">
        <StatusTimeline status={order.status} />
      </Card>

      {order.payment_method === 'CASH_ON_DELIVERY' && (
        <Card className="p-4 text-sm text-ink-soft">
          هذا الطلب سيُدفع نقدًا للمندوب عند التسليم — لا حاجة لأي إجراء إضافي منك الآن.
        </Card>
      )}

      {needsProof && paymentSettings?.wallet_enabled && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">الدفع بالمحفظة</h2>
          <p className="mt-2 text-sm text-ink-soft">
            حوّل مبلغ <span className="font-bold text-ink">{formatCurrency(order.total)}</span> إلى رقم:
          </p>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5">
            <span className="font-mono text-base font-semibold text-brand-900" dir="ltr">
              {order.wallet_phone_used}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(order.wallet_phone_used ?? '')
                toast.success('تم نسخ الرقم')
              }}
              className="flex items-center gap-1 text-xs font-medium text-brand-700"
            >
              <Copy size={14} /> نسخ الرقم
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <Input label="رقم عملية التحويل" value={reference} onChange={(e) => setReference(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-soft">صورة إثبات التحويل</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line py-6 text-sm text-muted hover:border-brand-400">
                <Upload size={16} />
                {file ? file.name : 'اضغط لاختيار صورة'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <Button onClick={handleSubmitProof} loading={uploading}>
              تم التحويل
            </Button>
          </div>
        </Card>
      )}

      {order.payment_status === 'WAITING_VERIFICATION' && order.payment_proof_url && (
        <Card className="p-4 text-sm text-ink-soft">تم استلام إثبات الدفع وهو الآن قيد المراجعة من الإدارة.</Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">المنتجات</h2>
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const hasDiscount = item.original_price > item.price
            return (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  {item.product?.name ?? 'منتج'} × {item.quantity}
                </span>
                <span className="flex items-center gap-2">
                  {hasDiscount && (
                    <span className="text-xs text-muted line-through">{formatCurrency(item.original_price * item.quantity)}</span>
                  )}
                  <span className="font-medium text-ink">{formatCurrency(item.total)}</span>
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm font-bold text-ink">
          <span>الإجمالي</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </Card>

      {order.status === 'DELIVERED' && (
        <Card className="p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Star size={16} className="text-amber-accent" /> قيّم تجربتك مع {store?.name}
          </h2>
          <div className="mt-3">
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <Input className="mt-3" placeholder="اكتب تعليقك (اختياري)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button className="mt-3" size="sm" onClick={handleReview} loading={createReview.isPending}>
            إرسال التقييم
          </Button>
        </Card>
      )}

      <p className="text-center text-xs text-muted">{ORDER_STATUS_LABELS[order.status as OrderStatus]}</p>
    </div>
  )
}
