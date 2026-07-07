// ==========================================================================
// OCP-6 — Historical Portfolio
// ==========================================================================
// Pure, deterministic derivation of institutional history from canonical
// objects, memory events, and classified documents.
//
// Separates Current Snapshot from Historical Portfolio.
// Historical events are classified by evidence state:
//   DECLARED_HISTORY → DOCUMENT_BACKED_HISTORY → EXTERNALLY_CONFIRMED_HISTORY
//
// Design contract:
// - Pure function: same input → same output
// - Deterministic: no randomness
// - Stateless: no side effects, no persistence
// ==========================================================================

import type { InstitutionalMemoryEvent } from './institutional-memory'
import type { DocumentClassification } from './document-classifier'

// ==========================================================================
// Historical Event Types
// ==========================================================================

export type HistoricalEventType =
  | 'founding_or_institution_creation'
  | 'study_experience'
  | 'capability_acquisition'
  | 'infrastructure_expansion'
  | 'specialty_expansion'
  | 'certification_or_training_milestone'
  | 'audit_or_inspection_event'
  | 'vendor_or_lab_relationship'
  | 'organizational_change'
  | 'operational_achievement'
  | 'document_backed_history_event'
  | 'other'

export const HISTORICAL_EVENT_LABELS: Record<HistoricalEventType, string> = {
  founding_or_institution_creation: 'Founding or institution creation',
  study_experience: 'Study experience',
  capability_acquisition: 'Capability acquisition',
  infrastructure_expansion: 'Infrastructure expansion',
  specialty_expansion: 'Specialty expansion',
  certification_or_training_milestone: 'Certification or training milestone',
  audit_or_inspection_event: 'Audit or inspection event',
  vendor_or_lab_relationship: 'Vendor or lab relationship',
  organizational_change: 'Organizational change',
  operational_achievement: 'Operational achievement',
  document_backed_history_event: 'Document-backed history event',
  other: 'Other historical event',
}

// ==========================================================================
// History Evidence State
// ==========================================================================

export type HistoryEvidenceState =
  | 'DECLARED_HISTORY'
  | 'DOCUMENT_BACKED_HISTORY'
  | 'EXTERNALLY_CONFIRMED_HISTORY'
  | 'NEEDS_SUPPORTING_EVIDENCE'
  | 'UNKNOWN_DATE'
  | 'INCOMPLETE_CONTEXT'

export const HISTORY_EVIDENCE_LABELS: Record<HistoryEvidenceState, string> = {
  DECLARED_HISTORY: 'Declared history',
  DOCUMENT_BACKED_HISTORY: 'Document-backed history',
  EXTERNALLY_CONFIRMED_HISTORY: 'Externally confirmed history',
  NEEDS_SUPPORTING_EVIDENCE: 'Needs supporting evidence',
  UNKNOWN_DATE: 'Unknown date',
  INCOMPLETE_CONTEXT: 'Incomplete context',
}

// ==========================================================================
// Historical Event
// ==========================================================================

export interface HistoricalEvent {
  id: string
  type: HistoricalEventType
  typeLabel: string
  date: string | null
  title: string
  description: string
  evidenceState: HistoryEvidenceState
  evidenceStateLabel: string
  /** Linked document classifications from OCP-5 */
  linkedDocuments: string[]
  /** Source: memory event, canonical object, or derived */
  source: 'memory_event' | 'canonical_object' | 'derived' | 'document'
  /** Whether this event affects Passport depth */
  strengthensPassport: boolean
  /** Whether this event is part of the minimum historical baseline */
  isBaseline: boolean
}

// ==========================================================================
// Historical Gap
// ==========================================================================

export interface HistoricalGap {
  id: string
  description: string
  severity: 'critical' | 'recommended' | 'optional'
  affectsBaseline: boolean
}

// ==========================================================================
// Historical Portfolio
// ==========================================================================

