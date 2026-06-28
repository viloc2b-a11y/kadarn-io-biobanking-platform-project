import type { Metadata } from 'next'
import { KocShell } from '@/components/koc/koc-shell'

export const metadata: Metadata = {
  title: { template: '%s — KOC', default: 'Kadarn Operations Center' },
}

export default function KocLayout({ children }: { children: React.ReactNode }) {
  return <KocShell>{children}</KocShell>
}
