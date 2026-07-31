'use client'

// ==========================================================================
// OrganizationStep — Site Profile onboarding: institutional identity,
// type selection, research focus, therapeutic areas, languages.
// Fetches / posts to /api/v1/site-profiles.
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { SiteProfile, ProfileState } from '@kadarn/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrganizationStepData {
  name: string
  description: string
  profile_type: string
  institution_type: string
  founded_year: string
  mission_statement: string
  website: string
  dba_name: string
  research_focus: string[]
  therapeutic_areas: string[]
  research_modalities: string[]
  languages: string[]
  tags: string[]
}

export interface OrganizationStepProps {
  profileId?: string
  organizationId?: string
  initialData?: Partial<OrganizationStepData>
  onComplete?: (data: OrganizationStepData) => void
  onBack?: () => void
  onSave?: (data: OrganizationStepData) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const INSTITUTION_TYPES = [
  'Independent Research Site',
  'Hospital',
  'Academic Medical Center',
  'Biobank',
  'Laboratory',
  'SMO',
  'Research Network',
  'Reference / Central Laboratory',
  'Contract Research Organization (CRO)',
  'Physician Practice / Clinic',
  'University',
  'Non-Profit Research Organization',
  'Other',
] as const

const RESEARCH_FOCUS_OPTIONS = [
  'Phase I',
  'Phase II',
  'Phase III',
  'Phase IV',
  'Medical Device',
  'Diagnostics',
  'Digital Health',
  'Real-World Evidence',
  'Observational Studies',
  'Registry Studies',
  'Investigator-Initiated',
  'Decentralized / Hybrid Trials',
  'Biospecimen Collection',
  'Imaging',
  'Genomics',
] as const

const THERAPEUTIC_AREA_OPTIONS = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Immunology',
  'Infectious Disease',
  'Rare Disease',
  'Endocrinology',
  'Respiratory',
  'Gastroenterology',
  'Hematology',
  'Dermatology',
  'Psychiatry',
  'Ophthalmology',
  'Rheumatology',
  'Nephrology',
  'Pediatrics',
  'Women\'s Health',
  'Pain Management',
  'Vaccines',
  'Cell & Gene Therapy',
] as const

const RESEARCH_MODALITY_OPTIONS = [
  'Drug Trials',
  'Device Studies',
  'Biologic Studies',
  'Biosimilar Studies',
  'Diagnostic Studies',
  'Digital Therapeutic Studies',
  'Nutritional / Supplement Studies',
  'Surgical Studies',
  'Behavioral Intervention',
  'Epidemiological Studies',
] as const

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic',
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Italian', 'Dutch',
  'Hindi', 'Turkish', 'Vietnamese', 'Polish', 'Romanian', 'Czech',
  'Swedish', 'Hebrew', 'Thai', 'Ukrainian',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function toggleArrayValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

// ─── Shared input styles ────────────────────────────────────────────────────

const inputBaseClass =
  'w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2.5 text-sm text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors'

const labelClass = 'block text-sm font-medium text-[#c0c0d0] mb-1.5'
const sectionClass = 'rounded-xl border border-[#1e1e35] bg-[#0d0d22]/50 overflow-hidden'
const sectionHeaderClass = 'px-5 py-4 border-b border-[#1e1e35]'
const sectionBodyClass = 'px-5 py-4 space-y-4'

// ─── TagToggle ──────────────────────────────────────────────────────────────

