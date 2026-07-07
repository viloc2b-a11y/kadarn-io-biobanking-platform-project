import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

export const SHELL_ORIENTATION = {
  ROW: 'row',
  COLUMN: 'column',
} as const

export type ShellOrientation = (typeof SHELL_ORIENTATION)[keyof typeof SHELL_ORIENTATION]

interface KadarnMarkProps {
  size?: number
  gradientId?: string
  ariaHidden?: boolean
}

interface KadarnBrandLinkProps {
  href: string
  size?: number
  labelSize?: number
  gradientId?: string
  style?: CSSProperties
}

interface ApplicationShellRootProps {
  children: ReactNode
  orientation?: ShellOrientation
  style?: CSSProperties
}

interface AuthenticatedShellFrameProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
  mainStyle?: CSSProperties
  contentStyle?: CSSProperties
}

export function KadarnMark({
  size = 20,
  gradientId = 'kadarn-mark-gradient',
  ariaHidden = true,
}: KadarnMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden={ariaHidden}>
      <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
      <circle cx="28" cy="60" r="8" fill="#4467F2" />
      <circle cx="62" cy="20" r="8" fill="#4467F2" />
      <circle cx="72" cy="50" r="7" fill="#7B44FF" />
      <circle cx="62" cy="78" r="7" fill="#8B44FF" />
      <circle cx="45" cy="50" r="5" fill={`url(#${gradientId})`} />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0CC5C1" />
          <stop offset="100%" stopColor="#8B44FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function KadarnBrandLink({
  href,
  size = 20,
  labelSize = 15,
  gradientId,
  style,
}: KadarnBrandLinkProps) {
  return (
    <Link href={href} style={{ ...brandLinkStyle, ...style }}>
      <KadarnMark size={size} gradientId={gradientId} />
      <span style={{ fontWeight: 900, fontSize: labelSize }}>Kadarn</span>
    </Link>
  )
}

export function ApplicationShellRoot({
  children,
  orientation = SHELL_ORIENTATION.ROW,
  style,
}: ApplicationShellRootProps) {
  return (
    <div style={{ ...rootStyle, flexDirection: orientation, ...style }}>
      {children}
    </div>
  )
}

export function AuthenticatedShellFrame({
  sidebar,
  topbar,
  children,
  mainStyle,
  contentStyle,
}: AuthenticatedShellFrameProps) {
  return (
    <ApplicationShellRoot>
      {sidebar}
      <main style={{ ...mainPaneStyle, ...mainStyle }}>
        {topbar}
        <div style={{ ...contentPaneStyle, ...contentStyle }}>{children}</div>
      </main>
    </ApplicationShellRoot>
  )
}

const rootStyle: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
}

const brandLinkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--tx)',
  textDecoration: 'none',
}

const mainPaneStyle: CSSProperties = {
  marginLeft: 228,
  flex: 1,
  minHeight: '100vh',
}

const contentPaneStyle: CSSProperties = {
  padding: 28,
}
