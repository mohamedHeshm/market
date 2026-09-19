import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Bell, User } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { useNotifications } from '@/features/notifications/hooks'
import { Logo } from '@/components/common/Logo'

export function SiteHeader() {
  const { session } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const { data: notifications } = useNotifications(session?.user.id)
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          <Link to="/stores" className="hover:text-ink">المتاجر</Link>
          <Link to="/orders" className="hover:text-ink">طلباتي</Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5"
            aria-label="الإشعارات"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="relative flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5"
            aria-label="السلة"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute end-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-amber-accent text-[10px] font-bold text-ink">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate(session ? '/profile' : '/login')}
            className="hidden size-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5 md:flex"
            aria-label="حسابي"
          >
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