function TagToggle({
  option,
  selected,
  onToggle,
}: {
  option: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        selected
          ? 'bg-[#8b86e5]/15 border-[#8b86e5]/50 text-[#8b86e5]'
          : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30 hover:text-[#c0c0d0]'
      }`}
    >
      {option}
    </button>
  )
}

// ─── MultiSelectGrid ────────────────────────────────────────────────────────

function MultiSelectGrid({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string
  options: readonly string[]
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <TagToggle
            key={option}
            option={option}
            selected={selectedValues.includes(option)}
            onToggle={() => onToggle(option)}
          />
        ))}
      </div>
      <div className="text-[10px] text-[#4a4a60]">{selectedValues.length} selected</div>
    </div>
  )
}

// ─── SectionCard ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  completed,
  total,
  children,
}: {
  title: string
  completed: number
  total: number
  children: React.ReactNode
}) {
  return (
    <div className={sectionClass}>
      <div className={sectionHeaderClass}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#e0e0f0]">{title}</h4>
          <span className="text-[10px] text-[#4a4a60] font-mono">
            {completed}/{total}
          </span>
        </div>
      </div>
      <div className={sectionBodyClass}>{children}</div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function OrganizationStep({
  profileId,
  organizationId,
  initialData,
  onComplete,
  onBack,
  onSave,
}: OrganizationStepProps) {
  const [data, setData] = useState<OrganizationStepData>({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    profile_type: initialData?.profile_type ?? 'site_profile',
    institution_type: initialData?.institution_type ?? '',
    founded_year: initialData?.founded_year ?? '',
    mission_statement: initialData?.mission_statement ?? '',
    website: initialData?.website ?? '',
    dba_name: initialData?.dba_name ?? '',
    research_focus: initialData?.research_focus ?? [],
    therapeutic_areas: initialData?.therapeutic_areas ?? [],
    research_modalities: initialData?.research_modalities ?? [],
    languages: initialData?.languages ?? [],
    tags: initialData?.tags ?? [],
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedProfileId, setSavedProfileId] = useState<string | undefined>(profileId)

  // Load existing profile data
  useEffect(() => {
    if (!profileId) return
    let cancelled = false

    setLoading(true)
    apiGet<{ data: SiteProfile }>(`/api/v1/site-profiles/${profileId}`)
      .then((res) => {
        if (cancelled || !res?.data) return
        const p = res.data
        const content = p.content as Record<string, unknown> ?? {}
        setData((prev) => ({
          ...prev,
          name: p.name ?? prev.name,
          description: p.description ?? prev.description,
          profile_type: p.profile_type ?? prev.profile_type,
          institution_type: String(content.institution_type ?? prev.institution_type),
          founded_year: String(content.founded_year ?? prev.founded_year),
          mission_statement: String(content.mission_statement ?? prev.mission_statement),
          website: String(content.website ?? prev.website),
          dba_name: String(content.dba_name ?? prev.dba_name),
          research_focus: Array.isArray(content.research_focus) ? content.research_focus as string[] : prev.research_focus,
          therapeutic_areas: Array.isArray(content.therapeutic_areas) ? content.therapeutic_areas as string[] : prev.therapeutic_areas,
          research_modalities: Array.isArray(content.research_modalities) ? content.research_modalities as string[] : prev.research_modalities,
          languages: Array.isArray(content.languages) ? content.languages as string[] : prev.languages,
          tags: p.tags ?? prev.tags,
        }))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [profileId])

  // Persist to API
  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)

    const content = {
      institution_type: data.institution_type,
      founded_year: data.founded_year,
      mission_statement: data.mission_statement,
      website: data.website,
      dba_name: data.dba_name,
      research_focus: data.research_focus,
      therapeutic_areas: data.therapeutic_areas,
      research_modalities: data.research_modalities,
      languages: data.languages,
    }

    try {
      let profile: SiteProfile
      if (savedProfileId) {
        profile = await apiPatch<{ data: SiteProfile }>(`/api/v1/site-profiles/${savedProfileId}`, {
          name: data.name,
          description: data.description,
          content,
          tags: data.tags,
        }).then((res) => (res as { data: SiteProfile }).data)
      } else {
        profile = await apiPost<{ data: SiteProfile }>('/api/v1/site-profiles', {
          organization_id: organizationId,
          name: data.name || 'Untitled Site Profile',
          description: data.description,
          profile_type: data.profile_type,
          content,
          tags: data.tags,
        }).then((res) => (res as { data: SiteProfile }).data)
      }
      setSavedProfileId(profile.id)
      onSave?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [data, savedProfileId, organizationId, onSave])

  const handleContinue = useCallback(async () => {
    await handleSave()
    if (!error) onComplete?.(data)
  }, [handleSave, error, data, onComplete])

  const update = useCallback(<K extends keyof OrganizationStepData>(key: K, value: OrganizationStepData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleArray = useCallback((key: 'research_focus' | 'therapeutic_areas' | 'research_modalities' | 'languages', value: string) => {
    setData((prev) => ({ ...prev, [key]: toggleArrayValue(prev[key] as string[], value) }))
  }, [])

  // Computed completion
  const sections = [
    {
      title: 'Institution Identity',
      fields: ['name', 'institution_type', 'founded_year', 'dba_name'] as const,
      completed: [data.name, data.institution_type, data.founded_year].filter(Boolean).length,
      total: 3,
    },
    {
      title: 'Mission & Purpose',
      fields: ['mission_statement', 'website'] as const,
      completed: [data.mission_statement, data.website].filter(Boolean).length,
      total: 2,
    },
    {
      title: 'Research Programs',
      fields: [] as const,
      completed: data.research_focus.length > 0 ? 1 : 0,
      total: 1,
    },
    {
      title: 'Therapeutic Expertise',
      fields: [] as const,
      completed: data.therapeutic_areas.length > 0 ? 1 : 0,
      total: 1,
    },
    {
      title: 'Research Modalities',
      fields: [] as const,
      completed: data.research_modalities.length > 0 ? 1 : 0,
      total: 1,
    },
    {
      title: 'Languages',
      fields: [] as const,
      completed: data.languages.length > 0 ? 1 : 0,
      total: 1,
    },
  ]

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b80]">Loading organization profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">
          Organization Profile
        </h2>
        <p className="text-sm text-[#6b6b80]">
          Define your institution&rsquo;s identity, research focus, therapeutic expertise, and operational languages.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Progress */}
      <div className="mb-6 flex items-center gap-4 text-xs text-[#6b6b80]">
        <span>
          {sections.reduce((sum, s) => sum + s.completed, 0)}/{sections.reduce((sum, s) => sum + s.total, 0)} sections complete
        </span>
        <div className="flex-1 h-1 rounded-full bg-[#1e1e35]">
          <div
            className="h-full rounded-full bg-[#8b86e5] transition-all"
            style={{
              width: `${(sections.reduce((sum, s) => sum + s.completed, 0) / Math.max(sections.reduce((sum, s) => sum + s.total, 0), 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {/* Institution Identity */}
        <SectionCard title="Institution Identity" completed={sections[0].completed} total={3}>
          <div>
            <label className={labelClass}>
              Official Institution Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className={inputBaseClass}
              placeholder="e.g., Vilo Research Institute"
              value={data.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Does your institution operate under any other names?</label>
            <input
              type="text"
              className={inputBaseClass}
              placeholder="DBAs, trade names (optional)"
              value={data.dba_name}
              onChange={(e) => update('dba_name', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>
              Institution Type <span className="text-red-400">*</span>
            </label>
            <select
              className={inputBaseClass}
              value={data.institution_type}
              onChange={(e) => update('institution_type', e.target.value)}
            >
              <option value="">Select institution type...</option>
              {INSTITUTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Founded Year</label>
            <input
              type="number"
              className={inputBaseClass}
              placeholder="e.g., 1995"
              min={1800}
              max={2030}
              value={data.founded_year}
              onChange={(e) => update('founded_year', e.target.value)}
            />
          </div>
        </SectionCard>

        {/* Mission & Purpose */}
        <SectionCard title="Mission & Purpose" completed={sections[1].completed} total={2}>
          <div>
            <label className={labelClass}>Institutional Mission Statement</label>
            <textarea
              className={`${inputBaseClass} min-h-[80px] resize-y`}
              rows={3}
              placeholder="e.g., Advancing precision medicine through innovative clinical research..."
              value={data.mission_statement}
              onChange={(e) => update('mission_statement', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Institutional Website</label>
            <input
              type="url"
              className={inputBaseClass}
              placeholder="https://www.your-institution.org"
              value={data.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Brief Description</label>
            <textarea
              className={`${inputBaseClass} min-h-[60px] resize-y`}
              rows={2}
              placeholder="A short summary of your institution..."
              value={data.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
        </SectionCard>

        {/* Research Focus */}
        <SectionCard title="Research Programs" completed={sections[2].completed} total={1}>
          <MultiSelectGrid
            title="Which research programs can your institution execute?"
            options={RESEARCH_FOCUS_OPTIONS}
            selectedValues={data.research_focus}
            onToggle={(v) => toggleArray('research_focus', v)}
          />
        </SectionCard>

        {/* Therapeutic Areas */}
        <SectionCard title="Therapeutic Expertise" completed={sections[3].completed} total={1}>
          <MultiSelectGrid
            title="Which therapeutic areas do you have experience in?"
            options={THERAPEUTIC_AREA_OPTIONS}
            selectedValues={data.therapeutic_areas}
            onToggle={(v) => toggleArray('therapeutic_areas', v)}
          />
        </SectionCard>

        {/* Research Modalities */}
        <SectionCard title="Research Modalities" completed={sections[4].completed} total={1}>
          <MultiSelectGrid
            title="Which research modalities can your institution execute?"
            options={RESEARCH_MODALITY_OPTIONS}
            selectedValues={data.research_modalities}
            onToggle={(v) => toggleArray('research_modalities', v)}
          />
        </SectionCard>

        {/* Languages */}
        <SectionCard title="Operational Languages" completed={sections[5].completed} total={1}>
          <MultiSelectGrid
            title="Which languages does your institution support for patients and staff?"
            options={LANGUAGE_OPTIONS}
            selectedValues={data.languages}
            onToggle={(v) => toggleArray('languages', v)}
          />
        </SectionCard>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-8 mt-8 border-t border-[#1e1e35]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving || !data.name}
            className="px-5 py-2 rounded-lg bg-[#8b86e5] text-white text-sm font-medium hover:bg-[#7a75d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrganizationStep
