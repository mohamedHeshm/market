import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePaymentSettings, useUpdatePaymentSettings } from '@/features/payments/hooks'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'
import { ChangePasswordCard } from '@/features/auth/ChangePasswordCard'

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = usePaymentSettings()
  const update = useUpdatePaymentSettings()

  const [enabled, setEnabled] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (settings) {
      setEnabled(settings.wallet_enabled)
      setPhone(settings.wallet_phone ?? '')
    }
  }, [settings])

  async function handleSave() {
    if (enabled && !phone.trim()) {
      toast.error('يرجى إدخال رقم المحفظة')
      return
    }
    try {
      await update.mutateAsync({ walletEnabled: enabled, walletPhone: phone || null })
      toast.success('تم حفظ إعدادات الدفع')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر حفظ إعدادات الدفع')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">الإعدادات</h1>

      {!isLoading && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-ink">الدفع بالمحفظة</h2>

          <div className="flex items-center justify-between rounded-lg border border-line p-3">
            <span className="text-sm font-medium text-ink">تفعيل الدفع بالمحفظة</span>
            <button
              onClick={() => setEnabled((e) => !e)}
              className={cn('relative h-6 w-11 rounded-full transition-colors', enabled ? 'bg-brand-700' : 'bg-line')}
              aria-label="تبديل حالة الدفع بالمحفظة"
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  enabled ? 'start-[22px]' : 'start-0.5'
                )}
              />
            </button>
          </div>

          <Input label="رقم المحفظة" dir="ltr" placeholder="010XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!enabled} />

          <Button onClick={handleSave} loading={update.isPending} className="self-start">
            حفظ الإعدادات
          </Button>
        </Card>
      )}

      <ChangePasswordCard />
    </div>
  )
}
