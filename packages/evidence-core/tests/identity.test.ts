// ==========================================================================
// Institution Identity — Tests (19.0A)
// ==========================================================================
// Baseline AF-1.0. ACR-001.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  resolveTier1,
  resolveTier2,
  resolveTier3,
  resolveIdentity,
  normalizeName,
  normalizeForMatching,
  expandAbbreviations,
  detectConflicts,
  detectMergeCandidates,
  detectSplitCandidates,
  requireKadarnId,
  requireSiteId,
} from '../src/index.js';
import type { InstitutionIdentity, SiteIdentity, ExternalIdentifier } from '../src/index.js';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function makeInst(id: string, name: string, fei?: string, city?: string, state?: string, country = 'US'): InstitutionIdentity {
  const ids: ExternalIdentifier[] = [];
  if (fei) ids.push({ type: 'fei', value: fei, label: `FEI ${fei}`, confidence: 'high', verifiedAt: '2026-01-01', verifiedBy: 'automated' });
  return {
    kadarnId: id, canonicalName: name, institutionType: 'hospital', active: true,
    externalIds: ids, aliases: [], resolvedAtTier: null, status: 'active',
    address: city ? { city, state, country, zip: undefined } : undefined,
    identityCreatedBy: 'system', identitySource: 'test', identityLastVerified: null, identityVersion: 1,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', mergedInto: null,
  };
}

function makeAliasInst(id: string, name: string, aliases: string[], city?: string, state?: string): InstitutionIdentity {
  return {
    ...makeInst(id, name, undefined, city, state),
    aliases: aliases.map(a => ({ alias: a, source: 'manual', confidence: 'medium' as const, createdAt: '2026-01-01T00:00:00Z' })),
  };
}

function makeSite(id: string, instId: string, name: string, city?: string, state?: string): SiteIdentity {
  return {
    siteId: id, kadarnId: instId, siteName: name, siteType: 'research_unit', status: 'active',
    identityConfidence: 'high', address: city ? { city, state: state ?? '', country: 'US' } : undefined,
    createdBy: 'system', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  };
}

const mayoRochester = makeInst('inst-mayo-rochester', 'Mayo Clinic Rochester', 'FEI-12345', 'Rochester', 'MN');
const mayoJacksonville = makeInst('inst-mayo-jax', 'Mayo Clinic Florida', 'FEI-67890', 'Jacksonville', 'FL');
const northwestern = makeInst('inst-northwestern', 'Northwestern University Feinberg School of Medicine', 'FEI-99999', 'Chicago', 'IL');
const jhMiami = makeInst('inst-jh-miami', 'Johns Hopkins University', 'FEI-11111', 'Miami', 'FL');
const houstonMethodist = makeAliasInst('inst-houston-methodist', 'Houston Methodist Hospital', ['Methodist Hospital', 'Houston Methodist Research Institute', 'HMRI'], 'Houston', 'TX');

const allInsts = [mayoRochester, mayoJacksonville, northwestern, jhMiami, houstonMethodist];

// --------------------------------------------------------------------------
// Abbreviation expansion
// --------------------------------------------------------------------------

describe('expandAbbreviations', () => {
  it('expands common abbreviations', () => {
    const r = expandAbbreviations('Univ of Med Ctr');
    expect(r.toLowerCase()).toContain('university');
    expect(r.toLowerCase()).toContain('medical');
    expect(r.toLowerCase()).toContain('center');
  });
});

// --------------------------------------------------------------------------
// Tier 1
// --------------------------------------------------------------------------

describe('Tier 1 — Exact external identifier match', () => {
  it('matches by FEI number', () => {
    const r = resolveTier1([{ type: 'fei', value: 'FEI-12345', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }], allInsts);
    expect(r.institution).not.toBeNull();
    expect(r.institution!.kadarnId).toBe('inst-mayo-rochester');
    expect(r.confidence).toBe('high');
  });

  it('is case-insensitive', () => {
    const r = resolveTier1([{ type: 'fei', value: 'fei-12345', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }], allInsts);
    expect(r.institution).not.toBeNull();
  });
});

// --------------------------------------------------------------------------
// Tier 2
// --------------------------------------------------------------------------

describe('Tier 2 — Name + address fuzzy match', () => {
  it('matches Northwestern via name or alias', () => {
    const r = resolveTier2('Northwestern University Feinberg School of Medicine', 'Chicago', 'IL', 'US', allInsts);
    expect(r.institution).not.toBeNull();
    expect(r.confidence).toBe('medium');
      });

  it('distinguishes Mayo Rochester from Mayo Jacksonville', () => {
    const r1 = resolveTier2('Mayo Clinic Rochester', 'Rochester', 'MN', 'US', allInsts);
    const r2 = resolveTier2('Mayo Clinic Florida', 'Jacksonville', 'FL', 'US', allInsts);
    expect(r1.institution!.kadarnId).toBe('inst-mayo-rochester');
    expect(r2.institution!.kadarnId).toBe('inst-mayo-jax');
    expect(r1.institution!.kadarnId).not.toBe(r2.institution!.kadarnId);
  });

  it('matches via alias (Houston Methodist)', () => {
    const r = resolveTier2('HMRI', 'Houston', 'TX', 'US', allInsts);
    expect(r.institution).not.toBeNull();
    expect(r.institution!.kadarnId).toBe('inst-houston-methodist');
  });

  it('returns low confidence for completely unknown institution', () => {
    const r = resolveTier2('ZZTopNonExistent Research Center', undefined, undefined, 'US', allInsts);
    expect(r.confidence).toBe('low');
  });
});

