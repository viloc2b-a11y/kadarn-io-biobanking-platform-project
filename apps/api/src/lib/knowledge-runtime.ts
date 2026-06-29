// ==========================================================================
// Knowledge Fabric Runtime — Supabase-backed automatic knowledge feeding
// ==========================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  KnowledgeService,
  InMemoryKnowledgeAdapter,
  type KnowledgeAdapter,
  type VocabularySet,
  type VocabularySnapshot,
  type NormalizationResult,
  type CodingSystem,
  ALL_VOCABULARIES,
} from '@kadarn/knowledge-engine';
import { match } from '@kadarn/matching-engine';
import { createServiceClient } from '@/lib/service-client';
import { publishIntegrationEvent } from '@/lib/event-runtime';

type TermRow = {
  id: string;
  vocabulary: VocabularySet;
  preferred_label: string;
  display_name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number | null;
};

type SynonymRow = {
  id: string;
  term_id: string;
  synonym: string;
  source: string | null;
  is_abbreviation: boolean;
};

type MappingRow = {
  id: string;
  term_id: string;
  coding_system: string;
  external_code: string;
  external_label: string | null;
};

export interface KnowledgeFabricContext {
  actorId: string;
  organizationId?: string | null;
  correlationId: string;
}

const snapshotCache = new Map<VocabularySet, { snapshot: VocabularySnapshot; loadedAt: number }>();
const CACHE_TTL_MS = 60_000;

class SupabaseKnowledgeAdapter implements KnowledgeAdapter {
  constructor(private readonly client: SupabaseClient) {}

  async getTermsByVocabulary(vocabulary: VocabularySet) {
    const { data, error } = await this.client
      .from('ontology_terms')
      .select('id, vocabulary, preferred_label, display_name, description, parent_id, sort_order')
      .eq('vocabulary', vocabulary)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTermRow);
  }

  async getSynonymsForTerms(termIds: string[]) {
    if (termIds.length === 0) return [];
    const { data, error } = await this.client
      .from('ontology_synonyms')
      .select('id, term_id, synonym, source, is_abbreviation')
      .in('term_id', termIds);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapSynonymRow);
  }

  async getMappingsForTerms(termIds: string[]) {
    if (termIds.length === 0) return [];
    const { data, error } = await this.client
      .from('ontology_mappings')
      .select('id, term_id, coding_system, external_code, external_label')
      .in('term_id', termIds);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapMappingRow);
  }

  async getTermByPreferredLabel(vocabulary: VocabularySet, label: string) {
    const { data } = await this.client
      .from('ontology_terms')
      .select('id, vocabulary, preferred_label, display_name, description, parent_id, sort_order')
      .eq('vocabulary', vocabulary)
      .eq('preferred_label', label)
      .maybeSingle();

    return data ? mapTermRow(data as TermRow) : null;
  }

  async getSynonyms(termId: string) {
    return this.getSynonymsForTerms([termId]);
  }

  async getChildren(termId: string) {
    const { data, error } = await this.client
      .from('ontology_terms')
      .select('id, vocabulary, preferred_label, display_name, description, parent_id, sort_order')
      .eq('parent_id', termId);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTermRow);
  }

  async getMappings(termId: string) {
    return this.getMappingsForTerms([termId]);
  }

  async findTermBySynonym(vocabulary: VocabularySet, synonym: string) {
    const { data } = await this.client
      .from('ontology_synonyms')
      .select('term_id, ontology_terms!inner(id, vocabulary, preferred_label, display_name, description, parent_id, sort_order)')
      .eq('synonym', synonym)
      .eq('ontology_terms.vocabulary', vocabulary)
      .maybeSingle();

    if (!data?.ontology_terms) return null;
    const term = Array.isArray(data.ontology_terms) ? data.ontology_terms[0] : data.ontology_terms;
    return mapTermRow(term as TermRow);
  }

  async fuzzySearch(vocabulary: VocabularySet, query: string) {
    const { data, error } = await this.client
      .from('ontology_terms')
      .select('id, vocabulary, preferred_label, display_name, description, parent_id, sort_order')
      .eq('vocabulary', vocabulary)
      .ilike('preferred_label', `%${query}%`);

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTermRow);
  }
}

