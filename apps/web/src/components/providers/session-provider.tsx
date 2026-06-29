'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { KadarnRole, OrganizationMembership } from '@kadarn/types'
import { resolveRole, defaultRedirect } from '@kadarn/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SessionState {
  user: User | null
  role: KadarnRole | null
  membership: OrganizationMembership | null
  loading: boolean
}

interface SessionContextValue extends SessionState {
  signOut: () => Promise<void>
  setActiveMembership: (membership: OrganizationMembership) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [state, setState] = useState<SessionState>({
    user: null,
    role: null,
    membership: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user ?? null
      const role = user ? resolveRole(user.user_metadata) : null
      setState(s => ({ ...s, user, role, loading: false }))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null
      const role = user ? resolveRole(user.user_metadata) : null
      setState(s => ({ ...s, user, role }))
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, role: null, membership: null, loading: false })
    router.push('/auth/login')
  }, [supabase, router])

  const setActiveMembership = useCallback((membership: OrganizationMembership) => {
    setState(s => ({ ...s, membership }))
  }, [])

  return (
    <SessionContext.Provider value={{ ...state, signOut, setActiveMembership }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
