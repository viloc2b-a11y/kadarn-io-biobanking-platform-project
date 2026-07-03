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

    // Note: Trust Score logic removed per ADR-010 (RC-0.2)
    const suppliers: SupplierMatch[] = [];
    const maxResults = criteria.maxResults ?? 20;

    for (const org of candidates) {
      if (suppliers.length >= maxResults) break;



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
        capabilities: criteria.requiredCapabilities ?? [],
        matchReasons: reasons,
      });
    }


    return suppliers;
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
