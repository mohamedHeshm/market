import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { SetupNotice } from '@/components/common/SetupNotice'
import { isSupabaseConfigured } from '@/lib/supabase'

function App() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />
  }

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
