'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/components/providers/session-provider'
import {
  E2E_WORKSPACE_PROFILE,
  isE2EAuthClientEnabled,
} from '@/lib/e2e/mock-session'
import { findSurfaceByPath, KUX_MOVEMENTS, SPONSOR_SURFACES } from './sponsor-nav'

export function SponsorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: sessionLoading, signOut } = useSession()
  const surface = findSurfaceByPath(pathname)
  const e2eAuth = isE2EAuthClientEnabled()

  useEffect(() => {
    if (sessionLoading || e2eAuth) return
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [user, sessionLoading, e2eAuth, router, pathname])

  if (!sessionLoading && !user && !e2eAuth) return null
  if (sessionLoading) return <SponsorSkeleton />

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email ??
    E2E_WORKSPACE_PROFILE.user.full_name ??
    'Sponsor user'

  const orgName = e2eAuth
    ? (E2E_WORKSPACE_PROFILE.active_org?.org_name ?? 'Sponsor organization')
    : ((user?.user_metadata?.active_org_name as string | undefined) ?? 'Sponsor organization')

  return (
    <div style={rootStyle}>
      {/* Global Header — KUX-004 §3 */}
      <header style={globalHeaderStyle} role="banner">
        <div style={headerLeftStyle}>
          <Link href="/sponsor" style={brandLinkStyle}>
            <KadarnDots />
            <span style={{ fontWeight: 900, fontSize: 15 }}>Kadarn</span>
          </Link>
          <span style={headerDividerStyle} aria-hidden="true">/</span>
          <span style={headerOrgStyle}>{orgName}</span>
          <span style={headerRoleStyle}>Sponsor Workspace</span>
        </div>
        <div style={headerRightStyle}>
          <button type="button" style={headerButtonStyle} aria-label="Global search">
            Search evidence and institutions…
          </button>
          <Link href="/sponsor/notifications" style={headerIconLinkStyle} aria-label="Alerts">
            Alerts
          </Link>
          <span style={headerUserStyle}>{displayName}</span>
          <button type="button" onClick={() => signOut()} style={headerSignOutStyle}>
            Sign out
          </button>
        </div>
      </header>

      {/* Context Bar — KUX-004 §4 */}
      <div style={contextBarStyle} role="region" aria-label="Workspace context">
        <div style={contextPrimaryStyle}>
          <span style={contextLabelStyle}>Surface</span>
          <span style={contextValueStyle}>{surface?.label ?? 'Sponsor Workspace'}</span>
        </div>
        <span style={contextSepStyle} aria-hidden="true">·</span>
        <div style={contextPrimaryStyle}>
          <span style={contextLabelStyle}>Lens</span>
          <span style={contextValueStyle}>Portfolio view</span>
        </div>
        <span style={contextSepStyle} aria-hidden="true">·</span>
        <div style={contextPrimaryStyle}>
          <span style={contextLabelStyle}>Moment</span>
          <span style={contextValueStyle}>As of now</span>
        </div>
        <div style={{ flex: 1 }} />
        <nav aria-label="Breadcrumb" style={breadcrumbStyle}>
          <span style={crumbStyle}>Portfolio</span>
          <span style={crumbSepStyle} aria-hidden="true">›</span>
          <span style={crumbActiveStyle}>{surface?.label ?? 'Dashboard'}</span>
        </nav>
      </div>

      {/* Main row: Left Nav · Work Area · Right Context Panel */}
      <div style={mainRowStyle}>
        <nav style={leftNavStyle} aria-label="Sponsor workspace navigation">
          <div style={navSectionLabelStyle}>Surfaces</div>
          <ul style={navListStyle}>
            {SPONSOR_SURFACES.map((item) => {
              const active =
                item.href === '/sponsor'
                  ? pathname === '/sponsor'
                  : pathname.startsWith(item.href)
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    style={navLinkStyle(active)}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div style={{ ...navSectionLabelStyle, marginTop: 24 }}>Movement · KUX-005</div>
          <p style={movementIntroStyle}>
            Users follow evidence toward a decision — not pages.
          </p>
          <ul style={movementListStyle}>
            {KUX_MOVEMENTS.map((movement) => (
              <li key={movement.id} style={movementItemStyle}>
                <span style={movementLabelStyle}>{movement.label}</span>
                <span style={movementSummaryStyle}>{movement.summary}</span>
              </li>
            ))}
          </ul>
        </nav>

        <main style={workAreaStyle} role="main" id="sponsor-work-area">
          {children}
        </main>

        <aside style={rightPanelStyle} role="complementary" aria-label="Reasoning context">
          <div style={panelHeaderStyle}>Reasoning context</div>
          <p style={panelBodyStyle}>
            Select an evidence-bearing item in the work area to inspect provenance,
            supporting and contradicting evidence, and rationale — without leaving this surface.
          </p>
          <p style={panelHintStyle}>
            Institution remains the persistent object; the Passport is its living representation at this moment.
          </p>
        </aside>
      </div>

      {/* Action Bar — KUX-004 §7 */}
      <footer style={actionBarStyle} role="region" aria-label="Contextual actions">
        <div style={nextActionStyle}>
          <span style={nextActionLabelStyle}>One next action</span>
          <span style={nextActionTextStyle}>
            {surface?.id === 'dashboard'
              ? 'Review open reasoning sessions or define a study requirements profile'
              : `Continue ${surface?.label ?? 'workspace'} work with evidence in view`}
          </span>
        </div>
        <div style={verbsStyle}>
          {['Review', 'Investigate', 'Compare', 'Trace', 'Share'].map((verb) => (
            <button key={verb} type="button" style={verbButtonStyle} disabled>
              {verb}
            </button>
          ))}
        </div>
      </footer>
    </div>
  )
}

function KadarnDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
      <circle cx="28" cy="60" r="8" fill="#4467F2" />
      <circle cx="62" cy="20" r="8" fill="#4467F2" />
      <circle cx="72" cy="50" r="7" fill="#7B44FF" />
      <circle cx="62" cy="78" r="7" fill="#8B44FF" />
    </svg>
  )
}

const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'var(--navy)',
}

