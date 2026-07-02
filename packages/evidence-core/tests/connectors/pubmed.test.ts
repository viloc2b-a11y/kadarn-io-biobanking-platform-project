// ==========================================================================
// PubMed Connector — Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
// PubMed = strong scientific evidence, weak institutional identity.
// Affiliation-only matches go to staging.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { ingestPubMed, createMockPubMedClient, mapArticleToClaims } from '../../src/index.js';
import type { PubMedArticle } from '../../src/index.js';
import type { IdentityResolver, EvidenceNodeCreator, Stager, DuplicateChecker } from '../../src/index.js';
import type { InstitutionIdentity, SiteIdentity } from '../../src/index.js';

// --------------------------------------------------------------------------
// Sample articles
// --------------------------------------------------------------------------

function makeArticle(overrides: Partial<PubMedArticle> = {}): PubMedArticle {
  return {
    pmid: overrides.pmid ?? '12345678',
    title: overrides.title ?? 'A Clinical Study of Drug X in Cancer Patients',
    journal: overrides.journal ?? 'Journal of Clinical Oncology',
    publicationDate: overrides.publicationDate ?? '2025-06-01',
    authors: overrides.authors ?? ['J. Smith', 'M. Johnson'],
    affiliations: overrides.affiliations ?? ['Mayo Clinic, Rochester, MN'],
    doi: overrides.doi ?? '10.1000/xyz123',
    meshTerms: overrides.meshTerms ?? ['Neoplasms', 'Drug Therapy'],
    publicationType: overrides.publicationType ?? ['Clinical Trial'],
    referencesClinicalStudy: overrides.referencesClinicalStudy ?? true,
    rawPayload: overrides.rawPayload ?? { pmid: '12345678' },
    externalUrl: overrides.externalUrl ?? `https://pubmed.ncbi.nlm.nih.gov/${overrides.pmid ?? '12345678'}/`,
  };
}

// --------------------------------------------------------------------------
// Mock dependencies
// --------------------------------------------------------------------------

function createMockDeps(knownInstitutions: InstitutionIdentity[], knownSites: SiteIdentity[]) {
  const createdEvidence: any[] = [];
  const stagedRecords: any[] = [];
  const ingestedPmids = new Set<string>();
  let resolveCallCount = 0;

  const identityResolver: IdentityResolver = {
    async resolve(params) {
      resolveCallCount++;
      // Match by checking if the affiliation string mentions the institution name
      const inst = knownInstitutions.find(i =>
        params.name.toLowerCase().includes(i.canonicalName.toLowerCase().split(' ')[0].toLowerCase()),
      );

      if (!inst) {
        return { institution: null, site: null, resolutionTier: null, unresolved: null, identityConfidence: 'low', explanation: 'No match' };
      }

      const site = knownSites.find(s => s.kadarnId === inst.kadarnId);

      // First 2 calls: return high confidence
      if (resolveCallCount <= 2) {
        return {
          institution: inst,
          site: site ?? null,
          resolutionTier: 1,
          unresolved: null,
          identityConfidence: 'high',
          explanation: 'Mock high-confidence match',
        };
      }

      return {
        institution: inst,
        site: site ?? null,
        resolutionTier: 2,
        unresolved: null,
        identityConfidence: 'medium',
        explanation: 'Mock medium-confidence match (affiliation-only)',
      };
    },
  };

  const evidenceCreator: EvidenceNodeCreator = {
    async createEvidenceNode(params) {
      const id = `ev-pubmed-${params.externalUrl?.split('/').pop() ?? Date.now()}`;
      createdEvidence.push({ id, ...params });
      return { id };
    },
  };

  const stager: Stager = {
    async stage(params) {
      const stagingId = `staging-pubmed-${params.externalId}-${Date.now()}`;
      stagedRecords.push({ stagingId, ...params });
      return { stagingId };
    },
  };

  const duplicateChecker: DuplicateChecker = {
    async isDuplicate(pmid) {
      if (ingestedPmids.has(pmid)) return true;
      ingestedPmids.add(pmid);
      return false;
    },
  };

  return { identityResolver, evidenceCreator, stager, duplicateChecker, createdEvidence, stagedRecords };
}

// --------------------------------------------------------------------------
// Sample identities
// --------------------------------------------------------------------------

const mayoInst: InstitutionIdentity = {
  kadarnId: 'inst-mayo', canonicalName: 'Mayo Clinic Rochester', institutionType: 'hospital', active: true,
  externalIds: [{ type: 'fei', value: 'FEI-12345', label: 'FEI', confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }],
  aliases: [], resolvedAtTier: null, status: 'active',
  address: { city: 'Rochester', state: 'MN', country: 'US' },
  identityCreatedBy: 'system', identitySource: 'test', identityLastVerified: null, identityVersion: 1,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', mergedInto: null,
};

