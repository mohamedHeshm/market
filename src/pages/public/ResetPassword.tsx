import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/common/Logo'
import { updatePassword } from '@/features/auth/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      toast.success('تم تحديث كلمة المرور بنجاح')
      navigate('/login', { replace: true })
    } catch {
      setError('تعذر تحديث كلمة المرور، حاول من جديد عبر رابط الاستعادة')
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
          <h1 className="text-lg font-semibold text-ink">تعيين كلمة مرور جديدة</h1>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
            />
            <Button type="submit" loading={loading} className="w-full">
              حفظ كلمة المرور
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
