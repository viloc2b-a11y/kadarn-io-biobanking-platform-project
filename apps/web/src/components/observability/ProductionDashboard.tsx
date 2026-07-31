'use client'

// ============================================================================
// ProductionDashboard — Observability dashboard for KEMS site profile production.
// Shows event metrics, status cards, and health indicators.
//
// Dark Qdrant purple theme: bg #131722, accent #8b86e5, Inter font.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiGet } from '@/lib/api-client'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EventMetrics {
  profiles_created: number
  claims_created: number
  evidence_uploaded: number
  capabilities_activated: number
  total_events_24h: number
  profiles_created_24h: number
  claims_created_24h: number
  evidence_uploaded_24h: number
  capabilities_activated_24h: number
}

export interface StatusCards {
  publishable_profiles: number
  unsupported_claims: number
  expired_evidence: number
  quarantined_files: number
  profiles_in_review: number
  claims_needing_evidence: number
  degraded_capabilities: number
  pending_attestations: number
}

export interface HealthIndicator {
  name: string
  status: 'healthy' | 'degraded' | 'critical' | 'unknown'
  value?: string | number
  last_check?: string
}

export interface DashboardData {
  metrics: EventMetrics
  status: StatusCards
  health: HealthIndicator[]
  last_updated: string
}

export interface ProductionDashboardProps {
  institutionId?: string
  profileId?: string
  refreshIntervalMs?: number
  className?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_REFRESH_MS = 30_000 // 30 seconds
const DASHBOARD_ENDPOINT = '/api/v1/observability/production'

// ─── Mock / fallback data (when API is unavailable) ─────────────────────────

const FALLBACK_DATA: DashboardData = {
  metrics: {
    profiles_created: 42,
    claims_created: 1_287,
    evidence_uploaded: 3_904,
    capabilities_activated: 215,
    total_events_24h: 47,
    profiles_created_24h: 1,
    claims_created_24h: 12,
    evidence_uploaded_24h: 31,
    capabilities_activated_24h: 3,
  },
  status: {
    publishable_profiles: 3,
    unsupported_claims: 18,
    expired_evidence: 47,
    quarantined_files: 5,
    profiles_in_review: 2,
    claims_needing_evidence: 63,
    degraded_capabilities: 1,
    pending_attestations: 4,
  },
  health: [
    { name: 'Database', status: 'healthy', value: '42ms p99', last_check: new Date().toISOString() },
    { name: 'Supabase Auth', status: 'healthy', value: '12ms p99', last_check: new Date().toISOString() },
    { name: 'Storage (S3)', status: 'healthy', value: '89ms p99', last_check: new Date().toISOString() },
    { name: 'Evidence Pipeline', status: 'healthy', value: '1.2s avg', last_check: new Date().toISOString() },
    { name: 'Capability Engine', status: 'degraded', value: 'elevated latency', last_check: new Date().toISOString() },
    { name: 'Passport Generation', status: 'healthy', value: '3.1s avg', last_check: new Date().toISOString() },
    { name: 'RLS Policies', status: 'healthy', value: 'all active', last_check: new Date().toISOString() },
    { name: 'Vector Index', status: 'healthy', value: '98% recall', last_check: new Date().toISOString() },
  ],
  last_updated: new Date().toISOString(),
}

// ─── Styling constants (Qdrant dark purple theme) ───────────────────────────

const COLORS = {
  bg: '#131722',
  card: '#1a1d2e',
  cardHover: '#1e2137',
  border: '#2a2a40',
  accent: '#8b86e5',
  accentSecondary: '#6c63d4',
  text: '#e0e0f0',
  textMuted: '#6b6b80',
  textDim: '#4a4a60',
  success: '#4ade80',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#60a5fa',
  critical: '#dc2626',
  unknown: '#6b7280',
} as const

const metricCardClass =
  'rounded-xl border border-[#2a2a40] bg-[#1a1d2e] p-5 hover:bg-[#1e2137] transition-colors'

const statusBadge = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'bg-[#4ade80]/15 text-[#4ade80]'
    case 'degraded':
      return 'bg-[#f59e0b]/15 text-[#f59e0b]'
    case 'critical':
      return 'bg-[#ef4444]/15 text-[#ef4444]'
    default:
      return 'bg-[#6b7280]/15 text-[#6b7280]'
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
}: {
  label: string
  value: number | string
  delta?: number
  deltaLabel?: string
}) {
  return (
    <div className={metricCardClass}>
      <div className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-[#e0e0f0] font-mono tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {delta !== undefined && (
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          <span
            className={
              delta > 0
                ? 'text-[#4ade80]'
                : delta < 0
                  ? 'text-[#ef4444]'
                  : 'text-[#6b6b80]'
            }
          >
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '—'} {Math.abs(delta)}
          </span>
          {deltaLabel && (
            <span className="text-[#4a4a60]">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

function StatusCard({
  label,
  count,
  icon,
  variant = 'neutral',
}: {
  label: string
  count: number
  icon: string
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const variantStyles: Record<string, string> = {
    success:
      'border-l-[#4ade80] text-[#4ade80]',
    warning:
      'border-l-[#f59e0b] text-[#f59e0b]',
    danger:
      'border-l-[#ef4444] text-[#ef4444]',
    neutral:
      'border-l-[#8b86e5] text-[#8b86e5]',
  }

  return (
    <div
      className={`rounded-xl border border-[#2a2a40] bg-[#1a1d2e] p-4 border-l-4 ${variantStyles[variant]} hover:bg-[#1e2137] transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {count.toLocaleString()}
          </div>
        </div>
        <div className="text-2xl opacity-60">{icon}</div>
      </div>
    </div>
  )
}

function HealthRow({ indicator }: { indicator: HealthIndicator }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-[#1a1d2e] transition-colors">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(indicator.status)}`}
        >
          {indicator.status}
        </span>
        <span className="text-sm text-[#c0c0d0]">{indicator.name}</span>
      </div>
      <div className="flex items-center gap-4">
        {indicator.value && (
          <span className="text-xs text-[#6b6b80] font-mono">
            {indicator.value}
          </span>
        )}
        {indicator.last_check && (
          <span className="text-xs text-[#4a4a60]">
            {new Date(indicator.last_check).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

function LastUpdatedBadge({ timestamp }: { timestamp: string }) {
  const [relative, setRelative] = useState('')

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 1000,
      )
      if (seconds < 60) setRelative(`${seconds}s ago`)
      else if (seconds < 3600) setRelative(`${Math.floor(seconds / 60)}m ago`)
      else setRelative(`${Math.floor(seconds / 3600)}h ago`)
    }
    update()
    const interval = setInterval(update, 10_000)
    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <span className="text-xs text-[#4a4a60]">
      Updated {relative}
    </span>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProductionDashboard({
  institutionId,
  profileId,
  refreshIntervalMs = DEFAULT_REFRESH_MS,
  className = '',
}: ProductionDashboardProps) {
  const [data, setData] = useState<DashboardData>(FALLBACK_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (institutionId) params.set('institution_id', institutionId)
      if (profileId) params.set('profile_id', profileId)

      const result = await apiGet<DashboardData>(
        `${DASHBOARD_ENDPOINT}?${params.toString()}`,
      )
      setData(result)
      setUsingFallback(false)
    } catch (err) {
      // Fall back to mock data if API is unavailable
      setUsingFallback(true)
      const message =
        err instanceof Error ? err.message : 'Failed to fetch dashboard data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [institutionId, profileId])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(fetchData, refreshIntervalMs)
    return () => clearInterval(interval)
  }, [fetchData, refreshIntervalMs])

  // Compute aggregate health status
  const aggregateHealth = useMemo(() => {
    const criticals = data.health.filter((h) => h.status === 'critical').length
    const degradeds = data.health.filter((h) => h.status === 'degraded').length
    if (criticals > 0) return 'critical'
    if (degradeds > 0) return 'degraded'
    return 'healthy'
  }, [data.health])

  return (
    <div
      className={`min-h-screen font-sans ${className}`}
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <header className="border-b border-[#2a2a40] bg-[#1a1d2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: COLORS.accent, color: '#fff' }}
            >
              K
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#e0e0f0]">
                Production Dashboard
              </h1>
              <p className="text-xs text-[#6b6b80]">
                KEMS Site Profile Observability
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {usingFallback && (
              <span className="text-xs px-2 py-1 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] font-medium">
                Offline mode
              </span>
            )}
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  aggregateHealth === 'healthy'
                    ? 'bg-[#4ade80]'
                    : aggregateHealth === 'degraded'
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#ef4444]'
                }`}
              />
              <span className="text-xs text-[#6b6b80] capitalize">
                {aggregateHealth}
              </span>
            </div>
            <LastUpdatedBadge timestamp={data.last_updated} />
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-[#2a2a40] text-xs text-[#c0c0d0] hover:bg-[#1e2137] hover:text-[#e0e0f0] disabled:opacity-50 transition-colors"
              title="Refresh dashboard"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]">
            {error}
            <button
              onClick={fetchData}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Section: Event Metrics ─────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b86e5] uppercase tracking-wider mb-4">
            Event Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Profiles Created"
              value={data.metrics.profiles_created}
              delta={data.metrics.profiles_created_24h}
              deltaLabel="last 24h"
            />
            <MetricCard
              label="Claims Created"
              value={data.metrics.claims_created}
              delta={data.metrics.claims_created_24h}
              deltaLabel="last 24h"
            />
            <MetricCard
              label="Evidence Uploaded"
              value={data.metrics.evidence_uploaded}
              delta={data.metrics.evidence_uploaded_24h}
              deltaLabel="last 24h"
            />
            <MetricCard
              label="Capabilities Activated"
              value={data.metrics.capabilities_activated}
              delta={data.metrics.capabilities_activated_24h}
              deltaLabel="last 24h"
            />
          </div>
          <div className="mt-3 text-xs text-[#4a4a60]">
            Total events in last 24 hours:{' '}
            <span className="text-[#c0c0d0] font-mono">
              {data.metrics.total_events_24h.toLocaleString()}
            </span>
          </div>
        </section>

        {/* ── Section: Status Cards ──────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b86e5] uppercase tracking-wider mb-4">
            Status Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard
              label="Publishable Profiles"
              count={data.status.publishable_profiles}
              icon="📋"
              variant="success"
            />
            <StatusCard
              label="Unsupported Claims"
              count={data.status.unsupported_claims}
              icon="⚠️"
              variant="warning"
            />
            <StatusCard
              label="Expired Evidence"
              count={data.status.expired_evidence}
              icon="⏰"
              variant="danger"
            />
            <StatusCard
              label="Quarantined Files"
              count={data.status.quarantined_files}
              icon="🔒"
              variant="danger"
            />
          </div>
          {/* Secondary status row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatusCard
              label="Profiles In Review"
              count={data.status.profiles_in_review}
              icon="🔍"
              variant="neutral"
            />
            <StatusCard
              label="Claims Needing Evidence"
              count={data.status.claims_needing_evidence}
              icon="📎"
              variant="warning"
            />
            <StatusCard
              label="Degraded Capabilities"
              count={data.status.degraded_capabilities}
              icon="📉"
              variant="warning"
            />
            <StatusCard
              label="Pending Attestations"
              count={data.status.pending_attestations}
              icon="✍️"
              variant="neutral"
            />
          </div>
        </section>

        {/* ── Section: Health Indicators ─────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b86e5] uppercase tracking-wider mb-4">
            System Health
          </h2>
          <div className="rounded-xl border border-[#2a2a40] bg-[#1a1d2e] overflow-hidden">
            <div className="divide-y divide-[#2a2a40]">
              {data.health.map((indicator) => (
                <HealthRow key={indicator.name} indicator={indicator} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="flex items-center justify-between pt-4 border-t border-[#2a2a40]">
          <p className="text-xs text-[#4a4a60]">
            KADARN Platform v2 — KEMS Site Profile Production
          </p>
          <p className="text-xs text-[#4a4a60]">
            {usingFallback
              ? 'Using cached data'
              : `Live data • Refreshes every ${refreshIntervalMs / 1_000}s`}
          </p>
        </footer>
      </main>
    </div>
  )
}

export default ProductionDashboard
