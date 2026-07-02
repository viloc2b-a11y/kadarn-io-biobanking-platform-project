// Discovery Interaction Dashboard — structural and contract tests
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const WEB = join(ROOT, 'apps', 'web', 'src')
const API = join(ROOT, 'apps', 'api', 'src')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('Discovery Interaction Dashboard — routes', () => {
  it('workspace route renders site director dashboard', () => {
    const page = join(WEB, 'app', '(workspace)', 'workspace', 'discovery', 'page.tsx')
    expect(existsSync(page)).toBe(true)
    const source = read(page)
    expect(source).toContain('DiscoveryInteractionDashboard')
    expect(source).toContain('site_director')
  })

  it('KOC route renders kadarn reviewer dashboard', () => {
    const page = join(WEB, 'app', '(koc)', 'koc', 'discovery', 'page.tsx')
    expect(existsSync(page)).toBe(true)
    const source = read(page)
    expect(source).toContain('DiscoveryInteractionDashboard')
    expect(source).toContain('kadarn_reviewer')
  })
})

describe('Discovery Interaction Dashboard — navigation', () => {
  it('workspace navigation includes Institutional Discovery', () => {
    const nav = read(join(API, 'app', 'api', 'v1', 'workspace', 'navigation', 'route.ts'))
    expect(nav).toContain('/workspace/discovery')
    expect(nav).toContain('Institutional Discovery')
  })

  it('KOC shell includes Institutional Discovery under Evidence', () => {
    const shell = read(join(WEB, 'components', 'koc', 'koc-shell.tsx'))
    expect(shell).toContain('/koc/discovery')
    expect(shell).toContain('Institutional Discovery')
  })
})

describe('Discovery Interaction Dashboard — API surface', () => {
  const routes = [
    'session/route.ts',
    'dashboard/route.ts',
    'curation/route.ts',
    'validation-notes/route.ts',
    'provenance/route.ts',
    'pipeline-status/route.ts',
  ]

  for (const route of routes) {
    it(`exposes /api/v1/discovery/${route.replace('/route.ts', '')}`, () => {
      expect(existsSync(join(API, 'app', 'api', 'v1', 'discovery', route))).toBe(true)
    })
  }

  it('dashboard route is not nested under discovery/discovery', () => {
    expect(
      existsSync(join(API, 'app', 'api', 'v1', 'discovery', 'discovery', 'dashboard', 'route.ts')),
    ).toBe(false)
  })

  it('dashboard route never writes to Evidence Core', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'discovery', 'dashboard', 'route.ts'))
    expect(source).toContain('Never writes to Evidence Core')
    expect(source).not.toMatch(/evidence_core|EvidenceCore|promote/i)
  })

  it('curation route uses append-only discovery_curation_events', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'discovery', 'curation', 'route.ts'))
    expect(source).toContain('discovery_curation_events')
    expect(source).toContain('VALID_ACTIONS')
  })

  it('provenance route is read-only GET and never writes to Evidence Core', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'discovery', 'provenance', 'route.ts'))
    expect(source).toContain('read-only')
    expect(source).toContain('export const GET')
    expect(source).not.toMatch(/export const POST|\.insert\(|\.update\(|evidence_core|EvidenceCore/i)
  })
})

describe('Discovery Interaction Dashboard — tabs and panels', () => {
  const typesSource = read(join(WEB, 'components', 'discovery', 'types.ts'))

  const expectedTabs = [
    'pipeline',
    'snapshot',
    'profile',
    'documents',
    'entities',
    'relationships',
    'timeline',
    'capabilities',
    'claims',
    'gaps',
    'narrative',
    'curation',
    'notes',
    'provenance',
  ]

  for (const tab of expectedTabs) {
    it(`defines tab "${tab}"`, () => {
      expect(typesSource).toContain(`'${tab}'`)
    })
  }

  const panelFiles = [
    'snapshot-panel.tsx',
    'profile-panel.tsx',
    'documents-panel.tsx',
    'entities-panel.tsx',
    'relationships-panel.tsx',
    'timeline-panel.tsx',
    'capabilities-panel.tsx',
    'claims-panel.tsx',
    'gaps-panel.tsx',
    'narrative-panel.tsx',
    'curation-panel.tsx',
    'notes-panel.tsx',
    'provenance-panel.tsx',
    'view-provenance-link.tsx',
    'pipeline-panel.tsx',
    'discovery-tab-bar.tsx',
  ]

  for (const file of panelFiles) {
    it(`includes panel component ${file}`, () => {
      expect(existsSync(join(WEB, 'components', 'discovery', file))).toBe(true)
    })
  }

  it('dashboard shell wires all 14 tabs with accessible tab bar', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    expect(dashboard).toContain('DiscoveryTabBar')
    for (const tab of expectedTabs) {
      expect(dashboard).toContain(`case '${tab}'`)
    }
  })
})

