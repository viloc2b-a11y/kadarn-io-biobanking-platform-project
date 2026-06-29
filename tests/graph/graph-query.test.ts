// ==========================================================================
// Kadarn Graph Query Layer — Unit Tests
// ==========================================================================
// Tests cover: full provenance, trust history, supplier matching (cross-graph),
// shipment evidence, empty results, edge cases.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { GraphQueryService } from '../packages/graph-query/src/service.js';
import type { GraphQueryAdapter } from '../packages/graph-query/src/types.js';
import type { SpecimenProvenance, OrganizationTrustInfo, SupplierMatch } from '../packages/graph-query/src/types.js';

// --------------------------------------------------------------------------
// Mock adapter
// --------------------------------------------------------------------------

function createMockAdapter(): GraphQueryAdapter {
  return {
    async getProvenanceLineage(specimenId: string): Promise<SpecimenProvenance> {
      return {
        specimenId,
        specimenType: 'ffpe',
        ancestors: [
          { id: 'consent-1', nodeType: 'consent', label: 'Donor Consent', recordedAt: '2026-01-01T00:00:00Z' },
          { id: 'proc-1', nodeType: 'processing_event', label: 'FFPE Processing', recordedAt: '2026-01-05T00:00:00Z' },
          { id: 'qc-1', nodeType: 'qc_result', label: 'QC Passed', recordedAt: '2026-01-06T00:00:00Z' },
        ],
        descendants: [
          { id: 'ds-1', nodeType: 'dataset', label: 'Expression Dataset', recordedAt: '2026-02-01T00:00:00Z' },
        ],
        edges: [
          { edgeType: 'authorized_by', sourceId: 'spec-1', targetId: 'consent-1' },
          { edgeType: 'processed_by', sourceId: 'spec-1', targetId: 'proc-1' },
          { edgeType: 'verified_by', sourceId: 'spec-1', targetId: 'qc-1' },
          { edgeType: 'derived_from', sourceId: 'ds-1', targetId: 'spec-1' },
        ],
        evidence: [
          { type: 'consent_form', reference: '/docs/consent-1.pdf' },
          { type: 'qc_report', reference: '/docs/qc-1.pdf' },
        ],
      };
    },

    async getEvidenceForShipment(shipmentId: string) {
      return [
        { type: 'temperature_log', reference: `/logs/${shipmentId}.csv` },
        { type: 'chain_of_custody', reference: `/coc/${shipmentId}.pdf` },
        { type: 'customs_declaration', reference: `/customs/${shipmentId}.pdf` },
      ];
    },

    async getOrganizationTrust(orgId: string): Promise<OrganizationTrustInfo> {
      return {
        organizationId: orgId,
        operationalScore: 0.85,
        regulatoryScore: 0.92,
        financialScore: 0.78,
        technicalScore: 0.95,
        overallScore: 0.875,
        trajectory: [
          { date: '2026-01-01', score: 0.5, dimension: 'overall' },
          { date: '2026-01-15', score: 0.7, dimension: 'overall', eventSource: 'fulfillment.completed' },
          { date: '2026-02-01', score: 0.875, dimension: 'overall', eventSource: 'fulfillment.completed' },
        ],
      };
    },

    async normalizeAndExpand(term: string, vocabulary: string) {
      const expansions: Record<string, string[]> = {
        'whole_blood': ['whole_blood', 'WB', 'Blood (venous)', 'EDTA whole blood'],
        'ffpe': ['ffpe', 'FFPET', 'Formalin-fixed paraffin-embedded'],
        'breast_cancer': ['breast_cancer', 'C50', 'Breast Carcinoma'],
      };

      const synonyms = expansions[term] ?? [term];

      return {
        originalTerm: term,
        normalizedTerm: term,
        synonyms,
        vocabulary,
        externalCodes: term === 'breast_cancer'
          ? [{ system: 'icd10', code: 'C50' }]
          : [],
      };
    },

    async findOrganizationsByCapability(capabilities: string[]) {
      return [
        { id: 'org-biobank-1', name: 'University Biorepository' },
        { id: 'org-biobank-2', name: 'Pathology Lab Services' },
        { id: 'org-biobank-3', name: 'Tissue Solutions Inc.' },
      ];
    },
  };
}

// --------------------------------------------------------------------------
// specimenFullProvenance
// --------------------------------------------------------------------------

describe('specimenFullProvenance()', () => {
  it('should return complete provenance for a specimen', async () => {
    const service = new GraphQueryService(createMockAdapter());
    const result = await service.specimenFullProvenance('spec-001');

    expect(result.specimenId).toBe('spec-001');
    expect(result.ancestors).toHaveLength(3);
    expect(result.descendants).toHaveLength(1);
    expect(result.edges).toHaveLength(4);
    expect(result.evidence).toHaveLength(2);

    // Verify ancestor types
    const ancestorTypes = result.ancestors.map((a) => a.nodeType);
    expect(ancestorTypes).toContain('consent');
    expect(ancestorTypes).toContain('processing_event');
    expect(ancestorTypes).toContain('qc_result');
  });
});

