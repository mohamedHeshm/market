import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Compass size={28} />
      </div>
      <h1 className="text-xl font-bold text-ink">الصفحة غير موجودة</h1>
      <p className="text-sm text-muted">الرابط الذي حاولت فتحه غير متاح أو تم نقله.</p>
      <Link to="/">
        <Button>العودة للرئيسية</Button>
      </Link>
    </div>
  )
}
