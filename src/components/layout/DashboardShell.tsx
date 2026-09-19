import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Menu, X, LogOut, Bell } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Logo } from '@/components/common/Logo'
import { useAuth } from '@/features/auth/AuthContext'
import { signOut } from '@/features/auth/api'
import { useNotifications } from '@/features/notifications/hooks'
import { ROLE_LABELS } from '@/constants'

export interface DashboardNavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

export function DashboardShell({ navItems, title }: { navItems: DashboardNavItem[]; title: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const { data: notifications } = useNotifications(session?.user.id)
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button className="md:hidden" onClick={() => setDrawerOpen(false)} aria-label="إغلاق القائمة">
          <X size={20} />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-black/5'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line px-4 py-4">
        <p className="text-sm font-semibold text-ink">{profile?.name}</p>
        <p className="text-xs text-muted">{profile && ROLE_LABELS[profile.role]}</p>
        <button
          onClick={handleSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5"
        >
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 border-e border-line bg-surface md:block">{sidebarContent}</aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 bg-surface shadow-xl">{sidebarContent}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur">
          <button className="md:hidden" onClick={() => setDrawerOpen(true)} aria-label="فتح القائمة">
            <Menu size={22} />
          </button>
          <h1 className="text-base font-semibold text-ink">{title}</h1>
          <button
            onClick={() => navigate('notifications')}
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
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
