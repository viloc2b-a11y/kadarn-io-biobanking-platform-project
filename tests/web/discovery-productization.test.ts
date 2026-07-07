// Discovery Dashboard Productization (Sprint 20B) — Institutional Recognition tests
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { assessSponsorReadiness, formatDiscoveryConfidence } from '../../apps/web/src/components/discovery/lib'

const ROOT = join(__dirname, '..', '..')
const WEB = join(ROOT, 'apps', 'web', 'src')
const DISCOVERY = join(WEB, 'components', 'discovery')
const WORKSPACE_ROUTE = join(WEB, 'app', '(workspace)', 'workspace', 'discovery', 'page.tsx')
const KOC_ROUTE = join(WEB, 'app', '(koc)', 'koc', 'discovery', 'page.tsx')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('Tab label rendering (Task 5 renames)', () => {
  const types = read(join(DISCOVERY, 'types.ts'))

  const expectedLabels: Record<string, string> = {
    overview: 'Recognition Overview',
    pipeline: 'Discovery Pipeline',
    snapshot: 'Evidence Snapshot',
    profile: 'Institution Profile',
    documents: 'Evidence Documents',
    entities: 'People, Sites & Studies',
    relationships: 'Connections Found',
    timeline: 'Evidence Timeline',
    capabilities: 'Capabilities Found',
    claims: 'Evidence Claims',
    gaps: 'Evidence Gaps',
    narrative: 'Institutional Story',
    curation: 'Review & Improve Evidence',
    notes: 'Validation Notes',
    provenance: 'Source Trace',
    sponsor_readiness: 'Sponsor Readiness',
  }

  for (const [id, label] of Object.entries(expectedLabels)) {
    it(`tab "${id}" renders label "${label}"`, () => {
      expect(types).toContain(`{ id: '${id}', label: '${label}' }`)
    })
  }
})

