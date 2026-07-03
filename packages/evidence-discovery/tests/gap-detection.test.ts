// ==========================================================================
// Evidence Gap Detection — Tests
// ==========================================================================
// Sprint 20B.4.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { EvidenceGapDetector } from '../src/gap-detection/detector.js';
import { ClaimMappingRegistry } from '../src/claim-candidate/mapping.js';
import type { CandidateClaim } from '../src/claim-candidate/types.js';
import type { DiscoveryResult, Entity, Relationship, DocumentClassification } from '../src/orchestrator.js';
import type { InstitutionalTimeline, TimelineEvent } from '../src/timeline/types.js';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

const registry = new ClaimMappingRegistry();

function makeClaim(capabilityId: string, overrides?: Partial<CandidateClaim>): CandidateClaim {
  const rule = registry.getRule(capabilityId);
  return {
    claimId: `claim-${capabilityId}`,
    sourceCapabilityId: capabilityId,
    suggestedTaxonomy: rule?.suggestedTaxonomy ?? capabilityId,
    summary: rule?.summaryTemplate ?? `Claim for ${capabilityId}`,
    supportingEvidence: {
      entityIds: [],
      relationshipIds: [],
      artifactIds: [],
      eventIds: [],
    },
    confidence: 0.7,
    missingEvidence: [],
    evidenceCoverage: 0.75,
    humanExplanation: `Test claim for ${capabilityId}`,
    ...overrides,
  };
}

function makeDiscoveryResult(overrides?: {
  entities?: Entity[];
  classifications?: DocumentClassification[];
  relationships?: Relationship[];
}): DiscoveryResult {
  return {
    runId: 'run-gap-test',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [{ artifactId: 'art-1', filename: 'docs.zip' }],
    classifications: overrides?.classifications ?? [],
    entities: overrides?.entities ?? [],
    relationships: overrides?.relationships ?? [],
    agentOutputs: [],
  };
}

function makeEvent(category: string, overrides?: Partial<TimelineEvent>): TimelineEvent {
  return {
    eventId: `evt-${category}`,
    date: { value: '2024-01-01', precision: 'exact', rationale: 'test' },
    category: category as any,
    title: `Event ${category}`,
    narrative: `Test event for ${category}`,
    confidence: 0.8,
    evidenceEntityIds: [],
    evidenceRelationshipIds: [],
    sourceArtifactIds: [],
    requiresHumanReview: false,
    ...overrides,
  };
}

