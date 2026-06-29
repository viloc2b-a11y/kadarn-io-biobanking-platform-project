// ==========================================================================
// Sprint 10 — Knowledge Fabric: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KnowledgeService,
  InMemoryKnowledgeAdapter,
  expandQuery,
  mapToExternal,
  normalizeTerm,
} from '../../packages/knowledge-engine/src/index';
import { GraphQueryService } from '../../packages/graph-query/src/service';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const ROOT_PKG = path.join(REPO_ROOT, 'package.json');
const MIGRATION = path.join(REPO_ROOT, 'database/migrations/040_knowledge_fabric.sql');

const FIXTURE_TERMS = [
  {
    id: 'term-wb',
    vocabulary: 'specimen_type' as const,
    preferredLabel: 'whole_blood',
    displayName: 'Whole Blood',
    sortOrder: 1,
  },
  {
    id: 'term-plasma',
    vocabulary: 'specimen_type' as const,
    preferredLabel: 'plasma',
    displayName: 'Plasma',
    parentId: 'term-wb',
    sortOrder: 2,
  },
];

const FIXTURE_SYNONYMS = [
  { id: 'syn-1', termId: 'term-wb', synonym: 'WB', isAbbreviation: true },
  { id: 'syn-2', termId: 'term-wb', synonym: 'blood', isAbbreviation: false },
];

const FIXTURE_MAPPINGS = [
  {
    id: 'map-1',
    termId: 'term-wb',
    codingSystem: 'loinc' as const,
    externalCode: '1234-5',
  },
];

describe('Sprint 10 — version and migration', () => {
  it('platform version is hardening.10', () => {
    const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf-8')) as { version: string };
    expect(pkg.version).toMatch(/hardening\.(10|11)/);
  });

  it('migration 040 adds knowledge fabric tables and semantic search RPC', () => {
    const sql = fs.readFileSync(MIGRATION, 'utf-8');
    expect(sql).toContain('knowledge_entity_links');
    expect(sql).toContain('ontology_term_candidates');
    expect(sql).toContain('knowledge_expanded_terms');
    expect(sql).toContain('discovery_search_semantic');
  });
});

describe('Sprint 10 — knowledge engine runtime', () => {
  it('expands queries with synonyms and hierarchy children', () => {
    const expansion = expandQuery('whole_blood', FIXTURE_TERMS, FIXTURE_SYNONYMS, 'specimen_type');
    expect(expansion.expanded).toContain('whole_blood');
    expect(expansion.expanded).toContain('WB');
    expect(expansion.expanded).toContain('plasma');
  });

  it('normalizes abbreviations via KnowledgeService', async () => {
    const service = new KnowledgeService(
      new InMemoryKnowledgeAdapter(FIXTURE_TERMS, FIXTURE_SYNONYMS, FIXTURE_MAPPINGS),
    );
    const result = await service.normalize('specimen_type', 'WB');
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('whole_blood');
  });

  it('maps ontology terms to external coding systems', () => {
    const mappings = mapToExternal('term-wb', FIXTURE_MAPPINGS, 'loinc');
    expect(mappings).toHaveLength(1);
    expect(mappings[0]?.externalCode).toBe('1234-5');
  });

  it('passes through unknown terms with zero confidence', () => {
    const result = normalizeTerm('specimen_type', 'unknown_type', FIXTURE_TERMS, FIXTURE_SYNONYMS);
    expect(result.found).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

describe('Sprint 10 — graph query fabric', () => {
  it('composes knowledge expansion into supplier matching', async () => {
    const graph = new GraphQueryService({
      getProvenanceLineage: async () => ({
        specimenId: 's1',
        ancestors: [],
        descendants: [],
        edges: [],
        evidence: [],
      }),
      getEvidenceForShipment: async () => [],
      getOrganizationTrust: async orgId => ({
        organizationId: orgId,
        operationalScore: 0.8,
        regulatoryScore: 0.8,
        financialScore: 0.8,
        technicalScore: 0.8,
        overallScore: 0.8,
        trajectory: [],
      }),
      normalizeAndExpand: async (term, vocabulary) => ({
        originalTerm: term,
        normalizedTerm: 'whole_blood',
        synonyms: ['WB', 'blood'],
        vocabulary,
        externalCodes: [],
      }),
      findOrganizationsByCapability: async () => [
        { id: 'org-1', name: 'Biobank A' },
      ],
    });

    const matches = await graph.matchingSuppliers({
      specimenType: 'WB',
      minTrustScore: 0.5,
      requiredCapabilities: ['biobank'],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchReasons.join(' ')).toContain('WB');
  });
});

describe('Sprint 10 — orchestrator and API wiring', () => {
  it('stage handlers use knowledge and graph fabric runtimes', () => {
    const handlers = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/orchestration/stage-handlers.ts'),
      'utf-8',
    );
    expect(handlers).toContain('runKnowledgeFabricStage');
    expect(handlers).toContain('runDiscoveryFabricStage');
    expect(handlers).toContain('enrichTwinWithKnowledge');
    expect(handlers).not.toContain('expandQuery(term, [], [])');
  });

  it('event runtime auto-ingests knowledge from domain events', () => {
    const runtime = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/event-runtime.ts'),
      'utf-8',
    );
    expect(runtime).toContain('ingestKnowledgeFromEvent');
    expect(runtime).toContain('SupplyItemCreated');
  });

  it('discovery route uses semantic search helper', () => {
    const route = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/app/api/v1/discovery/route.ts'),
      'utf-8',
    );
    expect(route).toContain('semanticDiscoverySearch');
  });

  it('domain events include knowledge fabric events', () => {
    const events = fs.readFileSync(
      path.join(REPO_ROOT, 'packages/domain-events/src/index.ts'),
      'utf-8',
    );
    expect(events).toContain('TermNormalizationRecorded');
    expect(events).toContain('KnowledgeEntityLinked');
  });
});
