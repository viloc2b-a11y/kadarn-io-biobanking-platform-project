'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export interface RealtimeSubscriptionOptions {
  enabled?: boolean
  table: string
  filter?: string
  onChange: () => void
}

/**
 * Subscribe to Supabase Realtime postgres_changes (Sprint 11).
 * Falls back silently when Realtime is disabled or unavailable.
 */
export function useSupabaseRealtime(options: RealtimeSubscriptionOptions): void {
  const { enabled = process.env.NEXT_PUBLIC_REALTIME_ENABLED === 'true', table, filter, onChange } = options

  useEffect(() => {
    if (!enabled) return

    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`kadarn:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => onChange(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, table, filter, onChange])
}
