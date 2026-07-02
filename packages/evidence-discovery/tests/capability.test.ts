// ==========================================================================
// Capability Detection — Tests
// ==========================================================================
// Sprint 20B.2.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { CapabilityDetector, CapabilityNormalizer, CapabilityGates, StopConditionEvaluator } from '../src/index.js';
import type { DiscoveryResult } from '../src/index.js';
import type { InstitutionalTimeline, TimelineEvent } from '../src/index.js';
import type { CandidateCapability, CapabilityDetectionResult } from '../src/capability/index.js';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    runId: 'run-cap-test',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [{ artifactId: 'art-1', filename: 'documents.zip' }],
    classifications: overrides?.classifications ?? [
      { artifactId: 'art-1', documentType: 'SOP', confidence: 0.85, requiresHumanReview: false },
    ],
    entities: overrides?.entities ?? [
      { entityId: 'eq-1', type: 'EQUIPMENT', value: 'Freezer #A-123', normalizedValue: null, confidence: 0.8 },
      { entityId: 'temp-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      { entityId: 'pi-1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.8 },
    ],
    relationships: overrides?.relationships ?? [
      { relationshipId: 'rel-1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'eq-1', targetEntityId: 'temp-1', confidence: 0.7 },
    ],
    agentOutputs: [],
  };
}

function makeEmptyResult(): DiscoveryResult {
  return {
    runId: 'run-empty', pipelineVersion: 'v1', completedAt: '', artifacts: [],
    classifications: [], entities: [], relationships: [], agentOutputs: [],
  };
}

function makeTimeline(overrides?: Partial<InstitutionalTimeline>): InstitutionalTimeline {
  return {
    siteId: 'site-1',
    generatedAt: new Date().toISOString(),
    events: overrides?.events ?? [
      {
        eventId: 'evt-1',
        date: { value: '2023-01-15', precision: 'exact', rationale: 'Recorded date' },
        category: 'capability_milestone',
        title: 'PBMC Processing Capability Established',
        narrative: 'Lab acquired equipment and started PBMC isolation protocols',
        confidence: 0.85,
        evidenceEntityIds: ['eq-1'],
        evidenceRelationshipIds: [],
        sourceArtifactIds: ['art-1'],
        requiresHumanReview: false,
      },
      {
        eventId: 'evt-2',
        date: { value: '2023-06-01', precision: 'exact', rationale: 'Recorded date' },
        category: 'clinical_trial',
        title: 'Phase I Oncology Trial Initiated',
        narrative: 'First-in-human study for solid tumor treatment',
        confidence: 0.9,
        evidenceEntityIds: [],
        evidenceRelationshipIds: [],
        sourceArtifactIds: ['art-1'],
        requiresHumanReview: false,
      },
    ],
    yearRange: { start: 2023, end: 2023 },
    eventCount: overrides?.events?.length ?? 2,
    requiresReviewCount: 0,
  };
}

// --------------------------------------------------------------------------
// Detection Tests
// --------------------------------------------------------------------------

