'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  fetchDiscoveryDashboard,
  listDiscoverySessions,
  openDiscoverySession,
} from './discovery-api'
import { DISCOVERY_COPY } from './discovery-copy'
import './discovery-dashboard.css'
import { DiscoveryTabBar } from './discovery-tab-bar'
import {
  DASHBOARD_TABS,
  KADARN_REVIEWER_TAB_ORDER,
  SITE_DIRECTOR_TAB_ORDER,
  type DashboardData,
  type DashboardTab,
  type DiscoverySession,
} from './types'
import { DiscoverySnapshotPanel } from './snapshot-panel'
import { DiscoveryProfilePanel } from './profile-panel'
import { DiscoveryDocumentsPanel } from './documents-panel'
import { DiscoveryEntitiesPanel } from './entities-panel'
import { DiscoveryRelationshipsPanel } from './relationships-panel'
import { DiscoveryTimelinePanel } from './timeline-panel'
import { DiscoveryCapabilitiesPanel } from './capabilities-panel'
import { DiscoveryClaimsPanel } from './claims-panel'
import { DiscoveryGapsPanel } from './gaps-panel'
import { DiscoveryNarrativePanel } from './narrative-panel'
import { DiscoveryCurationPanel } from './curation-panel'
import { DiscoveryNotesPanel, type NotePrefill } from './notes-panel'
import { DiscoveryProvenancePanel } from './provenance-panel'
import { DiscoveryMetricsStrip, EMPTY_DISCOVERY_METRICS } from './discovery-metrics-strip'
import { DiscoveryPipelinePanel } from './pipeline-panel'
import { RecognitionOverviewPanel } from './recognition-overview-panel'
import { SponsorReadinessSummary } from './sponsor-readiness-summary'
import { ResearchAssetsEnabledPanel } from './research-assets-enabled-panel'
import { ReportGenerationCta } from './report-generation-cta'
import { ErrorPanel, PanelSkeleton } from './panel-primitives'
import type { ProvenanceSelection, ProvenanceTargetType } from './types'

export type DiscoveryDashboardMode = 'site_director' | 'kadarn_reviewer'

export interface DiscoveryInteractionDashboardProps {
  mode: DiscoveryDashboardMode
}

const TAB_PANEL_ID = 'discovery-tab-panel'

interface SessionsSlot {
  nonce: number
  data: DiscoverySession[] | null
  error: string | null
}

interface DashboardSlot {
  sessionId: string
  nonce: number
  data: DashboardData | null
  error: string | null
}

