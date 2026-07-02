'use client'

import { DISCOVERY_COPY } from '@/components/discovery/discovery-copy'
import { DiscoveryInteractionDashboard } from '@/components/discovery/dashboard'
import { PanelSkeleton } from '@/components/discovery/panel-primitives'
import { useSession } from '@/components/providers/session-provider'

export default function WorkspaceDiscoveryPage() {
  const { user, loading } = useSession()

  if (loading) {
    return (
      <div style={{ padding: 24 }} aria-busy="true" aria-label="Loading Institutional Discovery">
        <PanelSkeleton rows={4} />
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--txd)' }} role="status">
        {DISCOVERY_COPY.signIn}
      </div>
    )
  }

  return <DiscoveryInteractionDashboard mode="site_director" />
}
