'use client'

// ==========================================================================
// PeopleStep — Site Profile onboarding: multiple PIs, roles, certifications,
// location assignments.
// Fetches / posts to /api/v1/site-profiles.
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { SiteProfile } from '@kadarn/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CertificationEntry {
  id: string
  type: string
  number: string
  issuing_org: string
  issued_date: string
  expiry_date: string
  status: 'Active' | 'Expiring Soon' | 'Expired'
}

export interface PersonEntry {
  id: string
  first_name: string
  last_name: string
  title: string
  credentials: string
  email: string
  phone: string
  role: string
  is_principal_investigator: boolean
  research_roles: string[]
  therapeutic_expertise: string[]
  phase_experience: string[]
  languages: string[]
  certifications: CertificationEntry[]
  location_assignment: string
  years_experience: string
  completed_studies: string
  current_studies: string
  employment_status: string
  npi_number: string
  orcid: string
}

export interface PeopleStepData {
  people: PersonEntry[]
}

export interface PeopleStepProps {
  profileId?: string
  organizationId?: string
  locationOptions?: { id: string; name: string }[]
  initialData?: Partial<PeopleStepData>
  onComplete?: (data: PeopleStepData) => void
  onBack?: () => void
  onSave?: (data: PeopleStepData) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  'Principal Investigator', 'Sub-Investigator', 'Study Coordinator',
  'Clinical Research Nurse', 'Data Manager', 'Regulatory Specialist',
  'Lab Manager', 'Research Pharmacist', 'Recruitment Coordinator',
  'Quality Assurance Manager', 'Site Director', 'Research Assistant',
  'CRP / CRA', 'Biostatistician', 'Other',
] as const

const THERAPEUTIC_OPTIONS = [
  'Oncology', 'Cardiology', 'Neurology', 'Immunology',
  'Infectious Disease', 'Rare Disease', 'Endocrinology',
  'Respiratory', 'Gastroenterology', 'Hematology',
  'Dermatology', 'Psychiatry', 'Ophthalmology', 'Rheumatology',
  'Nephrology', 'Pediatrics', 'Women\'s Health',
  'Pain Management', 'Vaccines', 'Cell & Gene Therapy',
] as const

const PHASE_OPTIONS = [
  'Phase I', 'Phase II', 'Phase III', 'Phase IV',
  'Medical Device', 'Diagnostics', 'Observational',
  'Real-World Evidence', 'Decentralized / Hybrid',
] as const

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic',
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Italian', 'Dutch',
  'Hindi', 'Turkish', 'Vietnamese', 'Polish',
] as const

const CERTIFICATION_TYPES = [
  'GCP', 'ICH-GCP', 'ACRP-CP', 'ACRP-PM', 'CCRP', 'CCRC', 'CCRA',
  'CPI', 'RAC', 'CIP', 'BLS', 'ACLS', 'RN', 'MD', 'PharmD',
  'PhD', 'Lab Certification', 'Other',
] as const

const EMPLOYMENT_STATUS_OPTIONS = [
  'Full-time', 'Part-time', 'Contract', 'Affiliate', 'Emeritus',
] as const