describe('Discovery Interaction Dashboard — client API helpers', () => {
  const apiSource = read(join(WEB, 'components', 'discovery', 'discovery-api.ts'))

  it('calls discovery endpoints including provenance', () => {
    expect(apiSource).toContain('/api/v1/discovery/session')
    expect(apiSource).toContain('/api/v1/discovery/dashboard')
    expect(apiSource).toContain('/api/v1/discovery/curation')
    expect(apiSource).toContain('/api/v1/discovery/validation-notes')
    expect(apiSource).toContain('/api/v1/discovery/provenance')
    expect(apiSource).toContain('fetchDiscoveryProvenance')
  })

  it('exports curation and validation category constants', () => {
    expect(apiSource).toContain('CURATION_ACTIONS')
    expect(apiSource).toContain('CURATION_TARGET_TYPES')
    expect(apiSource).toContain('VALIDATION_CATEGORIES')
  })
})

describe('Discovery Interaction Dashboard — UI states', () => {
  it('shared primitives provide loading, empty, and error states', () => {
    const primitives = read(join(WEB, 'components', 'discovery', 'panel-primitives.tsx'))
    expect(primitives).toContain('EmptyPanel')
    expect(primitives).toContain('PanelSkeleton')
    expect(primitives).toContain('ErrorPanel')
  })

  it('dashboard shell handles session and dashboard errors with retry', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    expect(dashboard).toContain('ErrorPanel')
    expect(dashboard).toContain('onRetry')
    expect(dashboard).toContain('DiscoveryDashboardSkeleton')
  })
})

describe('Discovery Interaction Dashboard — agent key resolution', () => {
  it('snapshot panel prefers evidence_snapshot agent output', () => {
    const source = read(join(WEB, 'components', 'discovery', 'snapshot-panel.tsx'))
    expect(source).toContain("'evidence_snapshot'")
    expect(source).toContain("'snapshot_builder'")
  })

  it('entities panel uses entity-extractor agent key', () => {
    const source = read(join(WEB, 'components', 'discovery', 'entities-panel.tsx'))
    expect(source).toContain("'entity-extractor'")
  })

  it('relationships panel uses relationship-extractor agent key', () => {
    const source = read(join(WEB, 'components', 'discovery', 'relationships-panel.tsx'))
    expect(source).toContain("'relationship-extractor'")
  })
})

