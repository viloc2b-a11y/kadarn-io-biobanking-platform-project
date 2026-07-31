'use client'

// ==========================================================================
// ProgressiveInterview — 4-level KEMS-001 progressive questionnaire
// Replaces old wizard. Each "yes" → Claim creation → Document Vault opens.
// ==========================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { apiPost, apiGet } from '@/lib/api-client'
import type {
  QuestionnaireTemplate,
  QuestionnaireSection,
  QuestionnaireField,
  DocumentUploadResponse,
} from '@kadarn/types'

// ─── Confidence Level (imported separately to avoid barrel ambiguity with confidence.ts) ──

/**
 * Claim confidence levels per KEMS-001 §1.
 * Mirrors @kadarn/types ConfidenceLevel from claim.ts.
 */
type ClaimConfidenceLevel = 'declared' | 'documented' | 'verified' | 'expired' | 'contradicted' | 'unknown'

// ─── Local Types ────────────────────────────────────────────────────────────

export interface DraftAnswer {
  fieldId: string
  value: string
  answeredAt: string
}

export interface LocalClaim {
  id: string
  fieldId: string
  questionText: string
  answerValue: string
  category: 'identity' | 'experience' | 'infrastructure' | 'quality' | 'other'
  confidenceLevel: ClaimConfidenceLevel
  sourceId?: string
  fileName?: string
  createdAt: string
}

