// ==========================================================================
// Contract mapper — engine runtime types → frozen @kadarn/types/phase8 contracts
// Sprint 28A. Domain Freeze boundary.
// ==========================================================================

import type {
  Source as ContractSource,
  SourceType,
  SourceVersion as ContractSourceVersion,
  Artifact as ContractArtifact,
  ExtractionRun as ContractExtractionRun,
  ExtractedFact as ContractExtractedFact,
} from '@kadarn/types/phase8'

import type {
  Source,
  SourceVersion,
  LineageArtifact,
  ExtractionRun,
  ExtractedFact,
  LineageResult,
  EvidenceLineage,
} from './types.js'

function mapSourceType(engineType: Source['sourceType']): SourceType {
  switch (engineType) {
    case 'upload':
      return 'uploaded_document'
    case 'connector':
      return 'connector_record'
    case 'api':
      return 'other'
    case 'internal':
      return 'other'
    default:
      return 'other'
  }
}

export function toContractSource(
  source: Source,
  orgId: string,
): ContractSource {
  return {
    source_id: source.sourceId,
    source_type: mapSourceType(source.sourceType),
    provider_ref: source.providerId,
    org_id: orgId,
    external_url: source.sourceUrl,
    created_at: source.acquiredAt,
  }
}

export function toContractSourceVersion(
  sv: SourceVersion,
  connectorId: string,
  contentHash: string,
): ContractSourceVersion {
  return {
    source_version_id: sv.sourceVersionId,
    source_id: sv.sourceId,
    content_hash: contentHash,
    ingested_at: sv.ingestedAt,
    connector_id: connectorId,
    correlation_id: sv.sourceVersionId,
  }
}

export function toContractArtifact(artifact: LineageArtifact): ContractArtifact {
  return {
    artifact_id: artifact.artifactId,
    source_version_id: artifact.sourceVersionId,
    storage_ref: artifact.documentArtifact.filePath,
    mime_type: artifact.documentArtifact.mimeType,
    byte_size: artifact.documentArtifact.sizeBytes,
    created_at: artifact.registeredAt,
  }
}

export function toContractExtractionRun(run: ExtractionRun): ContractExtractionRun {
  return {
    run_id: run.extractionRunId,
    artifact_id: run.artifactId,
    parser_version: run.parserVersion,
    model_version: run.modelVersion ?? run.modelName ?? 'unknown',
    pipeline_version: `${run.parserName}@${run.parserVersion}`,
    started_at: run.startedAt,
    completed_at: run.completedAt,
    status: 'completed',
    correlation_id: run.extractionRunId,
  }
}

export function toContractExtractedFact(
  fact: ExtractedFact,
  sourceVersionId: string,
): ContractExtractedFact {
  const value =
    typeof fact.content.statement === 'string'
      ? fact.content.statement
      : typeof fact.content.name === 'string'
        ? fact.content.name
        : JSON.stringify(fact.content)

  return {
    fact_id: fact.factId,
    extraction_run_id: fact.extractionRunId,
    value,
    semantic_type: fact.factType,
    span: {
      address_type: 'byte_span',
      address_value: `line:${fact.offset.startLine}-${fact.offset.endLine}`,
      source_version_id: sourceVersionId,
    },
    created_at: fact.extractedAt,
  }
}

export interface ContractLineageBundle {
  source: ContractSource
  sourceVersion: ContractSourceVersion
  artifact: ContractArtifact
  extractionRun: ContractExtractionRun
  facts: ContractExtractedFact[]
}

/** Map a full engine lineage result to frozen Phase 8 contract shapes. */
export function toContractLineage(
  result: LineageResult,
  orgId: string,
): ContractLineageBundle {
  const { lineage, facts } = result
  const contentHash = lineage.artifact.documentArtifact.sha256
  const connectorId = lineage.source.providerId

  return {
    source: toContractSource(lineage.source, orgId),
    sourceVersion: toContractSourceVersion(
      lineage.sourceVersion,
      connectorId,
      contentHash,
    ),
    artifact: toContractArtifact(lineage.artifact),
    extractionRun: toContractExtractionRun(lineage.extractionRun),
    facts: facts.map(f =>
      toContractExtractedFact(f, lineage.sourceVersion.sourceVersionId),
    ),
  }
}

/** Validate contract completeness gates for Sprint 28B. */
export function assertContractLineageComplete(bundle: ContractLineageBundle): void {
  if (!bundle.source.source_id) throw new Error('contract: missing source_id')
  if (!bundle.sourceVersion.content_hash) throw new Error('contract: missing content_hash')
  if (!bundle.extractionRun.parser_version) throw new Error('contract: missing parser_version')
  for (const fact of bundle.facts) {
    if (!fact.span.source_version_id) {
      throw new Error(`contract: fact ${fact.fact_id} missing span.source_version_id`)
    }
    if (!fact.span.address_value) {
      throw new Error(`contract: fact ${fact.fact_id} missing span.address_value`)
    }
  }
}

export type { EvidenceLineage, LineageResult }
