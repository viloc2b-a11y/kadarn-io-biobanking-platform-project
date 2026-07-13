// ==========================================================================
// Kadarn Graph Query Layer — Query Service
// ==========================================================================
// Composes cross-graph queries by orchestrating the underlying graph
// engines (Provenance, Knowledge, Trust, Network).
// ==========================================================================

import type {
  GraphQueryAdapter,
  SpecimenProvenance,
  OrganizationTrustInfo,
  SupplierMatch,
  MatchingCriteria,
  KnowledgeInfo,
} from './types.js';

export class GraphQueryService {
  constructor(private readonly adapter: GraphQueryAdapter) {}

  // ------------------------------------------------------------------------
  // specimenFullProvenance — complete lineage for a specimen
  // ------------------------------------------------------------------------
  async specimenFullProvenance(specimenId: string): Promise<SpecimenProvenance> {
    return this.adapter.getProvenanceLineage(specimenId);
  }

  // ------------------------------------------------------------------------
  // organizationTrustHistory — trust trajectory for an org
  // ------------------------------------------------------------------------
  async organizationTrustHistory(orgId: string): Promise<OrganizationTrustInfo> {
    return this.adapter.getOrganizationTrust(orgId);
  }

  // ------------------------------------------------------------------------
  // matchingSuppliers — cross-graph supplier matching
  // ------------------------------------------------------------------------
  // Composes: Knowledge (expand terms) → Trust (filter by score) → Network (filter by capability)
  // ------------------------------------------------------------------------
  async matchingSuppliers(criteria: MatchingCriteria): Promise<SupplierMatch[]> {
    // Phase 1: Expand search terms via Knowledge Graph
    const expandedTypes = criteria.specimenType
      ? await this.adapter.normalizeAndExpand(criteria.specimenType, 'specimen_type')
      : null;

    const expandedDiagnoses = criteria.diagnosis
      ? await this.adapter.normalizeAndExpand(criteria.diagnosis, 'diagnosis')
      : null;

    // Phase 2: Find candidate organizations by capability (Network Graph)
    const candidates = criteria.requiredCapabilities?.length
      ? await this.adapter.findOrganizationsByCapability(criteria.requiredCapabilities)
      : [];

    const suppliers: SupplierMatch[] = [];
    const maxResults = criteria.maxResults ?? 20;
    const minTrustScore = criteria.minTrustScore ?? Number.NEGATIVE_INFINITY;

    for (const org of candidates) {
      const trust = await this.adapter.getOrganizationTrust(org.id);
      const trustScore = trust.overallScore;

      if (!Number.isFinite(trustScore) || trustScore < minTrustScore) {
        continue;
      }

      const reasons: string[] = [];
      if (expandedTypes) {
        reasons.push(`Matches specimen types: ${expandedTypes.synonyms.slice(0, 3).join(', ')}`);
      }
      if (expandedDiagnoses) {
        reasons.push(`Matches diagnoses: ${expandedDiagnoses.normalizedTerm}`);
      }

      suppliers.push({
        organizationId: org.id,
        name: org.name,
        trustScore,
        capabilities: criteria.requiredCapabilities ?? [],
        matchReasons: reasons,
      });
    }

    return suppliers
      .sort((a, b) => {
        const byTrust = (b.trustScore ?? Number.NEGATIVE_INFINITY) - (a.trustScore ?? Number.NEGATIVE_INFINITY);
        if (byTrust !== 0) return byTrust;

        return a.organizationId.localeCompare(b.organizationId);
      })
      .slice(0, maxResults);
  }

  // ------------------------------------------------------------------------
  // shipmentRegulatoryEvidence — all evidence for a shipment's provenance
  // ------------------------------------------------------------------------
  async shipmentRegulatoryEvidence(
    shipmentId: string,
  ): Promise<Array<{ type: string; reference: string }>> {
    return this.adapter.getEvidenceForShipment(shipmentId);
  }
}
