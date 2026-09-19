import { Button } from '@/components/ui/Button'
import { ShieldAlert } from 'lucide-react'
import { signOut } from '@/features/auth/api'
import { useNavigate } from 'react-router-dom'

export default function AccountDisabledPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldAlert size={28} />
      </div>
      <h1 className="text-xl font-bold text-ink">تم تعطيل هذا الحساب</h1>
      <p className="max-w-sm text-sm text-muted">
        تم إيقاف حسابك من قبل إدارة المنصة. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم.
      </p>
      <Button
        variant="outline"
        onClick={async () => {
          await signOut()
          navigate('/login')
        }}
      >
        تسجيل الخروج
      </Button>
    </div>
  )
}
