/**
 * RC-11.4 — Evidence Core graph traversal → PassportClaimProvenanceDetail.
 */

import {
  buildGraphFromData,
  getClaimEvidence,
  getContradictingEvidence,
  getSupportingEvidence,
  type Claim,
  type CounterEvidence,
  type EvidenceNode,
} from '@kadarn/evidence-core'
import type {
  PassportClaimProvenanceDetail,
  PassportEvidenceNode,
  PassportSourceDocument,
} from '../types'
import { mapClaimToPassportClaim, splitEvidenceNodes } from './map-claim'
import { formatEvidenceClassLabel } from './map-provenance'
import type { InstitutionEvidenceRead } from './queries'

function truncateExcerpt(content: string): string {
  return content.length > 280 ? `${content.slice(0, 277)}…` : content
}

function mapGraphNodeToPassportEvidenceNode(
  nodeId: string,
  data: EvidenceNode | CounterEvidence,
  supportsClaim: boolean,
): { evidenceNode: PassportEvidenceNode; sourceDocument: PassportSourceDocument } {
  const sourceDocumentId = `doc-${nodeId}`

  return {
    evidenceNode: {
      id: nodeId,
      evidenceClass: formatEvidenceClassLabel(data.evidenceClass),
      label: data.source,
      sourceDocumentId,
      supportsClaim,
      excerpt: truncateExcerpt(data.content),
    },
    sourceDocument: {
      id: sourceDocumentId,
      title: data.source,
      documentDate: data.date,
      evidenceClass: formatEvidenceClassLabel(data.evidenceClass),
    },
  }
}

function collectEvidenceTree(params: {
  graph: ReturnType<typeof buildGraphFromData>
  claimId: string
  claimEvidenceNodes: EvidenceNode[]
}): {
  evidenceNodes: PassportEvidenceNode[]
  sourceDocuments: PassportSourceDocument[]
} {
  const { graph, claimId, claimEvidenceNodes } = params
  let supporting = getSupportingEvidence(graph, claimId)
  let contradicting = getContradictingEvidence(graph, claimId)

  if (supporting.length === 0 && contradicting.length === 0) {
    const allClaimEvidence = getClaimEvidence(graph, claimId)
    supporting = allClaimEvidence.filter((node) => node.type === 'evidence_node')
    contradicting = allClaimEvidence.filter((node) => node.type === 'counter_evidence')
  }

  if (supporting.length === 0 && contradicting.length === 0 && claimEvidenceNodes.length > 0) {
    const { evidenceNodes, counterEvidence } = splitEvidenceNodes(claimEvidenceNodes)
    const evidenceNodesDto: PassportEvidenceNode[] = []
    const sourceDocuments: PassportSourceDocument[] = []

    for (const node of evidenceNodes) {
      const mapped = mapGraphNodeToPassportEvidenceNode(node.id, node, true)
      evidenceNodesDto.push(mapped.evidenceNode)
      sourceDocuments.push(mapped.sourceDocument)
    }

    for (const node of counterEvidence) {
      const mapped = mapGraphNodeToPassportEvidenceNode(node.id, node, false)
      evidenceNodesDto.push(mapped.evidenceNode)
      sourceDocuments.push(mapped.sourceDocument)
    }

    return { evidenceNodes: evidenceNodesDto, sourceDocuments }
  }

  const evidenceNodes: PassportEvidenceNode[] = []
  const sourceDocumentsById = new Map<string, PassportSourceDocument>()

  for (const node of supporting) {
    const data = node.data as EvidenceNode
    const mapped = mapGraphNodeToPassportEvidenceNode(node.id, data, true)
    evidenceNodes.push(mapped.evidenceNode)
    sourceDocumentsById.set(mapped.sourceDocument.id, mapped.sourceDocument)
  }

  for (const node of contradicting) {
    const data = node.data as CounterEvidence
    const mapped = mapGraphNodeToPassportEvidenceNode(node.id, data, false)
    evidenceNodes.push(mapped.evidenceNode)
    sourceDocumentsById.set(mapped.sourceDocument.id, mapped.sourceDocument)
  }

  return {
    evidenceNodes,
    sourceDocuments: [...sourceDocumentsById.values()],
  }
}

export function mapClaimProvenanceDetail(params: {
  read: InstitutionEvidenceRead
  institutionId: string
  claimId: string
  actorId: string
  correlationId: string
}): PassportClaimProvenanceDetail | undefined {
  const { read, institutionId, claimId, actorId, correlationId } = params
  const claim = read.claims.find((entry) => entry.id === claimId)
  if (!claim) return undefined

  const claimEvidenceNodes = read.evidenceByClaimId[claimId] ?? []
  const passportClaim = mapClaimToPassportClaim({
    claim,
    claimEvidenceNodes,
    actorId,
    correlationId,
  })

  const { evidenceNodes: regularNodes, counterEvidence } = splitEvidenceNodes(claimEvidenceNodes)
  const graph = buildGraphFromData({
    claims: [claim],
    evidenceNodes: [...regularNodes, ...counterEvidence],
    counterEvidence,
  })

  const tree = collectEvidenceTree({
    graph,
    claimId,
    claimEvidenceNodes,
  })

  const contradictingNodeIds = tree.evidenceNodes
    .filter((node) => !node.supportsClaim)
    .map((node) => node.id)

  const contested = passportClaim.contested || contradictingNodeIds.length > 0

  const detail: PassportClaimProvenanceDetail = {
    claimId,
    institutionId,
    statement: passportClaim.statement,
    confidence: passportClaim.confidence,
    confidenceExplanation: passportClaim.confidenceExplanation,
    contested,
    asOf: passportClaim.asOf,
    minimal: passportClaim.provenance,
    evidenceNodes: tree.evidenceNodes,
    sourceDocuments: tree.sourceDocuments,
  }

  if (contradictingNodeIds.length > 0) {
    detail.contradictingNodeIds = contradictingNodeIds
  }

  return detail
}

export function findClaimInRead(
  read: InstitutionEvidenceRead,
  claimId: string,
): Claim | undefined {
  return read.claims.find((claim) => claim.id === claimId)
}
