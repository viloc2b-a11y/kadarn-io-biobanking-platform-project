// ==========================================================================
// Capability Detection — Normalization
// ==========================================================================
// Sprint 20B.2.
//
// Normalizes detected capabilities: merges duplicates, resolves canonical
// names, aggregates reasoning and supporting evidence.
// No Claims. No Evidence Core modification. No promotion.
// ==========================================================================

import type { CandidateCapability } from './types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface NormalizedCapability {
  /** Normalized capability name */
  normalizedName: string;
  /** All claimTypeIds that map to this normalized capability */
  aliases: string[];
  /** Canonical claimTypeId */
  canonicalId: string;
  /** Category */
  category: string;
}

// --------------------------------------------------------------------------
// Default canonical mappings
// --------------------------------------------------------------------------

const DEFAULT_CANONICALS: NormalizedCapability[] = [
  // Processing
  {
    normalizedName: 'PK Sample Processing',
    aliases: ['biospecimen.processing.pk_samples'],
    canonicalId: 'biospecimen.processing.pk_samples',
    category: 'processing',
  },
  {
    normalizedName: 'PBMC Processing',
    aliases: ['biospecimen.processing.pbmc'],
    canonicalId: 'biospecimen.processing.pbmc',
    category: 'processing',
  },
  {
    normalizedName: 'FFPE Tissue Processing',
    aliases: ['biospecimen.processing.ffpe'],
    canonicalId: 'biospecimen.processing.ffpe',
    category: 'processing',
  },
  {
    normalizedName: 'Nucleic Acid Extraction',
    aliases: ['biospecimen.processing.dna_extraction', 'biospecimen.processing.rna_extraction'],
    canonicalId: 'biospecimen.processing.nucleic_extraction',
    category: 'processing',
  },

  // Storage
  {
    normalizedName: '-80°C Freezer Storage',
    aliases: ['biospecimen.storage.freezer_minus_80c'],
    canonicalId: 'biospecimen.storage.freezer_minus_80c',
    category: 'storage',
  },
  {
    normalizedName: 'Cryogenic Storage',
    aliases: ['biospecimen.storage.liquid_nitrogen'],
    canonicalId: 'biospecimen.storage.cryogenic',
    category: 'storage',
  },
  {
    normalizedName: 'Refrigerated Storage (2-8°C)',
    aliases: ['biospecimen.storage.refrigerated_2_8c'],
    canonicalId: 'biospecimen.storage.refrigerated_2_8c',
    category: 'storage',
  },

  // Shipping
  {
    normalizedName: 'Cold Chain Shipping',
    aliases: ['biospecimen.shipping.cold_chain'],
    canonicalId: 'biospecimen.shipping.cold_chain',
    category: 'shipping',
  },
  {
    normalizedName: 'Dry Ice Shipping',
    aliases: ['biospecimen.shipping.dry_ice'],
    canonicalId: 'biospecimen.shipping.dry_ice',
    category: 'shipping',
  },

  // Regulatory
  {
    normalizedName: 'GCP-Trained Staff',
    aliases: ['biospecimen.regulatory.gcp_staff'],
    canonicalId: 'biospecimen.regulatory.gcp_staff',
    category: 'regulatory',
  },
  {
    normalizedName: 'Inspection Readiness',
    aliases: ['biospecimen.regulatory.inspection_ready'],
    canonicalId: 'biospecimen.regulatory.inspection_ready',
    category: 'regulatory',
  },
  {
    normalizedName: 'SOP Governance',
    aliases: ['biospecimen.regulatory.sop_governance'],
    canonicalId: 'biospecimen.regulatory.sop_governance',
    category: 'regulatory',
  },

  // Operations
  {
    normalizedName: 'Phase I Study Experience',
    aliases: ['biospecimen.operations.phase_i_experience'],
    canonicalId: 'biospecimen.operations.phase_i_experience',
    category: 'operations',
  },
  {
    normalizedName: 'Study Completion History',
    aliases: ['biospecimen.operations.study_completion_history'],
    canonicalId: 'biospecimen.operations.study_completion_history',
    category: 'operations',
  },
  {
    normalizedName: 'Patient Recruitment Capability',
    aliases: ['biospecimen.operations.recruitment_therapeutic_area'],
    canonicalId: 'biospecimen.operations.recruitment_therapeutic_area',
    category: 'operations',
  },

  // Therapeutic Areas
  {
    normalizedName: 'Oncology Research',
    aliases: ['biospecimen.therapeutic_area.oncology'],
    canonicalId: 'biospecimen.therapeutic_area.oncology',
    category: 'therapeutic_area',
  },
];

// --------------------------------------------------------------------------
// Normalizer
// --------------------------------------------------------------------------

export class CapabilityNormalizer {
  /** Map of claimTypeId/alias → canonical capability */
  readonly aliasMap: Map<string, NormalizedCapability>;
  /** Map of canonicalId → canonical capability */
  readonly canonicalCapabilities: Map<string, NormalizedCapability>;

  constructor(canonicals?: NormalizedCapability[]) {
    this.aliasMap = new Map();
    this.canonicalCapabilities = new Map();

    const entries = canonicals ?? DEFAULT_CANONICALS;
    for (const entry of entries) {
      this.canonicalCapabilities.set(entry.canonicalId, entry);
      for (const alias of entry.aliases) {
        this.aliasMap.set(alias, entry);
      }
      // Self-alias: canonicalId also maps to itself
      if (!this.aliasMap.has(entry.canonicalId)) {
        this.aliasMap.set(entry.canonicalId, entry);
      }
    }
  }

  /** Resolve a claimTypeId to its canonical ID */
  resolveCanonical(claimTypeId: string): string {
    return this.aliasMap.get(claimTypeId)?.canonicalId ?? claimTypeId;
  }

  /** Normalize a list of capabilities: merge duplicates by canonical ID */
  normalize(capabilities: CandidateCapability[]): CandidateCapability[] {
    const merged = new Map<string, CandidateCapability>();

    for (const cap of capabilities) {
      const canonicalId = this.resolveCanonical(cap.claimTypeId);

      const existing = merged.get(canonicalId);
      if (existing) {
        // Merge: keep higher confidence, union supporting IDs, aggregate reasoning
        merged.set(canonicalId, {
          ...existing,
          confidence: Math.max(existing.confidence, cap.confidence),
          status: existing.confidence >= cap.confidence ? existing.status : cap.status,
          supportingEntityIds: this.union(existing.supportingEntityIds, cap.supportingEntityIds),
          supportingRelationshipIds: this.union(existing.supportingRelationshipIds, cap.supportingRelationshipIds),
          supportingArtifactIds: this.union(existing.supportingArtifactIds, cap.supportingArtifactIds),
          supportingEventIds: this.union(existing.supportingEventIds, cap.supportingEventIds),
          reasoning: `${existing.reasoning}; ${cap.reasoning}`,
        });
      } else {
        // Use canonical name from mappings if available
        const canonical = this.canonicalCapabilities.get(canonicalId);
        merged.set(canonicalId, {
          ...cap,
          claimTypeId: canonicalId,
          name: canonical?.normalizedName ?? cap.name,
          category: (canonical?.category as any) ?? cap.category,
        });
      }
    }

    return Array.from(merged.values());
  }

  private union<T>(a: T[], b: T[]): T[] {
    return Array.from(new Set([...a, ...b]));
  }
}
