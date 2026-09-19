import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchProfile } from './api'
import type { Profile } from '@/types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    try {
      const p = await fetchProfile(userId)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let active = true

    // Safety net: if getSession() hangs for any reason (bad network, a
    // misconfigured project, etc.), never leave the whole app stuck behind
    // the loading spinner — fail open to "signed out" after 8 seconds.
    const safetyTimer = window.setTimeout(() => {
      if (active) setLoading(false)
    }, 8000)

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return
        setSession(data.session)
        if (data.session?.user.id) {
          await loadProfile(data.session.user.id)
        }
      })
      .catch(() => {
        // Network hiccup, misconfigured keys, etc. — fail safe to "signed out"
        // instead of leaving the app stuck on a spinner forever.
        if (active) setSession(null)
      })
      .finally(() => {
        window.clearTimeout(safetyTimer)
        if (active) setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user.id) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      window.clearTimeout(safetyTimer)
      sub.subscription.unsubscribe()
    }
  }, [])

  async function refreshProfile() {
    if (session?.user.id) {
      await loadProfile(session.user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
