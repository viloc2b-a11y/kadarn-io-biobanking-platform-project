'use client'

// ==========================================================================
// InfrastructureStep — Site Profile onboarding: rooms, overnight observation,
// lab, pharmacy, processing areas, backup power.
// Fetches / posts to /api/v1/site-profiles.
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { SiteProfile } from '@kadarn/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InfrastructureEntry {
  id: string
  location_id: string
  location_name: string
  facility_type: string
  total_square_footage: string
  dedicated_research_space: string
  exam_rooms: string
  consultation_rooms: string
  overnight_observation_beds: string
  has_overnight_observation: boolean
  has_infusion_suite: boolean
  infusion_chairs: string
  has_laboratory: boolean
  laboratory_type: string
  lab_certifications: string[]
  has_pharmacy: boolean
  pharmacy_type: string
  pharmacy_certifications: string[]
  has_specimen_processing: boolean
  specimen_processing_areas: string[]
  has_secure_storage: boolean
  secure_storage_type: string[]
  has_backup_power: boolean
  backup_power_type: string
  has_temperature_monitoring: boolean
  temperature_monitoring_type: string
  has_emergency_system: boolean
  emergency_system_details: string
  has_internet_backup: boolean
  has_ct_scanner: boolean
  has_mri: boolean
  has_xray: boolean
  has_ultrasound: boolean
}

export interface InfrastructureStepData {
  infrastructure: InfrastructureEntry[]
}

