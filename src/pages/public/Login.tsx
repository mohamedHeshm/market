import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/common/Logo'
import { signIn, fetchProfile } from '@/features/auth/api'
import { ROLE_HOME_ROUTE } from '@/constants'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await signIn({ email, password })
      toast.success('تم تسجيل الدخول بنجاح')

      // If the person was redirected here from a specific protected page,
      // honor that. Otherwise send them to the home page that matches
      // their actual role (admin/store/delivery dashboard, or the
      // shopping home for a regular customer) instead of always "/".
      const explicitTarget = location.state?.from?.pathname
      if (explicitTarget) {
        navigate(explicitTarget, { replace: true })
        return
      }

      const profile = await fetchProfile(user.id)
      navigate(profile ? ROLE_HOME_ROUTE[profile.role] : '/', { replace: true })
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
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
          <h1 className="text-lg font-semibold text-ink">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted">أدخل بياناتك للمتابعة إلى حسابك</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="البريد الإلكتروني"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="كلمة المرور"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={error}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              تسجيل الدخول
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  )
}