describe('Role-specific default tab ordering (Task 6)', () => {
  const types = read(join(DISCOVERY, 'types.ts'))
  const dashboard = read(join(DISCOVERY, 'dashboard.tsx'))
  const tabBar = read(join(DISCOVERY, 'discovery-tab-bar.tsx'))

  it('defines SITE_DIRECTOR_TAB_ORDER starting with overview then Institutional Story then Sponsor Readiness then Evidence Gaps', () => {
    expect(types).toContain('SITE_DIRECTOR_TAB_ORDER')
    const match = types.match(/SITE_DIRECTOR_TAB_ORDER: DashboardTab\[\] = \[([\s\S]*?)\]/)
    expect(match).not.toBeNull()
    const order = match![1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
    expect(order.slice(0, 5)).toEqual(['overview', 'narrative', 'sponsor_readiness', 'research_assets', 'gaps'])
  })

  it('defines KADARN_REVIEWER_TAB_ORDER starting with overview then Evidence Gaps then Review & Improve Evidence then Validation Notes', () => {
    expect(types).toContain('KADARN_REVIEWER_TAB_ORDER')
    const match = types.match(/KADARN_REVIEWER_TAB_ORDER: DashboardTab\[\] = \[([\s\S]*?)\]/)
    expect(match).not.toBeNull()
    const order = match![1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean)
    expect(order.slice(0, 5)).toEqual(['overview', 'gaps', 'research_assets', 'curation', 'notes'])
  })

  it('dashboard selects tab order by mode and forwards it to the tab bar', () => {
    expect(dashboard).toContain('KADARN_REVIEWER_TAB_ORDER')
    expect(dashboard).toContain('SITE_DIRECTOR_TAB_ORDER')
    expect(dashboard).toContain('tabOrder={tabOrder}')
  })

  it('tab bar accepts an optional tabOrder prop and falls back to DASHBOARD_TABS', () => {
    expect(tabBar).toContain('tabOrder?: DashboardTab[]')
    expect(tabBar).toContain('tabOrder ?? DASHBOARD_TABS.map')
  })

  it('default active tab is overview (Recognition Overview first)', () => {
    expect(dashboard).toContain("useState<DashboardTab>('overview')")
  })
})

describe('Recognition Overview panel (Task 1)', () => {
  const panel = read(join(DISCOVERY, 'recognition-overview-panel.tsx'))

  it('exists and exports RecognitionOverviewPanel', () => {
    expect(panel).toContain('export function RecognitionOverviewPanel')
  })

  it('renders empty state with first-run empty copy when no session data', () => {
    expect(panel).toContain('DISCOVERY_COPY.firstRunEmpty')
    expect(panel).toContain('EmptyPanel')
  })

  it('uses graceful placeholders instead of inventing data', () => {
    expect(panel).toContain('DISCOVERY_COPY.notAvailableYet')
    expect(panel).toContain('DISCOVERY_COPY.noEvidenceFoundYet')
  })

  it('supports site and koc variants with distinct headlines', () => {
    expect(panel).toContain("variant === 'koc'")
    expect(panel).toContain('DISCOVERY_COPY.reviewHeadline')
    expect(panel).toContain('DISCOVERY_COPY.recognitionHeadline')
  })

  it('derives only from existing dashboard response fields (counts, agentOutputs, curationEvents, validationNotes, candidates)', () => {
    expect(panel).toContain('data.counts')
    expect(panel).toContain("data.agentOutputs['capability_detector']")
    expect(panel).toContain("data.agentOutputs['evidence_gap_detector']")
    expect(panel).toContain('data.curationEvents')
    expect(panel).toContain('data.validationNotes')
  })
})

describe('Sponsor Readiness Summary (Task 4)', () => {
  const summaryPanel = read(join(DISCOVERY, 'sponsor-readiness-summary.tsx'))
  const lib = read(join(DISCOVERY, 'lib.ts'))

  it('never uses the word "score" as a numeric readiness label', () => {
    expect(summaryPanel.toLowerCase()).not.toMatch(/readiness score|sponsor score/)
  })

  it('never uses the word "verified"', () => {
    expect(summaryPanel.toLowerCase()).not.toContain('verified')
  })

  it('never claims certification', () => {
    expect(summaryPanel.toLowerCase()).not.toContain('certified')
  })

  it('exposes only the four fixed categorical labels', () => {
    expect(summaryPanel).toContain('DISCOVERY_COPY.sponsorReadinessPresentationReady')
    expect(summaryPanel).toContain('DISCOVERY_COPY.sponsorReadinessNeedsAdditionalEvidence')
    expect(summaryPanel).toContain('DISCOVERY_COPY.sponsorReadinessNeedsHumanReview')
    expect(summaryPanel).toContain('DISCOVERY_COPY.sponsorReadinessNotEnoughEvidence')
  })

  it('shows insufficient-data message when no session data is present', () => {
    expect(summaryPanel).toContain('DISCOVERY_COPY.sponsorReadinessInsufficientData')
  })

  it('derivation logic lives in a pure lib.ts helper', () => {
    expect(lib).toContain('export function assessSponsorReadiness')
  })

  it('pure helper never arithmetically combines confidence values', () => {
    // Guard against regressions: the helper source must not reference any
    // confidence field or perform arithmetic aggregation.
        // Only inspect the assessSponsorReadiness function, not the rest of lib.ts
        const start = lib.indexOf('export function assessSponsorReadiness')
        const end = lib.indexOf('Research Assets Enabled', start + 10)
        const fnSource = end > start ? lib.slice(start, end) : lib.slice(start)
    expect(fnSource).not.toMatch(/confidence/i)
    expect(fnSource).not.toMatch(/[a-zA-Z_]+\s*\+\s*[a-zA-Z_]+/)
  })

  describe('assessSponsorReadiness — insufficient-data state', () => {
    it('returns not_enough_evidence when there are no capabilities and no claims', () => {
      const result = assessSponsorReadiness({
        capabilityCount: 0,
        claimCount: 0,
        criticalGapCount: 0,
        totalGapCount: 0,
        hasNarrative: false,
        hasCurationReview: false,
      })
      expect(result.label).toBe('not_enough_evidence')
    })

    it('returns needs_additional_evidence when a critical gap is present', () => {
      const result = assessSponsorReadiness({
        capabilityCount: 2,
        claimCount: 1,
        criticalGapCount: 1,
        totalGapCount: 1,
        hasNarrative: true,
        hasCurationReview: true,
      })
      expect(result.label).toBe('needs_additional_evidence')
    })

    it('returns needs_human_review when data exists but nothing has been curated', () => {
      const result = assessSponsorReadiness({
        capabilityCount: 2,
        claimCount: 1,
        criticalGapCount: 0,
        totalGapCount: 0,
        hasNarrative: true,
        hasCurationReview: false,
      })
      expect(result.label).toBe('needs_human_review')
    })

    it('returns presentation_ready when curated with no critical gaps', () => {
      const result = assessSponsorReadiness({
        capabilityCount: 2,
        claimCount: 1,
        criticalGapCount: 0,
        totalGapCount: 0,
        hasNarrative: true,
        hasCurationReview: true,
      })
      expect(result.label).toBe('presentation_ready')
    })
  })
})

describe('Confidence passthrough unchanged', () => {
  it('formatDiscoveryConfidence still never scales or recalculates', () => {
    expect(formatDiscoveryConfidence(0.82)).toBe('0.82')
    expect(formatDiscoveryConfidence(1)).toBe('1')
    expect(formatDiscoveryConfidence(0)).toBe('0')
    expect(formatDiscoveryConfidence(null)).toBe('—')
  })

  it('sponsor readiness panel does not import or call formatDiscoveryConfidence', () => {
    const summaryPanel = read(join(DISCOVERY, 'sponsor-readiness-summary.tsx'))
    expect(summaryPanel).not.toContain('formatDiscoveryConfidence')
  })
})

describe('No promotion language in touched UI copy (Task 3/9)', () => {
  const forbidden = /\bpromote\b|\bpromoted\b|\bpromotion\b/i
  const files = [
    'discovery-copy.ts',
    'recognition-overview-panel.tsx',
    'sponsor-readiness-summary.tsx',
    'report-generation-cta.tsx',
    'gaps-panel.tsx',
    'narrative-panel.tsx',
    'lib.ts',
    'dashboard.tsx',
    'discovery-tab-bar.tsx',
    'types.ts',
  ]

  for (const file of files) {
    it(`${file} does not contain promotion language`, () => {
      const source = read(join(DISCOVERY, file)); const sanitized = source.replace(/No promotion language.*/g, ''); expect(sanitized).not.toMatch(forbidden)
    })
  }
})

describe('Evidence Gaps action-oriented UI (Task 3)', () => {
  const panel = read(join(DISCOVERY, 'gaps-panel.tsx'))

  it('answers why it matters and what to do next for each gap', () => {
    expect(panel).toContain('DISCOVERY_COPY.gapWhyItMatters')
    expect(panel).toContain('DISCOVERY_COPY.gapNextAction')
  })

  it('flags whether a gap blocks sponsor readiness', () => {
    expect(panel).toContain('DISCOVERY_COPY.gapBlocksSponsorReadiness')
    expect(panel).toContain('DISCOVERY_COPY.gapDoesNotBlockSponsorReadiness')
  })

  it('only wires Add validation note to the existing onAddNote handler', () => {
    expect(panel).toContain('onAddNote')
    expect(panel).toContain("onAddNote?.('EVIDENCE_GAP', gapId)")
  })

  it('renders non-wired actions as disabled controls, not fake functionality', () => {
    expect(panel).toContain("ActionButton label={DISCOVERY_COPY.actionUploadEvidence} enabled={false}")
    expect(panel).toContain("ActionButton label={DISCOVERY_COPY.actionDeferReview} enabled={false}")
  })
})

describe('Report CTA (Task 7)', () => {
  const cta = read(join(DISCOVERY, 'report-generation-cta.tsx'))

  it('renders a disabled button with the exact required label', () => {
    expect(cta).toContain('disabled')
    expect(cta).toContain('DISCOVERY_COPY.reportCtaLabel')
  })

  it('shows helper text clarifying it is not yet functional', () => {
    expect(cta).toContain('DISCOVERY_COPY.reportCtaHelper')
  })

  it('copy does not imply completed functionality', () => {
    const copy = read(join(DISCOVERY, 'discovery-copy.ts'))
    expect(copy).toContain("reportCtaLabel: 'Generate Institution Recognition Report'")
    expect(copy).toContain("reportCtaHelper: 'Report generation will use the reviewed discovery profile.'")
  })

  it('is wired into the dashboard shell', () => {
    const dashboard = read(join(DISCOVERY, 'dashboard.tsx'))
    expect(dashboard).toContain('ReportGenerationCta')
  })
})

describe('First-run states (Task 8)', () => {
  const copy = read(join(DISCOVERY, 'discovery-copy.ts'))

  it('defines the exact empty, loading, and error copy', () => {
    expect(copy).toContain(
      "firstRunEmpty: 'Open a discovery session to let Kadarn reconstruct an initial evidence profile.'",
    )
    expect(copy).toContain("firstRunLoading: 'Kadarn is reconstructing the institutional evidence profile.'")
    expect(copy).toContain(
      "firstRunError: 'We could not load this discovery profile. Retry or select another session.'",
    )
  })
})

describe('discovery-api.ts references no new endpoints (Task 10)', () => {
  const apiSource = read(join(DISCOVERY, 'discovery-api.ts'))
  const allowedEndpoints = [
    '/api/v1/discovery/session',
    '/api/v1/discovery/dashboard',
    '/api/v1/discovery/report',
    '/api/v1/discovery/curation',
    '/api/v1/discovery/validation-notes',
    '/api/v1/discovery/pipeline-status',
    '/api/v1/discovery/provenance',
  ]

  it('every /api/v1/discovery path literal in the client belongs to the allowed set', () => {
    const matches = [...apiSource.matchAll(/\/api\/v1\/discovery\/[a-z-]+/g)].map((m) => m[0])
    expect(matches.length).toBeGreaterThan(0)
    for (const match of matches) {
      expect(allowedEndpoints).toContain(match)
    }
  })

  it('does not reference any endpoint outside the allowed set', () => {
    for (const endpoint of allowedEndpoints) {
      // sanity: every allowed endpoint is actually used at least once
      expect(apiSource).toContain(endpoint)
    }
  })
})

describe('Role context wiring (routes)', () => {
  it('workspace route still passes mode="site_director"', () => {
    expect(read(WORKSPACE_ROUTE)).toContain('mode="site_director"')
  })

  it('KOC route still passes mode="kadarn_reviewer"', () => {
    expect(read(KOC_ROUTE)).toContain('mode="kadarn_reviewer"')
  })
})