// --------------------------------------------------------------------------
// organizationTrustHistory
// --------------------------------------------------------------------------

describe('organizationTrustHistory()', () => {
  it('should return trust info with trajectory', async () => {
    const service = new GraphQueryService(createMockAdapter());
    const result = await service.organizationTrustHistory('org-biobank-1');

    expect(result.organizationId).toBe('org-biobank-1');
    expect(result.overallScore).toBeCloseTo(0.875, 2);
    expect(result.trajectory).toHaveLength(3);
    expect(result.trajectory[0].score).toBe(0.5);
    expect(result.trajectory[2].score).toBeCloseTo(0.875, 2);
  });
});

// --------------------------------------------------------------------------
// matchingSuppliers
// --------------------------------------------------------------------------

describe('matchingSuppliers()', () => {
  it('should return ranked suppliers matching criteria', async () => {
    const service = new GraphQueryService(createMockAdapter());
    const result = await service.matchingSuppliers({
      specimenType: 'whole_blood',
      minTrustScore: 0.7,
      requiredCapabilities: ['biobank'],
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].organizationId).toBeTruthy();
    expect(result[0].trustScore).toBeGreaterThanOrEqual(0.7);
    expect(result[0].matchReasons.length).toBeGreaterThan(0);
  });

  it('should sort by trust score descending', async () => {
    const service = new GraphQueryService({
      ...createMockAdapter(),
      // Override to return multiple orgs with different trust scores
      async findOrganizationsByCapability() {
        return [
          { id: 'org-high', name: 'High Trust' },
          { id: 'org-low', name: 'Low Trust' },
          { id: 'org-mid', name: 'Mid Trust' },
        ];
      },
      async getOrganizationTrust(orgId: string): Promise<OrganizationTrustInfo> {
        const scores: Record<string, number> = {
          'org-high': 0.95,
          'org-low': 0.50,
          'org-mid': 0.75,
        };
        const score = scores[orgId] ?? 0.5;
        return {
          organizationId: orgId,
          operationalScore: score, regulatoryScore: score,
          financialScore: score, technicalScore: score,
          overallScore: score,
          trajectory: [],
        };
      },
    });

    const result = await service.matchingSuppliers({
      requiredCapabilities: ['biobank'],
      minTrustScore: 0.4,
    });

    expect(result).toHaveLength(3);
    expect(result[0].organizationId).toBe('org-high');
    expect(result[1].organizationId).toBe('org-mid');
    expect(result[2].organizationId).toBe('org-low');
  });

  it('should filter by minimum trust score', async () => {
    const service = new GraphQueryService({
      ...createMockAdapter(),
      async findOrganizationsByCapability() {
        return [
          { id: 'org-a', name: 'A' },
          { id: 'org-b', name: 'B' },
        ];
      },
      async getOrganizationTrust(orgId: string): Promise<OrganizationTrustInfo> {
        const score = orgId === 'org-a' ? 0.9 : 0.3;
        return {
          organizationId: orgId,
          operationalScore: score, regulatoryScore: score,
          financialScore: score, technicalScore: score,
          overallScore: score,
          trajectory: [],
        };
      },
    });

    const result = await service.matchingSuppliers({
      requiredCapabilities: ['biobank'],
      minTrustScore: 0.7,
    });

    expect(result).toHaveLength(1);
    expect(result[0].organizationId).toBe('org-a');
  });

  it('should return empty when no candidates', async () => {
    const service = new GraphQueryService({
      ...createMockAdapter(),
      async findOrganizationsByCapability() {
        return [];
      },
    });

    const result = await service.matchingSuppliers({
      requiredCapabilities: ['nonexistent'],
    });

    expect(result).toHaveLength(0);
  });

  it('should return empty when no criteria provided', async () => {
    const service = new GraphQueryService(createMockAdapter());
    const result = await service.matchingSuppliers({});
    expect(result).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// shipmentRegulatoryEvidence
// --------------------------------------------------------------------------

describe('shipmentRegulatoryEvidence()', () => {
  it('should return evidence for a shipment', async () => {
    const service = new GraphQueryService(createMockAdapter());
    const result = await service.shipmentRegulatoryEvidence('sh-001');

    expect(result).toHaveLength(3);
    expect(result.some((e) => e.type === 'temperature_log')).toBe(true);
    expect(result.some((e) => e.type === 'chain_of_custody')).toBe(true);
    expect(result.some((e) => e.type === 'customs_declaration')).toBe(true);
  });
});
