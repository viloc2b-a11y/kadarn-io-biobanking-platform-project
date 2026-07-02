// ==========================================================================
// Claim Candidate Detection — Tests
// ==========================================================================
// Sprint 20B.3.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  ClaimCandidateDetector,
  ClaimMappingRegistry,
  ClaimGates,
  ClaimStopConditionEvaluator,
} from '../src/claim-candidate/index.js';
import type { CandidateCapability } from '../src/capability/index.js';
import type { DiscoveryResult } from '../src/index.js';
import type { InstitutionalTimeline } from '../src/timeline/types.js';

// --------------------------------------------------------------------------
// Helpers: factory functions
// --------------------------------------------------------------------------

function makeCapabilities(overrides?: Partial<CandidateCapability>[]): CandidateCapability[] {
  const defaults: CandidateCapability[] = [
    {
      capabilityId: 'cap-abc123',
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC Processing',
      category: 'processing',
      status: 'detected',
      confidence: 0.85,
      supportingEntityIds: ['eq-1', 'temp-1'],
      supportingRelationshipIds: ['rel-1'],
      supportingArtifactIds: ['art-1'],
      supportingEventIds: [],
      reasoning: 'PBMC processing capability detected',
    },
  ];

  if (overrides) {
    return defaults.map((d, i) => ({ ...d, ...(overrides[i] ?? {}) }));
  }
  return defaults;
}

function makeDiscoveryResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    runId: 'run-claim-test',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [{ artifactId: 'art-1', filename: 'documents.zip' }],
    classifications: [
      { artifactId: 'art-1', documentType: 'SOP', confidence: 0.85, requiresHumanReview: false },
      { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
    ],
    entities: [
      { entityId: 'eq-1', type: 'EQUIPMENT', value: 'Centrifuge Mk3', normalizedValue: null, confidence: 0.8 },
      { entityId: 'temp-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
    ],
    relationships: [
      { relationshipId: 'rel-1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'eq-1', targetEntityId: 'temp-1', confidence: 0.7 },
    ],
    agentOutputs: [],
    ...overrides,
  };
}

function makeMinimalResult(): DiscoveryResult {
  return {
    runId: 'run-minimal',
    pipelineVersion: 'v1',
    completedAt: '',
    artifacts: [],
    classifications: [],
    entities: [],
    relationships: [],
    agentOutputs: [],
  };
}

function makeTimeline(): InstitutionalTimeline {
  return {
    siteId: 'site-test',
    generatedAt: new Date().toISOString(),
    events: [
      {
        eventId: 'evt-1',
        date: { value: '2024-01-15', precision: 'exact', rationale: 'Document date' },
        category: 'capability_milestone',
        title: 'PBMC processing capability established',
        narrative: 'Site acquired equipment for PBMC isolation',
        confidence: 0.85,
        evidenceEntityIds: ['eq-1'],
        evidenceRelationshipIds: [],
        sourceArtifactIds: ['art-1'],
        requiresHumanReview: false,
      },
    ],
    yearRange: { start: 2024, end: 2024 },
    eventCount: 1,
    requiresReviewCount: 0,
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('ClaimCandidateDetector', () => {
  it('detects a claim candidate from PBMC capability', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeDiscoveryResult());

    expect(result.candidates.length).toBeGreaterThan(0);
    const claim = result.candidates[0];
    expect(claim.claimId).toMatch(/^claim-cand-/);
    expect(claim.sourceCapabilityId).toBe('biospecimen.processing.pbmc');
    expect(claim.suggestedTaxonomy).toBe('biospecimen.processing.pbmc');
  });

  it('calculates evidence coverage correctly', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeDiscoveryResult());

    const claim = result.candidates[0];
    // PBMC requires: entities [EQUIPMENT, TEMPERATURE], docs [SOP, LAB_MANUAL], rels [CALIBRATION_FOR_EQUIPMENT], events []
    // Entity coverage: 2/2 = 1.0
    // Doc coverage: 2/2 = 1.0
    // Rel coverage: 1/1 = 1.0
    // Event coverage: 0 required but we HAVE timeline? No timeline passed — eventCategories set is empty
    // Actually without timeline: requiredEventCategories has items but eventCategories set is empty = 0/2 = 0
    // Weighted: (1.0 + 1.0 + 1.0 + 0) / 4 = 0.75
    expect(claim.evidenceCoverage).toBe(0.75);
  });

  it('blends confidence from capability * coverage', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeDiscoveryResult());

    const claim = result.candidates[0];
    // cap.confidence = 0.85, evidenceCoverage = 0.75
    // blended = 0.85 * 0.75 = 0.6375 → rounded to 0.64
    expect(claim.confidence).toBe(0.64);
  });

  it('identifies missing evidence when requirements not met', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeMinimalResult());

    const claim = result.candidates[0];
    expect(claim.missingEvidence.length).toBeGreaterThan(0);
    const missingCategories = claim.missingEvidence.map(m => m.category);
    expect(missingCategories).toContain('entity_type');
    expect(missingCategories).toContain('document_type');
    // CALIBRATION_FOR_EQUIPMENT is a required relationship type
    expect(missingCategories).toContain('relationship_type');
  });

  it('flags insufficient evidence when coverage is low', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeMinimalResult());

    const claim = result.candidates[0];
    // PBMC rule minCoverageForCandidate: 0.5
    // With empty result: entity 0/2=0, doc 0/2=0, rel 0/1=0, event 0/2=0 → coverage 0
    expect(claim.evidenceCoverage).toBeLessThan(0.5);
    expect(result.totalCandidates).toBe(0);
    expect(result.insufficientCount).toBe(1);
  });

  it('boosts coverage with timeline events', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeDiscoveryResult(), makeTimeline());

    const claim = result.candidates[0];
    // Now event coverage: relevantEventCategories ['capability_milestone', 'equipment_acquisition']
    // Timeline has 'capability_milestone' → 1/2 = 0.5
    // Weighted: (1.0 + 1.0 + 1.0 + 0.5) / 4 = 0.875
    expect(claim.evidenceCoverage).toBe(0.88);
  });

  it('returns empty result for empty capabilities', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect([], makeDiscoveryResult());

    expect(result.candidates).toEqual([]);
    expect(result.totalCandidates).toBe(0);
    expect(result.insufficientCount).toBe(0);
  });

  it('skips capabilities without mapping rules', () => {
    const detector = new ClaimCandidateDetector();
    const unknownCaps: CandidateCapability[] = [
      {
        capabilityId: 'cap-unknown',
        claimTypeId: 'unknown.capability',
        name: 'Unknown',
        category: 'special',
        status: 'detected',
        confidence: 0.9,
        supportingEntityIds: [],
        supportingRelationshipIds: [],
        supportingArtifactIds: [],
        supportingEventIds: [],
        reasoning: 'Unknown capability',
      },
    ];
    const result = detector.detect(unknownCaps, makeDiscoveryResult());

    expect(result.candidates).toEqual([]);
  });

  it('every claim candidate has human explanation', () => {
    const detector = new ClaimCandidateDetector();
    const result = detector.detect(makeCapabilities(), makeDiscoveryResult());

    for (const claim of result.candidates) {
      expect(claim.humanExplanation.length).toBeGreaterThan(0);
      expect(claim.humanExplanation).toContain(claim.suggestedTaxonomy);
      expect(claim.humanExplanation).toContain(`${(claim.evidenceCoverage * 100).toFixed(0)}%`);
    }
  });

  it('does not create official Claims or write to Evidence Core', () => {
    const detector = new ClaimCandidateDetector();
    expect((detector as any).createClaim).toBeUndefined();
    expect((detector as any).writeToEvidenceCore).toBeUndefined();
    expect((detector as any).promoteClaim).toBeUndefined();
  });

  it('supports custom mapping registry', () => {
    const customRules = [
      {
        sourceCapabilityId: 'custom.processing',
        suggestedTaxonomy: 'custom.processing',
        summaryTemplate: 'Custom processing capability',
        requiredEntityTypes: ['EQUIPMENT'],
        requiredDocumentTypes: ['SOP'],
        requiredRelationshipTypes: [],
        relevantEventCategories: [],
        minCoverageForCandidate: 0.3,
      },
    ];
    const registry = new ClaimMappingRegistry(customRules);
    const detector = new ClaimCandidateDetector(registry);
    const customCaps: CandidateCapability[] = [
      {
        capabilityId: 'cap-custom',
        claimTypeId: 'custom.processing',
        name: 'Custom Processing',
        category: 'processing',
        status: 'detected',
        confidence: 0.8,
        supportingEntityIds: ['eq-1'],
        supportingRelationshipIds: [],
        supportingArtifactIds: ['art-1'],
        supportingEventIds: [],
        reasoning: 'Custom capability',
      },
    ];
    const result = detector.detect(customCaps, makeDiscoveryResult());

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].sourceCapabilityId).toBe('custom.processing');
  });
});

