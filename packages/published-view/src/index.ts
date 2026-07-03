export { PublishedViewEngine, confidenceLevelFromScore } from './engine'
export type { PublishInput, ViewAudience } from './engine'

export {
  LegacyReadAdapter,
  LEGACY_ADAPTER_VERSION,
} from './legacy-adapter'
export type {
  LegacyContinuityClaim,
  LegacyContinuityProfile,
  LegacyPassportBundle,
} from './legacy-adapter'

export {
  adaptDiscoveryAgentOutputs,
  adaptDiscoveryCandidates,
  DISCOVERY_ADAPTER_VERSION,
} from './discovery-agent-adapter'
export type { DiscoveryAdaptContext, DiscoveryAdaptResult } from './discovery-agent-adapter'

export { buildAllEngineOutputs } from './engine-output-builder'
export type { AgentOutputMap } from './engine-output-builder'

export { EvidencePackGenerator } from './evidence-pack'
export type { PackGenerationInput } from './evidence-pack'

export {
  generateDiscoveryReport,
  buildDiscoveryReportDirect,
} from './discovery-report'
export type { DiscoveryReportInput, InstitutionRecognitionReport } from './discovery-report'

export { PublishedViewService } from './service'
export type {
  PublishedViewServiceConfig,
  InstitutionOrgInput,
  InstitutionPublicInput,
  InstitutionPublicResponse,
  DiscoveryDashboardAdaptInput,
  DiscoveryDashboardAdaptResult,
} from './service'

export {
  PHASE8_VIEW_BOUNDARY,
  assertPublishedViewRead,
  VIEW_MIGRATED_ROUTES,
  VIEW_PENDING_ROUTES,
} from './integration-guard'
