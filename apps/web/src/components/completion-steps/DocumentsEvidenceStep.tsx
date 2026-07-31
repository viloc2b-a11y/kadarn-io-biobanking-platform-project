'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@/components/providers/session-provider'
import { apiGet } from '@/lib/api-client'
import type {
  KemsEvidenceSource,
} from '@kadarn/types'

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiEvidenceSourceResponse {
  data: KemsEvidenceSource[]
}

interface ApiClaimEvidenceResponse {
  data: Array<{
    id: string
    claim_id: string
    evidence_id: string
    relationship_type: string
    claim?: { id: string; name: string }
    evidence?: { id: string; content: string; evidence_class: string; status: string }
  }>
}

interface AugmentedEvidence extends KemsEvidenceSource {
  _classification: string
  _isExpired: boolean
  _isQuarantined: boolean
  _isRestricted: boolean
  _linkedClaims: Array<{ id: string; name: string }>
}

// ── Constants ───────────────────────────────────────────────────────────────

const EVIDENCE_CLASS_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: 'Public Independent', color: 'bg-emerald-100 text-emerald-700' },
  B: { label: 'Institutional Documentary', color: 'bg-blue-100 text-blue-700' },
  C: { label: 'Operational', color: 'bg-amber-100 text-amber-700' },
  D: { label: 'Cross-Source Corroboration', color: 'bg-violet-100 text-violet-700' },
  E: { label: 'Temporal Continuity', color: 'bg-cyan-100 text-cyan-700' },
  F: { label: 'External Confirmation', color: 'bg-purple-100 text-purple-700' },
}

