'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from '@/components/providers/session-provider'
import { resolveRole } from '@kadarn/auth'

const NAV = [
  {
    section: 'Network',
    items: [
      { id: 'overview',    label: 'Overview',       href: '/koc',                icon: '◎' },
      { id: 'health',      label: 'Network Health', href: '/koc/health',         icon: '⬡' },
      { id: 'exceptions',  label: 'Exceptions',     href: '/koc/exceptions',     icon: '▲' },
    ],
  },
  {
    section: 'Evidence',
    items: [
      { id: 'kpe',         label: 'KPE',            href: '/koc/kpe',            icon: '◇' },
      { id: 'discovery',   label: 'Institutional Discovery', href: '/koc/discovery',      icon: '◆' },
      { id: 'provenance',  label: 'Provenance',     href: '/koc/provenance',     icon: '▱' },
      { id: 'compliance',  label: 'Compliance',     href: '/koc/compliance',     icon: '○' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { id: 'capacity',    label: 'Capacity',       href: '/koc/capacity',       icon: '▦' },
      { id: 'programs',    label: 'Programs',       href: '/koc/programs',       icon: '◈' },
      { id: 'ai',          label: 'AI Insights',    href: '/koc/ai',             icon: '⇄' },
          { id: 'analytics',   label: 'Analytics',     href: '/koc/analytics',      icon: '◇' },
      { id: 'ecosystem',   label: 'Ecosystem',      href: '/koc/ecosystem',      icon: '◎' },
    ],
  },
  {
    section: 'Engines',
    items: [
      { id: 'policy',      label: 'Policy',         href: '/koc/policy',         icon: '◈' },
      { id: 'workflow',    label: 'Workflow',       href: '/koc/workflow',       icon: '⇄' },
      { id: 'twins',       label: 'Twins',          href: '/koc/twins',          icon: '◆' },
      { id: 'knowledge',   label: 'Knowledge',      href: '/koc/knowledge',      icon: '◇' },
    ],
  },
  {
    section: 'Platform',
    items: [
          { id: 'logistics',    label: 'Logistics',        href: '/koc/logistics',      icon: '▱' },
          { id: 'platform-health', label: 'Platform Health',  href: '/koc/platform-health', icon: '⬡' },
      { id: 'activity',    label: 'Activity',       href: '/koc/activity',       icon: '⬡' },
      { id: 'events',      label: 'Event Stream',    href: '/koc/events',               icon: '⇄' },
      { id: 'network',     label: 'Network Map',     href: '/koc/network',        icon: '◎' },
          { id: 'notifications', label: 'Notifications',href: '/koc/notifications',    icon: '▲' },
    ],
  },
]

export function KocShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useSession()
  const router  = useRouter()
  const pathname = usePathname()

  // ── Notifications ──
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifData, setNotifData] = useState<any>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(() => {
    fetch('/api/v1/notifications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setNotifData(d.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/auth/login?next=/koc'); return }

    const role = resolveRole(user.user_metadata ?? {})
    if (role !== 'kadarn_internal') {
      router.push('/workspace')
    }
  }, [user, loading, router])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  if (loading || !user) return <KocSkeleton />

  const currentLabel = NAV.flatMap(s => s.items).find(i =>
    i.href === pathname || (i.href !== '/koc' && pathname.startsWith(i.href))
  )?.label ?? 'KOC'

  const allNotifs = notifData ? [
    ...(notifData.activity ?? []).map((n: any) => ({ ...n, _type: 'activity', _time: n.created_at })),
    ...(notifData.challenges ?? []).map((n: any) => ({ ...n, _type: 'challenge', _time: n.created_at })),
    ...(notifData.tasks ?? []).map((n: any) => ({ ...n, _type: 'workflow', _time: n.created_at })),
  ].sort((a: any, b: any) => new Date(b._time ?? 0).getTime() - new Date(a._time ?? 0).getTime()).slice(0, 8) : []

  const totalNotifs = allNotifs.length

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
        {/* Header */}
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <KadarnDots />
            <span style={{ fontWeight: 900, fontSize: 15 }}>Kadarn</span>
          </Link>
          <div style={{
            padding: '8px 12px',
            borderRadius: 9,
            background: 'rgba(139,68,255,0.1)',
            border: '1px solid rgba(139,68,255,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', letterSpacing: 0.5 }}>
              KOC
            </div>
            <div style={{ fontSize: 10, color: 'rgba(139,68,255,0.6)', marginTop: 2 }}>
              Kadarn Operations Center
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {NAV.map(section => (
            <div key={section.section} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                color: 'var(--txdd)', fontWeight: 700, padding: '0 8px', marginBottom: 4,
              }}>
                {section.section}
              </div>
              {section.items.map(item => {
                const active = pathname === item.href ||
                  (item.href !== '/koc' && pathname.startsWith(item.href))
                return (
                  <Link key={item.id} href={item.href} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 8px',
                    borderRadius: 7,
                    fontSize: 13,
                    color: active ? 'var(--purple)' : 'var(--txd)',
                    background: active ? 'rgba(139,68,255,0.1)' : 'transparent',
                    fontWeight: active ? 700 : 400,
                    marginBottom: 1,
                  }}>
                    <span style={{ fontSize: 11, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Live indicator */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontSize: 10, color: 'var(--txdd)', flex: 1 }}>Live</span>
          <button onClick={() => signOut()} style={{ fontSize: 11, color: 'var(--txdd)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 228, flex: 1, minHeight: '100vh', background: 'var(--navy)' }}>
        {/* Top bar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 10,
          background: 'var(--navy)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <span style={{ fontSize: 11, color: 'rgba(139,68,255,0.6)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            KOC
          </span>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontSize: 12, color: 'var(--txd)', fontWeight: 600 }}>{currentLabel}</span>
          <div style={{ flex: 1 }} />
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifs() }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', padding: '4px', borderRadius: 6,
                color: notifOpen ? 'var(--purple)' : 'var(--txdd)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {totalNotifs > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {totalNotifs}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 360, maxHeight: 420, overflowY: 'auto',
                background: 'var(--navy2)', border: '1px solid var(--border)',
                borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 200,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)' }}>Notifications</span>
                  <button onClick={() => setNotifData(null)} style={{ fontSize: 10, color: 'var(--txdd)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Mark all read
                  </button>
                </div>
                {allNotifs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--txdd)', fontSize: 12 }}>No recent notifications</div>
                ) : (
                  allNotifs.map((n: any, i: number) => {
                    const typeColors: Record<string, string> = { activity: 'var(--blue)', challenge: 'var(--red)', workflow: 'var(--amber)' }
                    return (
                      <div key={n.id ?? i} style={{
                        padding: '10px 16px',
                        borderBottom: i < allNotifs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        display: 'flex', gap: 10, cursor: 'pointer',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setNotifOpen(false)}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[n._type] ?? 'var(--txdd)', marginTop: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--tx)', fontWeight: 600 }}>{n.summary ?? n.title ?? n.action ?? n._type}</div>
                          <div style={{ fontSize: 10, color: 'var(--txdd)', marginTop: 2 }}>
                            {n._type} · {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}{n.resource_type ? ` · ${n.resource_type}` : ''}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
          <span style={{ fontSize: 11, color: 'var(--txdd)' }}>
            {user.email}
          </span>
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
      <circle cx="45" cy="50" r="5" fill="url(#lgkoc)" />
      <defs>
        <linearGradient id="lgkoc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0CC5C1" />
          <stop offset="100%" stopColor="#8B44FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function KocSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 228, background: 'var(--navy2)', borderRight: '1px solid var(--border)' }} />
      <div style={{ flex: 1, padding: 28 }}>
        <div style={{ height: 32, width: 180, borderRadius: 8, background: 'var(--navy2)', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 88, borderRadius: 12, background: 'var(--navy2)' }} />)}
        </div>
      </div>
    </div>
  )
}