export type LevelStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface LevelProgress {
  level: number
  key: string
  label: string
  status: LevelStatus
  completedFields: number
  totalFields: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DRAFT_STORAGE_KEY = 'kadarn_progressive_interview_draft'

const LEVEL_LABELS: Record<number, string> = {
  1: 'Site Identity',
  2: 'Clinical Experience',
  3: 'Lab Infrastructure',
  4: 'Quality & Regulatory',
}

const CATEGORY_BY_LEVEL: Record<number, 'identity' | 'experience' | 'infrastructure' | 'quality'> = {
  1: 'identity',
  2: 'experience',
  3: 'infrastructure',
  4: 'quality',
}

// ─── Default Questionnaire Templates (mirrors migration 094 seed data) ──────

const DEFAULT_TEMPLATES: QuestionnaireTemplate[] = [
  {
    id: 'seed-template-identity',
    template_name: 'Site Identity',
    level: 1,
    module_key: 'site_identity',
    schema_definition: {
      sections: [
        {
          id: 'identity',
          title: 'Institution Identity',
          description: 'Basic information about your research site.',
          fields: [
            { id: 'identity_name', type: 'text', label: 'Official Institution Name', required: true },
            {
              id: 'identity_type',
              type: 'select',
              label: 'Institution Type',
              required: true,
              options: [
                'Hospital', 'Biobank', 'CRO', 'Laboratory', 'Academic Medical Center',
                'Independent Research Site', 'SMO', 'Research Network', 'Physician Practice',
                'University', 'Non-Profit', 'Other',
              ],
            },
            { id: 'identity_country', type: 'text', label: 'Country', required: true },
            { id: 'identity_city', type: 'text', label: 'City', required: true },
            { id: 'identity_description', type: 'textarea', label: 'Brief Description' },
          ],
        },
        {
          id: 'contacts',
          title: 'Key Contacts',
          description: 'Primary points of contact for sponsors and CROs.',
          fields: [
            { id: 'contact_pi_name', type: 'text', label: 'Principal Investigator Name', required: true },
            { id: 'contact_pi_email', type: 'text', label: 'PI Email', required: true },
            { id: 'contact_coordinator_name', type: 'text', label: 'Site Coordinator Name' },
            { id: 'contact_coordinator_email', type: 'text', label: 'Coordinator Email' },
          ],
        },
      ],
    },
    is_required: true,
    sort_order: 1,
  },
  {
    id: 'seed-template-clinical',
    template_name: 'Clinical Experience',
    level: 2,
    module_key: 'clinical_experience',
    schema_definition: {
      sections: [
        {
          id: 'study_phases',
          title: 'Study Phase Experience',
          fields: [
            { id: 'exp_phase_i', type: 'boolean', label: 'Phase I experience?', activates_evidence: true },
            { id: 'exp_phase_ii', type: 'boolean', label: 'Phase II experience?', activates_evidence: true },
            { id: 'exp_phase_iii', type: 'boolean', label: 'Phase III experience?', activates_evidence: true },
            { id: 'exp_phase_iv', type: 'boolean', label: 'Phase IV experience?', activates_evidence: true },
          ],
        },
        {
          id: 'therapeutic_areas',
          title: 'Therapeutic Areas',
          fields: [
            { id: 'exp_ta_oncology', type: 'boolean', label: 'Oncology' },
            { id: 'exp_ta_cardiology', type: 'boolean', label: 'Cardiology' },
            { id: 'exp_ta_neurology', type: 'boolean', label: 'Neurology' },
            { id: 'exp_ta_immunology', type: 'boolean', label: 'Immunology' },
            { id: 'exp_ta_infectious', type: 'boolean', label: 'Infectious Disease' },
            { id: 'exp_ta_rare', type: 'boolean', label: 'Rare Disease' },
            { id: 'exp_ta_endocrinology', type: 'boolean', label: 'Endocrinology' },
            { id: 'exp_ta_respiratory', type: 'boolean', label: 'Respiratory' },
            { id: 'exp_ta_other', type: 'boolean', label: 'Other (specify)' },
          ],
        },
        {
          id: 'recruitment',
          title: 'Patient Recruitment',
          fields: [
            {
              id: 'exp_patient_volume',
              type: 'select',
              label: 'Avg patients enrolled per year',
              options: ['<10', '10-50', '51-100', '101-500', '>500'],
            },
            {
              id: 'exp_retention_rate',
              type: 'select',
              label: 'Typical retention rate',
              options: ['<50%', '50-70%', '71-85%', '86-95%', '>95%'],
            },
          ],
        },
      ],
    },
    is_required: true,
    sort_order: 2,
  },
  {
    id: 'seed-template-lab',
    template_name: 'Laboratory & Biospecimen Infrastructure',
    level: 3,
    module_key: 'lab_infrastructure',
    schema_definition: {
      sections: [
        {
          id: 'lab_capabilities',
          title: 'Lab Capabilities',
          fields: [
            {
              id: 'lab_has_internal',
              type: 'boolean',
              label: 'Do you have internal lab infrastructure for biospecimen handling?',
              activates_evidence: true,
            },
            { id: 'lab_pbmc_processing', type: 'boolean', label: 'PBMC processing capability?', activates_evidence: true },
            { id: 'lab_storage_minus80', type: 'boolean', label: '-80°C storage available?', activates_evidence: true },
            { id: 'lab_storage_minus20', type: 'boolean', label: '-20°C storage available?', activates_evidence: true },
            { id: 'lab_refrigerated_centrifuge', type: 'boolean', label: 'Refrigerated centrifuge available?', activates_evidence: true },
          ],
        },
        {
          id: 'lab_certifications',
          title: 'Certifications',
          fields: [
            { id: 'lab_cert_clia', type: 'boolean', label: 'CLIA certified?' },
            { id: 'lab_cert_cap', type: 'boolean', label: 'CAP accredited?' },
            { id: 'lab_cert_iso', type: 'boolean', label: 'ISO 15189?' },
            { id: 'lab_cert_gmp', type: 'boolean', label: 'GMP compliant?' },
            { id: 'lab_cert_glp', type: 'boolean', label: 'GLP compliant?' },
          ],
        },
        {
          id: 'lab_equipment',
          title: 'Equipment',
          fields: [
            { id: 'lab_eq_centrifuge', type: 'boolean', label: 'Centrifuge' },
            { id: 'lab_eq_pcr', type: 'boolean', label: 'PCR Machine' },
            { id: 'lab_eq_flow_cytometer', type: 'boolean', label: 'Flow Cytometer' },
            { id: 'lab_eq_sequencer', type: 'boolean', label: 'Sequencer' },
            { id: 'lab_eq_mass_spec', type: 'boolean', label: 'Mass Spectrometer' },
            { id: 'lab_eq_hplc', type: 'boolean', label: 'HPLC' },
            { id: 'lab_eq_elisa', type: 'boolean', label: 'ELISA Reader' },
            { id: 'lab_eq_microscope', type: 'boolean', label: 'Microscope' },
            { id: 'lab_eq_biosafety', type: 'boolean', label: 'Biosafety Cabinet' },
          ],
        },
      ],
    },
    is_required: false,
    sort_order: 3,
    activation_condition: { depends_on: 'lab_has_internal', expected_value: true },
  },
  {
    id: 'seed-template-quality',
    template_name: 'Quality System & Regulatory Startup',
    level: 4,
    module_key: 'quality_regulatory',
    schema_definition: {
      sections: [
        {
          id: 'irb_ec',
          title: 'Ethics Committee / IRB',
          fields: [
            {
              id: 'reg_irb_type',
              type: 'select',
              label: 'IRB/EC type',
              options: ['Local/Institutional', 'Central', 'Both available'],
            },
            {
              id: 'reg_irb_approval_time',
              type: 'select',
              label: 'Avg approval time',
              options: ['<2 weeks', '2-4 weeks', '4-8 weeks', '8-12 weeks', '>12 weeks'],
            },
          ],
        },
        {
          id: 'contracting',
          title: 'Contract & Budget Timelines',
          fields: [
            {
              id: 'reg_contract_time',
              type: 'select',
              label: 'Avg time from receipt to fully executed contract',
              options: ['<2 weeks', '2-4 weeks', '4-8 weeks', '8-12 weeks', '>12 weeks'],
            },
            {
              id: 'reg_budget_time',
              type: 'select',
              label: 'Avg budget negotiation time',
              options: ['<1 week', '1-2 weeks', '2-4 weeks', '>4 weeks'],
            },
          ],
        },
        {
          id: 'certifications',
          title: 'Staff Certifications & Audits',
          fields: [
            { id: 'reg_gcp_certified', type: 'boolean', label: 'Staff with current GCP certification?', activates_evidence: true },
            { id: 'reg_fda_audited', type: 'boolean', label: 'FDA audited in last 5 years?' },
            { id: 'reg_ema_audited', type: 'boolean', label: 'EMA audited in last 5 years?' },
            { id: 'reg_other_audit', type: 'boolean', label: 'Other regulatory authority audit?' },
          ],
        },
      ],
    },
    is_required: true,
    sort_order: 4,
  },
]

// ─── Confidence Labels ──────────────────────────────────────────────────────

const CONFIDENCE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  declared: { label: 'Declared', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: '📝' },
  documented: { label: 'Documented', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: '📄' },
  verified: { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: '✅' },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: '⏰' },
  contradicted: { label: 'Contradicted', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: '⚠️' },
  unknown: { label: 'N/A', color: 'text-gray-500 bg-gray-500/10 border-gray-500/30', icon: '—' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadDraft(): Record<string, DraftAnswer> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DraftAnswer>) : {}
  } catch {
    return {}
  }
}

