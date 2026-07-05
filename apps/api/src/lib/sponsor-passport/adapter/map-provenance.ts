/**
 * RC-11.3 — Evidence Core evidence node → PassportClaimProvenanceMinimal.
 */

import { EVIDENCE_CLASS_NAMES, type EvidenceClass } from '@kadarn/evidence-core'
import type { EvidenceNode } from '@kadarn/evidence-core'
import type { PassportClaimProvenanceMinimal } from '../types'

export function formatEvidenceClassLabel(evidenceClass: EvidenceClass): string {
  const name = EVIDENCE_CLASS_NAMES[evidenceClass]
  return `Class ${evidenceClass} — ${name}`
}

export function mapMinimalProvenance(node: EvidenceNode): PassportClaimProvenanceMinimal {
  return {
    documentTitle: node.source,
    documentDate: node.date,
    evidenceClass: formatEvidenceClassLabel(node.evidenceClass),
    excerpt: node.content.length > 280 ? `${node.content.slice(0, 277)}…` : node.content,
  }
}

export function selectPrimaryEvidenceNode(nodes: EvidenceNode[]): EvidenceNode | undefined {
  const supporting = nodes.filter((node) => node.weight >= 0)
  if (supporting.length === 0) return undefined

  return [...supporting].sort((a, b) => b.weight - a.weight)[0]
}
