'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/components/providers/session-provider'
import { OrgSelector } from '@/components/auth/org-selector'
import type { OrganizationMembership } from '@kadarn/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface NavSection {
  label: string
  items: { id: string; label: string; href: string }[]
}

interface WorkspaceProfile {
  user: { full_name: string | null; email: string; role: string }
  active_org: { org_id: string; org_name: string; role: string; capabilities: string[]; applications: string[] } | null
  memberships: OrganizationMembership[]
  allowed_experiences: string[]
  default_redirect: string
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { user, loading: sessionLoading, signOut } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [profile, setProfile]   = useState<WorkspaceProfile | null>(null)
  const [navSections, setNav]   = useState<NavSection[]>([])
  const [profileLoading, setPL] = useState(true)
  const [orgMenuOpen, setOrgMenu] = useState(false)

  useEffect(() => {
    if (sessionLoading) return
    if (!user) { router.push('/auth/login?next=/workspace'); return }

    Promise.all([
      fetch(`${API}/api/v1/workspace/profile`,    { credentials: 'include' }).then(r => r.json()),
      fetch(`${API}/api/v1/workspace/navigation`, { credentials: 'include' }).then(r => r.json()),
    ]).then(([profileRes, navRes]) => {
      if (profileRes.data) setProfile(profileRes.data)
      if (navRes.data?.sections) setNav(navRes.data.sections)
    }).finally(() => setPL(false))
  }, [user, sessionLoading, router])

  // Not authenticated
  if (!sessionLoading && !user) return null

  // Loading
  if (sessionLoading || profileLoading) return <WorkspaceSkeleton />

  // No active org — show org selector
  if (profile && !profile.active_org) {
    return (
      <OrgSelector memberships={profile.memberships} />
    )
  }

  const org = profile?.active_org
  const capColor = 'var(--blue)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 228,
        borderRight: '1px solid var(--border)',
        background: 'var(--navy2)',
        position: 'fixed',
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}>
        {/* Org header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <KadarnDots />
            <span style={{ fontWeight: 900, fontSize: 15 }}>Kadarn</span>
          </Link>

          {/* Org switcher */}
          <button
            onClick={() => setOrgMenu(o => !o)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(68,103,242,0.2)',
              background: 'rgba(68,103,242,0.06)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {org?.org_name ?? 'Select org'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 1, textTransform: 'capitalize' }}>
                {org?.role ?? ''}
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--txdd)' }}>⌄</span>
          </button>

          {/* Org dropdown */}
          {orgMenuOpen && profile && profile.memberships.length > 1 && (
            <div style={{
              position: 'absolute',
              top: 110,
              left: 12,
              right: 12,
              background: 'var(--navy3)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              zIndex: 200,
              overflow: 'hidden',
            }}>
              {profile.memberships.map(m => (
                <button
                  key={m.org_id}
                  onClick={() => {
                    fetch(`${API}/api/v1/workspace/active-org`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ org_id: m.org_id }),
                    }).then(() => { setOrgMenu(false); router.refresh() })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: m.org_id === org?.org_id ? 'rgba(68,103,242,0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>{m.org_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 1, textTransform: 'capitalize' }}>{m.role}</div>
                </button>
              ))}
            </div>
          )}

          {/* Capability badges */}
          {org && org.capabilities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 8 }}>
              {org.capabilities.slice(0, 3).map(cap => (
                <span key={cap} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${capColor}12`, color: capColor, textTransform: 'capitalize' }}>
                  {cap.replace(/_/g, ' ')}
                </span>
              ))}
              {org.capabilities.length > 3 && (
                <span style={{ fontSize: 9, color: 'var(--txdd)' }}>+{org.capabilities.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--txdd)', fontWeight: 700, padding: '0 8px', marginBottom: 4 }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const active = pathname === item.href || (item.href !== '/workspace' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '7px 8px',
                      borderRadius: 7,
                      fontSize: 13,
                      color: active ? 'var(--blue)' : 'var(--txd)',
                      background: active ? 'rgba(68,103,242,0.1)' : 'transparent',
                      fontWeight: active ? 700 : 400,
                      marginBottom: 1,
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.user.full_name ?? profile?.user.email}
            </div>
            <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 1 }}>{profile?.user.role}</div>
          </div>
          <button onClick={() => signOut()} style={{ fontSize: 11, color: 'var(--txdd)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 228, flex: 1, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 12,
          background: 'var(--navy)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <span style={{ fontSize: 11, color: 'var(--txdd)', letterSpacing: 0.5 }}>
            {org?.org_name}
          </span>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: 12, color: 'var(--txd)', fontWeight: 600 }}>
            {navSections.flatMap(s => s.items).find(i => i.href === pathname)?.label ?? 'Workspace'}
          </span>
          <div style={{ flex: 1 }} />
          <Link href="/marketplace" style={{ fontSize: 12, color: 'var(--txdd)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            Marketplace
          </Link>
        </div>
        <div style={{ padding: 28 }}>{children}</div>
      </main>
    </div>
  )
}

function KadarnDots() {
  return (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
      <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
      <circle cx="28" cy="60" r="8" fill="#4467F2" />
      <circle cx="62" cy="20" r="8" fill="#4467F2" />
      <circle cx="72" cy="50" r="7" fill="#7B44FF" />
      <circle cx="62" cy="78" r="7" fill="#8B44FF" />
      <circle cx="45" cy="50" r="5" fill="url(#lgws)" />
      <defs>
        <linearGradient id="lgws" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0CC5C1" />
          <stop offset="100%" stopColor="#8B44FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function WorkspaceSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 228, background: 'var(--navy2)', borderRight: '1px solid var(--border)' }} />
      <div style={{ flex: 1, padding: 28 }}>
        <div style={{ height: 32, width: 200, borderRadius: 8, background: 'var(--navy2)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 90, borderRadius: 12, background: 'var(--navy2)' }} />)}
        </div>
      </div>
    </div>
  )
}