// --------------------------------------------------------------------------
// Mapping Registry Tests
// --------------------------------------------------------------------------

describe('ClaimMappingRegistry', () => {
  it('returns rule for known capability', () => {
    const registry = new ClaimMappingRegistry();
    const rule = registry.getRule('biospecimen.processing.pbmc');
    expect(rule).toBeDefined();
    expect(rule!.suggestedTaxonomy).toBe('biospecimen.processing.pbmc');
  });

  it('returns undefined for unknown capability', () => {
    const registry = new ClaimMappingRegistry();
    const rule = registry.getRule('does.not.exist');
    expect(rule).toBeUndefined();
  });

  it('returns all rules', () => {
    const registry = new ClaimMappingRegistry();
    const all = registry.getAllRules();
    expect(all.length).toBeGreaterThan(0);
    // Should have at least one rule per category
    const categories = new Set(all.map(r => r.sourceCapabilityId.split('.')[1]));
    expect(categories.has('processing')).toBe(true);
    expect(categories.has('storage')).toBe(true);
    expect(categories.has('shipping')).toBe(true);
    expect(categories.has('regulatory')).toBe(true);
    expect(categories.has('operations')).toBe(true);
    expect(categories.has('therapeutic_area')).toBe(true);
  });

  it('supports custom rules', () => {
    const custom = [{ sourceCapabilityId: 'custom.one', suggestedTaxonomy: 'custom.one', summaryTemplate: 'Custom', requiredEntityTypes: [], requiredDocumentTypes: [], requiredRelationshipTypes: [], relevantEventCategories: [], minCoverageForCandidate: 0.3 }];
    const registry = new ClaimMappingRegistry(custom);
    expect(registry.getRule('custom.one')).toBeDefined();
    expect(registry.getRule('biospecimen.processing.pbmc')).toBeUndefined();
  });
});

// --------------------------------------------------------------------------
// Gates Tests
// --------------------------------------------------------------------------

describe('ClaimGates', () => {
  it('passes a well-supported candidate', () => {
    const gates = new ClaimGates();
    const candidate = makeSampleCandidate({ evidenceCoverage: 0.8, confidence: 0.7, missingEvidence: [] });
    expect(gates.passesAll(candidate)).toBe(true);
  });

  it('fails on low coverage', () => {
    const gates = new ClaimGates();
    const candidate = makeSampleCandidate({ evidenceCoverage: 0.1, confidence: 0.7, missingEvidence: [] });
    expect(gates.passesAll(candidate)).toBe(false);
  });

  it('fails on low confidence', () => {
    const gates = new ClaimGates();
    const candidate = makeSampleCandidate({ evidenceCoverage: 0.8, confidence: 0.05, missingEvidence: [] });
    expect(gates.passesAll(candidate)).toBe(false);
  });

  it('fails when missing evidence exceeds max', () => {
    const gates = new ClaimGates({ maxMissingEvidence: { enabled: true, params: { max: 1 } } });
    const candidate = makeSampleCandidate({
      evidenceCoverage: 0.8,
      confidence: 0.7,
      missingEvidence: [
        { category: 'entity_type', description: 'Missing EQUIPMENT', priority: 'high' },
        { category: 'document_type', description: 'Missing SOP', priority: 'medium' },
      ],
    });
    expect(gates.passesAll(candidate)).toBe(false);
  });

  it('filter removes failing candidates', () => {
    const gates = new ClaimGates();
    const good = makeSampleCandidate({ evidenceCoverage: 0.8, confidence: 0.7, missingEvidence: [] });
    const bad = makeSampleCandidate({ evidenceCoverage: 0.1, confidence: 0.05, missingEvidence: [], claimId: 'bad-1' });
    const filtered = gates.filter([good, bad]);
    expect(filtered.length).toBe(1);
    expect(filtered[0].claimId).toBe(good.claimId);
  });

  it('evaluate returns detailed results', () => {
    const gates = new ClaimGates();
    const candidate = makeSampleCandidate({ evidenceCoverage: 0.8, confidence: 0.7, missingEvidence: [] });
    const results = gates.evaluate(candidate);
    expect(results.length).toBeGreaterThanOrEqual(2); // at least min_coverage + min_confidence
    for (const r of results) {
      expect(r.passed).toBe(true);
      expect(r.claimId).toBe(candidate.claimId);
    }
  });
});

