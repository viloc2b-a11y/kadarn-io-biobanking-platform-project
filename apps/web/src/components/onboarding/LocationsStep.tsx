'use client'

// ==========================================================================
// LocationsStep — Site Profile onboarding: multiple locations, services by
// location, operating hours, regulatory jurisdiction.
// Fetches / posts to /api/v1/site-profiles.
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { SiteProfile } from '@kadarn/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocationEntry {
  id: string
  name: string
  location_type: string
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  postal_code: string
  country: string
  timezone: string
  phone: string
  is_primary: boolean
  services: string[]
  operating_hours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  regulatory_jurisdiction: string
  regulatory_authority: string
  site_identifier: string
}

export interface LocationsStepData {
  locations: LocationEntry[]
}

export interface LocationsStepProps {
  profileId?: string
  organizationId?: string
  initialData?: Partial<LocationsStepData>
  onComplete?: (data: LocationsStepData) => void
  onBack?: () => void
  onSave?: (data: LocationsStepData) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCATION_TYPE_OPTIONS = [
  'Clinic', 'Hospital', 'Laboratory', 'Phase 1 Unit',
  'Pharmacy', 'Office', 'Storage / Warehouse', 'Other',
] as const

const SERVICE_OPTIONS = [
  'Inpatient Care', 'Outpatient Clinic', 'Emergency Department',
  'ICU', 'Surgery Suite', 'Imaging / Radiology',
  'Clinical Lab (onsite)', 'Pathology', 'Pharmacy (onsite)',
  'Infusion Suite', 'Overnight Observation', 'Rehabilitation',
  'Telehealth', 'Mobile Research Unit', 'Specimen Processing',
] as const

const JURISDICTION_OPTIONS = [
  'FDA (United States)', 'EMA (European Union)', 'MHRA (United Kingdom)',
  'Health Canada', 'TGA (Australia)', 'PMDA (Japan)',
  'NMPA (China)', 'ANVISA (Brazil)', 'CDSCO (India)',
  'MFDS (South Korea)', 'HSA (Singapore)', 'Swissmedic (Switzerland)',
  'Other',
] as const

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let _locCounter = 0
function nextLocationId(): string {
  _locCounter += 1
  return `loc-${Date.now()}-${_locCounter}`
}

function createLocation(index: number): LocationEntry {
  return {
    id: nextLocationId(),
    name: '',
    location_type: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    timezone: '',
    phone: '',
    is_primary: index === 0,
    services: [],
    operating_hours: {
      monday: '08:00-17:00',
      tuesday: '08:00-17:00',
      wednesday: '08:00-17:00',
      thursday: '08:00-17:00',
      friday: '08:00-17:00',
      saturday: '',
      sunday: '',
    },
    regulatory_jurisdiction: '',
    regulatory_authority: '',
    site_identifier: '',
  }
}

function toggleArray(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-sm text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors'

const labelClass = 'block text-xs font-medium text-[#6b6b80] uppercase tracking-wider mb-1'

const cardClass = 'rounded-xl border border-[#1e1e35] bg-[#0d0d22]/60 overflow-hidden'
const cardHeaderClass = 'px-5 py-3 border-b border-[#1e1e35] flex items-center justify-between gap-3'
const cardBodyClass = 'px-5 py-4 space-y-4'

// ─── HourInput ──────────────────────────────────────────────────────────────

function HourInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="text"
      className="w-28 rounded-md border border-[#2a2a40] bg-[#0f0f1a] px-2 py-1 text-xs text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-1 focus:ring-[#8b86e5]/50"
      placeholder="08:00-17:00"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ─── TagToggle ──────────────────────────────────────────────────────────────

function TagToggle({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
        selected
          ? 'bg-[#8b86e5]/15 border-[#8b86e5]/40 text-[#8b86e5]'
          : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/25 hover:text-[#c0c0d0]'
      }`}
    >
      {label}
    </button>
  )
}

// ─── LocationCard ───────────────────────────────────────────────────────────

function LocationCard({
  location,
  index,
  total,
  onChange,
  onSetPrimary,
  onDelete,
  onDuplicate,
}: {
  location: LocationEntry
  index: number
  total: number
  onChange: (patch: Partial<LocationEntry>) => void
  onSetPrimary: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const summary = [location.city, location.state_province].filter(Boolean).join(', ') || 'Location details pending'

  return (
    <div className={cardClass}>
      <div className={cardHeaderClass}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="text-sm text-[#e0e0f0] truncate">
              {location.name || `Location ${index + 1}`}
            </strong>
            {location.is_primary && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b86e5]/20 text-[#8b86e5] border border-[#8b86e5]/30">
                Primary
              </span>
            )}
          </div>
          <div className="text-xs text-[#4a4a60] mt-0.5">{summary}</div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {!location.is_primary && (
            <button type="button" onClick={onSetPrimary} className="text-[10px] text-[#6b6b80] hover:text-[#8b86e5] px-2 py-1 rounded hover:bg-white/5 transition-colors">
              Set Primary
            </button>
          )}
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] text-[#6b6b80] hover:text-[#c0c0d0] px-2 py-1 rounded hover:bg-white/5 transition-colors">
            {expanded ? 'Collapse' : 'Edit'}
          </button>
          <button type="button" onClick={onDuplicate} className="text-[10px] text-[#6b6b80] hover:text-[#c0c0d0] px-2 py-1 rounded hover:bg-white/5 transition-colors">
            Duplicate
          </button>
          {total > 1 && (
            <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className={cardBodyClass}>
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Location Name</label>
              <input type="text" className={inputClass} placeholder="e.g., Main Clinic" value={location.name} onChange={(e) => onChange({ name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Location Type</label>
              <select className={inputClass} value={location.location_type} onChange={(e) => onChange({ location_type: e.target.value })}>
                <option value="">Select type...</option>
                {LOCATION_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Address Line 1</label>
              <input type="text" className={inputClass} placeholder="Street address" value={location.address_line1} onChange={(e) => onChange({ address_line1: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address Line 2</label>
              <input type="text" className={inputClass} placeholder="Suite, building, etc." value={location.address_line2} onChange={(e) => onChange({ address_line2: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input type="text" className={inputClass} placeholder="City" value={location.city} onChange={(e) => onChange({ city: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>State / Province</label>
              <input type="text" className={inputClass} placeholder="State" value={location.state_province} onChange={(e) => onChange({ state_province: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Postal Code</label>
              <input type="text" className={inputClass} placeholder="ZIP / Postcode" value={location.postal_code} onChange={(e) => onChange({ postal_code: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" className={inputClass} placeholder="Country" value={location.country} onChange={(e) => onChange({ country: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <input type="text" className={inputClass} placeholder="e.g., America/Chicago" value={location.timezone} onChange={(e) => onChange({ timezone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" className={inputClass} placeholder="Phone number" value={location.phone} onChange={(e) => onChange({ phone: e.target.value })} />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className={labelClass}>Operating Hours</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {DAYS.map((day) => (
                <div key={day} className="text-center">
                  <div className="text-[10px] text-[#4a4a60] mb-0.5">{DAY_LABELS[day]}</div>
                  <HourInput
                    value={location.operating_hours[day]}
                    onChange={(v) => onChange({ operating_hours: { ...location.operating_hours, [day]: v } })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <label className={labelClass}>Services at this Location</label>
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_OPTIONS.map((svc) => (
                <TagToggle
                  key={svc}
                  label={svc}
                  selected={location.services.includes(svc)}
                  onToggle={() => onChange({ services: toggleArray(location.services, svc) })}
                />
              ))}
            </div>
          </div>

          {/* Regulatory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Regulatory Jurisdiction</label>
              <select className={inputClass} value={location.regulatory_jurisdiction} onChange={(e) => onChange({ regulatory_jurisdiction: e.target.value })}>
                <option value="">Select jurisdiction...</option>
                {JURISDICTION_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Regulatory Authority</label>
              <input type="text" className={inputClass} placeholder="e.g., FDA" value={location.regulatory_authority} onChange={(e) => onChange({ regulatory_authority: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Site Identifier / FEI</label>
              <input type="text" className={inputClass} placeholder="Facility identifier" value={location.site_identifier} onChange={(e) => onChange({ site_identifier: e.target.value })} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LocationsStep({
  profileId,
  organizationId,
  initialData,
  onComplete,
  onBack,
  onSave,
}: LocationsStepProps) {
  const [locations, setLocations] = useState<LocationEntry[]>(
    initialData?.locations && initialData.locations.length > 0
      ? initialData.locations
      : [createLocation(0)]
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedProfileId, setSavedProfileId] = useState<string | undefined>(profileId)

  // Load existing profile
  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    setLoading(true)
    apiGet<{ data: SiteProfile }>(`/api/v1/site-profiles/${profileId}`)
      .then((res) => {
        if (cancelled || !res?.data) return
        const content = res.data.content as Record<string, unknown> ?? {}
        if (Array.isArray(content.locations) && (content.locations as LocationEntry[]).length > 0) {
          setLocations(content.locations as LocationEntry[])
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profileId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    const content = { locations }
    try {
      if (savedProfileId) {
        await apiPatch(`/api/v1/site-profiles/${savedProfileId}`, { content })
      } else {
        const profile = await apiPost<{ data: SiteProfile }>('/api/v1/site-profiles', {
          organization_id: organizationId,
          name: 'Untitled Site Profile',
          content,
        }).then((res) => (res as { data: SiteProfile }).data)
        setSavedProfileId(profile.id)
      }
      onSave?.({ locations })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [locations, savedProfileId, organizationId, onSave])

  const handleContinue = useCallback(async () => {
    await handleSave()
    if (!error) onComplete?.({ locations })
  }, [handleSave, error, locations, onComplete])

  const updateLocation = useCallback((id: string, patch: Partial<LocationEntry>) => {
    setLocations((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l))
  }, [])

  const addLocation = useCallback(() => {
    setLocations((prev) => [...prev, createLocation(prev.length)])
  }, [])

  const deleteLocation = useCallback((id: string) => {
    setLocations((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((l) => l.id !== id)
      // If deleted the primary, make the first remaining one primary
      if (prev.find((l) => l.id === id)?.is_primary && next.length > 0) {
        next[0] = { ...next[0], is_primary: true }
      }
      return next
    })
  }, [])

  const setPrimary = useCallback((id: string) => {
    setLocations((prev) => prev.map((l) => ({ ...l, is_primary: l.id === id })))
  }, [])

  const duplicateLocation = useCallback((loc: LocationEntry) => {
    setLocations((prev) => [...prev, { ...loc, id: nextLocationId(), name: loc.name ? `${loc.name} Copy` : '', is_primary: false }])
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b80]">Loading location data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">Locations</h2>
        <p className="text-sm text-[#6b6b80]">
          Define the physical locations where your institution operates. Add operating hours, available services, and regulatory jurisdiction for each location.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4 mb-8">
        {locations.map((loc, idx) => (
          <LocationCard
            key={loc.id}
            location={loc}
            index={idx}
            total={locations.length}
            onChange={(patch) => updateLocation(loc.id, patch)}
            onSetPrimary={() => setPrimary(loc.id)}
            onDelete={() => deleteLocation(loc.id)}
            onDuplicate={() => duplicateLocation(loc)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addLocation}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[#2a2a40] text-sm text-[#6b6b80] hover:border-[#8b86e5]/40 hover:text-[#8b86e5] transition-colors mb-8"
      >
        + Add Location
      </button>

      <div className="flex justify-between items-center pt-8 border-t border-[#1e1e35]">
        {onBack ? (
          <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 transition-colors">
            ← Back
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 disabled:opacity-40 transition-colors">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={handleContinue} disabled={saving} className="px-5 py-2 rounded-lg bg-[#8b86e5] text-white text-sm font-medium hover:bg-[#7a75d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationsStep
