'use client'

import { useSession } from '@/components/providers/session-provider'
import { useRouter } from 'next/navigation'

interface RequestCtaProps {
  type: 'access' | 'feasibility'
  targetId: string
  targetType: 'supply_item' | 'organization'
}

export function RequestCta({ type, targetId, targetType }: RequestCtaProps) {
  const { user } = useSession()
  const router = useRouter()

  const label = type === 'access' ? 'Request Access' : 'Check Feasibility'
  const accent = type === 'access' ? 'var(--teal)' : 'var(--blue)'

  function handleClick() {
    if (!user) {
      const next = type === 'access'
        ? `/marketplace/requests/access?target=${targetId}&kind=${targetType}`
        : `/marketplace/requests/feasibility?target=${targetId}&kind=${targetType}`
      router.push(`/auth/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (type === 'access') {
      router.push(`/marketplace/requests/access?target=${targetId}&kind=${targetType}`)
    } else {
      router.push(`/marketplace/requests/feasibility?target=${targetId}&kind=${targetType}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${accent}35`,
        background: `${accent}10`,
        color: accent,
        fontWeight: 700,
        fontSize: 12,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}