// --------------------------------------------------------------------------
// Stop Conditions Tests
// --------------------------------------------------------------------------

describe('ClaimStopConditionEvaluator', () => {
  it('stops on empty input', () => {
    const evaluator = new ClaimStopConditionEvaluator();
    const result = makeDetectionResult([]);
    expect(evaluator.shouldStop(result)).toBe(true);
  });

  it('does not stop when candidates exist', () => {
    const evaluator = new ClaimStopConditionEvaluator();
    const result = makeDetectionResult([makeSampleCandidate({})]);
    expect(evaluator.shouldStop(result)).toBe(false);
  });

  it('stops exceeding max_candidates', () => {
    const evaluator = new ClaimStopConditionEvaluator({
      conditions: [{ type: 'max_candidates', max: 2 } as any],
    });
    const candidates = Array.from({ length: 5 }, (_, i) =>
      makeSampleCandidate({ claimId: `c-${i}` }),
    );
    const result = makeDetectionResult(candidates);
    expect(evaluator.shouldStop(result)).toBe(true);
  });

  it('stops on diminishing returns', () => {
    const evaluator = new ClaimStopConditionEvaluator({
      conditions: [{ type: 'diminishing_returns', minNewConfidence: 0.6 } as any],
    });
    const candidates = [
      makeSampleCandidate({ confidence: 0.3 }),
      makeSampleCandidate({ confidence: 0.2 }),
    ];
    const result = makeDetectionResult(candidates);
    expect(evaluator.shouldStop(result)).toBe(true);
  });

  it('getStopReasons returns reasons', () => {
    const evaluator = new ClaimStopConditionEvaluator();
    const result = makeDetectionResult([]);
    const reasons = evaluator.getStopReasons(result);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain('No claim candidates');
  });
});

// --------------------------------------------------------------------------
// Helpers for gates and stop conditions
// --------------------------------------------------------------------------

function makeSampleCandidate(overrides: Partial<import('../src/claim-candidate/types.js').CandidateClaim>): import('../src/claim-candidate/types.js').CandidateClaim {
  return {
    claimId: overrides.claimId ?? 'cand-test-001',
    sourceCapabilityId: 'biospecimen.processing.pbmc',
    suggestedTaxonomy: 'biospecimen.processing.pbmc',
    summary: 'Test candidate',
    supportingEvidence: { entityIds: [], relationshipIds: [], artifactIds: [], eventIds: [] },
    confidence: 0.7,
    missingEvidence: [],
    evidenceCoverage: 0.8,
    humanExplanation: 'Test explanation',
    ...overrides,
  };
}

function makeDetectionResult(candidates: import('../src/claim-candidate/types.js').CandidateClaim[]): import('../src/claim-candidate/types.js').ClaimCandidateDetectionResult {
  return {
    candidates,
    totalCandidates: candidates.length,
    insufficientCount: 0,
    generatedAt: new Date().toISOString(),
  };
}
