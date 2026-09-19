import { supabase } from '@/lib/supabase'
import type { Address, Profile, UserRole } from '@/types'

// ---------- Addresses ----------
export async function listAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
  if (error) throw error
  return data as Address[]
}

export async function createAddress(payload: Partial<Address> & { user_id: string; address: string }) {
  if (payload.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', payload.user_id)
  }
  const { data, error } = await supabase.from('addresses').insert(payload).select().single()
  if (error) throw error
  return data as Address
}

export async function updateAddress(id: string, userId: string, payload: Partial<Address>) {
  if (payload.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
  }
  const { data, error } = await supabase.from('addresses').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data as Address
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id)
  if (error) throw error
}

// ---------- Admin: users ----------
export async function listUsers(opts: { role?: UserRole; search?: string } = {}) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (opts.role) query = query.eq('role', opts.role)
  if (opts.search) query = query.ilike('name', `%${opts.search}%`)
  const { data, error } = await query
  if (error) throw error
  return data as Profile[]
}

export async function setUserActive(userId: string, isActive: boolean) {
  const { data, error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId).select().single()
  if (error) throw error
  return data as Profile
}

export async function setUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select().single()
  if (error) throw error
  return data as Profile
}

export async function deleteUser(userId: string) {
  // Deletes the profile row; removing the underlying auth user requires
  // the Supabase service role and should be done from a secure server
  // context (e.g. an Edge Function), never from the browser.
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}
