import { describe, it, expect } from 'vitest'
import { buildDiscoveryMetrics } from '../../apps/api/src/lib/discovery-metrics'

describe('buildDiscoveryMetrics', () => {
  it('returns zeroed metrics for empty session data', () => {
    const metrics = buildDiscoveryMetrics({
      counts: { artifacts: 0, entities: 0, relationships: 0, candidates: 0 },
      agentOutputs: {},
      curationEvents: [],
      validationNotes: [],
      sessionCreatedAt: '2026-01-01T00:00:00Z',
      latestRun: null,
    })

    expect(metrics.artifactsProcessed).toBe(0)
    expect(metrics.unknownDocuments).toBe(0)
    expect(metrics.lowConfidenceItems).toBe(0)
    expect(metrics.nextBestActionPresent).toBe(false)
    expect(metrics.ttfvMinutes).toBeNull()
  })

  it('derives counts from agent outputs', () => {
    const metrics = buildDiscoveryMetrics({
      counts: { artifacts: 3, entities: 5, relationships: 2, candidates: 0 },
      agentOutputs: {
        evidence_snapshot: {
          output: {
            summary: {
              documentsClassified: 3,
              unknownDocuments: 1,
              coverageIndicator: 'medium',
            },
            documentInventory: [
              { documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
              { documentType: 'UNKNOWN', confidence: 0.4, requiresHumanReview: true },
            ],
            nextBestAction: { action: 'Review unclassified documents', priority: 'high' },
            uncertainty: [{ type: 'unknown_document', description: 'One unknown' }],
          },
          confidence: 0.8,
          status: 'COMPLETED',
          created_at: '2026-01-01T00:00:00Z',
        },
        capability_detector: {
          output: { capabilities: [{ capabilityId: 'cap-1' }, { capabilityId: 'cap-2' }] },
          confidence: 0.7,
          status: 'COMPLETED',
          created_at: '2026-01-01T00:00:00Z',
        },
        claim_candidate_detector: {
          output: { candidates: [{ claimId: 'claim-1' }] },
          confidence: 0.6,
          status: 'COMPLETED',
          created_at: '2026-01-01T00:00:00Z',
        },
        evidence_gap_detector: {
          output: {
            reports: [{
              gaps: [{ gapId: 'g1' }, { gapId: 'g2' }],
              recommendedEvidence: [{ priority: 'high' }, { priority: 'low' }],
            }],
          },
          confidence: 0.5,
          status: 'COMPLETED',
          created_at: '2026-01-01T00:00:00Z',
        },
        'entity-extractor': {
          output: {
            entities: [
              { entityId: 'e1', confidence: 0.9 },
              { entityId: 'e2', confidence: 0.4, requiresHumanReview: true },
            ],
          },
          confidence: 0.7,
          status: 'COMPLETED',
          created_at: '2026-01-01T00:00:00Z',
        },
      },
      curationEvents: [{ id: 'c1' }],
      validationNotes: [{ id: 'n1' }, { id: 'n2' }],
      sessionCreatedAt: '2026-01-01T00:00:00Z',
      latestRun: { started_at: '2026-01-01T00:00:00Z', completed_at: '2026-01-01T00:30:00Z' },
    })

    expect(metrics.documentsClassified).toBe(3)
    expect(metrics.unknownDocuments).toBe(1)
    expect(metrics.capabilitiesDetected).toBe(2)
    expect(metrics.claimCandidatesDetected).toBe(1)
    expect(metrics.evidenceGapsDetected).toBe(2)
    expect(metrics.lowConfidenceItems).toBeGreaterThan(0)
    expect(metrics.curationEvents).toBe(1)
    expect(metrics.validationNotes).toBe(2)
    expect(metrics.nextBestActionPresent).toBe(true)
    expect(metrics.ttfvMinutes).toBe(30)
    expect(metrics.institutionReconstructionCoverage).toBe(55)
    expect(metrics.evidenceLeverageScore).toBe(20)
  })

  it('does not expose claim confidence or trust score fields', () => {
    const metrics = buildDiscoveryMetrics({
      counts: { artifacts: 1, entities: 1, relationships: 0, candidates: 0 },
      agentOutputs: {},
      curationEvents: [],
      validationNotes: [],
      sessionCreatedAt: '2026-01-01T00:00:00Z',
      latestRun: null,
    })

    const keys = Object.keys(metrics)
    expect(keys).not.toContain('claimConfidence')
    expect(keys).not.toContain('trustScore')
    expect(JSON.stringify(metrics)).not.toMatch(/claim confidence|trust score|certified/i)
  })
})
