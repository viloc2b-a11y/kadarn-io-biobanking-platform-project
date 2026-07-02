// ==========================================================================
// Institution Identity — Resolution Pipeline (4 tiers)
// ==========================================================================
// Baseline AF-1.0. Sprint 19.0A.
//
// ACR-001: Institution = legal entity. Site = operational unit.
// Identity resolution runs against InstitutionIdentity (legal/cross-source).
// SiteIdentity is created or confirmed separately (Tier 4).
// ==========================================================================

import type { InstitutionIdentity, SiteIdentity, ExternalIdentifier, IdentityResolution, UnresolvedIdentity, IdentityConfidence, InstitutionAlias } from './types.js';

// --------------------------------------------------------------------------
// Abbreviation expansion (Tier 2 normalization)
// --------------------------------------------------------------------------

const ABBREVIATIONS: Record<string, string> = {
  univ: 'university', med: 'medical', dept: 'department',
  hosp: 'hospital', ctr: 'center', inst: 'institute',
  sch: 'school', coll: 'college', assoc: 'association',
  lab: 'laboratory', natl: 'national', intl: 'international',
};

export function expandAbbreviations(name: string): string {
  let result = name;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    result = result.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  return result;
}

// --------------------------------------------------------------------------
// Normalization
// --------------------------------------------------------------------------

const STOP_WORDS = new Set(['the', 'of', 'at', 'and', 'for', 'a', 'an', 'in', 'to', 'by']);

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeForMatching(name: string): string {
  const expanded = expandAbbreviations(name);
  const normalized = normalizeName(expanded);
  return normalized.split(' ').filter(w => !STOP_WORDS.has(w)).join(' ');
}

// --------------------------------------------------------------------------
// Tier 1: Exact External Identifier Match
// --------------------------------------------------------------------------

export function resolveTier1(
  externalIds: ExternalIdentifier[],
  knownInstitutions: InstitutionIdentity[],
): { institution: InstitutionIdentity | null; confidence: IdentityConfidence; explanation: string } {
  for (const extId of externalIds) {
    for (const inst of knownInstitutions) {
      const match = inst.externalIds.find(
        e => e.type === extId.type && e.value.toLowerCase() === extId.value.toLowerCase(),
      );
      if (match) {
        return {
          institution: inst,
          confidence: 'high',
          explanation: `Tier 1: Exact match on ${extId.type.toUpperCase()} "${extId.value}" → "${inst.canonicalName}" (${inst.kadarnId})`,
        };
      }
    }
  }
  return { institution: null, confidence: 'low', explanation: 'Tier 1: No exact match found.' };
}

// --------------------------------------------------------------------------
// Tier 2: Normalized Name + Address Fuzzy Match
// --------------------------------------------------------------------------

export interface FuzzyMatchResult {
  institution: InstitutionIdentity | null;
  confidence: IdentityConfidence;
  score: number;
  explanation: string;
}

export function resolveTier2(
  name: string,
  city: string | undefined,
  state: string | undefined,
  country: string | undefined,
  knownInstitutions: InstitutionIdentity[],
): FuzzyMatchResult {
  const normalizedIncoming = normalizeForMatching(name);
  const incomingTokens = new Set(normalizedIncoming.split(' '));

  let bestScore = 0;
  let bestMatch: InstitutionIdentity | null = null;

  for (const inst of knownInstitutions) {
    // Score against canonical name
    const canonicalTokens = new Set(normalizeForMatching(inst.canonicalName).split(' '));
    let nameScore = tokenSetScore(incomingTokens, canonicalTokens);

    // Score against aliases (take best)
    for (const alias of inst.aliases) {
      const aliasTokens = new Set(normalizeForMatching(alias.alias).split(' '));
      const aliasScore = tokenSetScore(incomingTokens, aliasTokens);
      if (aliasScore > nameScore) nameScore = aliasScore;
    }

    // Location bonus
    let locationScore = 0;
    if (inst.address && city && state) {
      if (inst.address.city.toLowerCase() === city.toLowerCase() &&
          inst.address.state.toLowerCase() === state.toLowerCase()) {
        locationScore = 25;
      } else if (inst.address.city.toLowerCase() === city.toLowerCase() ||
                 inst.address.state.toLowerCase() === state.toLowerCase()) {
        locationScore = 10;
      }
    }
    if (country && inst.address?.country.toLowerCase() === country.toLowerCase()) {
      locationScore += 5;
    }

    const totalScore = nameScore + locationScore;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = inst;
    }
  }

  if (!bestMatch || bestScore < 50) {
    return { institution: null, confidence: 'low', score: bestScore, explanation: 'Tier 2: No match above 50 threshold.' };
  }

  let confidence: IdentityConfidence;
  if (bestScore >= 85) confidence = 'high';
  else if (bestScore >= 70) confidence = 'medium';
  else confidence = 'low';

  return {
    institution: bestMatch,
    confidence,
    score: bestScore,
    explanation: `Tier 2: Name+address match score ${bestScore} → "${bestMatch.canonicalName}" (confidence: ${confidence})`,
  };
}

function tokenSetScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return Math.round((intersection.size / union.size) * 50);
}

// --------------------------------------------------------------------------
// Tier 3: Cross-Source Bootstrap
// --------------------------------------------------------------------------

export function resolveTier3(
  name: string,
  knownInstitutions: InstitutionIdentity[],
  crossSourceIndex: Map<string, string[]>,
): FuzzyMatchResult {
  const normalizedIncoming = normalizeForMatching(name);

  for (const inst of knownInstitutions) {
    const normalizedCanonical = normalizeForMatching(inst.canonicalName);
    const canonicalTokens = new Set(normalizedCanonical.split(' '));
    const incomingTokens = new Set(normalizedIncoming.split(' '));
    const score = tokenSetScore(incomingTokens, canonicalTokens);

    if (score >= 60) {
      // Check if this institution appears in multiple sources
      const sources = crossSourceIndex.get(inst.kadarnId) ?? [];
      if (sources.length >= 2) {
        return {
          institution: inst,
          confidence: 'medium',
          score,
          explanation: `Tier 3: Cross-source bootstrap — "${name}" matches "${inst.canonicalName}" (score: ${score}, sources: ${sources.join(', ')})`,
        };
      }
    }
  }

  return { institution: null, confidence: 'low', score: 0, explanation: 'Tier 3: No cross-source bootstrap match.' };
}

// --------------------------------------------------------------------------
// Tier 4: Site-Confirmed Identity
// --------------------------------------------------------------------------

export function resolveTier4(
  institution: InstitutionIdentity,
): { institution: InstitutionIdentity; confidence: IdentityConfidence; explanation: string } {
  return {
    institution,
    confidence: 'high',
    explanation: `Tier 4: Site-confirmed — "${institution.canonicalName}" confirmed by institution (${institution.kadarnId})`,
  };
}

// --------------------------------------------------------------------------
// Full pipeline
// --------------------------------------------------------------------------

export function resolveIdentity(
  params: {
    name: string;
    externalIds: ExternalIdentifier[];
    city?: string;
    state?: string;
    country?: string;
  },
  knownInstitutions: InstitutionIdentity[],
  crossSourceIndex: Map<string, string[]>,
  attemptCount: number,
): IdentityResolution {
  // Tier 1
  const t1 = resolveTier1(params.externalIds, knownInstitutions);
  if (t1.institution) {
    return {
      institution: t1.institution,
      site: null,
      resolutionTier: 1,
      unresolved: null,
      identityConfidence: t1.confidence,
      explanation: t1.explanation,
    };
  }

  // Tier 2
  const t2 = resolveTier2(params.name, params.city, params.state, params.country, knownInstitutions);
  if (t2.institution && (t2.confidence === 'high' || t2.confidence === 'medium')) {
    return {
      institution: t2.institution,
      site: null,
      resolutionTier: 2,
      unresolved: null,
      identityConfidence: t2.confidence,
      explanation: t2.explanation,
    };
  }

  // Tier 3
  const t3 = resolveTier3(params.name, knownInstitutions, crossSourceIndex);
  if (t3.institution && t3.confidence === 'medium') {
    return {
      institution: t3.institution,
      site: null,
      resolutionTier: 3,
      unresolved: null,
      identityConfidence: 'medium',
      explanation: t3.explanation,
    };
  }

  // Unresolved
  const stagingId = `unresolved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const unresolved: UnresolvedIdentity = {
    stagingId,
    externalId: params.externalIds[0] ?? { type: 'custom', value: params.name, label: params.name, confidence: 'low', verifiedAt: null, verifiedBy: 'automated' },
    source: params.externalIds[0]?.type ?? 'custom',
    sourceName: params.name,
    context: { city: params.city, state: params.state, country: params.country },
    stagedAt: new Date().toISOString(),
    attemptCount: attemptCount + 1,
    lastReason: 'No matching identity found in known institutions after Tiers 1–3.',
  };

  return {
    institution: null,
    site: null,
    resolutionTier: null,
    unresolved,
    identityConfidence: 'low',
    explanation: `Unresolved: "${params.name}" could not be matched after Tiers 1–3. Staged as "${stagingId}".`,
  };
}