describe('CapabilityDetector', () => {
  it('detects -80°C freezer storage from equipment + temperature', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult());

    const freezerCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.storage.freezer_minus_80c');
    expect(freezerCap).toBeDefined();
    expect(freezerCap!.status).toBe('detected');
    expect(freezerCap!.supportingEntityIds.length).toBeGreaterThan(0);
  });

  it('detects SOP governance from SOP document type', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false }],
    }));

    const sopCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.regulatory.sop_governance');
    expect(sopCap).toBeDefined();
    expect(sopCap!.status).toBe('suspected');
  });

  it('detects cold chain shipping from SHIPMENT_LOG + temperature entities', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'SHIPMENT_LOG', confidence: 0.8, requiresHumanReview: false }],
      entities: [
        { entityId: 't-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
        { entityId: 's-1', type: 'STUDY', value: 'Protocol XYZ', normalizedValue: null, confidence: 0.7 },
      ],
      relationships: [
        { relationshipId: 'r-1', type: 'SHIPMENT_RELATED_TO_STUDY', sourceEntityId: 's-1', targetEntityId: 't-1', confidence: 0.6 },
      ],
    }));

    const shipCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.shipping.cold_chain');
    expect(shipCap).toBeDefined();
  });

  it('detects GCP-trained staff from INVESTIGATOR + TRAINING_RECORD', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'TRAINING_RECORD', confidence: 0.8, requiresHumanReview: false }],
      entities: [
        { entityId: 'pi-1', type: 'INVESTIGATOR', value: 'Dr. Jane Smith', normalizedValue: null, confidence: 0.9 },
      ],
      relationships: [
        { relationshipId: 'r-1', type: 'TRAINING_COMPLETED_BY', sourceEntityId: 'pi-1', targetEntityId: 'pi-1', confidence: 0.6 },
      ],
    }));

    const gcpCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.regulatory.gcp_staff');
    expect(gcpCap).toBeDefined();
  });

  it('detects Phase I experience from PROTOCOL + SPONSOR + relationships', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.85, requiresHumanReview: false }],
      entities: [
        { entityId: 'sp-1', type: 'SPONSOR', value: 'PharmaCorp', normalizedValue: null, confidence: 0.85 },
        { entityId: 'st-1', type: 'STUDY', value: 'Phase I Study', normalizedValue: null, confidence: 0.8 },
        { entityId: 'pi-1', type: 'INVESTIGATOR', value: 'Dr. John', normalizedValue: null, confidence: 0.8 },
      ],
      relationships: [
        { relationshipId: 'r-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'st-1', targetEntityId: 'sp-1', confidence: 0.75 },
      ],
    }));

    const phaseCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.operations.phase_i_experience');
    expect(phaseCap).toBeDefined();
  });

  it('detects oncology research from protocol + sponsor', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.8, requiresHumanReview: false }],
      entities: [
        { entityId: 'sp-1', type: 'SPONSOR', value: 'OncoPharma', normalizedValue: null, confidence: 0.8 },
        { entityId: 'st-1', type: 'STUDY', value: 'Solid Tumor Study', normalizedValue: null, confidence: 0.7 },
      ],
      relationships: [
        { relationshipId: 'r-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'st-1', targetEntityId: 'sp-1', confidence: 0.7 },
      ],
    }));

    const oncoCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.therapeutic_area.oncology');
    expect(oncoCap).toBeDefined();
  });

  it('returns nothing for empty result', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeEmptyResult());

    expect(result.capabilities).toEqual([]);
    expect(result.totalDetected).toBe(0);
    expect(result.totalSuspected).toBe(0);
  });

  it('every capability has reasoning', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult());

    for (const cap of result.capabilities) {
      expect(cap.reasoning.length).toBeGreaterThan(0);
    }
  });

  it('every capability is explainable (has supporting IDs)', () => {
    const detector = new CapabilityDetector();
    const result = detector.detect(makeResult());

    for (const cap of result.capabilities) {
      expect(cap.supportingEntityIds.length + cap.supportingRelationshipIds.length + cap.supportingArtifactIds.length)
        .toBeGreaterThan(0);
    }
  });

  it('does not create Claims or modify Evidence Core', () => {
    const detector = new CapabilityDetector();
    expect((detector as any).createClaim).toBeUndefined();
    expect((detector as any).computeConfidence).toBeUndefined();
    expect((detector as any).createEvidenceNode).toBeUndefined();
  });

  it('uses timeline events to boost detection', () => {
    const detector = new CapabilityDetector();
    const timeline = makeTimeline();

    // Result with PBMC-related entities
    const result = detector.detect(makeResult({
      entities: [
        { entityId: 'eq-1', type: 'EQUIPMENT', value: 'Centrifuge X-200', normalizedValue: null, confidence: 0.8 },
        { entityId: 'temp-1', type: 'TEMPERATURE', value: '4°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [{ artifactId: 'art-1', documentType: 'SOP', confidence: 0.8, requiresHumanReview: false }],
    }), timeline);

    const pbmcCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.processing.pbmc');
    expect(pbmcCap).toBeDefined();
    // Should have timeline event IDs in supportingEventIds
    expect(pbmcCap!.supportingEventIds.length).toBeGreaterThan(0);
  });

  it('timeline boost populates supportingEventIds', () => {
    const detector = new CapabilityDetector();
    const timeline = makeTimeline();

    const result = detector.detect(makeResult({
      classifications: [{ artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.8, requiresHumanReview: false }],
      entities: [
        { entityId: 'sp-1', type: 'SPONSOR', value: 'OncoPharma', normalizedValue: null, confidence: 0.8 },
        { entityId: 'st-1', type: 'STUDY', value: 'Tumor Study', normalizedValue: null, confidence: 0.7 },
      ],
      relationships: [
        { relationshipId: 'r-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'st-1', targetEntityId: 'sp-1', confidence: 0.7 },
      ],
    }), timeline);

    const oncoCap = result.capabilities.find(c => c.claimTypeId === 'biospecimen.therapeutic_area.oncology');
    expect(oncoCap).toBeDefined();
    expect(oncoCap!.supportingEventIds).toContain('evt-2');
  });
});

// --------------------------------------------------------------------------
// Normalization Tests
// --------------------------------------------------------------------------

describe('CapabilityNormalizer', () => {
  it('resolves canonical IDs', () => {
    const normalizer = new CapabilityNormalizer();
    expect(normalizer.resolveCanonical('biospecimen.processing.dna_extraction')).toBe('biospecimen.processing.nucleic_extraction');
    expect(normalizer.resolveCanonical('biospecimen.processing.rna_extraction')).toBe('biospecimen.processing.nucleic_extraction');
    expect(normalizer.resolveCanonical('biospecimen.storage.liquid_nitrogen')).toBe('biospecimen.storage.cryogenic');
    expect(normalizer.resolveCanonical('biospecimen.processing.pbmc')).toBe('biospecimen.processing.pbmc');
  });

  it('returns original claimTypeId when no canonical mapping exists', () => {
    const normalizer = new CapabilityNormalizer();
    expect(normalizer.resolveCanonical('unknown.claim')).toBe('unknown.claim');
  });

  it('merges duplicate capabilities by canonical ID', () => {
    const normalizer = new CapabilityNormalizer();
    const caps: CandidateCapability[] = [
      {
        capabilityId: 'cap-1',
        claimTypeId: 'biospecimen.processing.dna_extraction',
        name: 'DNA Extraction',
        category: 'processing',
        status: 'detected',
        confidence: 0.75,
        supportingEntityIds: ['e1'],
        supportingRelationshipIds: [],
        supportingArtifactIds: ['art-1'],
        supportingEventIds: [],
        reasoning: 'Found DNA extraction SOP',
      },
      {
        capabilityId: 'cap-2',
        claimTypeId: 'biospecimen.processing.rna_extraction',
        name: 'RNA Extraction',
        category: 'processing',
        status: 'suspected',
        confidence: 0.5,
        supportingEntityIds: ['e2'],
        supportingRelationshipIds: [],
        supportingArtifactIds: ['art-1'],
        supportingEventIds: [],
        reasoning: 'Found RNA extraction SOP',
      },
    ];

    const normalized = normalizer.normalize(caps);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].claimTypeId).toBe('biospecimen.processing.nucleic_extraction');
    expect(normalized[0].name).toBe('Nucleic Acid Extraction');
    expect(normalized[0].confidence).toBe(0.75); // max of both
    expect(normalized[0].supportingEntityIds).toEqual(['e1', 'e2']); // union
  });

  it('does not merge capabilities with different canonical IDs', () => {
    const normalizer = new CapabilityNormalizer();
    const caps: CandidateCapability[] = [
      {
        capabilityId: 'cap-1',
        claimTypeId: 'biospecimen.processing.pbmc',
        name: 'PBMC Processing',
        category: 'processing',
        status: 'detected',
        confidence: 0.8,
        supportingEntityIds: ['e1'],
        supportingRelationshipIds: [],
        supportingArtifactIds: ['art-1'],
        supportingEventIds: [],
        reasoning: 'Found PBMC SOP',
      },
      {
        capabilityId: 'cap-2',
        claimTypeId: 'biospecimen.processing.ffpe',
        name: 'FFPE Tissue Processing',
        category: 'processing',
        status: 'suspected',
        confidence: 0.5,
        supportingEntityIds: ['e2'],
        supportingRelationshipIds: [],
        supportingArtifactIds: ['art-1'],
        supportingEventIds: [],
        reasoning: 'Found FFPE SOP',
      },
    ];

    const normalized = normalizer.normalize(caps);
    expect(normalized).toHaveLength(2);
  });

  it('resolves oncology to biospecimen.therapeutic_area.oncology', () => {
    const normalizer = new CapabilityNormalizer();
    expect(normalizer.resolveCanonical('biospecimen.therapeutic_area.oncology')).toBe('biospecimen.therapeutic_area.oncology');
  });
});