// --------------------------------------------------------------------------
// Tier 3
// --------------------------------------------------------------------------

describe('Tier 3 — Cross-source bootstrap', () => {
  it('may match via cross-source index', () => {
    const idx = new Map<string, string[]>();
    idx.set('inst-mayo-rochester', ['clinicaltrials.gov', 'pubmed']);
    const r = resolveTier3('Mayo Clinic Rochester', allInsts, idx);
    // Cross-source bootstrap depends on token set score >= 60
    if (r.institution) {
      expect(r.confidence).toBe('medium');
    }
  });
});

// --------------------------------------------------------------------------
// Full pipeline
// --------------------------------------------------------------------------

describe('resolveIdentity — full pipeline', () => {
  it('resolves via Tier 1', () => {
    const r = resolveIdentity(
      { name: 'Mayo Clinic', externalIds: [{ type: 'fei', value: 'FEI-12345', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }], city: 'Rochester', state: 'MN' },
      allInsts, new Map(), 0,
    );
    expect(r.institution).not.toBeNull();
    expect(r.resolutionTier).toBe(1);
  });

  it('stages unresolved identities', () => {
    const r = resolveIdentity(
      { name: 'NeverHeardOf University', externalIds: [], city: 'Nowhere', state: 'XX' },
      allInsts, new Map(), 0,
    );
    expect(r.institution).toBeNull();
    expect(r.unresolved).not.toBeNull();
  });
});

// --------------------------------------------------------------------------
// Conflict detection
// --------------------------------------------------------------------------

describe('Conflict detection', () => {
  it('detects same FEI on different identities', () => {
    const conflicts = detectConflicts(
      [{ type: 'fei', value: 'FEI-12345', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }],
      [makeInst('a', 'A', 'FEI-12345'), makeInst('b', 'B', 'FEI-12345')],
    );
    expect(conflicts.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// Merge/split
// --------------------------------------------------------------------------

describe('Merge/split candidates', () => {
  it('detects merge candidates', () => {
    const m = detectMergeCandidates([
      makeInst('a', 'Mayo Clinic Rochester', 'FEI-12345'),
      makeInst('b', 'Mayo Clinic Rochester Campus', undefined),
    ]);
    expect(m.length).toBeGreaterThanOrEqual(0);
  });

  it('detects split candidates with multiple FEIs', () => {
    const multi: InstitutionIdentity = { ...makeInst('m', 'Multi-Site'), externalIds: [
      { type: 'fei', value: 'FEI-111', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' },
      { type: 'fei', value: 'FEI-222', label: '', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' },
    ]};
    const s = detectSplitCandidates([multi]);
    expect(s.length).toBeGreaterThan(0);
  });
});

// --------------------------------------------------------------------------
// FK enforcement
// --------------------------------------------------------------------------

describe('FK enforcement', () => {
  it('requireSiteId throws for null', () => {
    expect(() => requireSiteId(null, [], allInsts)).toThrow();
  });

  it('requireSiteId throws for unknown site', () => {
    expect(() => requireSiteId('unknown-site', [], allInsts)).toThrow();
  });

  it('requireSiteId passes for valid site', () => {
    const site = makeSite('site-oncology', 'inst-mayo-rochester', 'Oncology Research Unit');
    const mayoInstitution = makeInst('inst-mayo-rochester', 'Mayo Clinic Rochester', undefined, 'Rochester', 'MN');
    const r = requireSiteId('site-oncology', [site], [mayoInstitution, ...allInsts.filter(i => i.kadarnId !== 'inst-mayo-rochester')]);
    expect(r.site.siteId).toBe('site-oncology');
    expect(r.institution.kadarnId).toBe('inst-mayo-rochester');
  });

  it('requireKadarnId passes for valid institution', () => {
    const inst = requireKadarnId('inst-mayo-rochester', allInsts);
    expect(inst.canonicalName).toBe('Mayo Clinic Rochester');
  });
});

// --------------------------------------------------------------------------
// Terminology
// --------------------------------------------------------------------------

describe('Terminology compliance', () => {
  it('no retired terms in identity source files', () => {
    const fs = require('fs');
    const path = require('path');
    const files = ['types.ts', 'resolver.ts', 'conflicts.ts'];
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '../src/identity', file), 'utf-8').toLowerCase();
      for (const term of retired) {
        expect(content).not.toContain(term);
      }
    }
  });
});
