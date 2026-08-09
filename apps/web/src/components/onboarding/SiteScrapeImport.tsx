'use client'

// ==========================================================================
// SiteScrapeImport — Quick Import via website URL scraping.
//
// Prominent first card in the OrganizationStep onboarding flow.
// The user pastes their institution's URL, KADARN scrapes and extracts
// structured data via LLM, and returns a field-by-field review card.
// Each field can be individually approved or rejected before pre-populating
// the form. This is the "wow moment" for sales demos.
//
// Light theme: blue accent, white backgrounds, matches onboarding flow.
// ==========================================================================

import { useState, useCallback } from 'react'
import { apiPost } from '@/lib/api-client'
import type { OrganizationStepData } from './OrganizationStep'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScrapedField {
  value: string | string[] | null
  confidence: number
  source: string
  rationale: string
}

export interface ScrapeResult {
  url: string
  title: string
  fields: {
    name: ScrapedField
    description: ScrapedField
    institution_type: ScrapedField
    founded_year: ScrapedField
    mission_statement: ScrapedField
    website: ScrapedField
    dba_name: ScrapedField
    research_focus: ScrapedField
    therapeutic_areas: ScrapedField
    research_modalities: ScrapedField
    locations: ScrapedField
    people: ScrapedField
    contact_email: ScrapedField
    contact_phone: ScrapedField
  }
  raw_text_sample: string
  error?: string
}

interface FieldReview {
  key: string
  label: string
  field: ScrapedField
  approved: boolean
}

type ScrapeStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Constants ──────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  name: 'Institution Name',
  description: 'Description',
  institution_type: 'Institution Type',
  founded_year: 'Founded Year',
  mission_statement: 'Mission Statement',
  website: 'Website',
  dba_name: 'DBA / Trade Name',
  research_focus: 'Research Programs',
  therapeutic_areas: 'Therapeutic Expertise',
  research_modalities: 'Research Modalities',
  locations: 'Locations',
  people: 'People',
  contact_email: 'Contact Email',
  contact_phone: 'Contact Phone',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-red-400 bg-red-500/10 border-red-500/30',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function confidenceLabel(c: number): string {
  if (c >= 0.7) return 'high'
  if (c >= 0.4) return 'medium'
  return 'low'
}

function formatValue(value: string | string[] | null): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function QuickImportIcon() {
  return (
    <span className="text-blue-600 font-bold text-sm">→</span>
  )
}

