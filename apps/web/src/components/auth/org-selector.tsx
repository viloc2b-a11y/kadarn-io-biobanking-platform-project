'use client'

import { useRouter } from 'next/navigation'
import type { OrganizationMembership } from '@kadarn/types'
import { defaultRedirect, resolveRole } from '@kadarn/auth'
import { useSession } from '@/components/providers/session-provider'
import { getSupabaseClient } from '@/lib/supabase/client'

interface OrgSelectorProps {
  memberships: OrganizationMembership[]
}

export function OrgSelector({ memberships }: OrgSelectorProps) {
  const router = useRouter()
  const { user, setActiveMembership } = useSession()

  async function selectOrg(membership: OrganizationMembership) {
    const supabase = getSupabaseClient()

    // Persist active org in user metadata so middleware can read it
    await supabase.auth.updateUser({
      data: { active_org_id: membership.org_id },
    })

    setActiveMembership(membership)

    const role = user ? resolveRole(user.user_metadata) : 'org_member'
    router.push(defaultRedirect(role, true))
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy)',
    }}>
      <div style={{ width: 480, padding: 40, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--navy2)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Select organization</h1>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginBottom: 28 }}>
          You belong to multiple organizations. Choose your active workspace.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memberships.map(m => (
            <button
              key={m.org_id}
              onClick={() => selectOrg(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: 12,
                border: '1px solid rgba(68,103,242,0.2)',
                background: 'rgba(68,103,242,0.05)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 3 }}>
                  {m.org_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txdd)', textTransform: 'capitalize' }}>
                  {m.org_type} · {m.role}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200, justifyContent: 'flex-end' }}>
                {m.capabilities.slice(0, 3).map(cap => (
                  <span key={cap} style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: 'rgba(68,103,242,0.12)',
                    color: 'var(--blue)',
                  }}>
                    {cap}
                  </span>
                ))}
                {m.capabilities.length > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--txdd)' }}>
                    +{m.capabilities.length - 3}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