// --------------------------------------------------------------------------
// Gates Tests
// --------------------------------------------------------------------------

describe('CapabilityGates', () => {
  const passingCap: CandidateCapability = {
    capabilityId: 'cap-pass',
    claimTypeId: 'test.capability',
    name: 'Test Capability',
    category: 'processing',
    status: 'detected',
    confidence: 0.85,
    supportingEntityIds: ['e1', 'e2'],
    supportingRelationshipIds: ['r1'],
    supportingArtifactIds: ['art-1'],
    supportingEventIds: [],
    reasoning: 'Test',
  };

  const lowConfidenceCap: CandidateCapability = {
    capabilityId: 'cap-low',
    claimTypeId: 'test.capability',
    name: 'Low Confidence Test',
    category: 'processing',
    status: 'suspected',
    confidence: 0.15,
    supportingEntityIds: ['e1'],
    supportingRelationshipIds: [],
    supportingArtifactIds: ['art-1'],
    supportingEventIds: [],
    reasoning: 'Low conf',
  };

  const noArtifactCap: CandidateCapability = {
    capabilityId: 'cap-no-art',
    claimTypeId: 'test.capability',
    name: 'No Artifact Test',
    category: 'processing',
    status: 'detected',
    confidence: 0.8,
    supportingEntityIds: ['e1'],
    supportingRelationshipIds: [],
    supportingArtifactIds: [],
    supportingEventIds: [],
    reasoning: 'No artifact',
  };

  it('passes capability that meets all gates', () => {
    const gates = new CapabilityGates();
    expect(gates.passesAll(passingCap)).toBe(true);
  });

  it('fails capability below min confidence', () => {
    const gates = new CapabilityGates();
    expect(gates.passesAll(lowConfidenceCap)).toBe(false);
  });

  it('fails capability with no supporting artifacts', () => {
    const gates = new CapabilityGates();
    expect(gates.passesAll(noArtifactCap)).toBe(false);
  });

  it('returns gate results for evaluation', () => {
    const gates = new CapabilityGates();
    const results = gates.evaluate(lowConfidenceCap);

    const confGate = results.find(r => r.gateId === 'min_confidence');
    expect(confGate).toBeDefined();
    expect(confGate!.passed).toBe(false);
    expect(confGate!.reason).toContain('0.15');
  });

  it('filters capabilities correctly', () => {
    const gates = new CapabilityGates();
    const filtered = gates.filter([passingCap, lowConfidenceCap, noArtifactCap]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].capabilityId).toBe('cap-pass');
  });

  it('allows disabling gates via config', () => {
    const gates = new CapabilityGates({
      minConfidence: { enabled: false, params: {} },
      requireArtifact: { enabled: false, params: {} },
    });
    expect(gates.passesAll(lowConfidenceCap)).toBe(true);
    expect(gates.passesAll(noArtifactCap)).toBe(true);
  });

  it('can override minimum confidence threshold', () => {
    const gates = new CapabilityGates({
      minConfidence: { enabled: true, params: { min: 0.1 } },
    });
    expect(gates.passesAll(lowConfidenceCap)).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Stop Conditions Tests
// --------------------------------------------------------------------------

describe('StopConditionEvaluator', () => {
  const emptyResult: CapabilityDetectionResult = {
    capabilities: [],
    totalDetected: 0,
    totalSuspected: 0,
    generatedAt: new Date().toISOString(),
  };

  const fullResult: CapabilityDetectionResult = {
    capabilities: [
      {
        capabilityId: 'cap-1', claimTypeId: 'a', name: 'A', category: 'processing',
        status: 'detected', confidence: 0.8,
        supportingEntityIds: [], supportingRelationshipIds: [], supportingArtifactIds: ['art-1'],
        supportingEventIds: [], reasoning: 'test',
      },
      {
        capabilityId: 'cap-2', claimTypeId: 'b', name: 'B', category: 'storage',
        status: 'detected', confidence: 0.7,
        supportingEntityIds: [], supportingRelationshipIds: [], supportingArtifactIds: ['art-1'],
        supportingEventIds: [], reasoning: 'test',
      },
      {
        capabilityId: 'cap-3', claimTypeId: 'c', name: 'C', category: 'processing',
        status: 'suspected', confidence: 0.3,
        supportingEntityIds: [], supportingRelationshipIds: [], supportingArtifactIds: ['art-1'],
        supportingEventIds: [], reasoning: 'test',
      },
    ],
    totalDetected: 2,
    totalSuspected: 1,
    generatedAt: new Date().toISOString(),
  };

  it('stops on empty input by default', () => {
    const evaluator = new StopConditionEvaluator();
    expect(evaluator.shouldStop(emptyResult)).toBe(true);
  });

  it('does not stop on non-empty result (default config)', () => {
    const evaluator = new StopConditionEvaluator();
    expect(evaluator.shouldStop(fullResult)).toBe(false);
  });

  it('stops when max_capabilities is exceeded', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [{ type: 'max_capabilities', max: 2 }],
    });
    // fullResult has 3 capabilities (2 detected + 1 suspected)
    expect(evaluator.shouldStop(fullResult)).toBe(true);
  });

  it('returns stop reasons', () => {
    const evaluator = new StopConditionEvaluator();
    const reasons = evaluator.getStopReasons(emptyResult);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain('No capabilities detected');
  });

  it('evaluates all conditions', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [
        { type: 'empty_input' },
        { type: 'max_capabilities', max: 100 },
      ],
    });
    const results = evaluator.evaluate(fullResult);
    expect(results).toHaveLength(2);
    expect(results[0].shouldStop).toBe(false); // not empty
    expect(results[1].shouldStop).toBe(false); // 3 < 100
  });

  it('stops when diminishing_returns detects no high-confidence capabilities', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [{ type: 'diminishing_returns', minNewConfidence: 0.9 }],
    });
    // fullResult has max confidence 0.8, < 0.9
    expect(evaluator.shouldStop(fullResult)).toBe(true);
  });

  it('does not stop when high-confidence capabilities exist', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [{ type: 'diminishing_returns', minNewConfidence: 0.7 }],
    });
    // fullResult has two capabilities with confidence >= 0.7
    expect(evaluator.shouldStop(fullResult)).toBe(false);
  });

  it('stops when max_per_category is exceeded', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [{ type: 'max_per_category', max: 1 }],
    });
    // fullResult has 2 processing capabilities
    expect(evaluator.shouldStop(fullResult)).toBe(true);
  });

  it('stops when coverage is sufficient', () => {
    const evaluator = new StopConditionEvaluator({
      conditions: [{ type: 'coverage_sufficient', minCategoriesWithDetected: 2 }],
    });
    // fullResult has processing and storage detected
    expect(evaluator.shouldStop(fullResult)).toBe(true);
  });
});
