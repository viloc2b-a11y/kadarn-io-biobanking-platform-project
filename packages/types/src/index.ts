// ─── Organization & Workspace ────────────────────────────────────────────────
// ─── KAD-002A — Person Entity ───────────────────────────────────────────
export { PersonSchema, CreatePersonSchema, UpdatePersonSchema } from './person'
export type { Person, PersonStatus, CreatePerson, UpdatePerson } from './person'

// ─── KAD-002B — Location Entity ──────────────────────────────────────────
export { LocationSchema, CreateLocationSchema, UpdateLocationSchema } from './location'
export type { Location, LocationType, LocationStatus, CreateLocation, UpdateLocation } from './location'

// ─── KAD-002C — Institution Participation Model ──────────────────────────
export {
  MembershipSchema, CreateMembershipSchema, UpdateMembershipSchema,
  RoleSchema, RoleAssignmentSchema, CreateRoleAssignmentSchema,
  ResolvedPermissionsSchema,
} from './membership'
export type {
  Membership, MembershipStatus, CreateMembership, UpdateMembership,
  Role, RoleScope, RoleAssignment, CreateRoleAssignment,
  ResolvedPermissions,
} from './membership'

// ─── KAD-003 — Capability Model ──────────────────────────────────────────
export { InstitutionCapabilitySchema, CreateInstitutionCapabilitySchema, UpdateInstitutionCapabilitySchema } from './capability'
export type { InstitutionCapability, InstitutionCapabilityStatus, CreateInstitutionCapability, UpdateInstitutionCapability } from './capability'

// ─── KAD-004 — Canonical Claim ─────────────────────────────────────────
export { ClaimSchema, CreateClaimSchema, UpdateClaimSchema } from './claim'
export type { Claim, ClaimStatus, CreateClaim, UpdateClaim, ClaimLegacyType } from './claim'

// ─── KAD-005 — Canonical Evidence & Provenance ─────────────────────────
export {
  EvidenceSchema, CreateEvidenceSchema, UpdateEvidenceSchema,
  ProvenanceRecordSchema,
} from './evidence'
export type {
  Evidence, EvidenceClass, EvidenceStatus, CreateEvidence, UpdateEvidence,
  ProvenanceRecord, ProvenanceAction,
} from './evidence'

// ─── KAD-006 — Review Workflow ─────────────────────────────────────────
export { ReviewSchema, CreateReviewSchema, UpdateReviewSchema } from './review'
export type { Review, ReviewStatus, ReviewDecision, CreateReview, UpdateReview } from './review'

// ─── KAD-007 — Confidence ───────────────────────────────────────────────
export { ConfidenceScoreSchema, ConfidenceStateSnapshotSchema } from './confidence'
export type { ConfidenceScore, ConfidenceLevel, ConfidenceStateSnapshot } from './confidence'

// ─── KAD-008 — Knowledge Publication ─────────────────────────────────────
export { PublishedKnowledgeSchema, CreatePublishedKnowledgeSchema, UpdatePublishedKnowledgeSchema } from './knowledge'
export type { PublishedKnowledge, KnowledgeType, PublicationStatus, CreatePublishedKnowledge } from './knowledge'

// ─── KAD-009 — Passport ───────────────────────────────────────────────────
export { PassportEntrySchema, CreatePassportEntrySchema, PassportShareSchema, GrantPassportAccessSchema } from './passport'
export type { PassportEntry, PassportStatus, PassportShare, AccessLevel, CreatePassportEntry, GrantPassportAccess } from './passport'

// ─── KAD-011 — Readiness ─────────────────────────────────────────────────
export { ReadinessScoreSchema, computeReadinessLevel } from './readiness'
export type { ReadinessScore, ReadinessDimension, ReadinessLevel, ComputeReadinessResponse } from './readiness'

