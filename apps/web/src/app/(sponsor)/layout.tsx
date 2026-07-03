import type { Metadata } from 'next'
import { SponsorShell } from '@/components/sponsor/sponsor-shell'

export const metadata: Metadata = {
  title: { template: '%s — Sponsor Workspace', default: 'Sponsor Workspace' },
}

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return <SponsorShell>{children}</SponsorShell>
}
