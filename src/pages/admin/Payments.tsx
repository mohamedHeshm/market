import { toast } from 'sonner'
import { useState } from 'react'
import { Wallet, Download, Image as ImageIcon } from 'lucide-react'
import { usePendingPayments, useVerifyPayment, usePaymentProofUrl } from '@/features/payments/hooks'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'
import { EmptyState } from '@/components/common/States'

/** Thumbnail + explicit download button for one payment proof, resolved via a short-lived signed URL. */
function PaymentProofPreview({ path, orderId }: { path: string; orderId: string }) {
  const { data: signedUrl, isLoading, isError } = usePaymentProofUrl(path)
  const [downloading, setDownloading] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    if (!signedUrl) return
    setDownloading(true)
    try {
      // Fetching as a blob (rather than relying on the `download` attribute
      // alone) guarantees a real save-to-device even for a cross-origin
      // storage URL, instead of just opening the image in a new tab.
      const response = await fetch(signedUrl)
      if (!response.ok) throw new Error('fetch failed')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `payment-proof-${orderId}.jpg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('تعذر تحميل صورة الإثبات، قد تكون الصورة غير موجودة على السيرفر')
    } finally {
      setDownloading(false)
    }
  }

  const broken = isError || imageFailed

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <div className="size-16 animate-pulse rounded-lg bg-bg" />
      ) : signedUrl && !broken ? (
        <a href={signedUrl} target="_blank" rel="noreferrer">
          <img
            src={signedUrl}
            alt="إثبات الدفع"
            className="size-16 rounded-lg object-cover"
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : (
        <div className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg bg-danger/10 text-danger" title="تعذر تحميل الصورة">
          <ImageIcon size={16} />
          <span className="text-[9px]">تعذر التحميل</span>
        </div>
      )}
      <button
        onClick={handleDownload}
        disabled={!signedUrl || broken || downloading}
        className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
      >
        <Download size={13} /> تحميل
      </button>
    </div>
  )
}

export default function AdminPaymentsPage() {
  const { data: payments, isLoading } = usePendingPayments()
  const verify = useVerifyPayment()

  async function handle(orderId: string, approve: boolean) {
    await verify.mutateAsync({ orderId, approve })
    toast.success(approve ? 'تم تأكيد الدفع' : 'تم رفض الدفع')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">مراجعة المدفوعات</h1>

      {isLoading ? null : !payments || payments.length === 0 ? (
        <EmptyState title="لا توجد مدفوعات بحاجة لمراجعة" icon={<Wallet size={22} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {p.payment_proof_url && <PaymentProofPreview path={p.payment_proof_url} orderId={p.id} />}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {(p as unknown as { user: { name: string } | null }).user?.name ?? 'عميل'} —{' '}
                    {(p as unknown as { store: { name: string } | null }).store?.name ?? 'متجر'}
                  </p>
                  <p className="text-xs text-muted">رقم العملية: {p.payment_transaction_reference ?? '—'}</p>
                  <p className="text-xs text-muted">{new Date(p.created_at).toLocaleString('ar-EG')}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{p.total.toFixed(2)} ج.م</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" onClick={() => handle(p.id, false)} loading={verify.isPending}>
                  رفض الدفع
                </Button>
                <Button size="sm" onClick={() => handle(p.id, true)} loading={verify.isPending}>
                  تأكيد الدفع
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}