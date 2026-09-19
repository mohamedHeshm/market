import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/common/Logo'
import { signUp } from '@/features/auth/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setLoading(true)
    try {
      const data = await signUp({ name, phone, email, password })
      if (data.session) {
        toast.success('تم إنشاء الحساب بنجاح')
        navigate('/', { replace: true })
      } else {
        toast.success('تم إنشاء الحساب، تحقق من بريدك الإلكتروني لتأكيد الحساب')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message.includes('already') ? 'هذا البريد الإلكتروني مستخدم بالفعل' : 'تعذر إنشاء الحساب، حاول مرة أخرى')
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
          <h1 className="text-lg font-semibold text-ink">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-muted">انضم إلى وصلة واطلب من متاجرك المفضلة</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input label="الاسم الكامل" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="رقم الهاتف" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="البريد الإلكتروني" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              label="كلمة المرور"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              hint="6 أحرف على الأقل"
            />
            <Button type="submit" loading={loading} className="w-full">
              إنشاء الحساب
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
