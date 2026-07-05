/**
 * RC-11.3 — Evidence Core claim + evaluation → Sponsor Passport PassportClaim.
 */

import { evaluateClaim, type Claim, type CounterEvidence, type EvidenceNode } from '@kadarn/evidence-core'
import type { PassportClaim } from '../types'
import { mapConfidenceLevel } from './map-confidence'
import { mapMinimalProvenance, selectPrimaryEvidenceNode } from './map-provenance'
import { toCandidateStatement } from './map-statement'

export function splitEvidenceNodes(nodes: EvidenceNode[]): {
  evidenceNodes: EvidenceNode[]
  counterEvidence: CounterEvidence[]
} {
  const evidenceNodes: EvidenceNode[] = []
  const counterEvidence: CounterEvidence[] = []

  for (const node of nodes) {
    if (node.weight < 0) {
      counterEvidence.push({
        ...node,
        isCounterEvidence: true,
        hasResponse: false,
        responseId: null,
      })
    } else {
      evidenceNodes.push(node)
    }
  }

  return { evidenceNodes, counterEvidence }
}

function formatAsOfDate(isoTimestamp: string): string {
  if (!isoTimestamp) return new Date().toISOString().slice(0, 10)
  return isoTimestamp.slice(0, 10)
}

function buildConfidenceExplanation(reasoningChain: string, breakdownSummaries: string[]): string {
  const chain = reasoningChain.trim()
  if (chain) return chain
  return breakdownSummaries.filter(Boolean).join(' ')
}

export function mapClaimToPassportClaim(params: {
  claim: Claim
  claimEvidenceNodes: EvidenceNode[]
  actorId: string
  correlationId: string
}): PassportClaim {
  const { claim, claimEvidenceNodes, actorId, correlationId } = params
  const { evidenceNodes, counterEvidence } = splitEvidenceNodes(claimEvidenceNodes)

  const report = evaluateClaim({
    claimId: claim.id,
    claims: [claim],
    evidenceNodes,
    counterEvidence,
    actorId,
    correlationId,
  })

  const primaryEvidence = selectPrimaryEvidenceNode(evidenceNodes)
  const provenance = primaryEvidence
    ? mapMinimalProvenance(primaryEvidence)
    : {
        documentTitle: claim.name,
        documentDate: formatAsOfDate(claim.temporal.updatedAt),
        evidenceClass: 'Class B — Institutional Documentary Evidence',
        excerpt: claim.description,
      }

  const statementSource = claim.description.trim() || claim.name

  return {
    id: claim.id,
    taxonomyId: claim.claimTypeId,
    statement: toCandidateStatement(statementSource),
    confidence: mapConfidenceLevel(report.confidenceLevel),
    confidenceExplanation: buildConfidenceExplanation(
      report.explanation.reasoningChain,
      report.contributionBreakdown.map((item) => item.summary),
    ),
    contested: report.hasUnresolvedCounterEvidence,
    asOf: formatAsOfDate(report.evaluatedAt || claim.temporal.updatedAt),
    provenance,
  }
}

export function mapClaimsToPassportClaims(params: {
  claims: Claim[]
  evidenceByClaimId: Record<string, EvidenceNode[]>
  actorId: string
  correlationId: string
}): PassportClaim[] {
  return params.claims.map((claim) =>
    mapClaimToPassportClaim({
      claim,
      claimEvidenceNodes: params.evidenceByClaimId[claim.id] ?? [],
      actorId: params.actorId,
      correlationId: params.correlationId,
    }),
  )
}