export function DiscoveryInteractionDashboard({ mode }: DiscoveryInteractionDashboardProps) {
  const [sessionsSlot, setSessionsSlot] = useState<SessionsSlot | null>(null)
  const [sessionsNonce, setSessionsNonce] = useState(0)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [dashboardSlot, setDashboardSlot] = useState<DashboardSlot | null>(null)
  const [dashboardNonce, setDashboardNonce] = useState(0)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [openingSession, setOpeningSession] = useState(false)
  const [provenanceSelection, setProvenanceSelection] = useState<ProvenanceSelection | null>(null)
  const [notePrefill, setNotePrefill] = useState<NotePrefill | null>(null)
  const tabPanelRef = useRef<HTMLDivElement>(null)
  const sessionsListId = useId()

  // Derived session-list state — loading is "no result for the current request yet".
  const sessionsCurrent = sessionsSlot && sessionsSlot.nonce === sessionsNonce ? sessionsSlot : null
  const sessions = sessionsCurrent?.data ?? sessionsSlot?.data ?? []
  const sessionsError = sessionsCurrent?.error ?? null
  const sessionsLoading = sessionsCurrent === null

  // Derived dashboard state — keyed by session so switching sessions resets the view.
  const dashboardCurrent = dashboardSlot && dashboardSlot.sessionId === selectedSessionId ? dashboardSlot : null
  const dashboard = dashboardCurrent?.data ?? null
  const dashboardError = dashboardCurrent?.error ?? null
  const dashboardLoading = Boolean(selectedSessionId) && (dashboardCurrent === null || dashboardCurrent.nonce !== dashboardNonce)

  const openProvenance = useCallback((targetType: ProvenanceTargetType, targetId: string) => {
    setProvenanceSelection({ targetType, targetId })
    setActiveTab('provenance')
    requestAnimationFrame(() => tabPanelRef.current?.focus())
  }, [])

  const openNoteForTarget = useCallback((targetType: string, targetId: string) => {
    setNotePrefill({ targetType, targetId })
    setActiveTab('notes')
    requestAnimationFrame(() => tabPanelRef.current?.focus())
  }, [])

  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab)
    setNotePrefill(null)
    requestAnimationFrame(() => tabPanelRef.current?.focus())
  }, [])

  useEffect(() => {
    let active = true
    listDiscoverySessions()
      .then((data) => {
        if (!active) return
        setSessionsSlot({ nonce: sessionsNonce, data, error: null })
        if (data.length > 0) {
          setSelectedSessionId((prev) => prev ?? data[0].id)
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        setSessionsSlot({
          nonce: sessionsNonce,
          data: null,
          error: err instanceof Error ? err.message : 'Failed to load discovery sessions',
        })
      })
    return () => {
      active = false
    }
  }, [sessionsNonce])

  useEffect(() => {
    if (!selectedSessionId) return
    const sessionId = selectedSessionId
    const nonce = dashboardNonce
    let active = true
    fetchDiscoveryDashboard(sessionId)
      .then((data) => {
        if (active) setDashboardSlot({ sessionId, nonce, data, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setDashboardSlot({
            sessionId,
            nonce,
            data: null,
            error: err instanceof Error ? err.message : DISCOVERY_COPY.firstRunError,
          })
        }
      })
    return () => {
      active = false
    }
  }, [selectedSessionId, dashboardNonce])

  const selectSession = (id: string) => {
    setSelectedSessionId(id)
    setProvenanceSelection(null)
    setNotePrefill(null)
  }

  const retrySessions = () => setSessionsNonce((n) => n + 1)

  const handleOpenSession = async () => {
    setOpeningSession(true)
    try {
      const session = await openDiscoverySession()
      setSessionsSlot((prev) =>
        prev ? { ...prev, data: [session, ...(prev.data ?? [])], error: null } : prev,
      )
      setSelectedSessionId(session.id)
      setProvenanceSelection(null)
      setNotePrefill(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open discovery session'
      setSessionsSlot((prev) => ({
        nonce: prev?.nonce ?? sessionsNonce,
        data: prev?.data ?? [],
        error: message,
      }))
    } finally {
      setOpeningSession(false)
    }
  }

  const refreshDashboard = () => {
    if (selectedSessionId) setDashboardNonce((n) => n + 1)
  }

  const roleLabel = mode === 'kadarn_reviewer' ? 'Kadarn Reviewer' : 'Site Director'
  const refreshing = dashboardLoading && Boolean(dashboard)
  const activeTabLabel = DASHBOARD_TABS.find((tab) => tab.id === activeTab)?.label ?? activeTab
  const tabOrder = mode === 'kadarn_reviewer' ? KADARN_REVIEWER_TAB_ORDER : SITE_DIRECTOR_TAB_ORDER
  const overviewVariant = mode === 'kadarn_reviewer' ? 'koc' : 'site'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <div style={{ fontSize: 11, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          {DISCOVERY_COPY.eyebrow} · {roleLabel}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--tx)', marginBottom: 6 }}>
          {DISCOVERY_COPY.workbenchTitle}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txdd)', maxWidth: 720 }}>
          {DISCOVERY_COPY.workbenchIntro}
        </p>
      </header>

      {sessionsError ? (
        <ErrorPanel message={sessionsError} onRetry={retrySessions} />
      ) : null}

      <div className="discovery-shell">
        <aside
          className="discovery-sidebar"
          aria-label="Discovery sessions"
          style={{
            borderRadius: 16,
            border: '1px solid rgba(148,163,184,.22)',
            background: 'rgba(15,23,42,.55)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txd)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Sessions
            </div>
            <button
              type="button"
              disabled={openingSession}
              onClick={() => void handleOpenSession()}
              aria-label={openingSession ? 'Opening discovery session' : 'Open new discovery session'}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(59,130,246,.45)',
                background: 'rgba(59,130,246,.18)',
                color: 'var(--tx)',
                fontSize: 11,
                fontWeight: 600,
                cursor: openingSession ? 'wait' : 'pointer',
              }}
            >
              {openingSession ? 'Opening…' : 'Open Session'}
            </button>
          </div>

          <DiscoverySessionList
            listId={sessionsListId}
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            loading={sessionsLoading}
            onSelect={selectSession}
          />
        </aside>

        <section className="discovery-main" aria-label="Discovery session review">
          {sessionsLoading && !dashboard ? (
            <DiscoveryDashboardSkeleton />
          ) : (
            <>
              <DiscoverySessionOverview
                session={dashboard?.session ?? null}
                latestRun={dashboard?.latestRun ?? null}
                counts={dashboard?.counts ?? { artifacts: 0, entities: 0, relationships: 0, candidates: 0 }}
                loading={dashboardLoading && !dashboard}
                refreshing={refreshing}
              />

              <DiscoveryMetricsStrip
                metrics={dashboard?.metrics ?? EMPTY_DISCOVERY_METRICS}
                loading={dashboardLoading && !dashboard}
                refreshing={refreshing}
              />

              {dashboardError ? (
                <ErrorPanel message={dashboardError} onRetry={refreshDashboard} />
              ) : null}

              <DiscoveryTabBar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabPanelId={TAB_PANEL_ID}
                tabOrder={tabOrder}
              />

              <div
                ref={tabPanelRef}
                id={TAB_PANEL_ID}
                role="tabpanel"
                tabIndex={-1}
                aria-labelledby={`discovery-tab-${activeTab}`}
                aria-label={`${activeTabLabel} panel`}
                style={{ minHeight: 320, outline: 'none' }}
              >
                <DiscoveryTabPanel
                  tab={activeTab}
                  data={dashboard}
                  loading={dashboardLoading}
                  sessionId={selectedSessionId}
                  provenanceSelection={provenanceSelection}
                  notePrefill={notePrefill}
                  overviewVariant={overviewVariant}
                  onRefresh={refreshDashboard}
                  onViewProvenance={openProvenance}
                  onNavigateTab={handleTabChange}
                  onAddNote={openNoteForTarget}
                />
              </div>

              <ReportGenerationCta sessionId={selectedSessionId} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function DiscoveryTabPanel({
  tab,
  data,
  loading,
  sessionId,
  provenanceSelection,
  notePrefill,
  overviewVariant,
  onRefresh,
  onViewProvenance,
  onNavigateTab,
  onAddNote,
}: {
  tab: DashboardTab
  data: DashboardData | null
  loading: boolean
  sessionId: string | null
  provenanceSelection: ProvenanceSelection | null
  notePrefill: NotePrefill | null
  overviewVariant: 'site' | 'koc'
  onRefresh: () => void
  onViewProvenance: (targetType: ProvenanceTargetType, targetId: string) => void
  onNavigateTab: (tab: DashboardTab) => void
  onAddNote: (targetType: string, targetId: string) => void
}) {
  switch (tab) {
    case 'overview':
      return (
        <RecognitionOverviewPanel
          data={data}
          loading={loading}
          variant={overviewVariant}
          onNavigateTab={onNavigateTab}
        />
      )
    case 'sponsor_readiness':
      return <SponsorReadinessSummary data={data} loading={loading} />
        case 'research_assets':
          return <ResearchAssetsEnabledPanel data={data} loading={loading} />
    case 'pipeline':
      return (
        <DiscoveryPipelinePanel
          sessionId={sessionId}
          loading={loading}
          onNavigateTab={onNavigateTab}
        />
      )
    case 'snapshot':
      return <DiscoverySnapshotPanel data={data} loading={loading} />
    case 'profile':
      return <DiscoveryProfilePanel data={data} loading={loading} />
    case 'documents':
      return <DiscoveryDocumentsPanel data={data} loading={loading} />
    case 'entities':
      return <DiscoveryEntitiesPanel data={data} loading={loading} onViewProvenance={onViewProvenance} />
    case 'relationships':
      return <DiscoveryRelationshipsPanel data={data} loading={loading} onViewProvenance={onViewProvenance} />
    case 'timeline':
      return <DiscoveryTimelinePanel data={data} loading={loading} />
    case 'capabilities':
      return <DiscoveryCapabilitiesPanel data={data} loading={loading} onViewProvenance={onViewProvenance} />
    case 'claims':
      return <DiscoveryClaimsPanel data={data} loading={loading} onViewProvenance={onViewProvenance} />
    case 'gaps':
      return <DiscoveryGapsPanel data={data} loading={loading} onAddNote={onAddNote} />
    case 'narrative':
      return <DiscoveryNarrativePanel data={data} loading={loading} />
    case 'curation':
      return <DiscoveryCurationPanel data={data} loading={loading} onSubmitted={onRefresh} onAddNote={onAddNote} />
    case 'notes':
      return <DiscoveryNotesPanel data={data} loading={loading} onSubmitted={onRefresh} prefill={notePrefill} />
    case 'provenance':
      return (
        <DiscoveryProvenancePanel
          sessionId={sessionId}
          selection={provenanceSelection}
          loading={loading}
        />
      )
    default:
      return null
  }
}

function DiscoverySessionList({
  listId,
  sessions,
  selectedSessionId,
  loading,
  onSelect,
}: {
  listId: string
  sessions: DiscoverySession[]
  selectedSessionId: string | null
  loading: boolean
  onSelect: (id: string) => void
}) {
  if (loading && sessions.length === 0) {
    return <PanelSkeleton rows={2} label="Loading discovery sessions" />
  }

  if (sessions.length === 0) {
    return (
      <div style={{ color: 'var(--txdd)', fontSize: 13, textAlign: 'center', padding: '12px 0' }} role="status">
        <div>{DISCOVERY_COPY.sessionEmpty}</div>
        <div style={{ fontSize: 11, color: 'var(--txd)', marginTop: 6 }}>
          {DISCOVERY_COPY.sessionEmptyHint}
        </div>
      </div>
    )
  }

  return (
    <div id={listId} role="listbox" aria-label="Discovery sessions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sessions.map((session) => {
        const isActive = selectedSessionId === session.id
        return (
          <button
            key={session.id}
            type="button"
            role="option"
            aria-selected={isActive}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: isActive ? '1px solid rgba(59,130,246,.45)' : '1px solid rgba(148,163,184,.25)',
              background: isActive ? 'rgba(59,130,246,.18)' : 'rgba(15,23,42,.45)',
              color: 'var(--tx)',
              textAlign: 'left',
              fontSize: 13,
              cursor: 'pointer',
            }}
            onClick={() => onSelect(session.id)}
          >
            <div style={{ fontWeight: 600 }}>Session {session.id.slice(0, 8)}</div>
            <div style={{ fontSize: 11, color: 'var(--txdd)', marginTop: 2 }}>
              {new Date(session.created_at).toLocaleString()} · {session.status.replace(/_/g, ' ')}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DiscoverySessionOverview({
  session,
  latestRun,
  counts,
  loading,
  refreshing,
}: {
  session: DashboardData['session'] | null
  latestRun: DashboardData['latestRun'] | null
  counts: DashboardData['counts']
  loading: boolean
  refreshing: boolean
}) {
  if (!session) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: '1px dashed rgba(148,163,184,.25)',
          background: 'rgba(15,23,42,.45)',
          padding: 18,
          color: 'var(--txdd)',
          fontSize: 13,
        }}
        role="status"
        aria-busy={loading}
      >
        {loading ? DISCOVERY_COPY.firstRunLoading : DISCOVERY_COPY.firstRunEmpty}
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid rgba(148,163,184,.25)',
        background: 'rgba(15,23,42,.45)',
        padding: 18,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
      }}
      aria-busy={refreshing}
    >
      <OverviewStat
        label="Session"
        value={session.id.slice(0, 8)}
        extra={refreshing ? <span className="discovery-refresh-badge">Updating</span> : null}
      />
      <OverviewStat label="Status" value={session.status.replace(/_/g, ' ')} />
      <OverviewStat label="Latest run" value={latestRun ? latestRun.id.slice(0, 8) : '—'} />
      <OverviewStat label="Run status" value={latestRun ? latestRun.status.replace(/_/g, ' ') : '—'} />
      <OverviewStat label="Artifacts" value={counts.artifacts} />
      <OverviewStat label="Entities" value={counts.entities} />
      <OverviewStat label="Relationships" value={counts.relationships} />
      <OverviewStat label="Claim candidates" value={counts.candidates} />
    </div>
  )
}

function OverviewStat({
  label,
  value,
  extra,
}: {
  label: string
  value: string | number
  extra?: ReactNode
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--txdd)', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 }}>
        {label}
        {extra}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tx)' }}>{value}</div>
    </div>
  )
}

function DiscoveryDashboardSkeleton() {
  return (
    <div className="discovery-main" aria-busy="true" aria-label="Loading discovery workbench">
      <PanelSkeleton rows={1} />
      <PanelSkeleton rows={2} />
      <PanelSkeleton rows={5} />
    </div>
  )
}
