import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/common/Logo'
import { requestPasswordReset } from '@/features/auth/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-ink">استرجاع كلمة المرور</h1>
          {sent ? (
            <p className="mt-3 text-sm text-ink-soft">
              تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني، يرجى التحقق من صندوق الوارد.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Input label="البريد الإلكتروني" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button type="submit" loading={loading} className="w-full">
                  إرسال رابط الاستعادة
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