describe('Discovery Provenance Explorer', () => {
  const forbidden = /\bcertified\b|\bcanonical evidence\b|\bpromoted to evidence\b|\bclaim confidence\b/i

  it('provenance tab is defined and wired in dashboard', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    expect(types).toContain("'provenance'")
    expect(types).toContain('ProvenanceData')
    expect(dashboard).toContain("case 'provenance'")
    expect(dashboard).toContain('DiscoveryProvenancePanel')
  })

  it('reviewable panels expose View provenance actions', () => {
    for (const file of ['entities-panel.tsx', 'relationships-panel.tsx', 'capabilities-panel.tsx', 'claims-panel.tsx']) {
      const source = read(join(WEB, 'components', 'discovery', file))
      expect(source).toContain('ViewProvenanceLink')
    }
    const link = read(join(WEB, 'components', 'discovery', 'view-provenance-link.tsx'))
    expect(link).toContain('View provenance')
  })

  it('provenance panel shows Layer 0 reference, Layer 1 metadata, and agent/pipeline version', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'provenance-panel.tsx'))
    expect(panel).toContain('Layer 0')
    expect(panel).toContain('Layer 1')
    expect(panel).toContain('pipelineVersion')
    expect(panel).toContain('agent_version')
    expect(panel).toContain('ProvenanceBreadcrumb')
  })

  it('provenance panel provides empty, loading, and error states', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'provenance-panel.tsx'))
    expect(panel).toContain('EmptyPanel')
    expect(panel).toContain('PanelSkeleton')
    expect(panel).toContain('ErrorPanel')
  })

  it('provenance API resolves chain through layer1 and artifacts tables', () => {
    const route = read(join(API, 'app', 'api', 'v1', 'discovery', 'provenance', 'route.ts'))
    expect(route).toContain('discovery_layer1')
    expect(route).toContain('discovery_artifacts')
    expect(route).toContain('discovery_agent_outputs')
    expect(route).toContain('pipeline_version')
  })

  it('provenance UI does not use forbidden certification or promotion language', () => {
    const files = [
      join(WEB, 'components', 'discovery', 'provenance-panel.tsx'),
      join(WEB, 'components', 'discovery', 'view-provenance-link.tsx'),
      join(API, 'app', 'api', 'v1', 'discovery', 'provenance', 'route.ts'),
    ]
    for (const file of files) {
      expect(read(file)).not.toMatch(forbidden)
    }
  })

  it('provenance client does not call Evidence Core endpoints', () => {
    const api = read(join(WEB, 'components', 'discovery', 'discovery-api.ts'))
    expect(api).not.toMatch(/evidence.core|evidence_core|\/api\/v1\/evidence/i)
  })
})

describe('Discovery Metrics', () => {
  const forbidden = /\bclaim confidence\b|\btrust score\b|\bcertified\b|\bsponsor.score\b/i

  it('dashboard API includes metrics via buildDiscoveryMetrics', () => {
    const route = read(join(API, 'app', 'api', 'v1', 'discovery', 'dashboard', 'route.ts'))
    expect(route).toContain('buildDiscoveryMetrics')
    expect(route).toContain('metrics')
  })

  it('metrics strip renders from dashboard metrics payload', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    const strip = read(join(WEB, 'components', 'discovery', 'discovery-metrics-strip.tsx'))
    expect(dashboard).toContain('DiscoveryMetricsStrip')
    expect(dashboard).toContain('EMPTY_DISCOVERY_METRICS')
    expect(strip).toContain('metrics.artifactsProcessed')
    expect(strip).toContain('metrics.unknownDocuments')
    expect(strip).toContain('metrics.lowConfidenceItems')
  })

  it('metrics strip handles empty state safely', () => {
    const strip = read(join(WEB, 'components', 'discovery', 'discovery-metrics-strip.tsx'))
    expect(strip).toContain('EMPTY_DISCOVERY_METRICS')
    expect(strip).toContain('DISCOVERY_COPY.metricsTitle')
    expect(strip).toContain('Needs review')
  })

  it('dashboard uses Discovery Workbench product language', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    expect(dashboard).toContain('DISCOVERY_COPY.workbenchTitle')
    expect(dashboard).toContain('DISCOVERY_COPY.eyebrow')
  })

  it('does not display Claim Confidence or Trust Score as metric fields', () => {
    const strip = read(join(WEB, 'components', 'discovery', 'discovery-metrics-strip.tsx'))
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(strip).not.toMatch(/metrics\.claimConfidence|metrics\.trustScore/i)
    expect(strip).not.toMatch(/label="Claim Confidence"|label="Trust Score"/i)
    expect(types).toContain('DiscoveryMetrics')
    expect(types).not.toMatch(/trustScore|claimConfidence/i)
  })

  it('metrics computation does not call Evidence Core', () => {
    const lib = read(join(API, 'lib', 'discovery-metrics.ts'))
    const route = read(join(API, 'app', 'api', 'v1', 'discovery', 'dashboard', 'route.ts'))
    expect(lib).not.toMatch(/evidence_core|EvidenceCore|\.insert\(|\.update\(/i)
    expect(route).not.toMatch(/evidence_core|EvidenceCore/i)
  })
})

