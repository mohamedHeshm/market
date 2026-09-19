import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { SiteHeader } from './SiteHeader'
import { BottomNav } from './BottomNav'

export function UserShell() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'inherit' } }} />
    </div>
  )
}
