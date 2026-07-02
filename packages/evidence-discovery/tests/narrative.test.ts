// ==========================================================================
// Institutional Narrative — Tests
// ==========================================================================
// Sprint 20B.5.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { NarrativeEngine } from '../src/index.js';
import type { InstitutionalTimeline } from '../src/index.js';
import type { CandidateCapability } from '../src/index.js';
import type { CandidateClaim } from '../src/index.js';
import type { DiscoveryResult, Entity, Relationship } from '../src/index.js';

// --------------------------------------------------------------------------
// Fixture builders
// --------------------------------------------------------------------------

function makeTimeline(overrides?: Partial<InstitutionalTimeline>): InstitutionalTimeline {
  return {
    siteId: 'site-vilo-research',
    generatedAt: '2026-07-01T12:00:00Z',
    events: overrides?.events ?? [
      {
        eventId: 'evt-1',
        date: { value: '2018-03-15', precision: 'exact', rationale: 'Document date' },
        category: 'clinical_trial',
        title: 'First Clinical Trial Initiated',
        narrative: 'The institution initiated its first Phase I clinical trial in oncology.',
        confidence: 0.85,
        evidenceEntityIds: ['ent-sp-1', 'ent-st-1'],
        evidenceRelationshipIds: ['rel-1'],
        sourceArtifactIds: ['art-1'],
        requiresHumanReview: false,
      },
      {
        eventId: 'evt-2',
        date: { value: '2020-06-01', precision: 'estimated_month', rationale: 'Quarterly report' },
        category: 'capability_milestone',
        title: 'PBMC Processing Capability Added',
        narrative: 'The institution established PBMC processing capability with new equipment.',
        confidence: 0.75,
        evidenceEntityIds: ['ent-eq-1'],
        evidenceRelationshipIds: [],
        sourceArtifactIds: ['art-2'],
        requiresHumanReview: false,
      },
      {
        eventId: 'evt-3',
        date: { value: '2021-01-10', precision: 'exact', rationale: 'Equipment purchase record' },
        category: 'equipment_acquisition',
        title: '-80°C Freezer Acquired',
        narrative: 'Ultra-low temperature freezer installed for long-term sample storage.',
        confidence: 0.9,
        evidenceEntityIds: ['ent-eq-2', 'ent-temp-1'],
        evidenceRelationshipIds: ['rel-2'],
        sourceArtifactIds: ['art-3'],
        requiresHumanReview: false,
      },
      {
        eventId: 'evt-4',
        date: { value: '2022-09-20', precision: 'exact', rationale: 'Training record' },
        category: 'training_completed',
        title: 'GCP Training Completed',
        narrative: 'Key personnel completed GCP training certification.',
        confidence: 0.95,
        evidenceEntityIds: ['ent-pi-1'],
        evidenceRelationshipIds: ['rel-3'],
        sourceArtifactIds: ['art-4'],
        requiresHumanReview: false,
      },
      {
        eventId: 'evt-5',
        date: { value: '2023-05-01', precision: 'estimated_year', rationale: 'Annual report' },
        category: 'study_activity',
        title: 'Ongoing Phase II Study',
        narrative: 'The institution is conducting a Phase II oncology study.',
        confidence: 0.65,
        evidenceEntityIds: ['ent-sp-1', 'ent-st-2'],
        evidenceRelationshipIds: ['rel-4'],
        sourceArtifactIds: ['art-5'],
        requiresHumanReview: true,
      },
    ],
    yearRange: overrides?.yearRange ?? { start: 2018, end: 2023 },
    eventCount: overrides?.eventCount ?? 5,
    requiresReviewCount: overrides?.requiresReviewCount ?? 1,
  };
}

