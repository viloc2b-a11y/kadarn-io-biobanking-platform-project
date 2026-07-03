// ==========================================================================
// Dashboard Engine Output Builder — Sprint 25D / Phase 8 (28D convergence)
// ==========================================================================
// Re-exports from @kadarn/published-view for authenticated internal routes only.
// External-facing routes MUST use published-view-service — not this module.
// Pending: /api/v1/institution/profile
// ==========================================================================

export { buildAllEngineOutputs, type AgentOutputMap } from '@kadarn/published-view'
