'use client'

import { FormEvent, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api-client'

type Claim = {
  id: string
  title: string
  category: string
  verification_status: string
  confidence_score: number
  is_public: boolean
  continuity_evidence_items?: { id: string }[]
  continuity_references?: { id: string; status: string }[]
}

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(148,163,184,.35)',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'rgba(15,23,42,.65)',
  color: 'var(--tx)',
} as const

function badgeStyle(level: string | undefined): React.CSSProperties {
  const colors: Record<string, string> = {
    self_reported: '#6b7280',
    evidence_backed: '#f59e0b',
    reference_confirmed: '#3b82f6',
    kadarn_verified: '#10b981',
  }
  return {
    background: (colors[level ?? 'self_reported'] ?? '#6b7280') + '22',
    color: colors[level ?? 'self_reported'] ?? '#6b7280',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  }
}

const cardStyle = {
  border: '1px solid rgba(148,163,184,.2)',
  borderRadius: 16,
  padding: 16,
  background: 'rgba(15,23,42,.45)',
} as const

export default function ContinuityOnboardingPage() {
  const [organizationId, setOrganizationId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [claimId, setClaimId] = useState('')
  const [claims, setClaims] = useState<Claim[]>([])
  const [message, setMessage] = useState('')

  async function loadClaims() {
    if (!organizationId || !profileId) return
    const data = await apiGet<{ claims: Claim[] }>(
      `/api/v1/continuity/claims?organization_id=${organizationId}&profile_id=${profileId}`,
    )
    setClaims(data.claims)
  }

  async function createClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = await apiPost<{ claim: Claim }>('/api/v1/continuity/claims', {
      organizationId,
      siteContinuityProfileId: profileId,
      claimType: form.get('claimType'),
      category: form.get('category'),
      title: form.get('title'),
      description: form.get('description'),
      therapeuticArea: form.get('therapeuticArea'),
      studyPhase: form.get('studyPhase'),
      biospecimenType: form.get('biospecimenType'),
      startDate: form.get('startDate') || null,
      endDate: form.get('endDate') || null,
      quantity: form.get('quantity') ? Number(form.get('quantity')) : null,
      isPublic: form.get('isPublic') === 'on',
      sponsorNamePolicy: 'masked',
      maskedSponsorLabel: form.get('maskedSponsorLabel') || null,
    })
    setClaimId(result.claim.id)
    setMessage('Legacy experience claim created.')
    await loadClaims()
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await apiPost(`/api/v1/continuity/claims/${claimId}/evidence`, {
      organizationId,
      evidenceType: form.get('evidenceType'),
      title: form.get('title'),
      description: form.get('description'),
      fileUrl: form.get('fileUrl') || null,
      externalUrl: form.get('externalUrl') || null,
    })
    setMessage('Evidence submitted.')
    await loadClaims()
  }

  async function addReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await apiPost(`/api/v1/continuity/claims/${claimId}/references`, {
      organizationId,
      referenceType: form.get('referenceType'),
      referenceName: form.get('referenceName'),
      referenceOrganization: form.get('referenceOrganization'),
      referenceEmail: form.get('referenceEmail'),
      referenceRole: form.get('referenceRole'),
      relationshipContext: form.get('relationshipContext'),
    })
    setMessage('Reference added.')
    await loadClaims()
  }

  return (
    <main style={{ display: 'grid', gap: 20 }}>
      <section>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Site Continuity Onboarding</h1>
        <p style={{ color: 'var(--txdd)', marginTop: 6 }}>
          Add legacy site experience, evidence, and references without storing PHI.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Continuity profile context</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
          <input style={inputStyle} placeholder="Organization ID" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} />
          <input style={inputStyle} placeholder="Site Continuity Profile ID" value={profileId} onChange={(e) => setProfileId(e.target.value)} />
          <button type="button" onClick={loadClaims}>Load claims</button>
        </div>
      </section>

      <form onSubmit={createClaim} style={cardStyle}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Add Legacy Experience</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <input name="claimType" required style={inputStyle} placeholder="Claim type" />
          <input name="category" required style={inputStyle} placeholder="Category" />
          <input name="title" required style={inputStyle} placeholder="Title" />
          <textarea name="description" style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Description without PHI" />
          <input name="therapeuticArea" style={inputStyle} placeholder="Therapeutic area" />
          <input name="studyPhase" style={inputStyle} placeholder="Study phase" />
          <input name="biospecimenType" style={inputStyle} placeholder="Biospecimen type" />
          <input name="startDate" type="date" style={inputStyle} />
          <input name="endDate" type="date" style={inputStyle} />
          <input name="quantity" type="number" style={inputStyle} placeholder="Quantity" />
          <select name="maskedSponsorLabel" style={inputStyle}>
            <option value="">Masked sponsor label</option>
            <option>Global pharma sponsor</option>
            <option>Top 10 CRO</option>
            <option>IVD company</option>
            <option>Academic medical center</option>
            <option>Specialty lab</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input name="isPublic" type="checkbox" /> Public / passport-visible
          </label>
        </div>
        <button style={{ marginTop: 12 }} type="submit">Create claim</button>
      </form>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Add Evidence / Reference</h2>
        <input style={{ ...inputStyle, marginBottom: 12 }} placeholder="Claim ID" value={claimId} onChange={(e) => setClaimId(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <form onSubmit={submitEvidence} style={{ display: 'grid', gap: 10 }}>
            <input name="evidenceType" required style={inputStyle} placeholder="Evidence type" />
            <input name="title" required style={inputStyle} placeholder="Evidence title" />
            <textarea name="description" style={inputStyle} placeholder="Evidence description" />
            <input name="fileUrl" style={inputStyle} placeholder="File URL" />
            <input name="externalUrl" style={inputStyle} placeholder="External URL" />
            <button type="submit">Submit evidence</button>
          </form>
          <form onSubmit={addReference} style={{ display: 'grid', gap: 10 }}>
            <input name="referenceType" required style={inputStyle} placeholder="Reference type" />
            <input name="referenceName" required style={inputStyle} placeholder="Reference name" />
            <input name="referenceOrganization" style={inputStyle} placeholder="Organization" />
            <input name="referenceEmail" type="email" style={inputStyle} placeholder="Email" />
            <input name="referenceRole" style={inputStyle} placeholder="Role" />
            <textarea name="relationshipContext" style={inputStyle} placeholder="Relationship context" />
            <button type="submit">Add reference</button>
          </form>
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Claim List</h2>
        {message && <p style={{ color: '#86efac' }}>{message}</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          {claims.map((claim) => (
            <article key={claim.id} style={{ border: '1px solid rgba(148,163,184,.18)', borderRadius: 12, padding: 12 }}>
              <strong>{claim.title}</strong>
              <div style={{ color: 'var(--txdd)', fontSize: 13 }}>{claim.category}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                <span>Status: {claim.verification_status}</span>
                <span>Confidence: {claim.confidence_score}</span>
                <span>Evidence: {claim.continuity_evidence_items?.length ?? 0}</span>
                <span>References: {claim.continuity_references?.length ?? 0}</span>
                <span>{claim.is_public ? 'Public' : 'Private'}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