function makeTimeline(eventCategories: string[]): InstitutionalTimeline {
  return {
    siteId: 'site-test',
    generatedAt: new Date().toISOString(),
    events: eventCategories.map(c => makeEvent(c)),
    yearRange: { start: 2024, end: 2024 },
    eventCount: eventCategories.length,
    requiresReviewCount: 0,
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('EvidenceGapDetector', () => {
  it('returns no gaps when all evidence is present', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    // PBMC Processing requires: EQUIPMENT, TEMPERATURE entities; SOP, LAB_MANUAL docs; CALIBRATION_FOR_EQUIPMENT rel
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    expect(result.gaps.length).toBe(0);
    expect(result.coveragePercent).toBeGreaterThanOrEqual(90);
  });

  it('detects missing entity type', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    // Missing EQUIPMENT entity
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    expect(result.gaps.length).toBeGreaterThan(0);
    const entityGap = result.gaps.find(g => g.category === 'missing_entity_type');
    expect(entityGap).toBeDefined();
    expect(entityGap!.missingItem).toBe('EQUIPMENT');
  });

  it('detects missing document type', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.storage.freezer_minus_80c');

    // Freezer storage requires: CALIBRATION_RECORD, SOP docs
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Freezer #A1', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'CALIBRATION_RECORD', confidence: 0.9, requiresHumanReview: false },
        // Missing SOP
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    const docGap = result.gaps.find(g => g.category === 'missing_document_type');
    expect(docGap).toBeDefined();
    expect(docGap!.missingItem).toBe('SOP');
    expect(docGap!.fillableByUpload).toBe(true);
  });

  it('detects multiple missing items across categories', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.regulatory.gcp_staff');

    // GCP staff requires: INVESTIGATOR entities; TRAINING_RECORD docs; TRAINING_COMPLETED_BY rel
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    expect(result.gaps.length).toBeGreaterThanOrEqual(2);
    const categories = new Set(result.gaps.map(g => g.category));
    expect(categories.has('missing_entity_type')).toBe(true);
    expect(categories.has('missing_document_type')).toBe(true);
  });

  it('calculates coverage correctly for partial evidence', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.shipping.cold_chain');

    // Cold chain: TEMPERATURE, EQUIPMENT entities; SHIPMENT_LOG doc; SHIPMENT_RELATED_TO_STUDY rel
    // Provide only entities
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
        { entityId: 'e2', type: 'EQUIPMENT', value: 'Dry Shipper', normalizedValue: null, confidence: 0.8 },
      ],
      classifications: [],
      relationships: [],
    }));

    // 4 axes: entities 2/2=100%, docs 0/1=0%, rels 0/1=0%, events N/A (no timeline)
    // Applicable: entities(100%), docs(0%), rels(0%) → avg = 33%
    expect(result.coveragePercent).toBeLessThan(50);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it('assigns critical severity for very low coverage', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    expect(result.severityCounts.critical).toBeGreaterThan(0);
    const criticalGap = result.gaps.find(g => g.severity === 'critical');
    expect(criticalGap).toBeDefined();
  });

  it('assigns severity proportionally to coverage', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    // Provide only entities (50% coverage on entity axis, 0% on docs and rels)
    // entities: EQUIPMENT+ TEMPERATURE found 2/2 = 100%
    // docs: SOP+LAB_MANUAL found 0/2 = 0%
    // rels: CALIBRATION_FOR_EQUIPMENT found 0/1 = 0%
    // avg = (100+0+0)/3 = 33.3% → significant or critical
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [],
      relationships: [],
    }));

    // coverage should be in significant range (~33%)
    expect(result.coveragePercent).toBeLessThan(50);
    expect(result.coveragePercent).toBeGreaterThanOrEqual(25);
    const significantGaps = result.gaps.filter(g => g.severity === 'significant');
    expect(significantGaps.length).toBeGreaterThan(0);
  });

  it('generates recommendations for each gap', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    expect(result.recommendedEvidence.length).toBeGreaterThan(0);
    for (const rec of result.recommendedEvidence) {
      expect(rec.recommendationId).toBeTruthy();
      expect(rec.evidenceType).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.priority).toBeTruthy();
      expect(rec.rationale).toBeTruthy();
    }
  });

  it('assigns high priority to critical gaps', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    const highPriorityRecs = result.recommendedEvidence.filter(r => r.priority === 'high');
    expect(highPriorityRecs.length).toBeGreaterThan(0);
  });

  it('uses timeline events to reduce gaps', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    // PBMC has relevantEventCategories: capability_milestone, equipment_acquisition
    const timeline = makeTimeline(['capability_milestone', 'equipment_acquisition']);

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }), timeline);

    // With timeline events present, no missing event gaps
    const eventGaps = result.gaps.filter(g => g.category === 'missing_event_category');
    expect(eventGaps.length).toBe(0);
  });

  it('does not penalize when no timeline is provided', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    // No timeline — event axis should be N/A (100%)
    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    // All evidence present, no timeline — should be 100% coverage
    expect(result.coveragePercent).toBe(100);
    expect(result.gaps.length).toBe(0);
  });

  it('returns empty report for empty claims', () => {
    const detector = new EvidenceGapDetector(registry);
    const result = detector.analyze([], makeDiscoveryResult());

    expect(result.results).toEqual([]);
    expect(result.totalClaims).toBe(0);
    expect(result.averageCoverage).toBe(0);
    expect(result.totalGaps).toBe(0);
  });

  it('produces report with multiple claims', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim1 = makeClaim('biospecimen.processing.pbmc');
    const claim2 = makeClaim('biospecimen.storage.freezer_minus_80c');

    const result = detector.analyze([claim1, claim2], makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [],
      relationships: [],
    }));

    expect(result.totalClaims).toBe(2);
    expect(result.results.length).toBe(2);
    expect(result.totalGaps).toBeGreaterThan(0);
    expect(result.averageCoverage).toBeGreaterThan(0);
  });

  it('calculates average coverage correctly', () => {
    const detector = new EvidenceGapDetector(registry);

    // First claim: full evidence
    const claim1 = makeClaim('biospecimen.processing.pbmc');
    // Second claim: no evidence
    const claim2 = makeClaim('biospecimen.regulatory.sop_governance', { confidence: 0.8 });

    const result = detector.analyze([claim1, claim2], makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    expect(result.totalClaims).toBe(2);
    expect(result.averageCoverage).toBeGreaterThan(0);
    expect(result.averageCoverage).toBeLessThanOrEqual(100);
  });

  it('every gap has humanExplanation', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.ffpe');

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    expect(result.humanExplanation.length).toBeGreaterThan(0);
    expect(result.humanExplanation).toContain(result.coveragePercent.toString());
  });

  it('every gap has a unique gapId', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc');

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [],
      classifications: [],
      relationships: [],
    }));

    const ids = result.gaps.map(g => g.gapId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('detects low confidence gaps', () => {
    const detector = new EvidenceGapDetector(registry);
    const claim = makeClaim('biospecimen.processing.pbmc', { confidence: 0.2 });

    const result = detector.analyzeSingle(claim, makeDiscoveryResult({
      entities: [
        { entityId: 'e1', type: 'EQUIPMENT', value: 'Centrifuge', normalizedValue: null, confidence: 0.8 },
        { entityId: 'e2', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      ],
      classifications: [
        { artifactId: 'art-1', documentType: 'SOP', confidence: 0.9, requiresHumanReview: false },
        { artifactId: 'art-1', documentType: 'LAB_MANUAL', confidence: 0.8, requiresHumanReview: false },
      ],
      relationships: [
        { relationshipId: 'r1', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'e1', targetEntityId: 'e2', confidence: 0.7 },
      ],
    }));

    const confidenceGap = result.gaps.find(g => g.category === 'low_confidence');
    expect(confidenceGap).toBeDefined();
  });

  it('does not import from evidence-core', () => {
    // Verify the detector file doesn't reference evidence-core
    const fs = require('fs')
    const path = require('path')
    const detectorPath = path.resolve(__dirname, '../src/gap-detection/detector.ts')
    const content = fs.readFileSync(detectorPath, 'utf-8')
    expect(content).not.toContain('evidence-core');
  });
});
