'use client'

import { useState, useMemo } from 'react'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import {
  suggestDocumentRouting,
  checkEvidenceReadiness,
  canGenerateEvidenceNode,
  getSectionRoutingPreset,
  type RoutedDocument,
  type DocumentRoutingTarget,
  type DocumentRoutingTargetType,
  type DocumentRoutingStatus,
  type EvidenceReadiness,
} from '@/lib/documents/document-upload-router'
import {
  DOCUMENT_HANDLING_MODE_LABELS,
  evaluateFeasibilitySuggestion,
  type DocumentHandlingMode,
} from '@kadarn/types/document-handling'

// ==========================================================================
// Triage Inbox Page
// ==========================================================================

type TriageDoc = RoutedDocument & {
  uploadLabel: string
  uploadType: string
  isReallyUploaded: boolean
  fileName?: string
  status?: string
}

export default function DocumentTriagePage() {
  const { state } = useOnboarding()
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'ready' | 'blocked' | 'ff_candidate'>('all')

  // Build triage items from real uploadedDocs + study experience documents
  const triageItems = useMemo((): TriageDoc[] => {
    const items: TriageDoc[] = []

    // Real uploaded documents from the Documents page
    for (const doc of state.uploadedDocs) {
      const routing = suggestDocumentRouting({
        filename: doc.label,
        documentType: doc.type,
      })

      const item: TriageDoc = {
        documentId: doc.label,
        filename: doc.fileName || doc.label,
        documentType: doc.type,
        routingStatus: doc.uploaded ? 'suggested' : 'unassigned',
        primaryTarget: routing.suggestedTarget,
        claimCandidates: routing.claimCandidates,
        evidencePurpose: routing.evidencePurpose,
        evidenceReadiness: doc.uploaded ? 'not_ready_unassigned' : 'not_ready_unassigned',
        feasibilityEligible: routing.feasibilityEligible,
        handlingMode: routing.handlingMode,
        warning: routing.warning,
        uploadLabel: doc.label,
        uploadType: doc.type,
        isReallyUploaded: doc.uploaded,
        status: doc.status,
      }
      items.push(item)
    }

    // Study experience documents
    const studies = Array.isArray(state.answers['study_experience_records'])
      ? (state.answers['study_experience_records'] as Array<{ id: string; documents: Array<{ id: string; documentType: string; label: string; isUploaded: boolean; uploadedDocLabel?: string | null }> }>)
      : []

    for (const study of studies) {
      for (const doc of study.documents) {
        const routing = suggestDocumentRouting({
          documentType: doc.documentType,
          filename: doc.label,
          currentSection: 'study_experience',
        })

        const linkedDoc = doc.uploadedDocLabel
          ? state.uploadedDocs.find(d => d.label === doc.uploadedDocLabel)
          : null

        items.push({
          documentId: doc.id,
          filename: doc.label,
          documentType: doc.documentType,
          routingStatus: doc.isUploaded ? 'suggested' : 'unassigned',
          primaryTarget: routing.suggestedTarget,
          claimCandidates: routing.claimCandidates,
          evidencePurpose: routing.evidencePurpose,
          evidenceReadiness: linkedDoc?.uploaded ? 'not_ready_unassigned' : 'not_ready_unassigned',
          feasibilityEligible: routing.feasibilityEligible,
          handlingMode: routing.handlingMode,
          warning: routing.warning,
          uploadLabel: doc.label,
          uploadType: doc.documentType,
          isReallyUploaded: doc.isUploaded,
          fileName: doc.label,
        })
      }
    }

    return items
  }, [state.uploadedDocs, state.answers])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unassigned': return triageItems.filter(d => d.routingStatus === 'unassigned' || d.routingStatus === 'needs_review')
      case 'ready': return triageItems.filter(d => canGenerateEvidenceNode(d).canGenerate)
      case 'blocked': return triageItems.filter(d => !canGenerateEvidenceNode(d).canGenerate)
      case 'ff_candidate': return triageItems.filter(d => d.feasibilityEligible)
      default: return triageItems
    }
  }, [triageItems, filter])

  const counts = {
    total: triageItems.length,
    unassigned: triageItems.filter(d => d.routingStatus === 'unassigned' || d.routingStatus === 'needs_review').length,
    ready: triageItems.filter(d => canGenerateEvidenceNode(d).canGenerate).length,
    blocked: triageItems.filter(d => !canGenerateEvidenceNode(d).canGenerate).length,
    ff: triageItems.filter(d => d.feasibilityEligible).length,
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>Document Triage Inbox</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Review and assign uploaded documents before they count as evidence. Documents must have a document type, owner entity, and claim candidates to become evidence-backed.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatBox label="Total" value={counts.total} color="#1f2937" active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatBox label="Unassigned" value={counts.unassigned} color="#92400e" active={filter === 'unassigned'} onClick={() => setFilter('unassigned')} />
        <StatBox label="Ready" value={counts.ready} color="#166534" active={filter === 'ready'} onClick={() => setFilter('ready')} />
        <StatBox label="Blocked" value={counts.blocked} color="#991b1b" active={filter === 'blocked'} onClick={() => setFilter('blocked')} />
        <StatBox label="FF Candidates" value={counts.ff} color="#1e40af" active={filter === 'ff_candidate'} onClick={() => setFilter('ff_candidate')} />
      </div>

      {/* Triage list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
          <p style={{ color: '#6b7280' }}>No documents in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(doc => {
            const evidenceCheck = canGenerateEvidenceNode(doc)
            const readiness = checkEvidenceReadiness(doc)
            const isExpanded = expandedDoc === doc.documentId
            const feasibility = evaluateFeasibilitySuggestion({
              documentType: doc.documentType || '',
              documentLabel: doc.uploadLabel,
              isUploaded: doc.isReallyUploaded,
            })

            return (
              <div key={doc.documentId} style={{
                backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px',
                overflow: 'hidden',
              }}>
                {/* Row header */}
                <div
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.documentId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    cursor: 'pointer', backgroundColor: isExpanded ? '#f9fafb' : 'white',
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: evidenceCheck.canGenerate ? '#16a34a' :
                      readiness === 'not_ready_unassigned' ? '#f59e0b' :
                      readiness === 'not_ready_private' ? '#6b7280' : '#dc2626',
                  }} />

                  {/* Doc info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.filename || doc.uploadLabel}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {doc.documentType || 'No document type'} · {doc.isReallyUploaded ? 'Uploaded' : 'Pending'}
                    </div>
                  </div>

                  {/* Routing target */}
                  <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>
                    <div>{doc.primaryTarget?.targetType !== 'unassigned' ? `→ ${doc.primaryTarget?.targetType?.replace(/_/g, ' ')}` : 'Unassigned'}</div>
                    <div>{doc.primaryTarget?.section || ''}</div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {!evidenceCheck.canGenerate && (
                      <span style={badgeStyle('#fef2f2', '#991b1b')}>
                        {readiness === 'not_ready_unassigned' ? 'Needs assignment' :
                         readiness === 'not_ready_private' ? 'Private' :
                         readiness === 'not_ready_needs_document_type' ? 'Needs type' : 'Blocked'}
                      </span>
                    )}
                    {evidenceCheck.canGenerate && (
                      <span style={badgeStyle('#dcfce7', '#166534')}>Ready</span>
                    )}
                    {doc.feasibilityEligible && (
                      <span style={badgeStyle('#dbeafe', '#1e40af')}>+FF</span>
                    )}
                  </div>

                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <DetailField label="Document Type" value={doc.documentType || 'Not set'} />
                      <DetailField label="Routing Status" value={doc.routingStatus.replace(/_/g, ' ')} />
                      <DetailField label="Suggested Target" value={doc.primaryTarget?.targetType?.replace(/_/g, ' ') || 'Unassigned'} />
                      <DetailField label="Section" value={doc.primaryTarget?.section || '—'} />
                      <DetailField label="Evidence Purpose" value={doc.evidencePurpose?.replace(/_/g, ' ') || '—'} />
                      <DetailField label="Handling Mode" value={doc.handlingMode ? DOCUMENT_HANDLING_MODE_LABELS[doc.handlingMode] : '—'} />
                      <DetailField label="Feasibility Folder" value={doc.feasibilityEligible ? (feasibility.suggested ? 'Suggested' : 'Eligible') : 'Not eligible'} />
                      <DetailField label="Evidence Readiness" value={readiness.replace(/_/g, ' ')} />
                    </div>

                    {/* Claim candidates */}
                    {doc.claimCandidates && doc.claimCandidates.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Claim Candidates</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {doc.claimCandidates.map(c => (
                            <span key={c} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '100px', backgroundColor: '#f3f4f6', color: '#374151' }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blocked reason */}
                    {!evidenceCheck.canGenerate && (
                      <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '12px', color: '#991b1b' }}>
                        ⚠ {evidenceCheck.reason || 'Document cannot generate evidence.'}
                      </div>
                    )}

                    {/* Warning */}
                    {doc.warning && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fffbeb', borderRadius: '8px', fontSize: '12px', color: '#92400e' }}>
                        {doc.warning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '24px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: '11px', color: '#6b7280' }}>
        <strong>Legend:</strong>{' '}
        <span style={{ color: '#16a34a' }}>● Ready</span> ·{' '}
        <span style={{ color: '#f59e0b' }}>● Unassigned</span> ·{' '}
        <span style={{ color: '#dc2626' }}>● Blocked</span> ·{' '}
        <span style={{ color: '#6b7280' }}>● Private</span> ·{' '}
        <span style={badgeStyle('#dbeafe', '#1e40af')}>+FF</span> Feasibility Folder candidate
      </div>
    </div>
  )
}

// ==========================================================================
// Sub-components
// ==========================================================================

function StatBox({ label, value, color, active, onClick }: {
  label: string; value: number; color: string; active: boolean; onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
      backgroundColor: active ? `${color}15` : '#f9fafb',
      border: active ? `2px solid ${color}` : '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{label}</div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: '#374151' }}>{value}</div>
    </div>
  )
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return { fontSize: '10px', padding: '1px 6px', borderRadius: '100px', backgroundColor: bg, color, fontWeight: 500 }
}