const CREDENTIAL_OPTIONS = [
  'MD', 'DO', 'PhD', 'PharmD', 'RN', 'NP', 'PA', 'MPH', 'MS', 'MBA',
  'DrPH', 'ScD', 'Other',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

let _pCounter = 0
function nextPersonId(): string {
  _pCounter += 1
  return `person-${Date.now()}-${_pCounter}`
}

let _cCounter = 0
function nextCertId(): string {
  _cCounter += 1
  return `cert-${Date.now()}-${_cCounter}`
}

function createPerson(index: number): PersonEntry {
  return {
    id: nextPersonId(),
    first_name: '',
    last_name: '',
    title: '',
    credentials: '',
    email: '',
    phone: '',
    role: '',
    is_principal_investigator: index === 0,
    research_roles: index === 0 ? ['Principal Investigator'] : [],
    therapeutic_expertise: [],
    phase_experience: [],
    languages: ['English'],
    certifications: [],
    location_assignment: '',
    years_experience: '',
    completed_studies: '',
    current_studies: '',
    employment_status: '',
    npi_number: '',
    orcid: '',
  }
}

function createCertification(): CertificationEntry {
  return {
    id: nextCertId(),
    type: '',
    number: '',
    issuing_org: '',
    issued_date: '',
    expiry_date: '',
    status: 'Active',
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
const cardBodyClass = 'px-5 py-4 space-y-4'

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

// ─── CertificationEditor ────────────────────────────────────────────────────

function CertificationEditor({
  certifications,
  onChange,
}: {
  certifications: CertificationEntry[]
  onChange: (certs: CertificationEntry[]) => void
}) {
  const add = () => onChange([...certifications, createCertification()])
  const remove = (id: string) => onChange(certifications.filter((c) => c.id !== id))
  const update = (id: string, patch: Partial<CertificationEntry>) =>
    onChange(certifications.map((c) => c.id === id ? { ...c, ...patch } : c))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#4a4a60] uppercase tracking-wider">Certifications</span>
        <button type="button" onClick={add} className="text-[10px] text-[#8b86e5] hover:text-[#a09bf0] transition-colors">
          + Add Certification
        </button>
      </div>
      {certifications.length === 0 && (
        <p className="text-xs text-[#4a4a60] italic">No certifications added.</p>
      )}
      <div className="space-y-2">
        {certifications.map((cert) => (
          <div key={cert.id} className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50">
            <select className={inputClass} value={cert.type} onChange={(e) => update(cert.id, { type: e.target.value })}>
              <option value="">Certification Type</option>
              {CERTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" className={inputClass} placeholder="Certification #" value={cert.number} onChange={(e) => update(cert.id, { number: e.target.value })} />
            <input type="text" className={inputClass} placeholder="Issuing Organization" value={cert.issuing_org} onChange={(e) => update(cert.id, { issuing_org: e.target.value })} />
            <input type="date" className={inputClass} aria-label="Issue Date" value={cert.issued_date} onChange={(e) => update(cert.id, { issued_date: e.target.value })} />
            <input type="date" className={inputClass} aria-label="Expiry Date" value={cert.expiry_date} onChange={(e) => update(cert.id, { expiry_date: e.target.value })} />
            <select className={inputClass} value={cert.status} onChange={(e) => update(cert.id, { status: e.target.value as CertificationEntry['status'] })}>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
            <div className="col-span-2 sm:col-span-3 flex justify-end">
              <button type="button" onClick={() => remove(cert.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PersonCard ─────────────────────────────────────────────────────────────

function PersonCard({
  person,
  index,
  total,
  locationOptions,
  onChange,
  onDelete,
  onDuplicate,
}: {
  person: PersonEntry
  index: number
  total: number
  locationOptions: { id: string; name: string }[]
  onChange: (patch: Partial<PersonEntry>) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const fullName = [person.first_name, person.last_name].filter(Boolean).join(' ') || `Team Member ${index + 1}`
  const roleSummary = person.research_roles.join(', ') || person.role || 'Role pending'

  return (
    <div className={cardClass}>
      <div className={cardHeaderClass}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <strong className="text-sm text-[#e0e0f0] truncate">{fullName}</strong>
            {person.is_principal_investigator && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8b86e5]/20 text-[#8b86e5] border border-[#8b86e5]/30">
                PI
              </span>
            )}
          </div>
          <div className="text-xs text-[#4a4a60] mt-0.5">{roleSummary}</div>
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
              Remove
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className={cardBodyClass}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" className={inputClass} placeholder="First name" value={person.first_name} onChange={(e) => onChange({ first_name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" className={inputClass} placeholder="Last name" value={person.last_name} onChange={(e) => onChange({ last_name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Credentials</label>
              <select className={inputClass} value={person.credentials} onChange={(e) => onChange({ credentials: e.target.value })}>
                <option value="">Select...</option>
                {CREDENTIAL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Title / Position</label>
              <input type="text" className={inputClass} placeholder="e.g., Senior Investigator" value={person.title} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} placeholder="email@institution.org" value={person.email} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" className={inputClass} placeholder="Phone (optional)" value={person.phone} onChange={(e) => onChange({ phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Primary Role</label>
              <select className={inputClass} value={person.role} onChange={(e) => onChange({ role: e.target.value })}>
                <option value="">Select role...</option>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Location Assignment</label>
              <select className={inputClass} value={person.location_assignment} onChange={(e) => onChange({ location_assignment: e.target.value })}>
                <option value="">Select location...</option>
                {locationOptions.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Employment Status</label>
              <select className={inputClass} value={person.employment_status} onChange={(e) => onChange({ employment_status: e.target.value })}>
                <option value="">Select...</option>
                {EMPLOYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Years Experience</label>
              <input type="number" className={inputClass} placeholder="Years" min={0} value={person.years_experience} onChange={(e) => onChange({ years_experience: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Completed Studies</label>
              <input type="number" className={inputClass} placeholder="#" min={0} value={person.completed_studies} onChange={(e) => onChange({ completed_studies: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Current Studies</label>
              <input type="number" className={inputClass} placeholder="#" min={0} value={person.current_studies} onChange={(e) => onChange({ current_studies: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>NPI Number</label>
              <input type="text" className={inputClass} placeholder="National Provider Identifier" value={person.npi_number} onChange={(e) => onChange({ npi_number: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>ORCID</label>
              <input type="text" className={inputClass} placeholder="0000-0000-0000-0000" value={person.orcid} onChange={(e) => onChange({ orcid: e.target.value })} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={person.is_principal_investigator}
              onChange={() => {
                const nextPI = !person.is_principal_investigator
                onChange({
                  is_principal_investigator: nextPI,
                  research_roles: nextPI && !person.research_roles.includes('Principal Investigator')
                    ? [...person.research_roles, 'Principal Investigator']
                    : person.research_roles.filter((r) => r !== 'Principal Investigator'),
                })
              }}
              className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5] focus:ring-[#8b86e5]"
            />
            <span className="text-sm text-[#c0c0d0]">Principal Investigator</span>
          </label>

          <MultiSelect title="Research Roles" options={ROLE_OPTIONS} selected={person.research_roles} onToggle={(v) => onChange({ research_roles: toggleArr(person.research_roles, v) })} />
          <MultiSelect title="Therapeutic Expertise" options={THERAPEUTIC_OPTIONS} selected={person.therapeutic_expertise} onToggle={(v) => onChange({ therapeutic_expertise: toggleArr(person.therapeutic_expertise, v) })} />
          <MultiSelect title="Phase Experience" options={PHASE_OPTIONS} selected={person.phase_experience} onToggle={(v) => onChange({ phase_experience: toggleArr(person.phase_experience, v) })} />
          <MultiSelect title="Languages" options={LANGUAGE_OPTIONS} selected={person.languages} onToggle={(v) => onChange({ languages: toggleArr(person.languages, v) })} />

          <CertificationEditor
            certifications={person.certifications}
            onChange={(certs) => onChange({ certifications: certs })}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PeopleStep({
  profileId,
  organizationId,
  locationOptions = [],
  initialData,
  onComplete,
  onBack,
  onSave,
}: PeopleStepProps) {
  const [people, setPeople] = useState<PersonEntry[]>(
    initialData?.people && initialData.people.length > 0
      ? initialData.people
      : [createPerson(0)]
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
        if (Array.isArray(content.people) && (content.people as PersonEntry[]).length > 0) {
          setPeople(content.people as PersonEntry[])
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profileId])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    const content = { people }
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
      onSave?.({ people })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [people, savedProfileId, organizationId, onSave])

  const handleContinue = useCallback(async () => {
    await handleSave()
    if (!error) onComplete?.({ people })
  }, [handleSave, error, people, onComplete])

  const updatePerson = useCallback((id: string, patch: Partial<PersonEntry>) => {
    setPeople((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p))
  }, [])

  const addPerson = useCallback(() => {
    setPeople((prev) => [...prev, createPerson(prev.length)])
  }, [])

  const deletePerson = useCallback((id: string) => {
    setPeople((prev) => prev.length <= 1 ? prev : prev.filter((p) => p.id !== id))
  }, [])

  const duplicatePerson = useCallback((person: PersonEntry) => {
    setPeople((prev) => [...prev, { ...person, id: nextPersonId(), first_name: person.first_name ? `${person.first_name} (Copy)` : '', is_principal_investigator: false }])
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b80]">Loading team data...</p>
      </div>
    )
  }

  const piCount = people.filter((p) => p.is_principal_investigator).length
  const totalCerts = people.reduce((sum, p) => sum + p.certifications.filter((c) => c.type).length, 0)

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">Research Team</h2>
        <p className="text-sm text-[#6b6b80]">
          Add your research team members — PIs, coordinators, nurses, lab staff, and more. Each person gets certifications, therapeutic expertise, and location assignments.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      {/* Summary */}
      <div className="mb-6 flex flex-wrap gap-3 text-xs">
        <span className="px-2 py-1 rounded-full bg-[#1a1a2e] text-[#6b6b80] border border-[#2a2a40]">
          {people.length} team members
        </span>
        <span className="px-2 py-1 rounded-full bg-[#8b86e5]/10 text-[#8b86e5] border border-[#8b86e5]/20">
          {piCount} Principal Investigator{piCount !== 1 ? 's' : ''}
        </span>
        {totalCerts > 0 && (
          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {totalCerts} certification{totalCerts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {people.map((person, idx) => (
          <PersonCard
            key={person.id}
            person={person}
            index={idx}
            total={people.length}
            locationOptions={locationOptions}
            onChange={(patch) => updatePerson(person.id, patch)}
            onDelete={() => deletePerson(person.id)}
            onDuplicate={() => duplicatePerson(person)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addPerson}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[#2a2a40] text-sm text-[#6b6b80] hover:border-[#8b86e5]/40 hover:text-[#8b86e5] transition-colors mb-8"
      >
        + Add Team Member
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

export default PeopleStep
