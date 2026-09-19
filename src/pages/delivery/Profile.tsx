import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { updateProfile, signOut } from '@/features/auth/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/primitives'
import { ChangePasswordCard } from '@/features/auth/ChangePasswordCard'

export default function DeliveryProfilePage() {
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
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">حسابي</h1>
      <Card className="flex flex-col gap-4 p-4">
        <Input label="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="رقم الهاتف" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="البريد الإلكتروني" value={session?.user.email ?? ''} disabled />
        <Button onClick={handleSave} loading={saving} className="self-start">
          حفظ التغييرات
        </Button>
      </Card>

      <ChangePasswordCard />

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
