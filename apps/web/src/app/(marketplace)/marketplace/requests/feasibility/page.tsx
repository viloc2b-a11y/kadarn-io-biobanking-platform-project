'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function FeasibilityPage() {
  const searchParams = useSearchParams()
  const targetId = searchParams.get('target') ?? ''
  const router = useRouter()
  const { user } = useSession()

  const [programName, setProgramName] = useState('')
  const [description, setDescription] = useState('')
  const [therapeuticArea, setTherapeuticArea] = useState('')
  const [diseaseLabel, setDiseaseLabel] = useState('')
  const [sampleTypes, setSampleTypes] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [sampleCount, setSampleCount] = useState('')
  const [urgency, setUrgency] = useState('standard')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const sampleOpts = ['ffpe', 'fresh_frozen', 'whole_blood', 'serum', 'plasma', 'urine', 'csf', 'tissue', 'dna', 'rna']
  const capOpts = [
    { value: 'biobank', label: 'Biobank' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'cro', label: 'CRO' },
    { value: 'clinical_site', label: 'Clinical Site' },
    { value: 'processing_lab', label: 'Processing Lab' },
    { value: 'diagnostic_lab', label: 'Diagnostic Lab' },
    { value: 'logistics_vendor', label: 'Logistics' },
    { value: 'regulatory_body', label: 'Regulatory Body' },
  ]
  const countryOpts = [
    { value: 'US', label: 'United States' },
    { value: 'DE', label: 'Germany' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'FR', label: 'France' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'SE', label: 'Sweden' },
    { value: 'DK', label: 'Denmark' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
  ]

  function toggleInList(list: string[], item: string, setFn: (l: string[]) => void) {
    if (list.includes(item)) setFn(list.filter(x => x !== item))
    else setFn([...list, item])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!programName.trim()) { setError('Program name is required'); return }
    setError('')
    setSubmitting(true)

    try {
      const token = (user as any)?.access_token
      const res = await fetch(`${API}/api/v1/marketplace/feasibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          program_name: programName.trim(),
          program_description: description.trim() || undefined,
          therapeutic_area: therapeuticArea || undefined,
          disease_label: diseaseLabel || undefined,
          required_sample_types: sampleTypes,
          required_capabilities: capabilities,
          target_countries: countries,
          estimated_sample_count: sampleCount ? parseInt(sampleCount) : undefined,
          urgency,
          target_org_ids: targetId ? [targetId] : [],
        }),
      })

      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error?.message ?? 'Failed to submit')
      }

      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>◇</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Feasibility Assessment Submitted</h2>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginBottom: 24 }}>
          Your feasibility request has been submitted. We'll identify candidate organizations and provide an assessment.
        </p>
        <button onClick={() => router.push('/marketplace/requests')} style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'var(--blue)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          View My Requests
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 8 }}>
          Marketplace / Requests
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Check Feasibility</h1>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginTop: 4 }}>
          Describe your program requirements and we'll assess feasibility across the Kadarn network.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Program Name *" help="Name of your research program">
          <input value={programName} onChange={e => setProgramName(e.target.value)}
            style={inputStyle} placeholder="e.g., Oncology Biomarker Validation" />
        </FormField>

        <FormField label="Description" help="Brief description of program goals and requirements">
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            placeholder="Program objectives, patient population, expected outcomes..." />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Therapeutic Area" help="Primary area of study">
            <input value={therapeuticArea} onChange={e => setTherapeuticArea(e.target.value)}
              style={inputStyle} placeholder="e.g., Oncology" />
          </FormField>
          <FormField label="Disease" help="Specific disease/condition">
            <input value={diseaseLabel} onChange={e => setDiseaseLabel(e.target.value)}
              style={inputStyle} placeholder="e.g., Non-small Cell Lung Cancer" />
          </FormField>
        </div>

        <FormField label="Sample Types Needed" help="Type of biospecimens required">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {sampleOpts.map(opt => (
              <Chip key={opt} label={opt.replace(/_/g, ' ')} selected={sampleTypes.includes(opt)}
                onClick={() => toggleInList(sampleTypes, opt, setSampleTypes)} />
            ))}
          </div>
        </FormField>

        <FormField label="Required Capabilities" help="Type of organizations needed">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {capOpts.map(opt => (
              <Chip key={opt.value} label={opt.label} selected={capabilities.includes(opt.value)}
                onClick={() => toggleInList(capabilities, opt.value, setCapabilities)} />
            ))}
          </div>
        </FormField>

        <FormField label="Target Countries" help="Preferred countries for partners">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {countryOpts.map(opt => (
              <Chip key={opt.value} label={opt.label} selected={countries.includes(opt.value)}
                onClick={() => toggleInList(countries, opt.value, setCountries)} />
            ))}
          </div>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Estimated Sample Count" help="Total samples needed">
            <input type="number" value={sampleCount} onChange={e => setSampleCount(e.target.value)}
              style={inputStyle} placeholder="e.g., 500" min="0" />
          </FormField>
          <FormField label="Urgency" help="Timeline preference">
            <select value={urgency} onChange={e => setUrgency(e.target.value)}
              style={inputStyle}>
              <option value="flexible">Flexible — no rush</option>
              <option value="standard">Standard — normal timeline</option>
              <option value="fast">Fast — expedited review</option>
            </select>
          </FormField>
        </div>

        {error && (
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: 'var(--red)', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={submitting} style={{
            padding: '11px 24px', borderRadius: 10, border: 'none',
            background: 'var(--blue)', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? 'Submitting...' : 'Submit Feasibility Request'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            padding: '11px 20px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--txd)', fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 7, border: `1px solid ${selected ? 'rgba(68,103,242,0.3)' : 'var(--border)'}`,
      background: selected ? 'rgba(68,103,242,0.12)' : 'var(--card)',
      color: selected ? 'var(--blue)' : 'var(--txd)',
      fontSize: 12, cursor: 'pointer', fontWeight: selected ? 700 : 400,
    }}>
      {label}
    </button>
  )
}

function FormField({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx)' }}>{label}</span>
      {help && <span style={{ fontSize: 10, color: 'var(--txdd)' }}>{help}</span>}
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--navy2)',
  color: 'var(--tx)', fontSize: 13, outline: 'none',
}
