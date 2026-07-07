import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { template: '%s — Kadarn Marketplace', default: 'Kadarn Marketplace' },
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: 'var(--navy)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
            <circle cx="28" cy="30" r="8" fill="#0CC5C1" />
            <circle cx="28" cy="60" r="8" fill="#4467F2" />
            <circle cx="62" cy="20" r="8" fill="#4467F2" />
            <circle cx="72" cy="50" r="7" fill="#7B44FF" />
            <circle cx="62" cy="78" r="7" fill="#8B44FF" />
            <circle cx="45" cy="50" r="5" fill="url(#lgnav)" />
            <defs>
              <linearGradient id="lgnav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0CC5C1" />
                <stop offset="100%" stopColor="#8B44FF" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontWeight: 900, fontSize: 16 }}>Kadarn</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {[
            { href: '/marketplace',               label: 'Discover' },
            { href: '/marketplace/organizations',  label: 'Organizations' },
            { href: '/marketplace/collections',    label: 'Collections' },
            { href: '/marketplace/services',       label: 'Services' },
            { href: '/marketplace/requests',       label: 'Requests' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              fontSize: 13,
              padding: '0 14px',
              height: 56,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--txd)',
              borderBottom: '2px solid transparent',
              fontWeight: 500,
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/workspace" style={{
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 7,
            color: 'var(--txd)',
            border: '1px solid var(--border)',
          }}>
            Workspace
          </Link>
          <Link href="/login" style={{
            fontSize: 12,
            padding: '5px 14px',
            borderRadius: 7,
            background: 'rgba(12,197,193,0.1)',
            color: 'var(--teal)',
            border: '1px solid rgba(12,197,193,0.2)',
            fontWeight: 700,
          }}>
            Sign in
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