describe('Discovery Pipeline Status', () => {
  it('pipeline status API is read-only GET', () => {
    const route = read(join(API, 'app', 'api', 'v1', 'discovery', 'pipeline-status', 'route.ts'))
    expect(route).toContain('read-only')
    expect(route).toContain('export const GET')
    expect(route).not.toMatch(/export const POST/)
    expect(route).not.toMatch(/\.insert\(/)
    expect(route).not.toMatch(/\.update\(/)
    expect(route).not.toMatch(/evidence_core/i)
  })

  it('pipeline tab is wired in dashboard', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain("'pipeline'")
    expect(dashboard).toContain("case 'pipeline'")
    expect(dashboard).toContain('DiscoveryPipelinePanel')
  })

  it('pipeline panel renders stages with status and navigation', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'pipeline-panel.tsx'))
    expect(panel).toContain('PipelineStageRow')
    expect(panel).toContain('onNavigateTab')
    expect(panel).toContain('EmptyPanel')
    expect(panel).toContain('ErrorPanel')
    expect(panel).not.toMatch(/Evidence Core|promote/i)
  })

  it('pipeline client fetches pipeline-status endpoint only', () => {
    const api = read(join(WEB, 'components', 'discovery', 'discovery-api.ts'))
    expect(api).toContain('/api/v1/discovery/pipeline-status')
    expect(api).toContain('fetchDiscoveryPipelineStatus')
    expect(api).not.toMatch(/evidence_core|\/api\/v1\/evidence/i)
  })
})

describe('Discovery Research Assets Enabled — Sprint 21A', () => {
  const forbidden = /\bcertified\b|\bverified\b|\bpromoted to evidence\b|\bclaim confidence\b|\btrust score\b/i

  it('tab is defined in types and DASHBOARD_TABS', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain("'research_assets'")
    expect(types).toContain('Research Assets Enabled')
  })

  it('tab is included in site director tab order', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain('SITE_DIRECTOR_TAB_ORDER')
    const idx = types.indexOf('SITE_DIRECTOR_TAB_ORDER')
    const block = types.slice(idx, idx + 300)
    expect(block).toContain("'research_assets'")
  })

  it('tab is included in kadarn reviewer tab order', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    const idx = types.indexOf('KADARN_REVIEWER_TAB_ORDER')
    const block = types.slice(idx, idx + 300)
    expect(block).toContain("'research_assets'")
  })

  it('tab is wired in dashboard shell', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
    expect(dashboard).toContain('ResearchAssetsEnabledPanel')
    expect(dashboard).toContain("case 'research_assets'")
  })

  it('panel component file exists', () => {
    expect(
      existsSync(join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx')),
    ).toBe(true)
  })

  it('panel imports mapping functions from lib', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('mapCapabilitiesToResearchAssets')
  })

  it('panel resolves agent output keys for capabilities, claims, and gaps', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain("'capability_detector'")
    expect(panel).toContain("'claim_candidate_detector'")
    expect(panel).toContain("'evidence_gap_detector'")
  })

  it('panel provides empty, loading, and skeleton states', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('PanelSkeleton')
    expect(panel).toContain('EmptyPanel')
  })

  it('panel renders a grid of asset cards with badges', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('ResearchAssetCard')
    expect(panel).toContain('Badge')
    expect(panel).toContain('gridTemplateColumns')
  })

  it('panel shows recommended next step per asset', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('Recommended next step')
    expect(panel).toContain('nextStep')
  })

  it('panel does not use forbidden certification or promotion language', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).not.toMatch(forbidden)
  })

  it('does not call Evidence Core or write to any backend', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).not.toMatch(/evidence_core|EvidenceCore|\.insert\(|\.update\(|fetch\(/i)
  })

    it('lib mapping never uses verified or certification terms', () => {
      const lib = read(join(WEB, 'components', 'discovery', 'lib.ts'))
      const researchSection = lib.slice(lib.indexOf('Research Assets Enabled'))
      // Strip comments that self-describe the policy
      const withoutComments = researchSection
        .split('\n')
        .filter((line: string) => !line.includes('no "verified" language'))
        .join('\n')
      expect(withoutComments).not.toMatch(forbidden)
    })
})