const globalHeaderStyle: React.CSSProperties = {
  height: 52,
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  background: 'var(--navy2)',
  flexShrink: 0,
}

const headerLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--tx)',
  textDecoration: 'none',
}

const headerDividerStyle: React.CSSProperties = { color: 'var(--border)' }

const headerOrgStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--tx)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const headerRoleStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--teal)',
  fontWeight: 600,
}

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
}

const headerButtonStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txdd)',
  background: 'var(--navy3)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '6px 14px',
  cursor: 'default',
  minWidth: 220,
  textAlign: 'left',
}

const headerIconLinkStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  textDecoration: 'none',
}

const headerUserStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  maxWidth: 160,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const headerSignOutStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txdd)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
}

const contextBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 20px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--navy)',
  flexShrink: 0,
  flexWrap: 'wrap',
}

const contextPrimaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
}

const contextLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--txdd)',
  fontWeight: 700,
}

const contextValueStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  fontWeight: 600,
}

const contextSepStyle: React.CSSProperties = { color: 'var(--border)' }

const breadcrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
}

const crumbStyle: React.CSSProperties = { color: 'var(--txdd)' }
const crumbSepStyle: React.CSSProperties = { color: 'var(--border)' }
const crumbActiveStyle: React.CSSProperties = { color: 'var(--txd)', fontWeight: 600 }

const mainRowStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
}

const leftNavStyle: React.CSSProperties = {
  width: 248,
  borderRight: '1px solid var(--border)',
  background: 'var(--navy2)',
  padding: '16px 12px',
  overflowY: 'auto',
  flexShrink: 0,
}

const navSectionLabelStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: 'var(--txdd)',
  fontWeight: 700,
  padding: '0 8px',
  marginBottom: 8,
}

const navListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

function navLinkStyle(active: boolean): React.CSSProperties {
  return {
    display: 'block',
    padding: '8px 10px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--tx)' : 'var(--txd)',
    background: active ? 'rgba(12,197,193,0.08)' : 'transparent',
    borderLeft: active ? '2px solid var(--teal)' : '2px solid transparent',
    textDecoration: 'none',
    marginBottom: 2,
  }
}

const movementIntroStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txdd)',
  lineHeight: 1.45,
  padding: '0 8px',
  marginBottom: 10,
}

const movementListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: '0 8px',
}

const movementItemStyle: React.CSSProperties = {
  marginBottom: 10,
}

const movementLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--blue)',
  marginBottom: 2,
}

const movementSummaryStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: 'var(--txdd)',
  lineHeight: 1.4,
}

const workAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 28,
  minWidth: 0,
}

const rightPanelStyle: React.CSSProperties = {
  width: 280,
  borderLeft: '1px solid var(--border)',
  background: 'var(--navy2)',
  padding: '16px 18px',
  overflowY: 'auto',
  flexShrink: 0,
}

const panelHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--txd)',
  marginBottom: 12,
}

const panelBodyStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--txd)',
  lineHeight: 1.55,
  marginBottom: 12,
}

const panelHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--txdd)',
  lineHeight: 1.45,
  fontStyle: 'italic',
}

const actionBarStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  background: 'var(--navy2)',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  flexShrink: 0,
  flexWrap: 'wrap',
}

const nextActionStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
}

const nextActionLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: 'var(--teal)',
  fontWeight: 700,
  marginBottom: 4,
}

const nextActionTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--tx)',
  fontWeight: 600,
}

const verbsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const verbButtonStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--navy3)',
  color: 'var(--txdd)',
  cursor: 'not-allowed',
  opacity: 0.6,
}

function SponsorSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--navy)' }}>
      <div style={{ height: 52, borderBottom: '1px solid var(--border)', background: 'var(--navy2)' }} />
      <div style={{ height: 40, borderBottom: '1px solid var(--border)', background: 'var(--navy)' }} />
      <div style={{ flex: 1, padding: 28 }}>
        <div style={{ height: 32, width: 240, borderRadius: 8, background: 'var(--navy2)', marginBottom: 16 }} />
        <div style={{ height: 120, borderRadius: 12, background: 'var(--navy2)' }} />
      </div>
    </div>
  )
}
