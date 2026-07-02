// ==========================================================================
// Continuous Monitoring — Types + Orchestrator (Sprint 22D)
// ==========================================================================
//
// Living institutional intelligence. Monitors evidence continuously,
// detects changes, and triggers rebuilds of canonical engines.
//
// No new intelligence. Reuses existing Discovery. No Evidence Core writes.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type MonitoringSource = 'discovery_session' | 'artifact' | 'curation_event' | 'validation_note'

export type RefreshStatus = 'idle' | 'checking' | 'refreshing' | 'up_to_date' | 'stale'

export interface SourceChange {
  source: MonitoringSource
  source_id: string
  detected_at: string
  change_type: 'created' | 'updated' | 'deleted'
  description: string
}

export interface RefreshResult {
  status: RefreshStatus
  changes_detected: number
  engines_refreshed: string[]
  started_at: string
  completed_at: string | null
  errors: string[]
}

export interface MonitoringState {
  last_check_at: string | null
  last_refresh_at: string | null
  current_status: RefreshStatus
  pending_changes: number
  refresh_history: RefreshResult[]
}

// --------------------------------------------------------------------------
// ContinuousMonitoringOrchestrator
// --------------------------------------------------------------------------

export class ContinuousMonitoringOrchestrator {
  private state: MonitoringState

  constructor() {
    this.state = {
      last_check_at: null,
      last_refresh_at: null,
      current_status: 'idle',
      pending_changes: 0,
      refresh_history: [],
    }
  }

  /**
   * Check for changes since last refresh.
   * In production, this would query Discovery session/artifact timestamps.
   * For Sprint 22D, we define the contract and deterministic detection logic.
   */
  checkForChanges(knownSources: Array<{ source: MonitoringSource; source_id: string; last_seen_at: string }>): SourceChange[] {
    const now = new Date().toISOString()
    const changes: SourceChange[] = []

    for (const src of knownSources) {
      const lastSeen = new Date(src.last_seen_at).getTime()
      const threshold = Date.now() - 60_000 // 1 minute threshold for demo

      if (lastSeen > (this.state.last_refresh_at ? new Date(this.state.last_refresh_at).getTime() : 0)) {
        changes.push({
          source: src.source,
          source_id: src.source_id,
          detected_at: now,
          change_type: 'updated',
          description: `${src.source} ${src.source_id} has been updated since last refresh`,
        })
      }
    }

    this.state.last_check_at = now
    this.state.pending_changes = changes.length
    this.state.current_status = changes.length > 0 ? 'stale' : 'up_to_date'

    return changes
  }

  /**
   * Trigger a refresh of canonical engines.
   * Returns which engines would be rebuilt (orchestration only — no actual rebuild).
   */
  refresh(changes: SourceChange[]): RefreshResult {
    const now = new Date().toISOString()
    const engines: string[] = []

    if (changes.length === 0) {
      this.state.current_status = 'up_to_date'
      const result: RefreshResult = {
        status: 'up_to_date',
        changes_detected: 0,
        engines_refreshed: [],
        started_at: now,
        completed_at: now,
        errors: [],
      }
      this.state.refresh_history.push(result)
      return result
    }

    this.state.current_status = 'refreshing'

    // Deterministic engine rebuild order based on dependency chain
    const hasSourceChanges = changes.some((c) =>
      ['discovery_session', 'artifact'].includes(c.source),
    )
    const hasCurationChanges = changes.some((c) =>
      ['curation_event', 'validation_note'].includes(c.source),
    )

    if (hasSourceChanges) {
      engines.push('Capability Intelligence Engine')
      engines.push('Evidence Gap Intelligence Engine')
    }

    if (hasSourceChanges || hasCurationChanges) {
      engines.push('Institutional Capability Assessment Engine')
    }

    // Always refresh downstream consumers
    engines.push('Sponsor Readiness Engine')
    engines.push('Recommendation Engine')
    engines.push('Institution Recognition Report')

    const result: RefreshResult = {
      status: 'refreshing',
      changes_detected: changes.length,
      engines_refreshed: engines,
      started_at: now,
      completed_at: null, // would be set after actual rebuild completes
      errors: [],
    }

    this.state.current_status = 'up_to_date'
    this.state.last_refresh_at = now
    this.state.pending_changes = 0
    this.state.refresh_history.push({ ...result, completed_at: now, status: 'up_to_date' })

    return result
  }

  /**
   * Get the current monitoring state.
   */
  getState(): MonitoringState {
    return { ...this.state }
  }

  /**
   * Generate a dashboard-ready refresh indicator.
   */
  getDashboardIndicator(): {
    status: RefreshStatus
    last_refresh: string | null
    pending_changes: number
    engines_monitored: number
    label: string
  } {
    return {
      status: this.state.current_status,
      last_refresh: this.state.last_refresh_at,
      pending_changes: this.state.pending_changes,
      engines_monitored: 7,
      label:
        this.state.current_status === 'up_to_date'
          ? 'All engines up to date'
          : this.state.current_status === 'stale'
            ? `${this.state.pending_changes} change(s) pending refresh`
            : 'Checking for changes...',
    }
  }
}
