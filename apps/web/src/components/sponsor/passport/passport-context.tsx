'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { InstitutionalPassport, PassportClaim } from './passport-types'

interface SponsorPassportContextValue {
  activePassport: InstitutionalPassport | null
  setActivePassport: (passport: InstitutionalPassport | null) => void
  selectedClaim: PassportClaim | null
  selectClaim: (claim: PassportClaim | null) => void
}

const SponsorPassportContext = createContext<SponsorPassportContextValue | null>(null)

export function SponsorPassportProvider({ children }: { children: React.ReactNode }) {
  const [activePassport, setActivePassportState] = useState<InstitutionalPassport | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<PassportClaim | null>(null)

  const setActivePassport = useCallback((passport: InstitutionalPassport | null) => {
    setActivePassportState(passport)
    setSelectedClaim(null)
  }, [])

  const selectClaim = useCallback((claim: PassportClaim | null) => {
    setSelectedClaim(claim)
  }, [])

  const value = useMemo(
    () => ({ activePassport, setActivePassport, selectedClaim, selectClaim }),
    [activePassport, setActivePassport, selectedClaim, selectClaim],
  )

  return (
    <SponsorPassportContext.Provider value={value}>
      {children}
    </SponsorPassportContext.Provider>
  )
}

export function useSponsorPassportContext(): SponsorPassportContextValue {
  const ctx = useContext(SponsorPassportContext)
  if (!ctx) {
    throw new Error('useSponsorPassportContext must be used within SponsorPassportProvider')
  }
  return ctx
}

/** Safe hook for shell — returns null when outside provider (should not happen). */
export function useSponsorPassportContextOptional(): SponsorPassportContextValue | null {
  return useContext(SponsorPassportContext)
}
