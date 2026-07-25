// ─── KAD-002D/E — Repositories barrel export ─────────────────────────────

export { PersonRepository } from './person-repository'
export type { PersonRecord } from './person-repository'

export { LocationRepository } from './location-repository'
export type { LocationRecord } from './location-repository'

export { MembershipRepository } from './membership-repository'
export type { MembershipRecord, RoleRecord, RoleAssignmentRecord } from './membership-repository'

// ─── KAD-LOOP-CANONICALIZATION-001 — Event Repository ────────────────────
export { EventRepository } from './event-repository'

// ─── KAD-LOOP-002 — Evidence Acquisition Repositories ───────────────────
export { SourceRecordRepository } from './source-record-repository'
export { EvidenceSourceRepository } from './evidence-source-repository'
export { GenerationRuleRepository } from './generation-rule-repository'