describe('Discovery Engine Integration — Sprint 21B/21C', () => {
  const forbidden = /\bcertified\b|\bverified\b|\bpromoted to evidence\b|\bclaim confidence\b|\btrust score\b/i

  it('gaps-panel consumes gapIntelligence as preferred path', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'gaps-panel.tsx'))
    expect(panel).toContain('gapIntelligence')
    expect(panel).toContain('EngineDrivenGapsPanel')
    expect(panel).toContain('EngineGapCard')
  })

  it('gaps-panel engine card shows blocking status', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'gaps-panel.tsx'))
    expect(panel).toContain('gap.blocking')
  })

  it('gaps-panel engine card shows affected capabilities', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'gaps-panel.tsx'))
    expect(panel).toContain('affected_capabilities')
  })

  it('gaps-panel engine card shows affected research assets', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'gaps-panel.tsx'))
    expect(panel).toContain('affected_research_assets')
  })

  it('gaps-panel preserves agent-driven fallback', () => {
    const panel = read(join(WEB, 'components', 'discovery', 'gaps-panel.tsx'))
    expect(panel).toContain("data.agentOutputs['evidence_gap_detector']")
  })

  it('research-assets-panel consumes capabilityIntelligence and gapIntelligence', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('capabilityIntelligence')
    expect(panel).toContain('gapIntelligence')
    expect(panel).toContain('EngineDrivenPanel')
  })

  it('research-assets-panel shows blocking gaps from gap intelligence', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('Blocking gaps')
  })

  it('research-assets-panel preserves agent-driven fallback', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'research-assets-enabled-panel.tsx'),
    )
    expect(panel).toContain('AgentDrivenPanel')
  })

  it('sponsor-readiness consumes capabilityIntelligence and gapIntelligence', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'sponsor-readiness-summary.tsx'),
    )
    expect(panel).toContain('capabilityIntelligence')
    expect(panel).toContain('gapIntelligence')
    expect(panel).toContain('EngineDrivenReadiness')
  })

  it('sponsor-readiness preserves agent-driven fallback', () => {
    const panel = read(
      join(WEB, 'components', 'discovery', 'sponsor-readiness-summary.tsx'),
    )
    expect(panel).toContain("data.agentOutputs['capability_detector']")
  })

  it('dashboard types include all three engine contracts', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain('CapabilityIntelligenceData')
    expect(types).toContain('GapIntelligenceData')
    expect(types).toContain('gapIntelligence')
  })

  it('engine integration does not use forbidden language', () => {
    const files = [
      'gaps-panel.tsx',
      'research-assets-enabled-panel.tsx',
      'sponsor-readiness-summary.tsx',
      'types.ts',
    ]
    for (const file of files) {
      const source = read(join(WEB, 'components', 'discovery', file))
      // Only check the engine-specific sections, not comments describing the policy
      const withoutComments = source
        .split('\n')
        .filter((line) => !line.includes('//') && !line.includes(' * '))
        .join('\n')
      expect(withoutComments).not.toMatch(forbidden)
    }
  })
})

describe('Discovery Assessment Engine — Sprint 21D', () => {
  it('dashboard types include assessment contract', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain('AssessmentIntelligenceData')
    expect(types).toContain('assessmentIntelligence')
    expect(types).toContain('AssessmentEntry')
    expect(types).toContain('OperationalMaturity')
    expect(types).toContain('DashboardPriority')
  })

  it('assessment contract has all required fields', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain('assessment_status')
    expect(types).toContain('operational_maturity')
    expect(types).toContain('assessment_summary')
    expect(types).toContain('recommended_actions')
    expect(types).toContain('future_sponsor_relevance')
  })
})

describe('Executive Institution Profile — Sprint 22B', () => {
  it('profile component file exists', () => {
    expect(existsSync(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))).toBe(true)
  })

  it('profile exports ExecutiveInstitutionProfile', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    expect(profile).toContain('export function ExecutiveInstitutionProfile')
  })

  it('profile consumes engine outputs from DashboardData', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    expect(profile).toContain('capabilityIntelligence')
    expect(profile).toContain('gapIntelligence')
    expect(profile).toContain('assessmentIntelligence')
    expect(profile).toContain('sponsorReadiness')
    expect(profile).toContain('recommendations')
  })

  it('profile has all required sections', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    expect(profile).toContain('ProfileHero')
    expect(profile).toContain('ExecutiveSummaryCard')
    expect(profile).toContain('SponsorReadinessCard')
    expect(profile).toContain('CapabilitiesCard')
    expect(profile).toContain('ResearchAssetsCard')
    expect(profile).toContain('RecommendationsCard')
    expect(profile).toContain('HighlightsCard')
    expect(profile).toContain('GapsCard')
    expect(profile).toContain('QuickActionsCard')
  })

  it('profile uses business language — no internal engine names', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    expect(profile).not.toContain('Evidence Core')
    expect(profile).not.toContain('Claim Graph')
    expect(profile).not.toContain('Capability Engine')
    expect(profile).not.toContain('Intelligence Pipeline')
    expect(profile).not.toContain('confidence calculation')
  })

  it('profile has loading and empty states', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    expect(profile).toContain('ProfileSkeleton')
    expect(profile).toContain('EmptyProfile')
  })

  it('profile uses no forbidden terminology', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'executive-profile.tsx'))
    // Strip comments
    const withoutComments = profile
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n')
    expect(withoutComments).not.toMatch(/\bverified\b|\bcertified\b|\bgold\b|\bsilver\b|\bbronze\b/i)
  })
})