const PROCESSING_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
  extracting: { label: 'Extracting', className: 'bg-blue-100 text-blue-700' },
  chunking: { label: 'Chunking', className: 'bg-indigo-100 text-indigo-700' },
  embedding: { label: 'Embedding', className: 'bg-violet-100 text-violet-700' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DocumentsEvidenceStep() {
  const { membership } = useSession()
  const [evidence, setEvidence] = useState<AugmentedEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const institutionId = membership?.org_id ?? ''

  useEffect(() => {
    if (!institutionId) {
      setLoading(false)
      setError('No active institution selected.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      apiGet<ApiEvidenceSourceResponse>(`/api/v1/institutions/${institutionId}/knowledge`),
      apiGet<ApiClaimEvidenceResponse>(`/api/v1/evidence`),
    ])
      .then(([sourcesRes, linksRes]) => {
        if (cancelled) return
        const sources = sourcesRes.data ?? []
        const links = linksRes.data ?? []

        const augmented: AugmentedEvidence[] = sources.map((s) => {
          const linkedLinks = links.filter(
            (l) =>
              l.evidence_id === s.id ||
              (l.evidence && l.evidence.id === s.id)
          )

          const linkedClaims = linkedLinks
            .map((l) => l.claim ?? { id: l.claim_id, name: `Claim ${l.claim_id.slice(0, 8)}` })
            .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)

          return {
            ...s,
            _classification: 'B', // Default to B if unknown
            _isExpired: false,
            _isQuarantined: s.processing_status === 'failed',
            _isRestricted: false,
            _linkedClaims: linkedClaims,
          }
        })

        setEvidence(augmented)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [institutionId])

  // ── Computed ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      if (classFilter !== 'all' && e._classification !== classFilter) return false
      if (statusFilter !== 'all' && e.processing_status !== statusFilter) return false
      return true
    })
  }, [evidence, classFilter, statusFilter])

  const quarantinedCount = evidence.filter((e) => e._isQuarantined).length
  const completedCount = evidence.filter((e) => e.processing_status === 'completed').length
  const linkedCount = evidence.filter((e) => e._linkedClaims.length > 0).length

  const handleUpload = async () => {
    setUploading(true)
    setUploadError('')
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '.pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.png'

      input.onchange = async () => {
        const files = input.files
        if (!files || files.length === 0) {
          setUploading(false)
          return
        }

        // Simulated upload — in production this would use FormData + apiPost
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          // TODO: Replace with actual multipart upload
          console.log(`Uploading: ${file.name} (${file.size} bytes)`)
        }

        setUploading(false)
        // Refresh list
        if (institutionId) {
          const res = await apiGet<ApiEvidenceSourceResponse>(`/api/v1/institutions/${institutionId}/knowledge`)
          setEvidence((prev) => {
            const newSources = (res.data ?? [])
            return newSources.map((s) => {
              const existing = prev.find((p) => p.id === s.id)
              return {
                ...s,
                _classification: existing?._classification ?? 'B',
                _isExpired: existing?._isExpired ?? false,
                _isQuarantined: s.processing_status === 'failed',
                _isRestricted: existing?._isRestricted ?? false,
                _linkedClaims: existing?._linkedClaims ?? [],
              }
            })
          })
        }
      }
      input.click()
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Unable to load documents</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Documents &amp; Evidence</h2>
          <p className="text-sm text-gray-500 mt-1">
            Uploaded documents, classification, expiration dates, claim associations, quarantine and restricted status.
          </p>
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span> Uploading...
            </>
          ) : (
            <>📤 Upload Documents</>
          )}
        </button>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{uploadError}</div>
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatPill label="Total" value={evidence.length} color="purple" />
        <StatPill label="Completed" value={completedCount} color="emerald" />
        <StatPill label="Quarantined" value={quarantinedCount} color="red" />
        <StatPill label="Linked to Claims" value={linkedCount} color="indigo" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Classes</option>
          {Object.entries(EVIDENCE_CLASS_LABELS).map(([key, { label }]) => (
            <option key={key} value={key}>Class {key}: {label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
        >
          <option value="all">All Statuses</option>
          {Object.entries(PROCESSING_BADGE).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Evidence list */}
      {filtered.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No documents match the current filters. Upload documents to populate evidence.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <EvidenceCard key={ev.id} evidence={ev} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    red: 'bg-red-50 border-red-200 text-red-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${colors[color] ?? colors.purple}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </div>
  )
}

function EvidenceCard({ evidence }: { evidence: AugmentedEvidence }) {
  const classInfo = EVIDENCE_CLASS_LABELS[evidence._classification] ?? EVIDENCE_CLASS_LABELS.B
  const processing = PROCESSING_BADGE[evidence.processing_status] ?? PROCESSING_BADGE.pending

  return (
    <div className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${
      evidence._isQuarantined ? 'border-red-300 bg-red-50/30' :
      evidence._isRestricted ? 'border-amber-300' : 'border-gray-200'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">
            {evidence.processing_status === 'completed' ? '📄' : evidence.processing_status === 'failed' ? '❌' : '⏳'}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {evidence.file_name || evidence.label || `Evidence ${evidence.id.slice(0, 8)}`}
            </h3>
            {evidence.description && (
              <p className="text-xs text-gray-500 truncate">{evidence.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {evidence._isQuarantined && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              🚫 Quarantined
            </span>
          )}
          {evidence._isRestricted && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              🔒 Restricted
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${processing.className}`}>
            {processing.label}
          </span>
        </div>
      </div>

      {/* Classification + metadata */}
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 mb-2">
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${classInfo.color}`}>
          Class {evidence._classification}: {classInfo.label}
        </span>
        {evidence.file_type && <span>Type: {evidence.file_type}</span>}
        {evidence.file_size && <span>{formatBytes(evidence.file_size)}</span>}
        {evidence.page_count > 1 && <span>{evidence.page_count} pages</span>}
        {evidence.created_at && (
          <span>Uploaded: {new Date(evidence.created_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Expiration */}
      {/* Note: KemsEvidenceSource does not have expires_at; we use the processed/completed dates as proxy */}
      {evidence.updated_at && new Date(evidence.updated_at) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) && (
        <div className="mb-2">
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
            ⚠️ Potentially expired (last updated {new Date(evidence.updated_at).toLocaleDateString()})
          </span>
        </div>
      )}

      {/* Claim associations */}
      {evidence._linkedClaims.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400 mr-1">Linked claims:</span>
          {evidence._linkedClaims.map((claim) => (
            <span key={claim.id} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {claim.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i]
}
