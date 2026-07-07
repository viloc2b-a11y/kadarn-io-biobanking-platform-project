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