export interface HistoricalPortfolio {
  generatedAt: string
  events: HistoricalEvent[]
  gaps: HistoricalGap[]
  totalEvents: number
  documentBackedCount: number
  declaredOnlyCount: number
  completenessPercentage: number
  /** Minimum baseline met? */
  baselineMet: boolean
}

// ==========================================================================
// Derivation Input
// ==========================================================================

export interface HistoricalPortfolioInput {
  /** Memory events from onboarding state */
  memoryEvents: InstitutionalMemoryEvent[]
  /** Classified documents from OCP-5 */
  classifiedDocs?: DocumentClassification[]
  /** Canonical founding year */
  foundedYear: string | null
  /** Institution type */
  organizationType: string | null
  /** Whether the institution has declared lab/testing capability */
  hasLabDeclared: boolean
  /** Whether biospecimen operations are declared */
  hasBiospecimenDeclared: boolean
  /** Current capabilities (for capability milestone detection) */
  capabilityNames: string[]
  /** Whether study history evidence exists in documents */
  hasStudyHistoryEvidence: boolean
  /** Whether audit/inspection evidence exists */
  hasAuditEvidence: boolean
}

// ==========================================================================
// Document-to-history mapping
// ==========================================================================

const DOC_CATEGORY_TO_HISTORY_TYPE: Record<string, HistoricalEventType> = {
  study_history_evidence: 'study_experience',
  audit_or_inspection_evidence: 'audit_or_inspection_event',
  gcp_training: 'certification_or_training_milestone',
  iata_training: 'certification_or_training_milestone',
  clia_certificate: 'certification_or_training_milestone',
  calibration_record: 'infrastructure_expansion',
  equipment_record: 'infrastructure_expansion',
  temperature_log: 'infrastructure_expansion',
  sop: 'operational_achievement',
  legal_entity_document: 'founding_or_institution_creation',
  insurance: 'organizational_change',
  delegation_log: 'organizational_change',
  financial_disclosure: 'organizational_change',
  pi_medical_license: 'certification_or_training_milestone',
  cv: 'certification_or_training_milestone',
}

// ==========================================================================
// Keyword-based event type inference
// ==========================================================================

function inferEventType(title: string, domain: string): HistoricalEventType {
  const t = title.toLowerCase()
  const d = domain.toLowerCase()

  if (
    t.includes('found') || t.includes('established') || t.includes('created') ||
    t.includes('incorporated') || t.includes('founded')
  ) return 'founding_or_institution_creation'

  if (
    t.includes('study') || t.includes('trial') || t.includes('phase') ||
    t.includes('sponsor') || t.includes('protocol') || t.includes('enrollment')
  ) return 'study_experience'

  if (t.includes('audit') || t.includes('inspection') || t.includes('fda') || t.includes('ema'))
    return 'audit_or_inspection_event'

  if (
    t.includes('certif') || t.includes('training') || t.includes('gcp') ||
    t.includes('iata') || t.includes('clia') || t.includes('license')
  ) return 'certification_or_training_milestone'

  if (
    t.includes('infrastructure') || t.includes('facility') || t.includes('lab') ||
    t.includes('equipment') || t.includes('freezer') || t.includes('storage') ||
    t.includes('cold') || d.includes('infrastructure')
  ) return 'infrastructure_expansion'

  if (
    t.includes('capability') || t.includes('acquired') || t.includes('added') ||
    d.includes('capability')
  ) return 'capability_acquisition'

  if (
    t.includes('specialty') || t.includes('therapeutic') || t.includes('expanded') ||
    t.includes('new area') || t.includes('disease')
  ) return 'specialty_expansion'

  if (
    t.includes('vendor') || t.includes('partner') || t.includes('collaboration') ||
    t.includes('relationship')
  ) return 'vendor_or_lab_relationship'

  if (
    t.includes('organizational') || t.includes('restructured') || t.includes('merged') ||
    t.includes('leadership') || t.includes('director')
  ) return 'organizational_change'

  if (
    t.includes('achievement') || t.includes('milestone') || t.includes('completed') ||
    t.includes('award') || t.includes('recognition')
  ) return 'operational_achievement'

  if (
    t.includes('document') || t.includes('evidence') || t.includes('sop') ||
    t.includes('procedure')
  ) return 'document_backed_history_event'

  return 'other'
}