// ─── KADARN v2 — Sprint 1: Evidence Source Intelligence ────────────────
export {
  EvidenceSourceSchema, CreateEvidenceSourceSchema, UpdateEvidenceSourceSchema,
  SourceRecordSchema, CreateSourceRecordSchema,
  SourceType, ProducerType, AuthorityLevel, AcquisitionMethod,
  FreshnessPolicy, AcquisitionStatus,
} from './sources'
export type {
  EvidenceSource, CreateEvidenceSource, UpdateEvidenceSource,
  SourceRecord, CreateSourceRecord,
  SourceType as SourceTypeT, ProducerType as ProducerTypeT,
  AuthorityLevel as AuthorityLevelT, AcquisitionMethod as AcquisitionMethodT,
  FreshnessPolicy as FreshnessPolicyT, AcquisitionStatus as AcquisitionStatusT,
  FreshnessPolicyConfig,
} from './sources'

// ─── Organization & Workspace ────────────────────────────────────────────────

export type OrgType =
  | 'biobank'
  | 'sponsor'
  | 'site'
  | 'laboratory'
  | 'cro'
  | 'logistics'
  | 'regulatory'
  | 'hospital'
  | 'registry'

export type Capability =
  | 'inventory'
  | 'collections'
  | 'qc'
  | 'processing'
  | 'exchange'
  | 'analytics'
  | 'programs'
  | 'discovery'
  | 'payments'
  | 'consent'
  | 'logistics'
  | 'regulatory'

export interface Organization {
  id: string
  name: string
  type: OrgType
  capabilities: Capability[]
  created_at: string
}

// ─── Marketplace ─────────────────────────────────────────────────────────────

export type MarketplaceCategory = 'research' | 'services' | 'network'


// ─── KPE — Kadarn Proof of Execution ─────────────────────────────────────────

export interface KPEStatus {
  overall: number
  evidence_complete: number
  governance_complete: number
  provenance_complete: number
  settlement_complete: number
  audit_ready: boolean
  closeout_status: 'not_started' | 'in_progress' | 'complete'
}

// ─── Programs ────────────────────────────────────────────────────────────────

export type ProgramStatus =
  | 'draft'
  | 'feasibility'
  | 'active'
  | 'on_hold'
  | 'complete'
  | 'cancelled'

export interface Program {
  id: string
  name: string
  status: ProgramStatus
  sponsor_org_id: string
  created_at: string
  updated_at: string
}

// ─── Exceptions & Operations ──────────────────────────────────────────────────

export type ExceptionSeverity = 'critical' | 'warning' | 'info'

export interface Exception {
  id: string
  severity: ExceptionSeverity
  title: string
  description: string
  org_id?: string
  program_id?: string
  created_at: string
  resolved_at?: string
}

// ─── Auth & Access ───────────────────────────────────────────────────────────

export type KadarnRole =
  | 'kadarn_internal'   // KOC access — Kadarn team only
  | 'org_admin'         // Full workspace access for the org
  | 'org_member'        // Standard workspace access
  | 'marketplace_user'  // Marketplace only (light auth)

export type WorkspaceType =
  | 'biobank'
  | 'sponsor'
  | 'site'
  | 'laboratory'
  | 'cro'
  | 'logistics'
  | 'regulatory'
  | 'hospital'
  | 'registry'

export type Experience = 'marketplace' | 'workspace' | 'koc'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: KadarnRole
  created_at: string
}

export interface OrganizationMembership {
  user_id: string
  org_id: string
  org_name: string
  org_type: OrgType
  role: 'admin' | 'member' | 'viewer'
  capabilities: Capability[]
  joined_at: string
}

export interface AccessContext {
  user: UserProfile
  membership: OrganizationMembership | null
  role: KadarnRole
  experience: Experience
  // Resolved applications available for this user's org
  applications: string[]
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    code: string
    message: string
  }
}

// ─── Phase 8 (frozen domain contracts — Sprint 28A) ──────────────────────────

export * as phase8 from './phase8/index.js'
export type * from './phase8/index.js'

// ─── AF-4.0 Instrumentation ───────────────────────────────────────────────────

export * from './errors.js'
export * from './events/platform-events.js'