function makeCapabilities(overrides?: CandidateCapability[]): CandidateCapability[] {
  return overrides ?? [
    {
      capabilityId: 'cap-pbmc',
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC Processing',
      category: 'processing',
      status: 'detected',
      confidence: 0.78,
      supportingEntityIds: ['ent-eq-1'],
      supportingRelationshipIds: [],
      supportingArtifactIds: ['art-2'],
      supportingEventIds: ['evt-2'],
      reasoning: 'PBMC processing capability detected from equipment and SOP documents.',
    },
    {
      capabilityId: 'cap-80c',
      claimTypeId: 'biospecimen.storage.freezer_minus_80c',
      name: '-80°C Freezer Storage',
      category: 'storage',
      status: 'detected',
      confidence: 0.85,
      supportingEntityIds: ['ent-eq-2', 'ent-temp-1'],
      supportingRelationshipIds: ['rel-2'],
      supportingArtifactIds: ['art-3'],
      supportingEventIds: ['evt-3'],
      reasoning: '-80°C storage detected from equipment and temperature entities.',
    },
    {
      capabilityId: 'cap-gcp',
      claimTypeId: 'biospecimen.regulatory.gcp_staff',
      name: 'GCP-Trained Staff',
      category: 'regulatory',
      status: 'detected',
      confidence: 0.9,
      supportingEntityIds: ['ent-pi-1'],
      supportingRelationshipIds: ['rel-3'],
      supportingArtifactIds: ['art-4'],
      supportingEventIds: ['evt-4'],
      reasoning: 'GCP-trained staff detected from training records.',
    },
    {
      capabilityId: 'cap-phase1',
      claimTypeId: 'biospecimen.operations.phase_i_experience',
      name: 'Phase I Study Experience',
      category: 'operations',
      status: 'detected',
      confidence: 0.82,
      supportingEntityIds: ['ent-sp-1', 'ent-st-1'],
      supportingRelationshipIds: ['rel-1'],
      supportingArtifactIds: ['art-1'],
      supportingEventIds: ['evt-1'],
      reasoning: 'Phase I experience detected from protocol and sponsor relationships.',
    },
    {
      capabilityId: 'cap-oncology',
      claimTypeId: 'biospecimen.therapeutic_area.oncology',
      name: 'Oncology Research',
      category: 'therapeutic_area',
      status: 'detected',
      confidence: 0.75,
      supportingEntityIds: ['ent-sp-1'],
      supportingRelationshipIds: [],
      supportingArtifactIds: ['art-1'],
      supportingEventIds: ['evt-1'],
      reasoning: 'Oncology research detected from protocol documents.',
    },
  ];
}

function makeClaims(overrides?: CandidateClaim[]): CandidateClaim[] {
  return overrides ?? [
    {
      claimId: 'claim-pbmc',
      sourceCapabilityId: 'cap-pbmc',
      suggestedTaxonomy: 'biospecimen.processing.pbmc',
      summary: 'Institution has PBMC processing capability',
      supportingEvidence: {
        entityIds: ['ent-eq-1'],
        relationshipIds: [],
        artifactIds: ['art-2'],
        eventIds: ['evt-2'],
      },
      confidence: 0.72,
      missingEvidence: [],
      evidenceCoverage: 0.85,
      humanExplanation: 'PBMC processing capability is supported by equipment evidence.',
    },
    {
      claimId: 'claim-gcp',
      sourceCapabilityId: 'cap-gcp',
      suggestedTaxonomy: 'biospecimen.regulatory.gcp_staff',
      summary: 'Institution has GCP-trained research staff',
      supportingEvidence: {
        entityIds: ['ent-pi-1'],
        relationshipIds: ['rel-3'],
        artifactIds: ['art-4'],
        eventIds: ['evt-4'],
      },
      confidence: 0.88,
      missingEvidence: [],
      evidenceCoverage: 0.95,
      humanExplanation: 'GCP training records and investigator data support this claim.',
    },
  ];
}