function saveDraft(answers: Record<string, DraftAnswer>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(answers))
  } catch {
    // Storage full or unavailable — silently degrade
  }
}

function countFields(template: QuestionnaireTemplate): number {
  let count = 0
  for (const section of template.schema_definition.sections) {
    count += section.fields.length
  }
  return count
}

// ─── ClaimBadge ─────────────────────────────────────────────────────────────

function ClaimBadge({ level }: { level: ClaimConfidenceLevel }) {
  const cfg = CONFIDENCE_LABELS[level] ?? CONFIDENCE_LABELS.unknown
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

// ─── ProgressIndicator ──────────────────────────────────────────────────────

function ProgressIndicator({
  levels,
  currentLevel,
  onNavigate,
}: {
  levels: LevelProgress[]
  currentLevel: number
  onNavigate: (level: number) => void
}) {
  return (
    <nav aria-label="Progressive interview levels" className="flex items-center gap-1 mb-8">
      {levels.map((lp, idx) => {
        const isActive = lp.level === currentLevel
        const isPast = lp.status === 'completed'
        const isSkipped = lp.status === 'skipped'

        let circleClass = 'border-[#2a2a40] text-[#6b6b80]'
        if (isActive) circleClass = 'border-[#8b86e5] bg-[#8b86e5]/10 text-[#8b86e5]'
        else if (isPast) circleClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
        else if (isSkipped) circleClass = 'border-gray-600 bg-gray-700/30 text-gray-500'

        return (
          <div key={lp.key} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onNavigate(lp.level)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-bold ${circleClass}`}
              >
                {isPast ? '✓' : isSkipped ? '—' : lp.level}
              </span>
              <div className="hidden sm:block text-left">
                <div className={`text-xs font-medium ${isActive ? 'text-[#e0e0f0]' : 'text-[#6b6b80]'}`}>
                  {lp.label}
                </div>
                <div className="text-[10px] text-[#4a4a60]">
                  {lp.completedFields}/{lp.totalFields} fields
                </div>
              </div>
            </button>
            {idx < levels.length - 1 && (
              <div
                className={`w-6 h-px ${isPast ? 'bg-emerald-500/30' : 'bg-[#2a2a40]'}`}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ─── DocumentVault ──────────────────────────────────────────────────────────

function DocumentVault({
  claim,
  onUploadComplete,
  onClose,
}: {
  claim: LocalClaim
  onUploadComplete: (claimId: string, sourceId: string, fileName: string) => void
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/documents/upload`,
        { method: 'POST', body: form },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? `Upload failed (${response.status})`)
      }
      const result = (await response.json()) as DocumentUploadResponse
      onUploadComplete(claim.id, result.source_id, result.file_name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [file, claim.id, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) setFile(files[0])
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#12121f] border-l border-[#2a2a40] shadow-2xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#e0e0f0]">Document Vault</h3>
            <button
              onClick={onClose}
              className="text-[#6b6b80] hover:text-[#e0e0f0] transition-colors p-1 rounded hover:bg-white/5"
              aria-label="Close document vault"
            >
              ✕
            </button>
          </div>

          {/* Claim context */}
          <div className="mb-6 p-4 rounded-lg bg-[#1a1a2e] border border-[#2a2a40]">
            <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Evidence for claim</div>
            <div className="text-sm text-[#e0e0f0] font-medium mb-2">{claim.questionText}</div>
            <ClaimBadge level={claim.confidenceLevel} />
          </div>

          {/* Already uploaded */}
          {claim.sourceId ? (
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-6">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span>✅</span>
                <span>Evidence uploaded: <strong>{claim.fileName}</strong></span>
              </div>
              <p className="text-xs text-[#6b6b80] mt-2">
                Uploading additional evidence will replace the current file.
              </p>
            </div>
          ) : null}

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer mb-4 ${
              dragOver
                ? 'border-[#8b86e5] bg-[#8b86e5]/5'
                : 'border-[#2a2a40] hover:border-[#8b86e5]/50 hover:bg-white/[0.02]'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) setFile(files[0])
              }}
              accept=".pdf,.doc,.docx,.xlsx,.pptx,.html,.htm,.csv,.txt,.md,.png,.jpg,.jpeg"
            />
            <div className="text-3xl mb-2">{dragOver ? '📥' : '📄'}</div>
            <div className="text-sm font-medium text-[#c0c0d0] mb-1">
              {file ? file.name : 'Drop evidence file here or click to browse'}
            </div>
            <div className="text-xs text-[#6b6b80]">
              PDF, DOCX, XLSX, images — max 50MB
            </div>
          </div>

          {/* Selected file info */}
          {file && (
            <div className="mb-4 p-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a40] flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm text-[#e0e0f0] truncate">{file.name}</div>
                <div className="text-xs text-[#6b6b80]">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 transition-colors"
            >
              {claim.sourceId ? 'Close' : 'Skip for now'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 py-2 rounded-lg bg-[#8b86e5] text-white text-sm font-medium hover:bg-[#7a75d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : claim.sourceId ? (
                'Replace Evidence'
              ) : (
                'Upload Evidence'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── LevelCard ──────────────────────────────────────────────────────────────

function LevelCard({
  template,
  answers,
  claims,
  onFieldChange,
  onOpenVault,
  levelNumber,
}: {
  template: QuestionnaireTemplate
  answers: Record<string, DraftAnswer>
  claims: LocalClaim[]
  onFieldChange: (fieldId: string, value: string) => void
  onOpenVault: (claim: LocalClaim) => void
  levelNumber: number
}) {
  const createClaim = useCallback(
    (field: QuestionnaireField, value: string) => {
      const now = new Date().toISOString()
      const claim: LocalClaim = {
        id: crypto.randomUUID(),
        fieldId: field.id,
        questionText: field.label,
        answerValue: value,
        category: CATEGORY_BY_LEVEL[levelNumber] ?? 'other',
        confidenceLevel: 'declared',
        createdAt: now,
      }
      return claim
    },
    [levelNumber],
  )

  const handleBooleanChange = useCallback(
    (field: QuestionnaireField, val: string) => {
      onFieldChange(field.id, val)
      if (val === 'yes' && field.activates_evidence) {
        const claim = createClaim(field, val)
        onOpenVault(claim)
      }
    },
    [onFieldChange, createClaim, onOpenVault],
  )

  const renderField = (field: QuestionnaireField) => {
    const answer = answers[field.id]
    const value = answer?.value ?? ''

    const inputBaseClass =
      'w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-sm text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors'

    switch (field.type) {
      case 'boolean': {
        const claimForField = claims.find((c) => c.fieldId === field.id)
        return (
          <div className="space-y-2">
            <div className="flex gap-3">
              {['yes', 'no', 'skip'].map((opt) => {
                const isSelected = value === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleBooleanChange(field, opt)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? opt === 'yes'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : opt === 'no'
                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                            : 'bg-gray-500/10 border-gray-500/40 text-gray-400'
                        : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30 hover:text-[#c0c0d0]'
                    }`}
                  >
                    {opt === 'yes' ? '✓ Yes' : opt === 'no' ? '✕ No' : '— Skip'}
                  </button>
                )
              })}
            </div>
            {field.activates_evidence && value === 'yes' && claimForField && (
              <div className="flex items-center gap-2">
                <ClaimBadge level={claimForField.confidenceLevel} />
                <button
                  type="button"
                  onClick={() => onOpenVault(claimForField)}
                  className="text-xs text-[#8b86e5] hover:text-[#a09bf0] underline underline-offset-2"
                >
                  Open Document Vault ↗
                </button>
              </div>
            )}
          </div>
        )
      }

      case 'select':
        return (
          <select
            className={inputBaseClass}
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
          >
            <option value="">Select...</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            className={`${inputBaseClass} min-h-[80px] resize-y`}
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
          />
        )

      default:
        return (
          <input
            className={inputBaseClass}
            type={field.type === 'numeric' ? 'number' : 'text'}
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder ?? ''}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {template.schema_definition.sections.map((section: QuestionnaireSection) => (
        <SectionCard
          key={section.id}
          section={section}
          renderField={renderField}
          answers={answers}
        />
      ))}
    </div>
  )
}

function SectionCard({
  section,
  renderField,
  answers,
}: {
  section: QuestionnaireSection
  renderField: (field: QuestionnaireField) => React.ReactNode
  answers: Record<string, DraftAnswer>
}) {
  const completed = section.fields.filter((f: QuestionnaireField) => answers[f.id]?.value).length

  return (
    <div className="rounded-xl border border-[#1e1e35] bg-[#0d0d22]/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e35]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#e0e0f0]">{section.title}</h4>
            {section.description && (
              <p className="text-xs text-[#6b6b80] mt-0.5">{section.description}</p>
            )}
          </div>
          <span className="text-[10px] text-[#4a4a60] font-mono">
            {completed}/{section.fields.length}
          </span>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {section.fields.map((field: QuestionnaireField) => (
          <div key={field.id}>
            <label
              htmlFor={`field-${field.id}`}
              className="block text-sm text-[#c0c0d0] mb-1.5"
            >
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.help_text && (
              <p className="text-xs text-[#6b6b80] mb-1">{field.help_text}</p>
            )}
            {field.type === 'boolean' ? (
              renderField(field)
            ) : (
              <div id={`field-${field.id}`}>{renderField(field)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export interface ProgressiveInterviewProps {
  institutionId?: string
  onComplete?: (claims: LocalClaim[], answers: Record<string, DraftAnswer>) => void
}

export function ProgressiveInterview({
  institutionId,
  onComplete,
}: ProgressiveInterviewProps) {
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>(DEFAULT_TEMPLATES)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>(() => loadDraft())
  const [claims, setClaims] = useState<LocalClaim[]>([])
  const [activeVaultClaim, setActiveVaultClaim] = useState<LocalClaim | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load templates from API (fall back to defaults)
  useEffect(() => {
    let cancelled = false
    apiGet<{ data: QuestionnaireTemplate[] }>('/api/v1/questionnaire-templates')
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data) && res.data.length > 0) {
          setTemplates(res.data)
        }
      })
      .catch(() => {
        // Silently use default templates
      })
    return () => { cancelled = true }
  }, [])

  // Persist draft to localStorage
  useEffect(() => {
    saveDraft(answers)
  }, [answers])

  // Compute level progress
  const levelProgress: LevelProgress[] = useMemo(() => {
    return templates
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => {
        const totalFields = countFields(t)
        const completedFields = t.schema_definition.sections.reduce(
          (acc: number, s: QuestionnaireSection) =>
            acc + s.fields.filter((f: QuestionnaireField) => answers[f.id]?.value).length,
          0,
        )
        let status: LevelStatus = 'pending'
        if (completedFields === totalFields) status = 'completed'
        else if (completedFields > 0) status = 'in_progress'
        // Level 3 conditional — if lab_has_internal is answered "no" or skipped, mark skipped
        if (t.level === 3 && answers['lab_has_internal']?.value !== 'yes') {
          status = 'skipped'
        }
        return {
          level: t.level,
          key: t.module_key,
          label: LEVEL_LABELS[t.level] ?? `Level ${t.level}`,
          status,
          completedFields,
          totalFields,
        }
      })
  }, [templates, answers])

  // Filter level 3 if lab not declared
  const visibleLevels = useMemo(() => {
    return templates.filter((t) => {
      if (t.level === 3) {
        return answers['lab_has_internal']?.value === 'yes'
      }
      return true
    })
  }, [templates, answers])

  const currentTemplate = visibleLevels.find((t) => t.level === currentLevel)

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: { fieldId, value, answeredAt: new Date().toISOString() },
    }))
  }, [])

  const handleOpenVault = useCallback((claim: LocalClaim) => {
    // Add or update claim
    setClaims((prev) => {
      const idx = prev.findIndex((c) => c.fieldId === claim.fieldId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = claim
        return updated
      }
      return [...prev, claim]
    })
    setActiveVaultClaim(claim)
  }, [])

  const handleUploadComplete = useCallback(
    (claimId: string, sourceId: string, fileName: string) => {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, confidenceLevel: 'documented' as ClaimConfidenceLevel, sourceId, fileName }
            : c,
        ),
      )
      setActiveVaultClaim(null)
    },
    [],
  )

  const handleNavigate = useCallback((level: number) => {
    setCurrentLevel(level)
  }, [])

  const handleNext = useCallback(() => {
    const nextLevel = currentLevel + 1
    // If level 3 is skipped, jump to 4
    if (nextLevel === 3 && answers['lab_has_internal']?.value !== 'yes') {
      setCurrentLevel(4)
    } else if (nextLevel <= 4) {
      setCurrentLevel(nextLevel)
    }
  }, [currentLevel, answers])

  const handlePrevious = useCallback(() => {
    const prevLevel = currentLevel - 1
    // If level 3 is skipped, jump back to 2
    if (prevLevel === 3 && answers['lab_has_internal']?.value !== 'yes') {
      setCurrentLevel(2)
    } else if (prevLevel >= 1) {
      setCurrentLevel(prevLevel)
    }
  }, [currentLevel, answers])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      // Submit claims via API
      for (const claim of claims) {
        await apiPost('/api/v1/claims', {
          institution_id: institutionId ?? '00000000-0000-0000-0000-000000000000',
          question_text: claim.questionText,
          answer_value: claim.answerValue,
          answer_type: 'boolean',
          category: claim.category,
          evidence_source_id: claim.sourceId,
        })
      }
      onComplete?.(claims, answers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [claims, answers, institutionId, onComplete])

  if (!currentTemplate) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-2">All Levels Complete</h2>
        <p className="text-sm text-[#6b6b80] mb-6">
          You have completed all progressive interview levels.
          {claims.length > 0 && ` ${claims.length} claims created.`}
        </p>
        {claims.length > 0 && (
          <div className="max-w-md mx-auto mb-6">
            <h3 className="text-sm font-medium text-[#c0c0d0] mb-3">Claims Summary</h3>
            <div className="space-y-2">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a40]"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#e0e0f0] truncate">{claim.questionText}</div>
                    <div className="text-[10px] text-[#6b6b80] mt-0.5">Answer: {claim.answerValue}</div>
                  </div>
                  <ClaimBadge level={claim.confidenceLevel} />
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg bg-[#8b86e5] text-white font-medium text-sm hover:bg-[#7a75d4] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit All Claims'}
        </button>
      </div>
    )
  }

  const isLastVisible = currentTemplate === visibleLevels[visibleLevels.length - 1]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">Progressive Interview</h2>
        <p className="text-sm text-[#6b6b80]">
          Complete each level to build your site profile. Answering &ldquo;yes&rdquo; to evidence-backed
          questions will create claims and open the Document Vault for upload.
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressIndicator
        levels={levelProgress}
        currentLevel={currentLevel}
        onNavigate={handleNavigate}
      />

      {/* Claims bar */}
      {claims.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-[#1a1a2e] border border-[#2a2a40]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-[#6b6b80]">Claims created: </span>
              <span className="text-sm font-medium text-[#e0e0f0]">{claims.length}</span>
            </div>
            <div className="flex gap-2">
              {(['declared', 'documented', 'verified'] as ClaimConfidenceLevel[]).map((level) => {
                const count = claims.filter((c) => c.confidenceLevel === level).length
                if (count === 0) return null
                return <ClaimBadge key={level} level={level} />
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Level card */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8b86e5]/20 text-[#8b86e5] text-sm font-bold">
            {currentLevel}
          </span>
          <h3 className="text-lg font-semibold text-[#e0e0f0]">
            {LEVEL_LABELS[currentLevel] ?? currentTemplate.template_name}
          </h3>
        </div>

        <LevelCard
          template={currentTemplate}
          answers={answers}
          claims={claims}
          onFieldChange={handleFieldChange}
          onOpenVault={handleOpenVault}
          levelNumber={currentLevel}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentLevel === 1}
          className="px-4 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-3">
          {isLastVisible ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#8b86e5] text-white font-medium text-sm hover:bg-[#7a75d4] disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Complete Interview →'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-[#8b86e5] text-white font-medium text-sm hover:bg-[#7a75d4] transition-colors"
            >
              Next Level →
            </button>
          )}
        </div>
      </div>

      {/* Document Vault slide-out */}
      {activeVaultClaim && (
        <DocumentVault
          claim={activeVaultClaim}
          onUploadComplete={handleUploadComplete}
          onClose={() => setActiveVaultClaim(null)}
        />
      )}
    </div>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useProgressiveInterview() {
  const [claims, setClaims] = useState<LocalClaim[]>([])
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({})

  return { claims, setClaims, answers, setAnswers }
}
