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
  it('workspace navigation includes Evidence Discovery', () => {
    const nav = read(join(API, 'app', 'api', 'v1', 'workspace', 'navigation', 'route.ts'))
    expect(nav).toContain('/workspace/discovery')
    expect(nav).toContain('Evidence Discovery')
  })

  it('KOC shell includes Discovery under Evidence', () => {
    const shell = read(join(WEB, 'components', 'koc', 'koc-shell.tsx'))
    expect(shell).toContain('/koc/discovery')
  })
})

describe('Discovery Interaction Dashboard — API surface', () => {
  const routes = [
    'session/route.ts',
    'dashboard/route.ts',
    'curation/route.ts',
    'validation-notes/route.ts',
    'provenance/route.ts',
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

  it('dashboard route uses Published View service for capability/claim outputs', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'discovery', 'dashboard', 'route.ts'))
    expect(source).toContain('getPublishedViewService')
    expect(source).toContain('adaptDiscoveryDashboard')
    expect(source).not.toContain('buildAllEngineOutputs')
  })

  it('institution public route uses Published View service', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'institution', 'public', '[slug]', 'route.ts'))
    expect(source).toContain('getPublishedViewService')
    expect(source).toContain('getInstitutionPublicResponse')
    expect(source).not.toContain('buildAllEngineOutputs')
  })

  it('discovery report route uses Published View service', () => {
    const source = read(join(API, 'app', 'api', 'v1', 'discovery', 'report', 'route.ts'))
    expect(source).toContain('getPublishedViewService')
    expect(source).toContain('getDiscoveryReport')
    expect(source).not.toContain('buildAllEngineOutputs')
    expect(source).not.toContain('InstitutionRecognitionReportGenerator')
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
  ]

  for (const file of panelFiles) {
    it(`includes panel component ${file}`, () => {
      expect(existsSync(join(WEB, 'components', 'discovery', file))).toBe(true)
    })
  }

  it('dashboard shell wires all 13 tabs', () => {
    const dashboard = read(join(WEB, 'components', 'discovery', 'dashboard.tsx'))
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