function makeDiscoveryResult(overrides?: Partial<DiscoveryResult>): DiscoveryResult {
  return {
    runId: 'run-narrative-test',
    pipelineVersion: 'v1',
    completedAt: new Date().toISOString(),
    artifacts: [
      { artifactId: 'art-1', filename: 'protocol-phase1.pdf' },
      { artifactId: 'art-2', filename: 'pbmc-sop.pdf' },
      { artifactId: 'art-3', filename: 'freezer-calibration.pdf' },
      { artifactId: 'art-4', filename: 'gcp-training.pdf' },
      { artifactId: 'art-5', filename: 'study-report.pdf' },
    ],
    classifications: [
      { artifactId: 'art-1', documentType: 'PROTOCOL', confidence: 0.9, requiresHumanReview: false },
      { artifactId: 'art-2', documentType: 'SOP', confidence: 0.85, requiresHumanReview: false },
      { artifactId: 'art-3', documentType: 'CALIBRATION_RECORD', confidence: 0.8, requiresHumanReview: false },
      { artifactId: 'art-4', documentType: 'TRAINING_RECORD', confidence: 0.95, requiresHumanReview: false },
      { artifactId: 'art-5', documentType: 'STUDY_CLOSEOUT_LETTER', confidence: 0.7, requiresHumanReview: true },
    ],
    entities: [
      { entityId: 'ent-eq-1', type: 'EQUIPMENT', value: 'Centrifuge X-200', normalizedValue: null, confidence: 0.8 },
      { entityId: 'ent-eq-2', type: 'EQUIPMENT', value: 'Freezer #A-123', normalizedValue: null, confidence: 0.9 },
      { entityId: 'ent-temp-1', type: 'TEMPERATURE', value: '-80°C', normalizedValue: null, confidence: 0.9 },
      { entityId: 'ent-pi-1', type: 'INVESTIGATOR', value: 'Dr. Sarah Johnson', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-sp-1', type: 'SPONSOR', value: 'PharmaCorp', normalizedValue: null, confidence: 0.85 },
      { entityId: 'ent-st-1', type: 'STUDY', value: 'Phase I Oncology Study', normalizedValue: null, confidence: 0.8 },
      { entityId: 'ent-st-2', type: 'STUDY', value: 'Phase II Oncology Study', normalizedValue: null, confidence: 0.7 },
    ],
    relationships: [
      { relationshipId: 'rel-1', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-1', targetEntityId: 'ent-sp-1', confidence: 0.8 },
      { relationshipId: 'rel-2', type: 'CALIBRATION_FOR_EQUIPMENT', sourceEntityId: 'ent-eq-2', targetEntityId: 'ent-temp-1', confidence: 0.85 },
      { relationshipId: 'rel-3', type: 'TRAINING_COMPLETED_BY', sourceEntityId: 'ent-pi-1', targetEntityId: 'ent-pi-1', confidence: 0.9 },
      { relationshipId: 'rel-4', type: 'STUDY_SPONSORED_BY', sourceEntityId: 'ent-st-2', targetEntityId: 'ent-sp-1', confidence: 0.7 },
    ],
    agentOutputs: [],
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('NarrativeEngine', () => {
  it('generates narrative with all sections for full input', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    expect(result.siteId).toBe('site-vilo-research');
    expect(result.sections.length).toBeGreaterThanOrEqual(4);
    expect(result.totalParagraphs).toBeGreaterThan(0);
    expect(result.totalCitations).toBeGreaterThan(0);
  });

  it('generates institution overview as first section', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    expect(result.sections[0].type).toBe('institution_overview');
    expect(result.sections[0].paragraphs.length).toBeGreaterThan(0);
  });

  it('generates timeline chronology section with event ordering', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const tlSection = result.sections.find(s => s.type === 'timeline_chronology');
    expect(tlSection).toBeDefined();

    // Each event should have at least one paragraph
    const eventParagraphs = tlSection!.paragraphs.filter(p => p.citations.some(c => c.type === 'event'));
    expect(eventParagraphs.length).toBeGreaterThanOrEqual(5);
  });

  it('generates capability summary with all capability entries', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const capSection = result.sections.find(s => s.type === 'capability_summary');
    expect(capSection).toBeDefined();
    expect(capSection!.paragraphs.length).toBeGreaterThanOrEqual(4);
  });

  it('groups capabilities by category', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const capSection = result.sections.find(s => s.type === 'capability_summary');
    expect(capSection).toBeDefined();

    // Should have paragraphs for processing, storage, regulatory, operations, therapeutic_area categories
    // plus a summary paragraph
    expect(capSection!.paragraphs.length).toBeGreaterThanOrEqual(5);
  });

  it('generates research activity section', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const researchSection = result.sections.find(s => s.type === 'research_activity');
    expect(researchSection).toBeDefined();
    expect(researchSection!.paragraphs.length).toBeGreaterThan(0);
  });

  it('generates regulatory compliance section', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const regSection = result.sections.find(s => s.type === 'regulatory_compliance');
    expect(regSection).toBeDefined();
    expect(regSection!.paragraphs.length).toBeGreaterThan(0);
  });

  it('every paragraph has at least one citation', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    for (const section of result.sections) {
      for (const paragraph of section.paragraphs) {
        expect(paragraph.citations.length).toBeGreaterThan(0);
      }
    }
  });

  it('executive summary is non-empty', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('summary references capabilities when present', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    expect(result.summary).toContain('capabilities');
  });

  it('handles empty input gracefully', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline({ events: [], yearRange: { start: null, end: null }, eventCount: 0, requiresReviewCount: 0 }),
      capabilities: [],
      claims: [],
      discoveryResult: makeDiscoveryResult({ artifacts: [], classifications: [], entities: [], relationships: [] }),
    });

    expect(result.sections.length).toBe(1); // only overview
    expect(result.sections[0].type).toBe('institution_overview');
    expect(result.summary).toContain('No institutional activity data');
  });

  it('handles timeline with no events but has capabilities', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline({ events: [], yearRange: { start: null, end: null }, eventCount: 0, requiresReviewCount: 0 }),
      capabilities: makeCapabilities(),
      claims: [],
      discoveryResult: makeDiscoveryResult(),
    });

    // Should have overview + capability sections
    const types = result.sections.map(s => s.type);
    expect(types).toContain('capability_summary');
    expect(types).not.toContain('timeline_chronology');
  });

  it('handles single capability', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline({ events: [], yearRange: { start: null, end: null }, eventCount: 0, requiresReviewCount: 0 }),
      capabilities: [makeCapabilities()[0]], // just PBMC
      claims: [],
      discoveryResult: makeDiscoveryResult(),
    });

    const capSection = result.sections.find(s => s.type === 'capability_summary');
    expect(capSection).toBeDefined();
    expect(capSection!.paragraphs[0].text).toContain('PBMC');
  });

  it('narrative does not modify input objects', () => {
    const engine = new NarrativeEngine();
    const timeline = makeTimeline();
    const caps = makeCapabilities();
    const claims = makeClaims();
    const dr = makeDiscoveryResult();

    const origEventCount = timeline.eventCount;
    const origCapLength = caps.length;

    engine.generate({ timeline, capabilities: caps, claims, discoveryResult: dr });

    expect(timeline.eventCount).toBe(origEventCount);
    expect(caps.length).toBe(origCapLength);
  });

  it('timeline chronology cites event source artifact IDs', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const tlSection = result.sections.find(s => s.type === 'timeline_chronology');
    expect(tlSection).toBeDefined();

    const hasDocumentCitations = tlSection!.paragraphs.some(p =>
      p.citations.some(c => c.type === 'document'),
    );
    expect(hasDocumentCitations).toBe(true);
  });

  it('capability summary cites capability IDs and entity IDs', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const capSection = result.sections.find(s => s.type === 'capability_summary');
    expect(capSection).toBeDefined();

    const hasCapabilityCitations = capSection!.paragraphs.some(p =>
      p.citations.some(c => c.type === 'capability'),
    );
    const hasEntityCitations = capSection!.paragraphs.some(p =>
      p.citations.some(c => c.type === 'entity'),
    );
    expect(hasCapabilityCitations).toBe(true);
    expect(hasEntityCitations).toBe(true);
  });

  it('research activity cites entities when sponsors exist', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const researchSection = result.sections.find(s => s.type === 'research_activity');
    expect(researchSection).toBeDefined();

    const hasEntityCitations = researchSection!.paragraphs.some(p =>
      p.citations.some(c => c.type === 'entity'),
    );
    expect(hasEntityCitations).toBe(true);
  });

  it('totalCitations equals sum of all paragraph citations', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const counted = result.sections.reduce(
      (sum, s) => sum + s.paragraphs.reduce((ps, p) => ps + p.citations.length, 0),
      0,
    );
    expect(result.totalCitations).toBe(counted);
  });

  it('section ordering is correct (overview first)', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    expect(result.sections[0].order).toBe(0);
    for (let i = 1; i < result.sections.length; i++) {
      expect(result.sections[i].order).toBeGreaterThan(result.sections[i - 1].order);
    }
  });

  it('generates unique section IDs', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const ids = result.sections.map(s => s.sectionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('research activity section is omitted when no research signals exist', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline({
        events: [{
          eventId: 'evt-other',
          date: { value: '2020-01-01', precision: 'exact', rationale: 'Other' },
          category: 'other',
          title: 'Other Event',
          narrative: 'Unrelated event.',
          confidence: 0.5,
          evidenceEntityIds: [],
          evidenceRelationshipIds: [],
          sourceArtifactIds: ['art-1'],
          requiresHumanReview: false,
        }],
        yearRange: { start: 2020, end: 2020 },
        eventCount: 1,
        requiresReviewCount: 0,
      }),
      capabilities: [makeCapabilities()[0]], // just PBMC (processing, not therapeutic_area)
      claims: [],
      discoveryResult: makeDiscoveryResult(),
    });

    const types = result.sections.map(s => s.type);
    expect(types).not.toContain('research_activity');
  });

  it('regulatory section is omitted when no regulatory signals exist', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline({
        events: [{
          eventId: 'evt-other',
          date: { value: '2020-01-01', precision: 'exact', rationale: 'Other' },
          category: 'other',
          title: 'Other Event',
          narrative: 'Unrelated event.',
          confidence: 0.5,
          evidenceEntityIds: [],
          evidenceRelationshipIds: [],
          sourceArtifactIds: ['art-1'],
          requiresHumanReview: false,
        }],
        yearRange: { start: 2020, end: 2020 },
        eventCount: 1,
        requiresReviewCount: 0,
      }),
      capabilities: [makeCapabilities()[0]], // just PBMC (processing)
      claims: [],
      discoveryResult: makeDiscoveryResult(),
    });

    const types = result.sections.map(s => s.type);
    expect(types).not.toContain('regulatory_compliance');
  });

  it('no Evidence Core modification', () => {
    const engine = new NarrativeEngine();
    expect((engine as any).createClaim).toBeUndefined();
    expect((engine as any).createEvidenceNode).toBeUndefined();
    expect((engine as any).computeConfidence).toBeUndefined();
  });

  it('generates narrative with claims referencing claim citations', () => {
    const engine = new NarrativeEngine();
    const result = engine.generate({
      timeline: makeTimeline(),
      capabilities: makeCapabilities(),
      claims: makeClaims(),
      discoveryResult: makeDiscoveryResult(),
    });

    const overviewSection = result.sections.find(s => s.type === 'institution_overview');
    expect(overviewSection).toBeDefined();

    const hasClaimCitations = overviewSection!.paragraphs.some(p =>
      p.citations.some(c => c.type === 'claim'),
    );
    expect(hasClaimCitations).toBe(true);
  });
});
