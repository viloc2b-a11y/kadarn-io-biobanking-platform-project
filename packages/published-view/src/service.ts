// ==========================================================================
// Published View Service — central read boundary (28D)
// ==========================================================================

import type { PublishedView } from '@kadarn/types/phase8'
import { LegacyReadAdapter, type LegacyPassportBundle } from './legacy-adapter'
import { PublishedViewEngine } from './engine'
import { EvidencePackGenerator } from './evidence-pack'
import { buildAllEngineOutputs, type AgentOutputMap } from './engine-output-builder'
import {
  adaptDiscoveryAgentOutputs,
  adaptDiscoveryCandidates,
  type DiscoveryAdaptContext,
} from './discovery-agent-adapter'
import { generateDiscoveryReport, type DiscoveryReportInput } from './discovery-report'

export interface PublishedViewServiceConfig {
  /** When false (28K cutover), legacy adapter is disabled */
  legacyAdapterEnabled?: boolean
}

export interface InstitutionOrgInput {
  id: string
  name: string
  city?: string | null
  state?: string | null
  description?: string | null
}

export interface InstitutionPublicInput {
  org: InstitutionOrgInput
  slug: string
  agentOutputs: AgentOutputMap
  sessionId?: string
}

export interface InstitutionPublicResponse {
  institution_name: string
  institution_slug: string
  institution_story: string
  location: string
  capabilities: ReturnType<typeof buildAllEngineOutputs>['capabilityIntelligence']
  assessment: ReturnType<typeof buildAllEngineOutputs>['assessmentIntelligence']
  gaps: null
  readiness: {
    readiness_label: string
    summary: string
    strengths: string[]
    concerns: string[]
  } | null
  recommendations: null
  generated_at: string
}

export interface DiscoveryDashboardAdaptInput {
  orgId: string
  sessionId: string
  agentOutputs: AgentOutputMap
  candidates: Array<Record<string, unknown>>
}

export interface DiscoveryDashboardAdaptResult {
  agentOutputs: AgentOutputMap
  candidates: Array<Record<string, unknown>>
  views: PublishedView[]
}

export class PublishedViewService {
  private readonly legacyAdapter: LegacyReadAdapter
  private readonly nativeEngine: PublishedViewEngine
  private readonly packGenerator: EvidencePackGenerator
  private legacyEnabled: boolean

  constructor(config: PublishedViewServiceConfig = {}) {
    this.legacyAdapter = new LegacyReadAdapter()
    this.nativeEngine = new PublishedViewEngine()
    this.packGenerator = new EvidencePackGenerator()
    this.legacyEnabled = config.legacyAdapterEnabled ?? true
  }

  isLegacyAdapterEnabled(): boolean {
    return this.legacyEnabled
  }

  disableLegacyAdapter(): void {
    this.legacyEnabled = false
  }

  getPassportViews(bundle: LegacyPassportBundle): PublishedView[] {
    if (!this.legacyEnabled) {
      const native = this.nativeEngine.getAll().filter(v => v.org_id === bundle.profile.organization_id)
      if (native.length > 0) return native
      // Controlled cutover: materialize public views from route bundle until DB native backfill
      return this.materializePassportViews(bundle)
    }
    return this.legacyAdapter.adaptPassport(bundle, 'public')
  }

  /** Native projection from bundle snapshot (28K cutover — Compatibility Layer code retained for rollback) */
  private materializePassportViews(bundle: LegacyPassportBundle): PublishedView[] {
    return this.legacyAdapter.adaptPassport(bundle, 'public')
  }

  getPassportResponse(bundle: LegacyPassportBundle) {
    const views = this.getPassportViews(bundle)
    return this.legacyAdapter.toLegacyPassportResponse(bundle, views)
  }

  /** Institution public profile — capabilities/assessment via Published View boundary */
  getInstitutionPublicResponse(input: InstitutionPublicInput): InstitutionPublicResponse {
    const ctx: DiscoveryAdaptContext = {
      orgId: input.org.id,
      sessionId: input.sessionId ?? input.slug,
      audience: 'institution',
    }

    const { agentOutputs, views } = adaptDiscoveryAgentOutputs(input.agentOutputs, ctx)
    void views

    const engines = buildAllEngineOutputs(agentOutputs)
    const readiness = engines.sponsorReadiness

    return {
      institution_name: input.org.name,
      institution_slug: input.slug,
      institution_story: input.org.description ?? `${input.org.name} is a Kadarn-enrolled institution.`,
      location: [input.org.city, input.org.state].filter(Boolean).join(', '),
      capabilities: engines.capabilityIntelligence,
      assessment: engines.assessmentIntelligence,
      gaps: null,
      readiness: readiness
        ? {
            readiness_label: readiness.readiness_label,
            summary: readiness.summary,
            strengths: readiness.strengths,
            concerns: readiness.concerns,
          }
        : null,
      recommendations: null,
      generated_at: new Date().toISOString(),
    }
  }

  /** Discovery dashboard — capability/claim agent outputs and candidates via views */
  adaptDiscoveryDashboard(input: DiscoveryDashboardAdaptInput): DiscoveryDashboardAdaptResult {
    const ctx: DiscoveryAdaptContext = {
      orgId: input.orgId,
      sessionId: input.sessionId,
      audience: 'canonical',
    }

    const agentAdapted = adaptDiscoveryAgentOutputs(input.agentOutputs, ctx)
    const candidateAdapted = adaptDiscoveryCandidates(input.candidates, ctx)

    return {
      agentOutputs: agentAdapted.agentOutputs,
      candidates: candidateAdapted.candidates,
      views: [...agentAdapted.views, ...candidateAdapted.views],
    }
  }

  /** Discovery recognition report — all claim/capability sections via Published View */
  getDiscoveryReport(input: DiscoveryReportInput) {
    return generateDiscoveryReport(input)
  }

  getEvidencePackForView(view: PublishedView) {
    return this.packGenerator.generate({
      view,
      variant: 'public',
    })
  }
}