// ==========================================================================
// Derivation
// ==========================================================================

export function deriveHistoricalPortfolio(
  input: HistoricalPortfolioInput,
): HistoricalPortfolio {
  const now = new Date().toISOString()
  const events: HistoricalEvent[] = []
  const docLabels = (input.classifiedDocs ?? []).map((d) => d.category)

  // ── 1. Founding event (from canonical) ──
  const hasFoundedYear = input.foundedYear && input.foundedYear !== 'unknown' && input.foundedYear !== ''
  events.push({
    id: 'history-founding',
    type: 'founding_or_institution_creation',
    typeLabel: HISTORICAL_EVENT_LABELS['founding_or_institution_creation'],
    date: hasFoundedYear ? `${input.foundedYear}-01-01` : null,
    title: hasFoundedYear
      ? `Institution founded in ${input.foundedYear}`
      : 'Institution founding date not recorded',
    description: input.organizationType
      ? `${input.organizationType} established${hasFoundedYear ? ' in ' + input.foundedYear : ''}.`
      : 'Institution creation milestone.',
    evidenceState: hasFoundedYear
      ? docLabels.includes('legal_entity_document') ? 'DOCUMENT_BACKED_HISTORY' : 'DECLARED_HISTORY'
      : 'UNKNOWN_DATE',
    evidenceStateLabel: '',
    linkedDocuments: docLabels.includes('legal_entity_document') ? ['Legal entity document'] : [],
    source: 'canonical_object',
    strengthensPassport: hasFoundedYear,
    isBaseline: true,
  })
  events[events.length - 1].evidenceStateLabel =
    HISTORY_EVIDENCE_LABELS[events[events.length - 1].evidenceState]

  // ── 2. Capability milestones (from current capabilities) ──
  for (const capName of input.capabilityNames.slice(0, 5)) {
    const hasDocSupport = docLabels.some((l) => l !== 'other')
    events.push({
      id: `history-cap-${capName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'capability_acquisition',
      typeLabel: HISTORICAL_EVENT_LABELS['capability_acquisition'],
      date: null,
      title: `${capName} capability`,
      description: `Institution currently demonstrates ${capName} capability.`,
      evidenceState: hasDocSupport ? 'DOCUMENT_BACKED_HISTORY' : 'DECLARED_HISTORY',
      evidenceStateLabel: '',
      linkedDocuments: [],
      source: 'derived',
      strengthensPassport: hasDocSupport,
      isBaseline: true,
    })
    events[events.length - 1].evidenceStateLabel =
      HISTORY_EVIDENCE_LABELS[events[events.length - 1].evidenceState]
  }

  // ── 3. Document-backed history events (from OCP-5 classified docs) ──
  for (const doc of input.classifiedDocs ?? []) {
    const historyType = DOC_CATEGORY_TO_HISTORY_TYPE[doc.category]
    if (!historyType || historyType === 'founding_or_institution_creation') continue

    events.push({
      id: `history-doc-${doc.category}`,
      type: historyType,
      typeLabel: HISTORICAL_EVENT_LABELS[historyType],
      date: null,
      title: `${doc.categoryLabel} on file`,
      description: `Classified document: ${doc.categoryLabel}. This evidence supports institutional history.`,
      evidenceState: 'DOCUMENT_BACKED_HISTORY',
      evidenceStateLabel: HISTORY_EVIDENCE_LABELS['DOCUMENT_BACKED_HISTORY'],
      linkedDocuments: [doc.categoryLabel],
      source: 'document',
      strengthensPassport: true,
      isBaseline: false,
    })
  }

  // ── 4. Memory events (user-declared history) ──
  for (const mem of input.memoryEvents.slice(0, 20)) {
    const eventType = inferEventType(mem.title, mem.domain)
    const hasLinkedEvidence = mem.linkedEvidence.length > 0
    const hasMatchingDoc = docLabels.some((l) => {
      const labelWords = l.replace(/_/g, ' ').toLowerCase().split(/\s+/)
      return mem.linkedEvidence.some((e) => {
        const evWords = e.toLowerCase().split(/\s+/)
        return labelWords.some((lw) => evWords.some((ew) => ew.includes(lw) || lw.includes(ew)))
      })
    })

    events.push({
      id: mem.id || `history-mem-${Math.random().toString(36).slice(2, 8)}`,
      type: eventType,
      typeLabel: HISTORICAL_EVENT_LABELS[eventType],
      date: mem.date || null,
      title: mem.title,
      description: mem.description || `${mem.domain} event`,
      evidenceState: hasMatchingDoc
        ? 'DOCUMENT_BACKED_HISTORY'
        : hasLinkedEvidence
          ? 'NEEDS_SUPPORTING_EVIDENCE'
          : mem.date
            ? 'DECLARED_HISTORY'
            : 'UNKNOWN_DATE',
      evidenceStateLabel: '',
      linkedDocuments: mem.linkedEvidence,
      source: 'memory_event',
      strengthensPassport: hasMatchingDoc,
      isBaseline: false,
    })
    events[events.length - 1].evidenceStateLabel =
      HISTORY_EVIDENCE_LABELS[events[events.length - 1].evidenceState]
  }

  // ── 5. Detect historical gaps ──
  const gaps: HistoricalGap[] = []

  if (!hasFoundedYear) {
    gaps.push({
      id: 'gap-founding-date',
      description: 'Founding date is missing. Add your institution\'s founding year to strengthen the Historical Portfolio.',
      severity: 'critical',
      affectsBaseline: true,
    })
  }

  const hasStudyEvent = events.some(
    (e) => e.type === 'study_experience' || e.type === 'document_backed_history_event',
  )
  if (!hasStudyEvent && !input.hasStudyHistoryEvidence) {
    gaps.push({
      id: 'gap-study-history',
      description: 'No study experience or research history recorded. Add past or current studies to demonstrate experience.',
      severity: 'recommended',
      affectsBaseline: true,
    })
  }

  const hasCapabilityMilestone = events.some((e) => e.type === 'capability_acquisition')
  if (!hasCapabilityMilestone && input.capabilityNames.length === 0) {
    gaps.push({
      id: 'gap-capability-milestone',
      description: 'No capability milestones recorded. Add capabilities to show institutional growth.',
      severity: 'recommended',
      affectsBaseline: true,
    })
  }

  const declaredOnlyCount = events.filter((e) => e.evidenceState === 'DECLARED_HISTORY').length
  if (declaredOnlyCount > events.length * 0.5) {
    gaps.push({
      id: 'gap-evidence-support',
      description: `${declaredOnlyCount} of ${events.length} historical events are declared but not backed by documents. Upload supporting evidence to strengthen your history.`,
      severity: 'recommended',
      affectsBaseline: false,
    })
  }

  // ── Compute summary ──
  const documentBackedCount = events.filter(
    (e) => e.evidenceState === 'DOCUMENT_BACKED_HISTORY' || e.evidenceState === 'EXTERNALLY_CONFIRMED_HISTORY',
  ).length
  const totalEvents = events.length || 1
  const declaredOnly = events.filter((e) => e.evidenceState === 'DECLARED_HISTORY').length

  const baselineMet = hasFoundedYear || input.capabilityNames.length > 0

  const completenessPercentage = Math.round(
    ((documentBackedCount * 2 + declaredOnly) / (totalEvents * 2)) * 100,
  )

  return {
    generatedAt: now,
    events,
    gaps,
    totalEvents,
    documentBackedCount,
    declaredOnlyCount,
    completenessPercentage,
    baselineMet,
  }
}
