// ==========================================================================
// Continuous Monitoring — Tests (Sprint 22D)
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { ContinuousMonitoringOrchestrator } from '../src/continuous-monitoring/orchestrator.js'

// --------------------------------------------------------------------------

describe('ContinuousMonitoring — idle state', () => {
  it('starts in idle state with no history', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const state = orch.getState()
    expect(state.current_status).toBe('idle')
    expect(state.refresh_history).toHaveLength(0)
  })
})

// --------------------------------------------------------------------------

describe('ContinuousMonitoring — change detection', () => {
  it('detects changes from known sources updated after last refresh', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const changes = orch.checkForChanges([
      { source: 'discovery_session', source_id: 'sess-001', last_seen_at: new Date().toISOString() },
    ])
    expect(changes.length).toBeGreaterThan(0)
    expect(changes[0].source).toBe('discovery_session')
  })

  it('returns no changes when sources are older than last refresh', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    // First refresh to set baseline
    orch.refresh([])
    const changes = orch.checkForChanges([
      { source: 'artifact', source_id: 'art-001', last_seen_at: '2020-01-01T00:00:00Z' },
    ])
    expect(changes).toHaveLength(0)
  })

  it('updates status to stale when changes detected', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    orch.checkForChanges([
      { source: 'discovery_session', source_id: 'sess-002', last_seen_at: new Date().toISOString() },
    ])
    expect(orch.getState().current_status).toBe('stale')
  })

  it('updates status to up_to_date when no changes', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    orch.checkForChanges([])
    expect(orch.getState().current_status).toBe('up_to_date')
  })
})

// --------------------------------------------------------------------------

describe('ContinuousMonitoring — refresh pipeline', () => {
  it('rebuilds capability and gap engines for source changes', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const changes = orch.checkForChanges([
      { source: 'discovery_session', source_id: 's1', last_seen_at: new Date().toISOString() },
    ])
    const result = orch.refresh(changes)
    expect(result.engines_refreshed).toContain('Capability Intelligence Engine')
    expect(result.engines_refreshed).toContain('Evidence Gap Intelligence Engine')
    expect(result.engines_refreshed).toContain('Institutional Capability Assessment Engine')
  })

  it('includes downstream consumers in refresh', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const changes = orch.checkForChanges([
      { source: 'curation_event', source_id: 'c1', last_seen_at: new Date().toISOString() },
    ])
    const result = orch.refresh(changes)
    expect(result.engines_refreshed).toContain('Sponsor Readiness Engine')
    expect(result.engines_refreshed).toContain('Recommendation Engine')
    expect(result.engines_refreshed).toContain('Institution Recognition Report')
  })

  it('no changes → up_to_date, no engines refreshed', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const result = orch.refresh([])
    expect(result.status).toBe('up_to_date')
    expect(result.engines_refreshed).toHaveLength(0)
  })

  it('records refresh history', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    orch.refresh([])
    orch.refresh([])
    expect(orch.getState().refresh_history).toHaveLength(2)
  })
})

// --------------------------------------------------------------------------

describe('ContinuousMonitoring — dashboard indicator', () => {
  it('returns idle indicator initially', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const indicator = orch.getDashboardIndicator()
    expect(indicator.status).toBe('idle')
    expect(indicator.engines_monitored).toBe(7)
  })

  it('returns stale indicator with pending count', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    orch.checkForChanges([
      { source: 'artifact', source_id: 'a1', last_seen_at: new Date().toISOString() },
    ])
    const indicator = orch.getDashboardIndicator()
    expect(indicator.status).toBe('stale')
    expect(indicator.pending_changes).toBe(1)
  })

  it('returns up_to_date after refresh', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    orch.refresh([])
    const indicator = orch.getDashboardIndicator()
    expect(indicator.status).toBe('up_to_date')
  })
})

// --------------------------------------------------------------------------

describe('ContinuousMonitoring — no confidence', () => {
  it('output never contains confidence', () => {
    const orch = new ContinuousMonitoringOrchestrator()
    const json = JSON.stringify(orch.getState())
    expect(json).not.toContain('"confidence"')
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
  })
})