function mapTermRow(row: TermRow) {
  return {
    id: row.id,
    vocabulary: row.vocabulary,
    preferredLabel: row.preferred_label,
    displayName: row.display_name,
    description: row.description ?? undefined,
    parentId: row.parent_id ?? undefined,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapSynonymRow(row: SynonymRow) {
  return {
    id: row.id,
    termId: row.term_id,
    synonym: row.synonym,
    source: row.source ?? undefined,
    isAbbreviation: row.is_abbreviation,
  };
}

function mapMappingRow(row: MappingRow) {
  return {
    id: row.id,
    termId: row.term_id,
    codingSystem: row.coding_system as CodingSystem,
    externalCode: row.external_code,
    externalLabel: row.external_label ?? undefined,
  };
}

let knowledgeService: KnowledgeService | null = null;

export function getKnowledgeService(): KnowledgeService {
  if (knowledgeService) return knowledgeService;

  const client = createServiceClient();
  const adapter: KnowledgeAdapter = client
    ? new SupabaseKnowledgeAdapter(client)
    : new InMemoryKnowledgeAdapter();

  knowledgeService = new KnowledgeService(adapter);
  return knowledgeService;
}

export function resetKnowledgeRuntime(): void {
  knowledgeService = null;
  snapshotCache.clear();
}

async function getCachedSnapshot(vocabulary: VocabularySet): Promise<VocabularySnapshot> {
  const cached = snapshotCache.get(vocabulary);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  const snapshot = await getKnowledgeService().loadVocabulary(vocabulary);
  snapshotCache.set(vocabulary, { snapshot, loadedAt: Date.now() });
  return snapshot;
}

export async function expandSearchTerms(
  query: string,
  vocabulary: VocabularySet = 'specimen_type',
): Promise<string[]> {
  if (!query.trim()) return [];
  const snapshot = await getCachedSnapshot(vocabulary);
  const expansion = await getKnowledgeService().expand(vocabulary, query, snapshot);
  return expansion.expanded;
}

export async function runKnowledgeFabricStage(
  ctx: KnowledgeFabricContext,
  payload: Record<string, unknown>,
): Promise<{ expandedTerms: string[]; normalizations: NormalizationResult[] }> {
  const query = String(payload.title ?? payload.programName ?? payload.query ?? payload.specimenType ?? '');
  if (!query.trim()) return { expandedTerms: [], normalizations: [] };

  const vocabularies = resolveVocabularies(payload);
  const normalizations: NormalizationResult[] = [];
  const expandedTerms = new Set<string>();

  for (const vocabulary of vocabularies) {
    const snapshot = await getCachedSnapshot(vocabulary);
    const terms = extractTermsForVocabulary(payload, vocabulary, query);

    for (const term of terms) {
      const normalized = await getKnowledgeService().normalize(vocabulary, term, snapshot);
      normalizations.push(normalized);

      const expansion = await getKnowledgeService().expand(vocabulary, term, snapshot);
      expansion.expanded.forEach(value => expandedTerms.add(value));

      await persistNormalization(ctx, {
        entityType: String(payload.entityType ?? inferEntityType(payload)),
        entityId: String(payload.entityId ?? payload.specimenId ?? payload.supplyItemId ?? payload.collectionId ?? ctx.correlationId),
        vocabulary,
        originalValue: term,
        normalization: normalized,
        snapshot,
      });
    }
  }

  publishIntegrationEvent(
    'DiscoveryContextEnriched',
    {
      query,
      expandedTerms: [...expandedTerms],
      organizationId: ctx.organizationId,
      pipeline: payload.pipeline as string | undefined,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `KnowledgeExpanded:${ctx.correlationId}`,
    },
  );

  for (const normalization of normalizations) {
    if (!normalization.found) continue;
    publishIntegrationEvent(
      'TermNormalizationRecorded',
      {
        entityType: String(payload.entityType ?? inferEntityType(payload)),
        entityId: String(payload.entityId ?? payload.specimenId ?? payload.supplyItemId ?? ctx.correlationId),
        vocabulary: normalization.vocabulary,
        originalTerm: normalization.original,
        normalizedTerm: normalization.normalized,
        confidence: normalization.confidence,
        organizationId: ctx.organizationId,
      },
      {
        actorId: ctx.actorId,
        organizationId: ctx.organizationId,
        correlationId: ctx.correlationId,
        idempotencyKey: `TermNormalizationRecorded:${normalization.original}:${ctx.correlationId}`,
      },
    );
  }

  return { expandedTerms: [...expandedTerms], normalizations };
}

export async function runDiscoveryFabricStage(
  ctx: KnowledgeFabricContext,
  payload: Record<string, unknown>,
  pipeline?: string,
): Promise<{ matchCount: number; expandedTerms: string[] }> {
  const query = String(payload.title ?? payload.query ?? payload.programName ?? '');
  if (!query.trim()) return { matchCount: 0, expandedTerms: [] };

  const knowledge = await runKnowledgeFabricStage(ctx, { ...payload, pipeline });
  const sampleTypes = payload.sampleTypes;
  const specimenType = Array.isArray(sampleTypes) ? String(sampleTypes[0]) : String(payload.specimenType ?? '');

  const expandedTerms = [...new Set([...knowledge.expandedTerms, ...(specimenType ? [specimenType] : [])])];

  const adapter = {
    searchSpecimens: async () => {
      const client = createServiceClient();
      if (!client) return [];

      const { data, error } = await client.rpc('discovery_search_semantic', {
        p_search_text: query,
        p_sample_types: specimenType ? [specimenType] : null,
        p_disease_icd10: (payload.diseaseIcd10 as string | undefined) ?? null,
        p_expanded_terms: expandedTerms.length > 0 ? expandedTerms : null,
        p_limit: 5,
        p_offset: 0,
      });

      if (error || !data) return [];

      return (data as Array<{ id: string; title: string; organization_id: string; search_rank?: number }>).map(row => ({
        specimenId: row.id,
        collectionId: row.id,
        organizationId: row.organization_id,
        score: Number(row.search_rank ?? 0),
        matchReasons: [`Discovery match: ${row.title}`],
      }));
    },
  };

  const matches = await match(adapter, {
    diagnosis: payload.diseaseIcd10 as string | undefined,
    specimenType: specimenType || undefined,
    maxResults: 5,
  }).catch(() => []);

  publishIntegrationEvent(
    'DiscoveryContextEnriched',
    {
      query,
      expandedTerms,
      matchCount: matches.length,
      organizationId: ctx.organizationId,
      pipeline,
    },
    {
      actorId: ctx.actorId,
      organizationId: ctx.organizationId,
      correlationId: ctx.correlationId,
      idempotencyKey: `DiscoveryContextEnriched:${ctx.correlationId}:${query.slice(0, 32)}`,
    },
  );

  return { matchCount: matches.length, expandedTerms };
}

export async function ingestKnowledgeFromEvent(
  eventType: string,
  payload: Record<string, unknown>,
  ctx: KnowledgeFabricContext,
): Promise<void> {
  switch (eventType) {
    case 'SupplyItemCreated':
      await ingestSupplyItem(ctx, payload);
      break;
    case 'FeasibilityAssessmentCompleted':
      await runKnowledgeFabricStage(ctx, {
        entityType: 'feasibility_assessment',
        entityId: payload.assessmentId,
        programName: payload.programName,
        pipeline: 'feasibility',
      });
      break;
    case 'CollectionCreated':
      await runKnowledgeFabricStage(ctx, {
        entityType: 'collection',
        entityId: payload.collectionId,
        title: payload.name,
        pipeline: 'collection-twin',
      });
      break;
    case 'QcCompleted':
      await runKnowledgeFabricStage(ctx, {
        entityType: 'qc_result',
        entityId: payload.aliquotId,
        query: payload.qcStatus,
        pipeline: 'qc',
      });
      break;
    default:
      break;
  }
}

async function ingestSupplyItem(ctx: KnowledgeFabricContext, payload: Record<string, unknown>): Promise<void> {
  const supplyItemId = String(payload.supplyItemId ?? '');
  if (!supplyItemId) return;

  const sampleTypes = Array.isArray(payload.sampleTypes)
    ? payload.sampleTypes.map(String)
    : [];

  const result = await runKnowledgeFabricStage(ctx, {
    entityType: 'supply_item',
    entityId: supplyItemId,
    title: payload.title,
    sampleTypes,
    diseaseLabel: payload.diseaseLabel,
    pipeline: 'supply-item',
  });

  const client = createServiceClient();
  if (client && result.expandedTerms.length > 0) {
    await client
      .from('supply_items')
      .update({ knowledge_expanded_terms: result.expandedTerms })
      .eq('id', supplyItemId);
  }
}

async function persistNormalization(
  ctx: KnowledgeFabricContext,
  input: {
    entityType: string;
    entityId: string;
    vocabulary: VocabularySet;
    originalValue: string;
    normalization: NormalizationResult;
    snapshot: VocabularySnapshot;
  },
): Promise<void> {
  const client = createServiceClient();
  if (!client) return;

  const term = input.snapshot.terms.find(
    item => item.preferredLabel === input.normalization.normalized,
  );
  const entityId = isUuid(input.entityId) ? input.entityId : null;

  if (input.normalization.found && term && entityId) {
    await client.from('knowledge_entity_links').upsert(
      {
        entity_type: input.entityType,
        entity_id: entityId,
        term_id: term.id,
        vocabulary: input.vocabulary,
        original_value: input.originalValue,
        normalized_label: input.normalization.normalized,
        confidence: input.normalization.confidence,
        correlation_id: ctx.correlationId,
      },
      { onConflict: 'entity_type,entity_id,vocabulary,original_value' },
    );

    publishIntegrationEvent(
      'KnowledgeEntityLinked',
      {
        entityType: input.entityType,
        entityId,
        termId: term.id,
        vocabulary: input.vocabulary,
        normalizedLabel: input.normalization.normalized,
        organizationId: ctx.organizationId,
      },
      {
        actorId: ctx.actorId,
        organizationId: ctx.organizationId,
        correlationId: ctx.correlationId,
        idempotencyKey: `KnowledgeEntityLinked:${input.entityType}:${entityId}:${term.id}`,
      },
    );
  } else if (input.originalValue.trim()) {
    await client.rpc('record_ontology_term_candidate', {
      p_vocabulary: input.vocabulary,
      p_candidate_term: input.originalValue,
      p_source_entity_type: input.entityType,
      p_source_entity_id: entityId,
    });
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveVocabularies(payload: Record<string, unknown>): VocabularySet[] {
  if (payload.specimenType || payload.sampleTypes) return ['specimen_type'];
  if (payload.diseaseLabel || payload.diseaseIcd10) return ['diagnosis', 'specimen_type'];
  if (payload.qcStatus) return ['processing_method'];
  return ['specimen_type', 'diagnosis'];
}

function extractTermsForVocabulary(
  payload: Record<string, unknown>,
  vocabulary: VocabularySet,
  fallback: string,
): string[] {
  const terms = new Set<string>();

  if (vocabulary === 'specimen_type') {
    if (payload.specimenType) terms.add(String(payload.specimenType));
    if (Array.isArray(payload.sampleTypes)) {
      payload.sampleTypes.forEach(value => terms.add(String(value)));
    }
  }

  if (vocabulary === 'diagnosis') {
    if (payload.diseaseLabel) terms.add(String(payload.diseaseLabel));
    if (payload.diseaseIcd10) terms.add(String(payload.diseaseIcd10));
    if (payload.programName) terms.add(String(payload.programName));
  }

  if (vocabulary === 'processing_method' && payload.qcStatus) {
    terms.add(String(payload.qcStatus));
  }

  if (terms.size === 0 && fallback.trim()) {
    terms.add(fallback);
  }

  return [...terms];
}

function inferEntityType(payload: Record<string, unknown>): string {
  if (payload.specimenId) return 'specimen_twin';
  if (payload.supplyItemId) return 'supply_item';
  if (payload.collectionId) return 'collection';
  if (payload.assessmentId) return 'feasibility_assessment';
  return 'pipeline_entity';
}

export async function semanticDiscoverySearch(
  client: SupabaseClient,
  params: {
    q?: string | null;
    sampleTypes?: string[] | null;
    disease?: string | null;
    types?: string[] | null;
    country?: string | null;
    commercialOnly?: boolean | null;
    limit?: number;
    offset?: number;
  },
) {
  const expandedTerms = params.q ? await expandSearchTerms(params.q) : [];

  const semantic = await client.rpc('discovery_search_semantic', {
    p_search_text: params.q ?? null,
    p_types: params.types ?? null,
    p_sample_types: params.sampleTypes ?? null,
    p_disease_icd10: params.disease ?? null,
    p_country: params.country ?? null,
    p_commercial_only: params.commercialOnly ?? null,
    p_expanded_terms: expandedTerms.length > 0 ? expandedTerms : null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });

  if (!semantic.error) return semantic;

  return client.rpc('discovery_search', {
    p_search_text: params.q ?? null,
    p_types: params.types ?? null,
    p_sample_types: params.sampleTypes ?? null,
    p_disease_icd10: params.disease ?? null,
    p_country: params.country ?? null,
    p_commercial_only: params.commercialOnly ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  });
}

export { ALL_VOCABULARIES };
