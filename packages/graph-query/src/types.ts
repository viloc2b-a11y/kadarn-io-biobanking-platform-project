// ==========================================================================
// Kadarn Graph Query Layer — Type Definitions
// ==========================================================================
// ADR-016: Graph-Native Query Layer
// ==========================================================================

// --------------------------------------------------------------------------
// Provenance
// --------------------------------------------------------------------------
export interface ProvenanceNodeInfo {
  id: string;
  nodeType: string;
  label?: string;
  recordedAt: string;
}

export interface ProvenanceEdgeInfo {
  edgeType: string;
  sourceId: string;
  targetId: string;
}

export interface SpecimenProvenance {
  specimenId: string;
  specimenType?: string;
  ancestors: ProvenanceNodeInfo[];
  descendants: ProvenanceNodeInfo[];
  edges: ProvenanceEdgeInfo[];
  evidence: Array<{ type: string; reference: string }>;
}

// --------------------------------------------------------------------------
// Trust
// --------------------------------------------------------------------------
export interface TrustHistoryPoint {
  date: string;
  score: number;
  dimension: string;
  eventSource?: string;
}

export interface OrganizationTrustInfo {
  organizationId: string;
  operationalScore: number;
  regulatoryScore: number;
  financialScore: number;
  technicalScore: number;
  overallScore: number;
  trajectory: TrustHistoryPoint[];
}

// --------------------------------------------------------------------------
// Knowledge
// --------------------------------------------------------------------------
export interface KnowledgeInfo {
  originalTerm: string;
  normalizedTerm: string;
  synonyms: string[];
  vocabulary: string;
  externalCodes: Array<{ system: string; code: string }>;
}

// --------------------------------------------------------------------------
// Matching supplier
// --------------------------------------------------------------------------
export interface SupplierMatch {
  organizationId: string;
  name: string;
  trustScore: number;
  capabilities: string[];
  matchReasons: string[];
}

// --------------------------------------------------------------------------
// Matching criteria
// --------------------------------------------------------------------------
export interface MatchingCriteria {
  specimenType?: string;
  diagnosis?: string;
  minTrustScore?: number;
  requiredCapabilities?: string[];
  maxResults?: number;
}

// --------------------------------------------------------------------------
// Graph Query Adapter
// --------------------------------------------------------------------------

export interface GraphQueryAdapter {
  // Provenance
  getProvenanceLineage(specimenId: string): Promise<SpecimenProvenance>;
  getEvidenceForShipment(shipmentId: string): Promise<Array<{ type: string; reference: string }>>;

  // Trust
  getOrganizationTrust(orgId: string): Promise<OrganizationTrustInfo>;

  // Knowledge
  normalizeAndExpand(term: string, vocabulary: string): Promise<KnowledgeInfo>;

  // Network
  findOrganizationsByCapability(capabilities: string[]): Promise<Array<{ id: string; name: string }>>;
}