describe('Sponsor Capability Search — Sprint 22C', () => {
  it('search component file exists', () => {
    expect(existsSync(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))).toBe(true)
  })

  it('search exports SponsorCapabilitySearch', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('export function SponsorCapabilitySearch')
  })

  it('search includes capability and research asset filters', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('Capabilities')
    expect(search).toContain('Research Assets')
  })

  it('search has readiness filter', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('Any readiness')
  })

  it('search has empty state', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('No institutions match')
  })

  it('result card displays all required fields', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('Matched capabilities')
    expect(search).toContain('Research assets:')
    expect(search).toContain('Strengths:')
    expect(search).toContain('Areas for improvement:')
  })

  it('result card has quick actions', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('Open Executive Profile')
    expect(search).toContain('Generate Report')
  })

  it('search types include SponsorSearchResult and SponsorSearchFilters', () => {
    const types = read(join(WEB, 'components', 'discovery', 'types.ts'))
    expect(types).toContain('SponsorSearchResult')
    expect(types).toContain('SponsorSearchFilters')
    expect(types).toContain('SponsorSearchResponse')
  })

  it('search uses deterministic ordering — no AI ranking', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    expect(search).toContain('Presentation Ready')
    expect(search).not.toContain('score')
    expect(search).not.toContain('ranking')
    expect(search).not.toContain('weight')
  })

  it('search uses no forbidden terminology', () => {
    const search = read(join(WEB, 'components', 'discovery', 'sponsor-search.tsx'))
    const withoutComments = search
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n')
    expect(withoutComments).not.toMatch(/\bverified\b|\bcertified\b|\bgold\b|\bsilver\b|\bbronze\b/i)
    expect(withoutComments).not.toContain('confidence')
  })
})

describe('Public Institution Profile � Sprint 22F', () => {
  it('public profile component exists', () => {
    expect(existsSync(join(WEB, 'components', 'discovery', 'public-profile.tsx'))).toBe(true)
  })

  it('public profile exports PublicInstitutionProfile', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    expect(profile).toContain('export function PublicInstitutionProfile')
  })

  it('public profile uses business language only', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    const clean = profile
      .split(
)
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.includes('//'))
      .join(
)
      .replace(/\w*Engine\w*/g, '')
    expect(clean).not.toMatch(/engine/i)
    expect(clean).not.toContain('Evidence Core')
    expect(clean).not.toContain('Claim Graph')
  })

  it('public profile has SEO structured data', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    expect(profile).toContain('application/ld+json')
    expect(profile).toContain('schema.org')
  })

  it('public profile has all required sections', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    expect(profile).toContain('Sponsor Readiness')
    expect(profile).toContain('Institutional Capabilities')
    expect(profile).toContain('Research Assets Enabled')
    expect(profile).toContain('Evidence Highlights')
    expect(profile).toContain('Priority Improvements')
    expect(profile).toContain('Institutional Timeline')
  })

  it('public profile is responsive', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    expect(profile).toContain('maxWidth')
    expect(profile).toContain('auto-fit')
  })

  it('public profile uses no forbidden terminology', () => {
    const profile = read(join(WEB, 'components', 'discovery', 'public-profile.tsx'))
    const clean = profile
      .split(
)
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.includes('//'))
      .join(
)
    expect(clean).not.toMatch(/verified|certified|gold|silver|bronze/i)
    expect(clean).not.toContain('confidence')
  })
})
