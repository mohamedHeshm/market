import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export async function signUp(params: { name: string; email: string; password: string; phone?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { name: params.name, phone: params.phone ?? null },
    },
  })
  if (error) throw error
  return data
}

export async function signIn(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params)
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/**
 * Changes the signed-in user's password, re-verifying their current
 * password first (Supabase's updateUser() alone does not require it,
 * since it trusts the active session — this adds that extra check).
 * Supabase stores and transmits passwords securely on its own; this
 * function never persists or logs the plain-text password anywhere.
 */
export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (verifyError) {
    throw new Error('كلمة المرور الحالية غير صحيحة')
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'name' | 'phone'>>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}
