// ==========================================================================
// Evidence Class (KEMS-001 §3)
// ==========================================================================
// Ordered from most to least independently verifiable.
// Baseline AF-1.0.
// ==========================================================================

/**
 * Evidence Classes as defined by KEMS-001 §3.
 *
 * A — Public Independent Evidence
 * B — Institutional Documentary Evidence
 * C — Operational Evidence (Vilo OS)
 * D — Cross-Source Corroboration
 * E — Temporal Continuity Evidence
 * F — External Confirmation
 */
export enum EvidenceClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
}

/** Human-readable names for each Evidence Class */
export const EVIDENCE_CLASS_NAMES: Record<EvidenceClass, string> = {
  [EvidenceClass.A]: 'Public Independent Evidence',
  [EvidenceClass.B]: 'Institutional Documentary Evidence',
  [EvidenceClass.C]: 'Operational Evidence',
  [EvidenceClass.D]: 'Cross-Source Corroboration',
  [EvidenceClass.E]: 'Temporal Continuity Evidence',
  [EvidenceClass.F]: 'External Confirmation',
};

/** Descriptions for each Evidence Class */
export const EVIDENCE_CLASS_DESCRIPTIONS: Record<EvidenceClass, string> = {
  [EvidenceClass.A]: 'Evidence from public registries and regulatory databases verifiable without relying on the institution.',
  [EvidenceClass.B]: 'Evidence from the institution itself in the form of structured documents with internal verifiability.',
  [EvidenceClass.C]: 'Evidence generated automatically by operational systems as a byproduct of execution.',
  [EvidenceClass.D]: 'Structural consistency detected when two or more independent sources from different Classes agree.',
  [EvidenceClass.E]: 'Evidence that a capability has been maintained consistently over time through coherent date sequences.',
  [EvidenceClass.F]: 'Evidence provided by an independent third party confirming a specific capability from their own records.',
};

/**
 * Default decay parameters per Evidence Class (in months).
 * Per KEMS-001 §9.
 */
export const EVIDENCE_CLASS_DECAY_MONTHS: Record<EvidenceClass, number | null> = {
  [EvidenceClass.A]: 60,    // Low decay — study participation remains relevant
  [EvidenceClass.B]: 24,    // Medium decay — certifications and SOPs need renewal
  [EvidenceClass.C]: 12,    // Higher decay — operational evidence is time-sensitive
  [EvidenceClass.D]: null,  // No decay — corroboration is structural
  [EvidenceClass.E]: null,  // No decay — continuity is assessed over full history
  [EvidenceClass.F]: 36,    // Low decay — external confirmations remain meaningful
};

/**
 * Default weight per Evidence Class (higher = more independent).
 * These are initial estimates per KEMS-001 §3 contribution descriptions.
 */
export const EVIDENCE_CLASS_DEFAULT_WEIGHT: Record<EvidenceClass, number> = {
  [EvidenceClass.A]: 0.8,
  [EvidenceClass.B]: 0.5,
  [EvidenceClass.C]: 0.7,
  [EvidenceClass.D]: 0.0,  // Modulation weight — applied to corroborated nodes
  [EvidenceClass.E]: 0.0,  // Modulation weight — applied to continuity, not standalone
  [EvidenceClass.F]: 1.0,
};