function LoadingPulse() {
  return (
    <div className="flex items-center gap-4 p-6 rounded-xl border border-blue-500/20 bg-blue-50">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">Analyzing website...</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Extracting institution profile, research focus, therapeutic areas, people, and locations.
        </p>
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level = confidenceLabel(confidence)
  const pct = Math.round(confidence * 100)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${CONFIDENCE_COLORS[level]}`}>
      {level === 'high' ? '✓' : level === 'medium' ? '~' : '?'} {pct}%
    </span>
  )
}

function FieldReviewRow({
  item,
  onToggle,
}: {
  item: FieldReview
  onToggle: () => void
}) {
  const hasValue = item.field.value !== null && item.field.value !== undefined &&
    !(Array.isArray(item.field.value) && item.field.value.length === 0)

  if (!hasValue) return null // don't show empty fields

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
        item.approved
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-gray-200 bg-white hover:border-blue-500/20'
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className="mt-0.5 shrink-0">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            item.approved
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 bg-transparent'
          }`}
        >
          {item.approved && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{item.label}</span>
          <ConfidenceBadge confidence={item.field.confidence} />
        </div>
        <div className="text-sm text-gray-600 truncate">{formatValue(item.field.value)}</div>
        {item.field.rationale && (
          <div className="text-[10px] text-gray-400 mt-1 italic">{item.field.rationale}</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export interface SiteScrapeImportProps {
  onApply: (fields: Partial<OrganizationStepData>) => void
}

export function SiteScrapeImport({ onApply }: SiteScrapeImportProps) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<ScrapeStatus>('idle')
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [reviews, setReviews] = useState<FieldReview[]>([])
  const [error, setError] = useState<string | null>(null)

  // Build review list from result
  const buildReviews = useCallback((res: ScrapeResult) => {
    const items: FieldReview[] = []
    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      const field = (res.fields as Record<string, ScrapedField>)[key]
      if (!field) continue
      const hasValue = field.value !== null && field.value !== undefined &&
        !(Array.isArray(field.value) && field.value.length === 0)
      if (!hasValue) continue
      items.push({
        key,
        label,
        field,
        approved: field.confidence >= 0.4, // auto-approve medium+ confidence
      })
    }
    setReviews(items)
  }, [])

  // Handle scrape
  const handleScrape = useCallback(async () => {
    if (!url.trim()) return

    setStatus('loading')
    setError(null)
    setResult(null)
    setReviews([])

    try {
      const res = await apiPost<{ data: ScrapeResult }>('/api/v1/site-profiles/scrape', { url: url.trim() })
      const data = (res as unknown as { data: ScrapeResult }).data
      if (!data) throw new Error('No data returned')
      setResult(data)
      buildReviews(data)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Scrape failed')
    }
  }, [url, buildReviews])

  // Toggle individual field
  const toggleField = useCallback((key: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.key === key ? { ...r, approved: !r.approved } : r)),
    )
  }, [])

  // Select all / deselect all
  const selectAll = useCallback(() => {
    setReviews((prev) => prev.map((r) => ({ ...r, approved: true })))
  }, [])
  const deselectAll = useCallback(() => {
    setReviews((prev) => prev.map((r) => ({ ...r, approved: false })))
  }, [])

  // Apply approved fields to parent form
  const handleApply = useCallback(() => {
    const patch: Partial<OrganizationStepData> = {}

    for (const review of reviews) {
      if (!review.approved) continue
      const val = review.field.value
      if (val === null || val === undefined) continue

      switch (review.key) {
        case 'name':
          patch.name = String(val)
          break
        case 'description':
          patch.description = String(val)
          break
        case 'institution_type':
          patch.institution_type = String(val)
          break
        case 'founded_year':
          patch.founded_year = String(val)
          break
        case 'mission_statement':
          patch.mission_statement = String(val)
          break
        case 'website':
          patch.website = String(val)
          break
        case 'dba_name':
          patch.dba_name = String(val)
          break
        case 'research_focus':
          patch.research_focus = Array.isArray(val) ? val : [String(val)]
          break
        case 'therapeutic_areas':
          patch.therapeutic_areas = Array.isArray(val) ? val : [String(val)]
          break
        case 'research_modalities':
          patch.research_modalities = Array.isArray(val) ? val : [String(val)]
          break
        // locations, people, contact_email, contact_phone are extracted
        // but don't directly map to OrganizationStepData — they can be
        // used for PeopleStep / LocationsStep downstream.
      }
    }

    onApply(patch)
  }, [reviews, onApply])

  const approvedCount = reviews.filter((r) => r.approved).length
  const totalCount = reviews.length

  return (
    <div className="space-y-4">
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 border border-blue-500/20">
          <QuickImportIcon />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Quick Import
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          Paste your institution&rsquo;s website URL and KADARN will extract your profile automatically.
        </span>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* URL Input */}
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                placeholder="https://www.your-institution.org"
                disabled={status === 'loading'}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleScrape}
              disabled={status === 'loading' || !url.trim()}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <QuickImportIcon />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="px-5 py-4">
            <LoadingPulse />
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="px-5 py-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium text-red-400">Analysis failed</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => { setStatus('idle'); setError(null) }}
                className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'success' && result && reviews.length > 0 && (
          <div className="px-5 py-4 space-y-4">
            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Found {totalCount} fields from {result.title || result.url}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Review and approve the fields you want to import. High-confidence fields are pre-selected.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[10px] text-blue-600 hover:text-[#3b82f6] transition-colors"
                >
                  Select all
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[10px] text-gray-500 hover:text-gray-600 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Field review list */}
            <div className="space-y-2">
              {reviews.map((item) => (
                <FieldReviewRow
                  key={item.key}
                  item={item}
                  onToggle={() => toggleField(item.key)}
                />
              ))}
            </div>

            {/* Apply button */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {approvedCount} of {totalCount} fields selected
              </span>
              <button
                type="button"
                onClick={handleApply}
                disabled={approvedCount === 0}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Apply {approvedCount} Fields →
              </button>
            </div>
          </div>
        )}

        {/* Empty / no results */}
        {status === 'success' && result && reviews.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-500">
              No structured fields could be extracted from this website.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try a different URL or continue filling the form manually.
            </p>
          </div>
        )}

        {/* Idle state — show inside the card body */}
        {status === 'idle' && (
          <div className="px-5 py-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-500/10">
              <div className="mt-0.5 text-blue-600">
                <QuickImportIcon />
              </div>
              <div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-medium text-gray-900">Save time.</span> Enter your
                  institution&rsquo;s website URL above and KADARN will automatically extract your
                  organization name, type, research focus, therapeutic areas, mission statement,
                  and more.
                </p>
                <p className="text-[10px] text-gray-500 mt-2">
                  You&rsquo;ll review and approve every field before it&rsquo;s imported.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SiteScrapeImport
