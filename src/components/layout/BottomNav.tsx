import { NavLink } from 'react-router-dom'
import { Home, Store, ShoppingCart, ClipboardList, UserRound } from 'lucide-react'
import { useCart } from '@/features/cart/CartContext'
import { cn } from '@/lib/cn'

const items = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/stores', label: 'المتاجر', icon: Store, end: false },
  { to: '/cart', label: 'السلة', icon: ShoppingCart, end: false },
  { to: '/orders', label: 'طلباتي', icon: ClipboardList, end: false },
  { to: '/profile', label: 'حسابي', icon: UserRound, end: false },
]

export function BottomNav() {
  const { cart } = useCart()
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                isActive ? 'text-brand-800' : 'text-muted'
              )
            }
          >
            <span className="relative">
              <Icon size={22} />
              {to === '/cart' && itemCount > 0 && (
                <span className="absolute -end-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-amber-accent text-[9px] font-bold text-ink">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
