import type { Metadata } from 'next'
import { WorkspaceShell } from '@/components/workspace/workspace-shell'

export const metadata: Metadata = {
  title: { template: '%s — Workspace', default: 'Workspace' },
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
