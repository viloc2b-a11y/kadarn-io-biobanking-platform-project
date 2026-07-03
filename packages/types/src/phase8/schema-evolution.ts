// ==========================================================================
// Phase 8 Contracts — Schema evolution (28I)
// KEMS-005 draft
// ==========================================================================

import type {
  CompatibilityContractType,
  IsoDateTime,
  SchemaVersionStatus,
} from './common.js'

export interface ClaimTypeDefinition {
  claim_type_id: string
  domain: string
  display_name: string
  description: string
  current_schema_version: string
  evidence_classes: string[]
  status: SchemaVersionStatus
}

export interface CompatibilityContract {
  from_version: string
  to_version: string
  contract_type: CompatibilityContractType
}

export interface SchemaVersion {
  schema_version_id: string
  claim_type_id: string
  version: string
  json_schema: Record<string, unknown>
  compatibility: CompatibilityContract[]
  published_at: IsoDateTime
  supersedes_version?: string
  changelog: string
}

export interface CanonicalClaimViewModel {
  claim_type_id: string
  claim_instance_id: string
  claim_version_id: string
  schema_version: string
  subject_entity_id: string
  summary: string
  attributes: Record<string, CanonicalAttributeValue>
  evidence_refs: string[]
  lifecycle_state: string
  adapter_version: string
}

export type CanonicalAttributeValue =
  | string
  | number
  | boolean
  | null
  | CanonicalAttributeValue[]
  | { [key: string]: CanonicalAttributeValue }

export interface ReadAdapterRegistration {
  adapter_id: string
  schema_version_id: string
  adapter_version: string
  adapter_type: 'canonicalizer' | 'upcaster' | 'rule_replay_helper'
  entrypoint: string
}

export type MigrationRuleType =
  | 'field_rename'
  | 'field_map'
  | 'default_inject'
  | 'split'
  | 'merge'

export interface MigrationRule {
  migration_rule_id: string
  from_schema_version: string
  to_schema_version: string
  rule_type: MigrationRuleType
  mapping: Record<string, unknown>
  requires_review: boolean
}