export interface InfrastructureStepProps {
  profileId?: string
  organizationId?: string
  locationOptions?: { id: string; name: string }[]
  initialData?: Partial<InfrastructureStepData>
  onComplete?: (data: InfrastructureStepData) => void
  onBack?: () => void
  onSave?: (data: InfrastructureStepData) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FACILITY_TYPES = [
  'Hospital', 'Clinic', 'Academic Medical Center', 'Research Center',
  'Phase 1 Unit', 'SMO Facility', 'Outpatient Center', 'Laboratory Building',
  'Mixed-Use Medical Office', 'Other',
] as const

const LAB_TYPES = [
  'Clinical Chemistry', 'Hematology', 'Microbiology', 'Molecular / PCR',
  'Flow Cytometry', 'Histology / Pathology', 'Genomics / Sequencing',
  'Proteomics', 'Cell Culture', 'Biobank / Repository', 'General Purpose',
  'Other',
] as const

const LAB_CERTIFICATIONS = [
  'CLIA', 'CAP', 'ISO 15189', 'GMP', 'GLP', 'COLA', 'Joint Commission',
  'State Licensed', 'CDC Certified', 'Other',
] as const

const PHARMACY_TYPES = [
  'Investigational Drug Service (IDS)', 'Retail Pharmacy',
  'Compounding Pharmacy', 'Inpatient Pharmacy', 'Specialty Pharmacy',
  'Other',
] as const

const PHARMACY_CERTIFICATIONS = [
  'USP 797', 'USP 800', 'USP 795', 'State Board Licensed',
  'Joint Commission', 'DEA Licensed', 'Other',
] as const

const SPECIMEN_AREAS = [
  'Blood Processing', 'Urinalysis', 'Tissue Processing',
  'PBMC Isolation', 'Centrifugation', 'Aliquoting',
  'Cryopreservation', 'Shipping / Receiving', 'Slide Preparation',
  'DNA/RNA Extraction',
] as const

const STORAGE_TYPES = [
  'Ambient (15-25°C)', 'Refrigerated (2-8°C)', 'Freezer (-20°C)',
  'Ultra-Low (-80°C)', 'LN2 / Cryogenic', 'Controlled Substance Safe',
  'Temperature-Monitored Cabinet', 'Secure Document Storage',
] as const

const BACKUP_POWER_TYPES = [
  'Generator + UPS', 'Generator only', 'UPS only', 'Redundant Grid Feed',
  'Battery Backup', 'None',
] as const

const TEMP_MONITORING_TYPES = [
  'Continuous logging with alarms', 'Continuous logging (no alarms)',
  'Manual twice-daily checks', 'Manual daily checks', 'None',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

let _iCounter = 0
function nextInfraId(): string {
  _iCounter += 1
  return `infra-${Date.now()}-${_iCounter}`
}

function createInfrastructure(locationOptions: { id: string; name: string }[]): InfrastructureEntry {
  const first = locationOptions[0]
  return {
    id: nextInfraId(),
    location_id: first?.id ?? '',
    location_name: first?.name ?? '',
    facility_type: '',
    total_square_footage: '',
    dedicated_research_space: '',
    exam_rooms: '',
    consultation_rooms: '',
    overnight_observation_beds: '',
    has_overnight_observation: false,
    has_infusion_suite: false,
    infusion_chairs: '',
    has_laboratory: false,
    laboratory_type: '',
    lab_certifications: [],
    has_pharmacy: false,
    pharmacy_type: '',
    pharmacy_certifications: [],
    has_specimen_processing: false,
    specimen_processing_areas: [],
    has_secure_storage: false,
    secure_storage_type: [],
    has_backup_power: false,
    backup_power_type: '',
    has_temperature_monitoring: false,
    temperature_monitoring_type: '',
    has_emergency_system: false,
    emergency_system_details: '',
    has_internet_backup: false,
    has_ct_scanner: false,
    has_mri: false,
    has_xray: false,
    has_ultrasound: false,
  }
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-sm text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors'

const labelClass = 'block text-xs font-medium text-[#6b6b80] uppercase tracking-wider mb-1'

const cardClass = 'rounded-xl border border-[#1e1e35] bg-[#0d0d22]/60 overflow-hidden'
const cardHeaderClass = 'px-5 py-3 border-b border-[#1e1e35] flex items-center justify-between gap-3'
const cardBodyClass = 'px-5 py-4 space-y-5'

// ─── ToggleSwitch ───────────────────────────────────────────────────────────

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1.5">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#8b86e5]' : 'bg-[#2a2a40]'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-[#c0c0d0]">{label}</span>
    </label>
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

// ─── MultiSelect ────────────────────────────────────────────────────────────

function MultiSelect({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-medium text-[#4a4a60] uppercase tracking-wider">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <TagToggle key={opt} label={opt} selected={selected.includes(opt)} onToggle={() => onToggle(opt)} />
        ))}
      </div>
    </div>
  )
}

// ─── YesNoToggle ────────────────────────────────────────────────────────────

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | undefined
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-[#c0c0d0]">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
            value === true
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
            value === false
              ? 'bg-red-500/10 border-red-500/40 text-red-400'
              : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30'
          }`}
        >
          No
        </button>
      </div>
    </div>
  )
}

// ─── InfrastructureCard ─────────────────────────────────────────────────────

function InfrastructureCard({
  infra,
  index,
  total,
  locationOptions,
  onChange,
  onDelete,
  onDuplicate,
}: {
  infra: InfrastructureEntry
  index: number
  total: number
  locationOptions: { id: string; name: string }[]
  onChange: (patch: Partial<InfrastructureEntry>) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const locName = locationOptions.find((l) => l.id === infra.location_id)?.name ?? 'Unknown Location'
  const summary = infra.facility_type || 'Facility type pending'

  return (
    <div className={cardClass}>
      <div className={cardHeaderClass}>
        <div className="min-w-0">
          <strong className="text-sm text-[#e0e0f0]">{locName} — Infrastructure</strong>
          <div className="text-xs text-[#4a4a60] mt-0.5">{summary}</div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
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
          {/* Location & Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Location</label>
              <select className={inputClass} value={infra.location_id} onChange={(e) => onChange({ location_id: e.target.value, location_name: locationOptions.find((l) => l.id === e.target.value)?.name ?? '' })}>
                <option value="">Select location...</option>
                {locationOptions.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Facility Type</label>
              <select className={inputClass} value={infra.facility_type} onChange={(e) => onChange({ facility_type: e.target.value })}>
                <option value="">Select type...</option>
                {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Total Square Footage</label>
              <input type="number" className={inputClass} placeholder="sq ft" min={0} value={infra.total_square_footage} onChange={(e) => onChange({ total_square_footage: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Dedicated Research Space (sq ft)</label>
              <input type="number" className={inputClass} placeholder="sq ft" min={0} value={infra.dedicated_research_space} onChange={(e) => onChange({ dedicated_research_space: e.target.value })} />
            </div>
          </div>

          {/* Rooms & Beds */}
          <div>
            <label className={labelClass}>Clinical Spaces</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-[#4a4a60]">Exam Rooms</label>
                <input type="number" className={inputClass} placeholder="#" min={0} value={infra.exam_rooms} onChange={(e) => onChange({ exam_rooms: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a60]">Consultation Rooms</label>
                <input type="number" className={inputClass} placeholder="#" min={0} value={infra.consultation_rooms} onChange={(e) => onChange({ consultation_rooms: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a60]">Overnight Beds</label>
                <input type="number" className={inputClass} placeholder="#" min={0} value={infra.overnight_observation_beds} onChange={(e) => onChange({ overnight_observation_beds: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-[#4a4a60]">Infusion Chairs</label>
                <input type="number" className={inputClass} placeholder="#" min={0} value={infra.infusion_chairs} onChange={(e) => onChange({ infusion_chairs: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Infrastructure capabilities */}
          <div className="space-y-1 divide-y divide-[#1e1e35]">
            <YesNoToggle label="Overnight Observation Capability" value={infra.has_overnight_observation} onChange={(v) => onChange({ has_overnight_observation: v })} />
            <YesNoToggle label="Infusion Suite" value={infra.has_infusion_suite} onChange={(v) => onChange({ has_infusion_suite: v })} />
            <YesNoToggle label="Onsite Laboratory" value={infra.has_laboratory} onChange={(v) => onChange({ has_laboratory: v })} />
            <YesNoToggle label="Onsite Pharmacy" value={infra.has_pharmacy} onChange={(v) => onChange({ has_pharmacy: v })} />
            <YesNoToggle label="Specimen Processing Area" value={infra.has_specimen_processing} onChange={(v) => onChange({ has_specimen_processing: v })} />
            <YesNoToggle label="Secure Storage" value={infra.has_secure_storage} onChange={(v) => onChange({ has_secure_storage: v })} />
            <YesNoToggle label="Backup Power" value={infra.has_backup_power} onChange={(v) => onChange({ has_backup_power: v })} />
            <YesNoToggle label="Temperature Monitoring" value={infra.has_temperature_monitoring} onChange={(v) => onChange({ has_temperature_monitoring: v })} />
            <YesNoToggle label="Emergency Response System" value={infra.has_emergency_system} onChange={(v) => onChange({ has_emergency_system: v })} />
            <YesNoToggle label="Internet / Network Backup" value={infra.has_internet_backup} onChange={(v) => onChange({ has_internet_backup: v })} />
          </div>

          {/* Conditional sections */}
          {infra.has_laboratory && (
            <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
              <h5 className="text-xs font-semibold text-[#8b86e5] uppercase tracking-wider">Laboratory Details</h5>
              <div>
                <label className={labelClass}>Laboratory Type</label>
                <select className={inputClass} value={infra.laboratory_type} onChange={(e) => onChange({ laboratory_type: e.target.value })}>
                  <option value="">Select lab type...</option>
                  {LAB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <MultiSelect title="Lab Certifications" options={LAB_CERTIFICATIONS} selected={infra.lab_certifications} onToggle={(v) => onChange({ lab_certifications: toggleArr(infra.lab_certifications, v) })} />
            </div>
          )}

          {infra.has_pharmacy && (
            <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
              <h5 className="text-xs font-semibold text-[#8b86e5] uppercase tracking-wider">Pharmacy Details</h5>
              <div>
                <label className={labelClass}>Pharmacy Type</label>
                <select className={inputClass} value={infra.pharmacy_type} onChange={(e) => onChange({ pharmacy_type: e.target.value })}>
                  <option value="">Select type...</option>
                  {PHARMACY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <MultiSelect title="Pharmacy Certifications" options={PHARMACY_CERTIFICATIONS} selected={infra.pharmacy_certifications} onToggle={(v) => onChange({ pharmacy_certifications: toggleArr(infra.pharmacy_certifications, v) })} />
            </div>
          )}

          {infra.has_specimen_processing && (
            <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
              <h5 className="text-xs font-semibold text-[#8b86e5] uppercase tracking-wider">Specimen Processing Areas</h5>
              <MultiSelect title="Available Processing Capabilities" options={SPECIMEN_AREAS} selected={infra.specimen_processing_areas} onToggle={(v) => onChange({ specimen_processing_areas: toggleArr(infra.specimen_processing_areas, v) })} />
            </div>
          )}

          {infra.has_secure_storage && (
            <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
              <h5 className="text-xs font-semibold text-[#8b86e5] uppercase tracking-wider">Secure Storage</h5>
              <MultiSelect title="Storage Types" options={STORAGE_TYPES} selected={infra.secure_storage_type} onToggle={(v) => onChange({ secure_storage_type: toggleArr(infra.secure_storage_type, v) })} />
            </div>
          )}

          {infra.has_backup_power && (
            <div>
              <label className={labelClass}>Backup Power Type</label>
              <select className={inputClass} value={infra.backup_power_type} onChange={(e) => onChange({ backup_power_type: e.target.value })}>
                <option value="">Select type...</option>
                {BACKUP_POWER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {infra.has_temperature_monitoring && (
            <div>
              <label className={labelClass}>Temperature Monitoring Type</label>
              <select className={inputClass} value={infra.temperature_monitoring_type} onChange={(e) => onChange({ temperature_monitoring_type: e.target.value })}>
                <option value="">Select type...</option>
                {TEMP_MONITORING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {infra.has_emergency_system && (
            <div>
              <label className={labelClass}>Emergency System Details</label>
              <textarea className={`${inputClass} min-h-[60px] resize-y`} rows={2} placeholder="Describe emergency response capabilities..." value={infra.emergency_system_details} onChange={(e) => onChange({ emergency_system_details: e.target.value })} />
            </div>
          )}

          {/* Imaging */}
          <div>
            <label className={labelClass}>Onsite Imaging</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={infra.has_ct_scanner} onChange={(e) => onChange({ has_ct_scanner: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5] focus:ring-[#8b86e5]" />
                <span className="text-sm text-[#c0c0d0]">CT Scanner</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={infra.has_mri} onChange={(e) => onChange({ has_mri: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5] focus:ring-[#8b86e5]" />
                <span className="text-sm text-[#c0c0d0]">MRI</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={infra.has_xray} onChange={(e) => onChange({ has_xray: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5] focus:ring-[#8b86e5]" />
                <span className="text-sm text-[#c0c0d0]">X-Ray</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={infra.has_ultrasound} onChange={(e) => onChange({ has_ultrasound: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5] focus:ring-[#8b86e5]" />
                <span className="text-sm text-[#c0c0d0]">Ultrasound</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function InfrastructureStep({
  profileId,
  organizationId,
  locationOptions = [],
  initialData,
  onComplete,
  onBack,
  onSave,
}: InfrastructureStepProps) {
  const [infrastructure, setInfrastructure] = useState<InfrastructureEntry[]>(
    initialData?.infrastructure && initialData.infrastructure.length > 0
      ? initialData.infrastructure
      : [createInfrastructure(locationOptions)]
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedProfileId, setSavedProfileId] = useState<string | undefined>(profileId)

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    setLoading(true)
    apiGet<{ data: SiteProfile }>(`/api/v1/site-profiles/${profileId}`)
      .then((res) => {
        if (cancelled || !res?.data) return
        const content = res.data.content as Record<string, unknown> ?? {}
        if (Array.isArray(content.infrastructure) && (content.infrastructure as InfrastructureEntry[]).length > 0) {
          setInfrastructure(content.infrastructure as InfrastructureEntry[])
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profileId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    const content = { infrastructure }
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
      onSave?.({ infrastructure })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [infrastructure, savedProfileId, organizationId, onSave])

  const handleContinue = useCallback(async () => {
    await handleSave()
    if (!error) onComplete?.({ infrastructure })
  }, [handleSave, error, infrastructure, onComplete])

  const updateInfra = useCallback((id: string, patch: Partial<InfrastructureEntry>) => {
    setInfrastructure((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i))
  }, [])

  const addInfra = useCallback(() => {
    setInfrastructure((prev) => [...prev, createInfrastructure(locationOptions)])
  }, [locationOptions])

  const deleteInfra = useCallback((id: string) => {
    setInfrastructure((prev) => prev.length <= 1 ? prev : prev.filter((i) => i.id !== id))
  }, [])

  const duplicateInfra = useCallback((infra: InfrastructureEntry) => {
    setInfrastructure((prev) => [...prev, { ...infra, id: nextInfraId() }])
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b80]">Loading infrastructure data...</p>
      </div>
    )
  }

  const labsCount = infrastructure.filter((i) => i.has_laboratory).length
  const pharmaciesCount = infrastructure.filter((i) => i.has_pharmacy).length
  const backupPowerCount = infrastructure.filter((i) => i.has_backup_power).length

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">Infrastructure</h2>
        <p className="text-sm text-[#6b6b80]">
          Define the physical infrastructure and capabilities at each location — rooms, labs, pharmacies, specimen processing, backup power, temperature monitoring, and imaging.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        <span className="px-2 py-1 rounded-full bg-[#1a1a2e] text-[#6b6b80] border border-[#2a2a40]">
          {infrastructure.length} location{infrastructure.length !== 1 ? 's' : ''}
        </span>
        {labsCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-[#8b86e5]/10 text-[#8b86e5] border border-[#8b86e5]/20">
            {labsCount} lab{labsCount !== 1 ? 's' : ''}
          </span>
        )}
        {pharmaciesCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {pharmaciesCount} pharmac{pharmaciesCount !== 1 ? 'ies' : 'y'}
          </span>
        )}
        {backupPowerCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {backupPowerCount} w/ backup power
          </span>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {infrastructure.map((infra, idx) => (
          <InfrastructureCard
            key={infra.id}
            infra={infra}
            index={idx}
            total={infrastructure.length}
            locationOptions={locationOptions}
            onChange={(patch) => updateInfra(infra.id, patch)}
            onDelete={() => deleteInfra(infra.id)}
            onDuplicate={() => duplicateInfra(infra)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addInfra}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[#2a2a40] text-sm text-[#6b6b80] hover:border-[#8b86e5]/40 hover:text-[#8b86e5] transition-colors mb-8"
      >
        + Add Infrastructure Entry
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

export default InfrastructureStep
