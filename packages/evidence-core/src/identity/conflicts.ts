// ==========================================================================
// Institution Identity — Conflict Detection, Merge/Split, FK Enforcement
// ==========================================================================
// Baseline AF-1.0. Sprint 19.0A.
// ACR-001: Institution → Site hierarchy.
// ==========================================================================

import type { InstitutionIdentity, SiteIdentity, ExternalIdentifier, IdentityConflict, MergeCandidate, SplitCandidate, IdentityConfidence } from './types.js';
import { normalizeForMatching } from './resolver.js';

// --------------------------------------------------------------------------
// Conflict detection
// --------------------------------------------------------------------------

export function detectConflicts(
  externalIds: ExternalIdentifier[],
  knownInstitutions: InstitutionIdentity[],
): IdentityConflict[] {
  const conflicts: IdentityConflict[] = [];

  for (const extId of externalIds) {
    const matching = knownInstitutions.filter(inst =>
      inst.externalIds.some(e => e.type === extId.type && e.value.toLowerCase() === extId.value.toLowerCase()),
    );

    if (matching.length > 1) {
      conflicts.push({
        externalId: extId,
        existingIds: matching.map(i => i.kadarnId),
        description: `${extId.type.toUpperCase()}="${extId.value}" associated with ${matching.length} identities: ${matching.map(i => i.canonicalName).join(', ')}`,
      });
    }
  }

  return conflicts;
}

// --------------------------------------------------------------------------
// Merge candidates
// --------------------------------------------------------------------------

export function detectMergeCandidates(knownInstitutions: InstitutionIdentity[]): MergeCandidate[] {
  const candidates: MergeCandidate[] = [];

  for (let i = 0; i < knownInstitutions.length; i++) {
    for (let j = i + 1; j < knownInstitutions.length; j++) {
      const a = knownInstitutions[i];
      const b = knownInstitutions[j];

      // Shared external identifiers
      const sharedIds = a.externalIds.filter(ae =>
        b.externalIds.some(be => be.type === ae.type && be.value.toLowerCase() === ae.value.toLowerCase()),
      );
      if (sharedIds.length > 0) {
        candidates.push({
          primaryId: a.kadarnId,
          secondaryIds: [b.kadarnId],
          reason: `"${a.canonicalName}" and "${b.canonicalName}" share ${sharedIds.length} external identifier(s). Possible duplicate.`,
          confidence: 0.7,
        });
        continue;
      }

      // Very similar normalized names
      const normA = normalizeForMatching(a.canonicalName);
      const normB = normalizeForMatching(b.canonicalName);
      if (normA === normB) {
        candidates.push({
          primaryId: a.kadarnId,
          secondaryIds: [b.kadarnId],
          reason: `"${a.canonicalName}" and "${b.canonicalName}" have identical normalized names. Possible duplicate.`,
          confidence: 0.6,
        });
      }
    }
  }

  return candidates;
}

// --------------------------------------------------------------------------
// Split candidates
// --------------------------------------------------------------------------

export function detectSplitCandidates(knownInstitutions: InstitutionIdentity[]): SplitCandidate[] {
  const candidates: SplitCandidate[] = [];

  for (const inst of knownInstitutions) {
    const feiIds = inst.externalIds.filter(e => e.type === 'fei');
    if (feiIds.length > 1) {
      candidates.push({
        kadarnId: inst.kadarnId,
        suggestedIds: feiIds.map(e => `${inst.kadarnId}-${e.value.slice(0, 8)}`),
        reason: `"${inst.canonicalName}" has ${feiIds.length} FEI numbers, suggesting multiple sites under one institution identity.`,
        confidence: 0.5,
      });
    }

    const nctIds = inst.externalIds.filter(e => e.type === 'nct_id');
    if (nctIds.length > 10) {
      candidates.push({
        kadarnId: inst.kadarnId,
        suggestedIds: [`${inst.kadarnId}-dept1`, `${inst.kadarnId}-dept2`],
        reason: `"${inst.canonicalName}" has ${nctIds.length} NCT IDs. Consider splitting by department.`,
        confidence: 0.3,
      });
    }
  }

  return candidates;
}

// --------------------------------------------------------------------------
// FK enforcement
// --------------------------------------------------------------------------

export function requireSiteId(
  siteId: string | null | undefined,
  knownSites: SiteIdentity[],
  knownInstitutions: InstitutionIdentity[],
): { site: SiteIdentity; institution: InstitutionIdentity } {
  if (!siteId) {
    throw new Error(
      'EvidenceNode site_id is required. Raw external identifiers are not permitted. ' +
      'Resolve the identity first via /identity/resolve, then create or select a SiteIdentity.',
    );
  }

  const site = knownSites.find(s => s.siteId === siteId);
  if (!site) {
    throw new Error(`SiteIdentity "${siteId}" not found. Create the site first.`);
  }

  const institution = knownInstitutions.find(i => i.kadarnId === site.kadarnId);
  if (!institution) {
    throw new Error(`InstitutionIdentity for site "${siteId}" not found. Data integrity violation.`);
  }

  return { site, institution };
}

/**
 * Validate kadarn_id exists (for institution-level operations).
 */
export function requireKadarnId(
  kadarnId: string | null | undefined,
  knownInstitutions: InstitutionIdentity[],
): InstitutionIdentity {
  if (!kadarnId) {
    throw new Error('kadarn_id is required. Resolve the identity first.');
  }
  const inst = knownInstitutions.find(i => i.kadarnId === kadarnId);
  if (!inst) {
    throw new Error(`kadarn_id "${kadarnId}" not found.`);
  }
  return inst;
}
