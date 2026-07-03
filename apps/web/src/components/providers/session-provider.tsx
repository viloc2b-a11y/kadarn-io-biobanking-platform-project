'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { KadarnRole, OrganizationMembership } from '@kadarn/types'
import { resolveRole, defaultRedirect } from '@kadarn/auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  createE2EMockUser,
  E2E_MOCK_MEMBERSHIP,
  isE2EAuthClientEnabled,
} from '@/lib/e2e/mock-session'
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
  const e2eAuth = isE2EAuthClientEnabled()
  const supabase = e2eAuth ? null : getSupabaseClient()

  const [state, setState] = useState<SessionState>(() =>
    e2eAuth
      ? {
          user: createE2EMockUser(),
          role: 'org_admin',
          membership: E2E_MOCK_MEMBERSHIP,
          loading: false,
        }
      : { user: null, role: null, membership: null, loading: true },
  )

  useEffect(() => {
    if (e2eAuth || !supabase) return

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
  }, [e2eAuth, supabase])

  const signOut = useCallback(async () => {
    if (e2eAuth) {
      setState({ user: null, role: null, membership: null, loading: false })
      router.push('/login')
      return
    }
    if (!supabase) return
    await supabase.auth.signOut()
    setState({ user: null, role: null, membership: null, loading: false })
    router.push('/login')
  }, [e2eAuth, supabase, router])

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
