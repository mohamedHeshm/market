import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin, LogOut, ChevronLeft, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { updateProfile, signOut } from '@/features/auth/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { ROLE_HOME_ROUTE, ROLE_LABELS } from '@/constants'
import { ChangePasswordCard } from '@/features/auth/ChangePasswordCard'

export default function ProfilePage() {
  const { profile, session, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!session?.user.id) return
    setSaving(true)
    try {
      await updateProfile(session.user.id, { name, phone })
      await refreshProfile()
      toast.success('تم تحديث بياناتك')
    } catch {
      toast.error('تعذر حفظ التغييرات')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-ink">حسابي</h1>

      {profile && profile.role !== 'USER' && (
        <button
          onClick={() => navigate(ROLE_HOME_ROUTE[profile.role])}
          className="flex items-center justify-between rounded-card border border-brand-300 bg-brand-50 p-4 text-sm font-medium text-brand-800"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard size={17} /> الذهاب إلى لوحة تحكم {ROLE_LABELS[profile.role]}
          </span>
          <ChevronLeft size={17} />
        </button>
      )}

      <Card className="flex flex-col gap-4 p-4">
        <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="رقم الهاتف" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="البريد الإلكتروني" value={session?.user.email ?? ''} disabled />
        <Button onClick={handleSave} loading={saving} className="self-start">
          حفظ التغييرات
        </Button>
      </Card>

      <ChangePasswordCard />

      <button
        onClick={() => navigate('/addresses')}
        className="flex items-center justify-between rounded-card border border-line bg-surface p-4 text-sm font-medium text-ink"
      >
        <span className="flex items-center gap-2">
          <MapPin size={17} /> عناويني
        </span>
        <ChevronLeft size={17} className="text-muted" />
      </button>

      <Button
        variant="outline"
        onClick={async () => {
          await signOut()
          navigate('/login')
        }}
      >
        <LogOut size={16} /> تسجيل الخروج
      </Button>
    </div>
  )
}
