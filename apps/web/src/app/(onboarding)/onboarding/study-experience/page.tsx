'use client'

import { useState } from 'react'
import { DomainHeader } from '../../components/domain-header'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import {
  createStudyExperienceRecord,
  classifyStudyEvidence,
  deriveStudyExperienceClaims,
  type StudyExperienceRecord,
  type StudyExperienceDocument,
  type ComponentEvidenceStatus,
  type StudyDocumentType,
  STUDY_DOCUMENT_LABELS,
  STUDY_COMPONENT_LABELS,
  COMPONENT_LABELS,
} from '@/lib/onboarding/study-experience-record'

type EditingStudy = StudyExperienceRecord | null

export default function StudyExperiencePage() {
  const { state, setAnswer } = useOnboarding()
  const records: StudyExperienceRecord[] = Array.isArray(state.answers['study_experience_records'])
    ? (state.answers['study_experience_records'] as StudyExperienceRecord[])
    : []

  const [editing, setEditing] = useState<EditingStudy>(null)

  const saveRecords = (updated: StudyExperienceRecord[]) => {
    setAnswer('study_experience_records', updated)
  }

  const addStudy = () => {
    setEditing(createStudyExperienceRecord())
  }

  const saveStudy = (record: StudyExperienceRecord) => {
    const reclassified = { ...record, evidenceStatus: classifyStudyEvidence(record), updatedAt: new Date().toISOString() }
    const existing = records.findIndex(r => r.id === record.id)
    const updated = existing >= 0
      ? records.map((r, i) => i === existing ? reclassified : r)
      : [...records, reclassified]
    saveRecords(updated)
    setEditing(null)
  }

  const deleteStudy = (id: string) => {
    saveRecords(records.filter(r => r.id !== id))
  }

  const claims = deriveStudyExperienceClaims(records)
  const answeredCount = records.length

  if (editing) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <DomainHeader domain="organization" questionCount={1} questionsAnswered={answeredCount > 0 ? 1 : 0} />
        <StudyForm
          record={editing}
          onChange={(patch) => setEditing({ ...editing, ...patch })}
          onSave={() => saveStudy(editing)}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <DomainHeader domain="organization" questionCount={1} questionsAnswered={answeredCount > 0 ? 1 : 0} />

      <div style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>Study Experience Evidence</h2>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
          Record studies your institution has participated in. Each study can be anchored to ClinicalTrials.gov (NCT number),
          supported by uploaded documents (IRB approval, activation, closeout), and include enrollment data.
          Enrollment is self-reported by default and only becomes externally corroborated with sponsor/CRO confirmation.
        </p>
      </div>

      {/* Claims summary */}
      {claims.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Derived Claims</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {claims.map(c => (
              <span key={c.claimId} style={{
                padding: '4px 10px', borderRadius: '100px', fontSize: '12px',
                backgroundColor: c.evidenceStatus === 'EXTERNALLY_CORROBORATED' ? '#dcfce7' :
                  c.evidenceStatus === 'DOCUMENT_SUPPORTED' ? '#dbeafe' :
                  c.evidenceStatus === 'ANCHORED' ? '#fef3c7' :
                  c.evidenceStatus === 'SELF_REPORTED' ? '#ffedd5' : '#f3f4f6',
                color: c.evidenceStatus === 'EXTERNALLY_CORROBORATED' ? '#166534' :
                  c.evidenceStatus === 'DOCUMENT_SUPPORTED' ? '#1e40af' :
                  c.evidenceStatus === 'ANCHORED' ? '#92400e' :
                  c.evidenceStatus === 'SELF_REPORTED' ? '#9a3412' : '#6b7280',
              }}>
                {COMPONENT_LABELS[c.evidenceStatus]}: {c.claimLabel} ({c.studyCount} studies)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Study list */}
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>No studies recorded yet.</p>
          <button onClick={addStudy} style={{
            padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none',
            borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}>
            Record Your First Study
          </button>
        </div>
      ) : (
        <div style={{ spaceY: '12px' }}>
          {records.map(record => (
            <StudyCard
              key={record.id}
              record={record}
              onEdit={() => setEditing(record)}
              onDelete={() => deleteStudy(record.id)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      {records.length > 0 && (
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button onClick={addStudy} style={{
            padding: '8px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>
            + Add Another Study
          </button>
        </div>
      )}
    </div>
  )
}

// ==========================================================================
// Study Card
// ==========================================================================

function StudyCard({ record, onEdit, onDelete }: {
  record: StudyExperienceRecord
  onEdit: () => void
  onDelete: () => void
}) {
  const es = record.evidenceStatus
  const hasEnrollment = record.enrollmentEnrolledReported !== null || record.enrollmentCompletedReported !== null

  const badges: { label: string; color: string; bg: string }[] = []

  if (es.study_existence === 'ANCHORED') badges.push({ label: 'NCT anchored', color: '#92400e', bg: '#fef3c7' })
  if (es.site_irb_approval === 'DOCUMENT_SUPPORTED') badges.push({ label: 'IRB letter uploaded', color: '#1e40af', bg: '#dbeafe' })
  if (es.operational_execution === 'DOCUMENT_SUPPORTED') badges.push({ label: 'Activation/Closeout evidence', color: '#1e40af', bg: '#dbeafe' })
  if (es.site_participation === 'EXTERNALLY_CORROBORATED') badges.push({ label: 'Sponsor-confirmed', color: '#166534', bg: '#dcfce7' })
  if (es.enrollment_performance === 'EXTERNALLY_CORROBORATED') badges.push({ label: 'Enrollment corroborated', color: '#166534', bg: '#dcfce7' })
  else if (es.enrollment_performance === 'DOCUMENT_SUPPORTED') badges.push({ label: 'Enrollment document-supported', color: '#1e40af', bg: '#dbeafe' })
  else if (es.enrollment_performance === 'SELF_REPORTED') badges.push({ label: 'Enrollment self-reported', color: '#9a3412', bg: '#ffedd5' })
  if (es.biospecimen_handling === 'DOCUMENT_SUPPORTED') badges.push({ label: 'Biospecimen evidence', color: '#1e40af', bg: '#dbeafe' })

  return (
    <div style={{
      backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
      padding: '20px', marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
            {record.studyTitle || 'Untitled Study'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            {record.protocolNumber && <span>Protocol: {record.protocolNumber}</span>}
            {record.clinicaltrialsGovNct && <span style={{ marginLeft: '12px' }}>NCT: {record.clinicaltrialsGovNct}</span>}
            {record.sponsorName && <span style={{ marginLeft: '12px' }}>Sponsor: {record.sponsorName}</span>}
          </div>
          {(record.indication || record.phase) && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {[record.indication, record.phase, record.studyType].filter(Boolean).join(' · ')}
            </div>
          )}
          {hasEnrollment && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Enrollment: {record.enrollmentEnrolledReported !== null ? `${record.enrollmentEnrolledReported} enrolled` : ''}
              {record.enrollmentCompletedReported !== null ? ` / ${record.enrollmentCompletedReported} completed` : ''}
              {record.enrollmentTarget !== null ? ` (target: ${record.enrollmentTarget})` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={onEdit} style={{
            padding: '4px 12px', fontSize: '12px', border: '1px solid #d1d5db',
            borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer',
          }}>Edit</button>
          <button onClick={onDelete} style={{
            padding: '4px 12px', fontSize: '12px', border: '1px solid #fecaca',
            borderRadius: '6px', backgroundColor: '#fef2f2', color: '#991b1b', cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {badges.map((b, i) => (
          <span key={i} style={{
            padding: '2px 8px', borderRadius: '100px', fontSize: '11px',
            color: b.color, backgroundColor: b.bg, fontWeight: 500,
          }}>{b.label}</span>
        ))}
        {badges.length === 0 && (
          <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6' }}>
            No evidence provided
          </span>
        )}
      </div>

      {/* Missing evidence warnings */}
      {record.documents.length === 0 && record.clinicaltrialsGovNct && (
        <div style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fffbeb', padding: '6px 10px', borderRadius: '6px' }}>
          ⚠ NCT anchored but no documents uploaded. Add IRB approval letter or other site documents to strengthen evidence.
        </div>
      )}
      {es.enrollment_performance === 'SELF_REPORTED' && (
        <div style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fffbeb', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
          ⚠ Enrollment is self-reported. Upload an enrollment summary or sponsor confirmation to increase confidence.
        </div>
      )}
    </div>
  )
}

// ==========================================================================
// Study Form (inline editor)
// ==========================================================================

function StudyForm({ record, onChange, onSave, onCancel }: {
  record: StudyExperienceRecord
  onChange: (patch: Partial<StudyExperienceRecord>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const [docType, setDocType] = useState<StudyDocumentType>('irb_approval_letter')

  const addDocument = () => {
    const newDoc: StudyExperienceDocument = {
      id: `doc-${Date.now()}`,
      documentType: docType,
      label: STUDY_DOCUMENT_LABELS[docType],
      uploadedDocLabel: null,
      isUploaded: false,
      isPending: true,
      effectiveDate: null,
      expirationDate: null,
      reviewStatus: null,
      componentsSupported: [],
    }
    onChange({ documents: [...record.documents, newDoc] })
  }

  const removeDocument = (docId: string) => {
    onChange({ documents: record.documents.filter(d => d.id !== docId) })
  }

  const toggleDocUploaded = (docId: string) => {
    onChange({
      documents: record.documents.map(d =>
        d.id === docId ? { ...d, isUploaded: !d.isUploaded, isPending: !d.isUploaded ? false : d.isPending } : d
      ),
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
  }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' }
  const fieldStyle: React.CSSProperties = { marginBottom: '12px' }

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
        {record.studyTitle ? 'Edit Study' : 'New Study Record'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Study Title *</label>
          <input style={inputStyle} value={record.studyTitle} onChange={e => onChange({ studyTitle: e.target.value })} placeholder="e.g., A Phase II Study of..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Protocol Number *</label>
          <input style={inputStyle} value={record.protocolNumber} onChange={e => onChange({ protocolNumber: e.target.value })} placeholder="e.g., ABC-123" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>ClinicalTrials.gov NCT</label>
          <input style={inputStyle} value={record.clinicaltrialsGovNct || ''} onChange={e => onChange({ clinicaltrialsGovNct: e.target.value || null })} placeholder="NCT01234567" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Sponsor Name</label>
          <input style={inputStyle} value={record.sponsorName || ''} onChange={e => onChange({ sponsorName: e.target.value || null })} placeholder="e.g., Pfizer" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>CRO Name</label>
          <input style={inputStyle} value={record.croName || ''} onChange={e => onChange({ croName: e.target.value || null })} placeholder="e.g., IQVIA" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Indication</label>
          <input style={inputStyle} value={record.indication || ''} onChange={e => onChange({ indication: e.target.value || null })} placeholder="e.g., NSCLC" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Phase</label>
          <select style={inputStyle} value={record.phase || ''} onChange={e => onChange({ phase: (e.target.value || null) as StudyExperienceRecord['phase'] })}>
            <option value="">Select...</option>
            <option value="Phase I">Phase I</option>
            <option value="Phase II">Phase II</option>
            <option value="Phase III">Phase III</option>
            <option value="Phase IV">Phase IV</option>
            <option value="Observational">Observational</option>
            <option value="Device">Device</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Study Type</label>
          <select style={inputStyle} value={record.studyType || ''} onChange={e => onChange({ studyType: (e.target.value || null) as StudyExperienceRecord['studyType'] })}>
            <option value="">Select...</option>
            <option value="Interventional">Interventional</option>
            <option value="Observational">Observational</option>
            <option value="Registry">Registry</option>
            <option value="Expanded Access">Expanded Access</option>
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Site Status</label>
          <select style={inputStyle} value={record.siteStatus || ''} onChange={e => onChange({ siteStatus: (e.target.value || null) as StudyExperienceRecord['siteStatus'] })}>
            <option value="">Select...</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="in_startup">In Startup</option>
            <option value="terminated">Terminated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Enrollment */}
      <div style={{ ...fieldStyle, marginTop: '8px' }}>
        <label style={labelStyle}>Enrollment (self-reported) </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <input style={inputStyle} type="number" placeholder="Target" value={record.enrollmentTarget ?? ''} onChange={e => onChange({ enrollmentTarget: e.target.value ? Number(e.target.value) : null })} />
          <input style={inputStyle} type="number" placeholder="Enrolled" value={record.enrollmentEnrolledReported ?? ''} onChange={e => onChange({ enrollmentEnrolledReported: e.target.value ? Number(e.target.value) : null })} />
          <input style={inputStyle} type="number" placeholder="Completed" value={record.enrollmentCompletedReported ?? ''} onChange={e => onChange({ enrollmentCompletedReported: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Enrollment is self-reported by default. Upload enrollment summary or sponsor confirmation to increase confidence.</div>
      </div>

      {/* Documents */}
      <div style={{ ...fieldStyle, marginTop: '16px' }}>
        <label style={labelStyle}>Study Documents</label>
        {record.documents.length === 0 && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>No documents associated yet.</div>
        )}
        {record.documents.map(doc => (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '12px' }}>
            <span style={{ flex: 1 }}>{STUDY_DOCUMENT_LABELS[doc.documentType] || doc.label}</span>
            <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={doc.isUploaded} onChange={() => toggleDocUploaded(doc.id)} />
              Uploaded
            </label>
            <button onClick={() => removeDocument(doc.id)} style={{ color: '#991b1b', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <select style={{ ...inputStyle, flex: 1 }} value={docType} onChange={e => setDocType(e.target.value as StudyDocumentType)}>
            {Object.entries(STUDY_DOCUMENT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button onClick={addDocument} style={{
            padding: '6px 12px', fontSize: '12px', border: '1px solid #2563eb', borderRadius: '6px',
            backgroundColor: 'white', color: '#2563eb', cursor: 'pointer',
          }}>+ Add</button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button onClick={onSave} style={{
          padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none',
          borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>Save Study</button>
        <button onClick={onCancel} style={{
          padding: '10px 24px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db',
          borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  )
}
