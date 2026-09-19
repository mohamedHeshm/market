import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

export async function listNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  return data as Notification[]
}

export async function markAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw error
  }
}

export function useNotifications(userId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channelName = `notifications-${userId}`

    // منع وجود أكثر من channel بنفس الاسم
    const existingChannel = supabase
      .getChannels()
      .find(
        (channel) =>
          channel.topic === `realtime:${channelName}`,
      )

    if (existingChannel) {
      void supabase.removeChannel(existingChannel)
    }

    // مهم جدًا:
    // on() قبل subscribe()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ['notifications', userId],
          })
        },
      )

    channel.subscribe((status) => {
      console.log(
        '[Notifications Realtime]',
        status,
      )
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, qc])

  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () =>
      listNotifications(userId as string),
    enabled: Boolean(userId),
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['notifications'],
      })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      markAllAsRead(userId),

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ['notifications'],
      })
    },
  })
}