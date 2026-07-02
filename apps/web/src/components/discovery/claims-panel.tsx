import type { DashboardData, ProvenanceTargetType } from './types'
import { Badge, EmptyPanel, JsonBlock, PanelHeader, PanelSkeleton, cardStyle } from './panel-primitives'
import { ViewProvenanceLink } from './view-provenance-link'

export function DiscoveryClaimsPanel({
  data,
  loading,
  onViewProvenance,
}: {
  data: DashboardData | null
  loading: boolean
  onViewProvenance?: (targetType: ProvenanceTargetType, targetId: string) => void
}) {
  if (loading && !data) return <PanelSkeleton />
  if (!data) return <EmptyPanel message="No evidence claims yet." />

  const claimsOutput = data.agentOutputs['claim_candidate_detector']?.output ?? null
  const candidates = (claimsOutput?.candidates as Array<Record<string, unknown>> | undefined) ?? []

  if (!claimsOutput) {
    return (
      <EmptyPanel
        message="Kadarn has not proposed evidence claims for this session yet."
        hint="Evidence claims appear after capability and gap analysis."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PanelHeader
        title="Evidence Claims"
        description="Evidence claims Kadarn inferred from available artifacts. Each requires human review — discovery confidence only, not a final claim."
      />

      {candidates.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {candidates.slice(0, 30).map((claim) => (
            <div key={String(claim.claimId ?? claim.id)} style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>
                {String(claim.summary ?? claim.claimLabel ?? claim.label ?? claim.claimId ?? 'Claim candidate')}
              </div>
              {claim.sourceCapabilityId ? (
                <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 6 }}>
                  Source capability: {String(claim.sourceCapabilityId)}
                </div>
              ) : null}
              {claim.status ? <div style={{ marginTop: 8 }}><Badge label={String(claim.status)} tone="amber" /></div> : null}
              <ViewProvenanceLink
                targetType="CLAIM_CANDIDATE"
                targetId={String(claim.claimId ?? claim.id ?? '')}
                onViewProvenance={onViewProvenance}
              />
            </div>
          ))}
        </div>
      ) : (
        <JsonBlock value={claimsOutput} />
      )}
    </div>
  )
}
