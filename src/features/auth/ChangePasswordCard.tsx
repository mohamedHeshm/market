import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from './AuthContext'
import { changePassword } from './api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

type Strength = 'weak' | 'medium' | 'strong'

function getStrength(password: string): Strength | null {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
}

const STRENGTH_LABEL: Record<Strength, string> = { weak: 'ضعيفة', medium: 'متوسطة', strong: 'قوية' }
const STRENGTH_COLOR: Record<Strength, string> = { weak: 'bg-danger', medium: 'bg-amber-accent', strong: 'bg-success' }
const STRENGTH_WIDTH: Record<Strength, string> = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' }

/**
 * Single reusable "change password" unit for the whole app. Mounted as a
 * card inside each role's own account/profile/settings page (never
 * re-implemented per page). Handles its own validation, current-password
 * re-verification, and success/error messaging; the host page just
 * renders <ChangePasswordCard /> wherever it wants the section to appear.
 */
export function ChangePasswordCard() {
  const { session } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const strength = getStrength(newPassword)

  function reset() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('يرجى إدخال كلمة المرور الحالية')
      return
    }
    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword === currentPassword) {
      setError('كلمة المرور الجديدة يجب أن تختلف عن الحالية')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور الجديدة وتأكيدها غير متطابقين')
      return
    }
    if (!session?.user.email) {
      setError('تعذر التحقق من الحساب، يرجى تسجيل الدخول من جديد')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(session.user.email, currentPassword, newPassword)
      toast.success('تم تغيير كلمة المرور بنجاح')
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تغيير كلمة المرور، حاول مرة أخرى')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <KeyRound size={16} className="text-brand-700" /> تغيير كلمة المرور
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          label="كلمة المرور الحالية"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrent}
          onToggleVisible={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
        />

        <div className="flex flex-col gap-1.5">
          <PasswordField
            label="كلمة المرور الجديدة"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggleVisible={() => setShowNew((v) => !v)}
            autoComplete="new-password"
            hint="6 أحرف على الأقل"
          />
          {strength && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div className={cn('h-full rounded-full transition-all', STRENGTH_COLOR[strength], STRENGTH_WIDTH[strength])} />
              </div>
              <span className="text-xs text-muted">{STRENGTH_LABEL[strength]}</span>
            </div>
          )}
        </div>

        <PasswordField
          label="تأكيد كلمة المرور الجديدة"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showNew}
          onToggleVisible={() => setShowNew((v) => !v)}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" loading={submitting} className="self-start">
          حفظ كلمة المرور الجديدة
        </Button>
      </form>
    </Card>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete,
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  visible: boolean
  onToggleVisible: () => void
  autoComplete?: string
  hint?: string
  error?: string
}) {
  return (
    <div className="relative">
      <Input
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        hint={hint}
        error={error}
        className="pe-11"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute end-3 top-[34px] text-muted hover:text-ink"
        aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}