const mayoOncology: SiteIdentity = {
  siteId: 'site-mayo-oncology', kadarnId: 'inst-mayo', siteName: 'Oncology Research Unit',
  siteType: 'research_unit', status: 'active', identityConfidence: 'high',
  address: { city: 'Rochester', state: 'MN', country: 'US' },
  createdBy: 'system', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('PubMed connector — successful ingestion', () => {
  it('ingests article with high-confidence identity resolution', async () => {
    const articles = [makeArticle({ pmid: '10000001' })];
    const client = createMockPubMedClient(articles);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    const result = await ingestPubMed(client, { institutionName: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'actor-1', organizationId: 'org-1', correlationId: 'corr-pubmed-1',
    });

    expect(result.totalFound).toBe(1);
    expect(result.ingested.length).toBeGreaterThanOrEqual(1);
    expect(result.staged.length).toBe(0);
    expect(deps.createdEvidence.length).toBeGreaterThan(0);

    const ev = deps.createdEvidence[0];
    expect(ev.evidenceClass).toBe('A');
    expect(ev.source).toBe('pubmed');
    expect(ev.externalUrl).toContain('pubmed.ncbi.nlm.nih.gov');
  });

  it('preserves provenance', async () => {
    const articles = [makeArticle({ pmid: '10000002' })];
    const client = createMockPubMedClient(articles);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    await ingestPubMed(client, { institutionName: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'actor-prov', organizationId: 'org-prov', correlationId: 'corr-prov',
    });

    const ev = deps.createdEvidence[0];
    expect(ev.provenance.createdByActorId).toBe('actor-prov');
    expect(ev.source).toBe('pubmed');
  });
});

describe('PubMed connector — affiliation-only staging', () => {
  it('stages articles with medium/low identity confidence', async () => {
    const articles = [makeArticle({ pmid: '20000001', affiliations: ['Some Unknown Research Institute, Springfield, IL'] })];
    const client = createMockPubMedClient(articles);

    const identityResolver: IdentityResolver = {
      async resolve() {
        return {
          institution: null, site: null, resolutionTier: null, unresolved: null,
          identityConfidence: 'low', explanation: 'No match for unknown institution',
        };
      },
    };
    const evidenceCreator: EvidenceNodeCreator = {
      async createEvidenceNode(p) { return { id: `ev-${p.externalUrl?.split('/').pop()}` }; },
    };
    const stager: Stager = {
      async stage(p) { return { stagingId: `staging-${p.externalId}` }; },
    };
    const duplicateChecker: DuplicateChecker = {
      async isDuplicate() { return false; },
    };

    const result = await ingestPubMed(client, { institutionName: 'Unknown Research Institute' }, {
      identityResolver, evidenceCreator, stager, duplicateChecker,
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.ingested.length).toBe(0);
    expect(result.staged.length).toBe(1);
  });
});

describe('PubMed connector — deduplication', () => {
  it('skips duplicate PMIDs', async () => {
    const articles = [
      makeArticle({ pmid: '30000001' }),
      makeArticle({ pmid: '30000001' }),
    ];
    const client = createMockPubMedClient(articles);
    const deps = createMockDeps([mayoInst], [mayoOncology]);

    const result = await ingestPubMed(client, { institutionName: 'Mayo Clinic' }, {
      ...deps,
      actorId: 'a', organizationId: 'o', correlationId: 'c',
    });

    expect(result.duplicatesSkipped).toBe(1);
  });
});

describe('PubMed — Claim mapping', () => {
  it('maps any article to publication history', () => {
    const article = makeArticle({ title: 'Basic science research' });
    const mappings = mapArticleToClaims(article);
    expect(mappings.length).toBeGreaterThanOrEqual(1);
  });

  it('maps clinical study articles to study completion history', () => {
    const article = makeArticle({
      publicationType: ['Randomized Controlled Trial'],
      referencesClinicalStudy: true,
    });
    const mappings = mapArticleToClaims(article);
    const clinicalMappings = mappings.filter(m => m.claimTypeId.includes('study_completion_history'));
    expect(clinicalMappings.length).toBeGreaterThanOrEqual(1);
  });

  it('does not map biospecimen Claims without explicit mentions', () => {
    const article = makeArticle({
      title: 'Cardiovascular outcomes in elderly patients',
      meshTerms: ['Cardiology', 'Hypertension'],
      publicationType: ['Journal Article'],
      referencesClinicalStudy: false,
    });
    const mappings = mapArticleToClaims(article);
    const bioMappings = mappings.filter(m => m.claimTypeId.startsWith('biospecimen.processing'));
    expect(bioMappings.length).toBe(0);
  });
});

describe('No forbidden operations', () => {
  it('no confidence or AI functions in pipeline', async () => {
    const pipeline = await import('../../src/connectors/pubmed/pipeline.js');
    const forbidden = ['computeConfidence', 'calculateConfidence', 'scoreInstitution',
      'rankSite', 'recommendSite', 'inferCapability', 'generateJudgment'];
    for (const fn of forbidden) {
      expect((pipeline as any)[fn]).toBeUndefined();
    }
  });

  it('no retired terminology in connector', () => {
    const fs = require('fs');
    const path = require('path');
    const files = ['types.ts', 'client.ts', 'pipeline.ts', 'claim-mapper.ts'];
    const retired = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const file of files) {
      const content = fs.readFileSync(path.resolve(__dirname, '../../src/connectors/pubmed', file), 'utf-8').toLowerCase();
      for (const term of retired) {
        expect(content).not.toContain(term);
      }
    }
  });
});
