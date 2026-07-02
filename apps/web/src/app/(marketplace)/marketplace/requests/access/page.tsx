'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/components/providers/session-provider'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function RequestAccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
      <RequestAccessForm />
    </Suspense>
  )
}

function RequestAccessForm() {
  const searchParams = useSearchParams()
  const targetId = searchParams.get('target') ?? ''
  const targetKind = searchParams.get('kind') ?? 'organization'
  const router = useRouter()
  const { user } = useSession()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sampleCount, setSampleCount] = useState('')
  const [timeline, setTimeline] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [commercial, setCommercial] = useState(false)
  const [dataCategories, setDataCategories] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (targetId) {
      setTitle(`Access request for ${targetKind}: ${targetId.slice(0, 8)}`)
    }
  }, [targetId, targetKind])

  const dataOpts = ['clinical_data', 'genomic_data', 'imaging_data', 'proteomic_data', 'pathology_reports', 'de_identified']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setError('')
    setSubmitting(true)

    try {
      const token = (user as any)?.access_token
      const res = await fetch(`${API}/api/v1/marketplace/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          supply_item_id: targetKind === 'supply_item' ? targetId : undefined,
          target_org_ids: targetKind === 'organization' ? [targetId] : [],
          requested_sample_count: sampleCount ? parseInt(sampleCount) : undefined,
          requested_timeline_days: timeline ? parseInt(timeline) : undefined,
          budget_range_min: budgetMin ? parseFloat(budgetMin) : undefined,
          budget_range_max: budgetMax ? parseFloat(budgetMax) : undefined,
          commercial_use: commercial,
          requested_data_categories: dataCategories,
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
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Request Submitted</h2>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginBottom: 24 }}>
          Your access request has been submitted. The target organization will review it.
        </p>
        <button onClick={() => router.push('/marketplace/requests')} style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'var(--teal)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          View My Requests
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8 }}>
          Marketplace / Requests
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>Request Access</h1>
        <p style={{ fontSize: 13, color: 'var(--txd)', marginTop: 4 }}>
          Submit an access request to a program, collection, or organization in the Kadarn network.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <FormField label="Title *" help="Brief title for your request">
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={inputStyle} placeholder="e.g., Oncology Biomarker Access Request" />
        </FormField>

        <FormField label="Description" help="Describe your research purpose and requirements">
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            placeholder="Project background, intended use, ethical approvals..." />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Sample Count" help="Number of samples needed">
            <input type="number" value={sampleCount} onChange={e => setSampleCount(e.target.value)}
              style={inputStyle} placeholder="e.g., 100" min="0" />
          </FormField>
          <FormField label="Timeline (days)" help="Expected project duration">
            <input type="number" value={timeline} onChange={e => setTimeline(e.target.value)}
              style={inputStyle} placeholder="e.g., 180" min="1" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Budget Min ($)" help="Estimated lower bound">
            <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
              style={inputStyle} placeholder="0" min="0" />
          </FormField>
          <FormField label="Budget Max ($)" help="Estimated upper bound">
            <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
              style={inputStyle} placeholder="0" min="0" />
          </FormField>
        </div>

        <FormField label="Data Categories" help="Types of data you need access to">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {dataOpts.map(opt => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 7,
                background: dataCategories.includes(opt) ? 'rgba(12,197,193,0.12)' : 'var(--card)',
                border: `1px solid ${dataCategories.includes(opt) ? 'rgba(12,197,193,0.3)' : 'var(--border)'}`,
                cursor: 'pointer', fontSize: 12,
              }}>
                <input
                  type="checkbox"
                  checked={dataCategories.includes(opt)}
                  onChange={e => {
                    if (e.target.checked) setDataCategories([...dataCategories, opt])
                    else setDataCategories(dataCategories.filter(d => d !== opt))
                  }}
                  style={{ accentColor: 'var(--teal)' }}
                />
                {opt.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Commercial Use">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={commercial} onChange={e => setCommercial(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--teal)' }} />
            This request involves commercial use of the data/samples
          </label>
        </FormField>

        {error && (
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: 'var(--red)', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={submitting} style={{
            padding: '11px 24px', borderRadius: 10, border: 'none',
            background: 'var(--teal)', color: 'var(--navy)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}>
            {submitting ? 'Submitting...' : 'Submit Request'}
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
