import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const WEB = join(ROOT, 'apps', 'web', 'src')
const DISCOVERY = join(WEB, 'components', 'discovery')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('Discovery Workbench — routes render both personas', () => {
  it('workspace route renders site director dashboard with session gate', () => {
    const page = read(join(WEB, 'app', '(workspace)', 'workspace', 'discovery', 'page.tsx'))
    expect(page).toContain('DiscoveryInteractionDashboard')
    expect(page).toContain('mode="site_director"')
    expect(page).toContain('DISCOVERY_COPY.signIn')
    expect(page).toContain('PanelSkeleton')
  })

  it('KOC route renders kadarn reviewer dashboard', () => {
    const page = read(join(WEB, 'app', '(koc)', 'koc', 'discovery', 'page.tsx'))
    expect(page).toContain('DiscoveryInteractionDashboard')
    expect(page).toContain('mode="kadarn_reviewer"')
  })
})

describe('Discovery Workbench — tab navigation and accessibility', () => {
  const dashboard = read(join(DISCOVERY, 'dashboard.tsx'))
  const tabBar = read(join(DISCOVERY, 'discovery-tab-bar.tsx'))
  const css = read(join(DISCOVERY, 'discovery-dashboard.css'))

  it('uses ARIA tab pattern with keyboard navigation', () => {
    expect(tabBar).toContain('role="tablist"')
    expect(tabBar).toContain('role="tab"')
    expect(tabBar).toContain('aria-selected')
    expect(tabBar).toContain('aria-controls')
    expect(tabBar).toContain('ArrowRight')
    expect(tabBar).toContain('ArrowLeft')
    expect(tabBar).toContain('Home')
    expect(tabBar).toContain('End')
  })

  it('wires tabpanel with labelledby and focus target', () => {
    expect(dashboard).toContain('role="tabpanel"')
    expect(dashboard).toContain('DiscoveryTabBar')
    expect(dashboard).toContain('aria-labelledby')
    expect(dashboard).toContain('tabPanelRef')
  })

  it('clears stale dashboard and provenance on session switch', () => {
    // Dashboard data is stored in a slot keyed by sessionId, so switching
    // sessions structurally discards stale data (no manual reset needed).
    expect(dashboard).toContain('dashboardSlot.sessionId === selectedSessionId')
    expect(dashboard).toContain('setProvenanceSelection(null)')
  })

  it('session list exposes selected state for assistive tech', () => {
    expect(dashboard).toContain('aria-selected={isActive}')
    expect(dashboard).toContain('role="listbox"')
  })

  it('shows refresh indicator while reloading existing session data', () => {
    expect(dashboard).toContain('refreshing')
    expect(dashboard).toContain('discovery-refresh-badge')
  })
})

describe('Discovery Workbench — responsive layout', () => {
  const css = read(join(DISCOVERY, 'discovery-dashboard.css'))
  const dashboard = read(join(DISCOVERY, 'dashboard.tsx'))

  it('defines mobile stack breakpoint for shell layout', () => {
    expect(css).toContain('.discovery-shell')
    expect(css).toContain('@media (max-width: 768px)')
    expect(css).toContain('grid-template-columns: 1fr')
  })

  it('tab bar supports horizontal scroll on narrow viewports', () => {
    expect(css).toContain('.discovery-tab-bar')
    expect(css).toContain('overflow-x: auto')
    expect(css).toContain('flex-wrap: nowrap')
  })

  it('dashboard shell uses responsive CSS classes', () => {
    expect(dashboard).toContain('className="discovery-shell"')
    expect(dashboard).toContain('className="discovery-sidebar"')
    expect(dashboard).toContain('className="discovery-main"')
    expect(dashboard).toContain("import './discovery-dashboard.css'")
  })

  it('provenance detail list stacks on mobile', () => {
    expect(css).toContain('.discovery-provenance-dl')
    const provenance = read(join(DISCOVERY, 'provenance-panel.tsx'))
    expect(provenance).toContain('discovery-provenance-dl')
  })
})

describe('Discovery Workbench — reviewer workflow forms', () => {
  it('curation form still submits via discovery curation API', () => {
    const panel = read(join(DISCOVERY, 'curation-panel.tsx'))
    expect(panel).toContain('submitCurationAction')
    expect(panel).toContain('Record curation action')
    expect(panel).toContain('FormMessage')
    expect(panel).toContain('CURATION_ACTION_LABELS')
  })

  it('validation notes form still submits via validation-notes API', () => {
    const panel = read(join(DISCOVERY, 'notes-panel.tsx'))
    expect(panel).toContain('submitValidationNote')
    expect(panel).toContain('Record validation note')
    expect(panel).toContain('FormMessage')
    expect(panel).toContain('VALIDATION_CATEGORIES')
  })

  it('provenance links remain accessible from review panels', () => {
    const link = read(join(DISCOVERY, 'view-provenance-link.tsx'))
    expect(link).toContain('View provenance')
    expect(link).toContain('aria-label')
    for (const file of ['entities-panel.tsx', 'relationships-panel.tsx', 'capabilities-panel.tsx', 'claims-panel.tsx']) {
      expect(read(join(DISCOVERY, file))).toContain('ViewProvenanceLink')
    }
  })

  it('metrics strip still reads dashboard metrics payload', () => {
    const strip = read(join(DISCOVERY, 'discovery-metrics-strip.tsx'))
    const dashboard = read(join(DISCOVERY, 'dashboard.tsx'))
    expect(strip).toContain('metrics.artifactsProcessed')
    expect(strip).toContain('HelpTooltip')
    expect(dashboard).toContain('DiscoveryMetricsStrip')
  })
})

describe('Discovery Workbench — shared UX primitives', () => {
  const primitives = read(join(DISCOVERY, 'panel-primitives.tsx'))

  it('empty, loading, and error states expose assistive semantics', () => {
    expect(primitives).toContain('role="status"')
    expect(primitives).toContain('aria-busy="true"')
    expect(primitives).toContain('role="alert"')
    expect(primitives).toContain('FormMessage')
    expect(primitives).toContain('aria-live="polite"')
    expect(primitives).toContain('HelpTooltip')
  })

  it('discovery UX CSS file exists', () => {
    expect(existsSync(join(DISCOVERY, 'discovery-dashboard.css'))).toBe(true)
    expect(existsSync(join(DISCOVERY, 'discovery-tab-bar.tsx'))).toBe(true)
  })
})
