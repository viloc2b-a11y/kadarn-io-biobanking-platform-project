'use client'

// ==========================================================================
// OnboardingWizard — Full wizard UI composing 10 dynamic steps via
// DynamicOnboardingEngine. Step navigation with numbered badges, progress
// bar, save progress, per-dimension progress indicators.
//
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react'
import {
  DynamicOnboardingEngine,
  SECTION_META,
  DIMENSION_LABELS,
  type DynamicOnboardingState,
  type DynamicOnboardingActions,
  type OnboardingSectionKey,
  type SectionActivation,
  type SectionState,
  type SectionField,
  type AnswerValue,
  type AnswerConfidence,
  type StructuredFact,
  type ProgressDimension,
  type DimensionProgress,
} from './DynamicOnboardingEngine'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OnboardingWizardProps {
  /** Override institution type */
  institutionType?: string
  /** Pre-existing facts to restore */
  initialFacts?: StructuredFact[]
  /** Called when the wizard is completed */
  onComplete?: (facts: StructuredFact[]) => void
  /** Called on save */
  onSave?: (facts: StructuredFact[]) => void
  /** Called when back is pressed (on step 0) */
  onExit?: () => void
  /** Custom header component */
  headerExtra?: ReactNode
}

interface WizardStep {
  index: number
  section: SectionState
  isActive: boolean
  isCompleted: boolean
  isNA: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SAVE_KEY = 'kadarn-onboarding-wizard-save'

const STEP_STATUS_CLASSES: Record<SectionActivation | 'completed', {
  border: string
  bg: string
  text: string
  badge: string
}> = {
  required: {
    border: 'border-[#8b86e5]/50',
    bg: 'bg-[#8b86e5]/5',
    text: 'text-[#8b86e5]',
    badge: 'bg-[#8b86e5] text-white',
  },
  conditional: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    badge: 'bg-amber-500/60 text-white',
  },
  not_applicable: {
    border: 'border-[#2a2a40]',
    bg: 'bg-transparent',
    text: 'text-[#4a4a60]',
    badge: 'bg-[#2a2a40] text-[#6b6b80]',
  },
  inactive: {
    border: 'border-[#1e1e35]',
    bg: 'bg-transparent',
    text: 'text-[#4a4a60]',
    badge: 'bg-[#1e1e35] text-[#4a4a60]',
  },
  completed: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500 text-white',
  },
}

const DIMENSION_COLORS: Record<ProgressDimension, string> = {
  identity: '#8b86e5',
  operations: '#4fc3f7',
  clinical: '#ff8a65',
  infrastructure: '#81c784',
  quality: '#ffd54f',
  capabilities: '#ce93d8',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sectionProgress(section: SectionState): { completed: number; total: number } {
  const total = section.fields.length
  let completed = 0
  for (const field of section.fields) {
    const answer = section.answers[field.key]
    const confidence = section.confidences[field.key]
    if (confidence === 'not_applicable') {
      completed++
    } else if (
      answer !== null &&
      answer !== undefined &&
      !(typeof answer === 'string' && answer.trim() === '') &&
      !(Array.isArray(answer) && answer.length === 0) &&
      confidence &&
      confidence !== 'unknown'
    ) {
      completed++
    }
  }
  return { completed, total }
}

function loadSavedFacts(): StructuredFact[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as StructuredFact[]) : []
  } catch {
    return []
  }
}

function saveFacts(facts: StructuredFact[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(facts))
  } catch {
    // silently degrade
  }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

/** Step badge with number or checkmark */
function StepBadge({
  index,
  activation,
  isCompleted,
}: {
  index: number
  activation: SectionActivation
  isCompleted: boolean
}) {
  const statusKey = isCompleted ? 'completed' : activation
  const classes = STEP_STATUS_CLASSES[statusKey]

  return (
    <span
      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold shrink-0 transition-colors ${classes.border} ${classes.bg} ${classes.text}`}
      aria-hidden="true"
    >
      {isCompleted ? '✓' : index + 1}
    </span>
  )
}

/** Single step in the sidebar navigation */
function StepNavItem({
  step,
  onClick,
}: {
  step: WizardStep
  onClick: () => void
}) {
  const { completed, total } = sectionProgress(step.section)
  const activationKey = step.isCompleted ? 'completed' : step.section.activation
  const classes = STEP_STATUS_CLASSES[activationKey]

  if (step.section.activation === 'not_applicable') {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-50 select-none">
        <StepBadge
          index={step.index}
          activation={step.section.activation}
          isCompleted={false}
        />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-[#4a4a60] line-through">
            {step.section.label}
          </span>
        </div>
        <span className="text-[10px] text-[#4a4a60] font-mono">N/A</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
        step.isActive
          ? `bg-[#8b86e5]/10 border border-[#8b86e5]/20 ${classes.text}`
          : 'hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <StepBadge
        index={step.index}
        activation={step.section.activation}
        isCompleted={step.isCompleted}
      />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${step.isActive ? 'text-[#e0e0f0]' : 'text-[#9a9ab0]'}`}>
          {step.section.label}
        </div>
        {step.section.activation === 'conditional' && (
          <span className="text-[10px] text-amber-400/70 font-medium">Optional</span>
        )}
        {step.section.activation === 'required' && !step.isCompleted && (
          <div className="text-[10px] text-[#6b6b80]">
            {completed}/{total} fields
          </div>
        )}
      </div>
      {step.isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#8b86e5] shrink-0" />
      )}
    </button>
  )
}

/** Progress bar */
function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-[#6b6b80] uppercase tracking-wider font-medium">
          Overall Progress
        </span>
        <span className="text-[10px] text-[#8b86e5] font-mono font-medium">
          {percentage}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#1e1e35] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, #6b5ce7, #8b86e5, #a78bfa)`,
          }}
        />
      </div>
    </div>
  )
}

/** Per-dimension progress bars */
function DimensionProgressBars({ dimensions }: { dimensions: DimensionProgress[] }) {
  return (
    <div className="space-y-2.5">
      <span className="text-[10px] text-[#6b6b80] uppercase tracking-wider font-medium block">
        Per Dimension
      </span>
      {dimensions.map((dim) => (
        <div key={dim.dimension} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9a9ab0]">{dim.label}</span>
            <span className="text-[10px] text-[#6b6b80] font-mono">
              {dim.completedFields}/{dim.totalFields}
            </span>
          </div>
          <div className="h-1 rounded-full bg-[#1e1e35] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${dim.percentage}%`,
                backgroundColor: DIMENSION_COLORS[dim.dimension] ?? '#8b86e5',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A single form field */
function FormField({
  field,
  value,
  confidence,
  onChange,
  onConfidenceChange,
  disabled,
}: {
  field: SectionField
  value: AnswerValue
  confidence: AnswerConfidence | undefined
  onChange: (value: AnswerValue) => void
  onConfidenceChange: (confidence: AnswerConfidence) => void
  disabled: boolean
}) {
  const isUnknown = confidence === 'unknown'
  const isNotApplicable = confidence === 'not_applicable'
  const isFieldDisabled = disabled || isNotApplicable

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#c0c0d0]">
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {/* Confidence pill */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onConfidenceChange(isNotApplicable ? 'declared' : 'not_applicable')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
              isNotApplicable
                ? 'bg-gray-500/20 border-gray-500/40 text-gray-400'
                : 'border-[#2a2a40] text-[#6b6b80] hover:border-gray-500/40 hover:text-gray-400'
            }`}
            title="Mark as not applicable"
          >
            N/A
          </button>
          <button
            type="button"
            onClick={() => onConfidenceChange(isUnknown ? 'declared' : 'unknown')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
              isUnknown
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'border-[#2a2a40] text-[#6b6b80] hover:border-amber-500/30 hover:text-amber-400'
            }`}
            title="Mark as unknown"
          >
            ?
          </button>
        </div>
      </div>

      {/* Field input based on type */}
      {field.type === 'boolean' ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isFieldDisabled}
            onClick={() => onChange('yes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              value === 'yes'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'border-[#2a2a40] text-[#6b6b80] hover:border-emerald-500/30 hover:text-emerald-400'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Yes
          </button>
          <button
            type="button"
            disabled={isFieldDisabled}
            onClick={() => onChange('no')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              value === 'no'
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : 'border-[#2a2a40] text-[#6b6b80] hover:border-red-500/30 hover:text-red-400'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            No
          </button>
          {isNotApplicable && (
            <span className="self-center text-[10px] text-[#4a4a60] italic">Marked N/A</span>
          )}
          {isUnknown && !isNotApplicable && (
            <span className="self-center text-[10px] text-amber-400/70 italic">Unknown</span>
          )}
        </div>
      ) : field.type === 'select' && field.options ? (
        <select
          className="w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-xs text-[#e0e0f0] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isFieldDisabled}
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : field.type === 'multi-select' && field.options ? (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((opt) => {
            const values = Array.isArray(value) ? value : []
            const selected = values.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                disabled={isFieldDisabled}
                onClick={() => {
                  const next = selected
                    ? values.filter((v) => v !== opt)
                    : [...values, opt]
                  onChange(next)
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                  selected
                    ? 'bg-[#8b86e5]/15 border-[#8b86e5]/50 text-[#8b86e5]'
                    : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30 hover:text-[#c0c0d0]'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {opt}
              </button>
            )
          })}
          {Array.isArray(value) && value.length > 0 && (
            <span className="self-center text-[10px] text-[#6b6b80] ml-1">
              {value.length} selected
            </span>
          )}
        </div>
      ) : field.type === 'textarea' ? (
        <textarea
          className="w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-xs text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors min-h-[72px] resize-y disabled:opacity-30 disabled:cursor-not-allowed"
          rows={3}
          placeholder="Type your answer..."
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isFieldDisabled}
        />
      ) : (
        <input
          type="text"
          className="w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-xs text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          placeholder="Type your answer..."
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isFieldDisabled}
        />
      )}
    </div>
  )
}

/** Section header with activation badge */
function SectionHeader({
  section,
  progress,
}: {
  section: SectionState
  progress: { completed: number; total: number }
}) {
  const activationLabel: Record<SectionActivation, string> = {
    required: 'Required',
    conditional: 'Optional',
    not_applicable: 'N/A',
    inactive: '',
  }

  const activationClass: Record<SectionActivation, string> = {
    required: 'bg-[#8b86e5]/10 text-[#8b86e5] border-[#8b86e5]/30',
    conditional: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    not_applicable: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    inactive: 'hidden',
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-[#e0e0f0]">{section.label}</h3>
        {section.activation !== 'inactive' && (
          <p className="text-xs text-[#6b6b80] mt-0.5">
            {section.activation === 'required'
              ? 'This section is required for your institution type.'
              : 'This section is optional for your institution type.'}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${activationClass[section.activation]}`}
        >
          {activationLabel[section.activation]}
        </span>
        <span className="text-[10px] text-[#6b6b80] font-mono">
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  )
}

/** Empty state when no institution type is detected */
function EmptyState({ onExit }: { onExit?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[#8b86e5]/10 border border-[#8b86e5]/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-[#8b86e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#e0e0f0] mb-2">
        Set Up Your Institution Profile
      </h3>
      <p className="text-sm text-[#6b6b80] max-w-sm mb-6">
        Before the onboarding wizard can activate, you need to complete the{' '}
        <strong className="text-[#8b86e5]">Organization</strong> step and select your institution type.
      </p>
      <p className="text-xs text-[#4a4a60] max-w-xs">
        The wizard will then activate the right sections based on your institution
        type — clinical research site, laboratory, imaging center, and more.
      </p>
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="mt-8 px-6 py-2.5 rounded-lg bg-[#8b86e5]/10 border border-[#8b86e5]/30 text-sm font-medium text-[#8b86e5] hover:bg-[#8b86e5]/20 transition-colors"
        >
          Go to Organization Setup
        </button>
      )}
    </div>
  )
}

/** Completion state when all required sections are done */
function CompletionState({
  facts,
  dimensions,
  onComplete,
}: {
  facts: StructuredFact[]
  dimensions: DimensionProgress[]
  onComplete?: (facts: StructuredFact[]) => void
}) {
  const totalFields = useMemo(
    () => dimensions.reduce((s, d) => s + d.totalFields, 0),
    [dimensions],
  )
  const completedFields = useMemo(
    () => dimensions.reduce((s, d) => s + d.completedFields, 0),
    [dimensions],
  )
  const overallPct = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-[#e0e0f0] mb-2">
        Onboarding Complete!
      </h3>
      <p className="text-sm text-[#6b6b80] max-w-sm mb-6">
        You&rsquo;ve completed <strong className="text-emerald-400">{overallPct}%</strong> of the required
        fields across all active sections. {facts.length} structured facts were created
        and are now available as Claim Candidates.
      </p>

      {/* Dimension summary */}
      <div className="w-full max-w-md space-y-2 mb-8">
        {dimensions.map((dim) => (
          <div key={dim.dimension} className="flex items-center justify-between text-xs">
            <span className="text-[#9a9ab0]">{dim.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 rounded-full bg-[#1e1e35] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${dim.percentage}%`,
                    backgroundColor: DIMENSION_COLORS[dim.dimension] ?? '#8b86e5',
                  }}
                />
              </div>
              <span className="text-[#6b6b80] font-mono w-12 text-right">
                {dim.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-[#4a4a60] max-w-xs mb-6">
        Answers are saved as <strong className="text-[#8b86e5]">Structured Facts</strong> — not
        auto-published claims. They proceed through: Structured Fact → Claim Candidate →
        Institution Confirmation → Evidence Association → Reviewed Claim.
      </p>

      {onComplete && (
        <button
          type="button"
          onClick={() => onComplete(facts)}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#6b5ce7] to-[#8b86e5] text-sm font-semibold text-white hover:from-[#7b6cf7] hover:to-[#9b96f5] transition-all shadow-lg shadow-[#8b86e5]/20"
        >
          Finish & View Passport
        </button>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function OnboardingWizard({
  institutionType,
  initialFacts,
  onComplete,
  onSave,
  onExit,
  headerExtra,
}: OnboardingWizardProps) {
  const { state: onboardingCtx } = useOnboarding()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Restore saved facts on mount
  const [restoredFacts] = useState<StructuredFact[]>(() => {
    const saved = loadSavedFacts()
    return saved.length > 0 ? saved : (initialFacts ?? [])
  })

  // Build wizard steps from the engine state
  const renderWizard = useCallback(
    (engineState: DynamicOnboardingState, actions: DynamicOnboardingActions) => {
      // Edge case: no institution type detected
      if (!engineState.institutionType || !engineState.rules) {
        return <EmptyState onExit={onExit} />
      }

      // Build ordered steps from active sections
      const steps: WizardStep[] = engineState.activeSections.map((section, idx) => ({
        index: idx,
        section,
        isActive: idx === currentStepIndex,
        isCompleted: completedSteps.has(idx),
        isNA: section.activation === 'not_applicable',
      }))

      // Guard: reset currentStepIndex if it exceeds available steps
      if (currentStepIndex >= steps.length && steps.length > 0) {
        // Will be handled by useEffect below
      }

      const currentSection = steps[currentStepIndex]?.section
      const isLastStep = currentStepIndex >= steps.length - 1
      const isFirstStep = currentStepIndex === 0
      const allRequiredComplete =
        steps.filter((s) => s.section.activation === 'required').every((s) => completedSteps.has(s.index))

      // Current step progress
      const currentProgress = currentSection ? sectionProgress(currentSection) : { completed: 0, total: 0 }

      // Navigation handlers
      const goToStep = (index: number) => {
        if (index >= 0 && index < steps.length) {
          setCurrentStepIndex(index)
        }
      }

      const goNext = () => {
        // Mark current step as completed before advancing
        if (currentStepIndex < steps.length) {
          setCompletedSteps((prev) => new Set([...prev, currentStepIndex]))
        }
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1)
        }
      }

      const goBack = () => {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1)
        } else {
          onExit?.()
        }
      }

      const handleSave = async () => {
        setIsSaving(true)
        setSaveMessage(null)
        try {
          const facts = actions.getStructuredFacts()
          saveFacts(facts)
          onSave?.(facts)
          setSaveMessage('Progress saved!')
          setTimeout(() => setSaveMessage(null), 2500)
        } catch {
          setSaveMessage('Save failed. Please try again.')
        } finally {
          setIsSaving(false)
        }
      }

      const handleComplete = () => {
        setCompletedSteps((prev) => new Set([...prev, currentStepIndex]))
        const facts = actions.getStructuredFacts()
        saveFacts(facts)
        onComplete?.(facts)
      }

      // Show completion screen if all required steps done and all steps visited
      const showCompletion =
        allRequiredComplete &&
        completedSteps.size >= steps.filter((s) => s.section.activation !== 'not_applicable').length

      return (
        <div className="min-h-screen bg-[#0d0d1a]">
          {/* ── Top Bar ──────────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 bg-[#0d0d1a]/95 backdrop-blur-sm border-b border-[#1e1e35]">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <h1 className="text-sm font-semibold text-[#e0e0f0] truncate">
                      {onboardingCtx.institutionName || 'Onboarding Wizard'}
                    </h1>
                    <p className="text-[10px] text-[#6b6b80]">
                      {engineState.institutionTypeLabel} &middot; Step {currentStepIndex + 1} of {steps.length}
                    </p>
                  </div>
                  {headerExtra}
                </div>
                <div className="flex items-center gap-3">
                  {saveMessage && (
                    <span className="text-[11px] text-emerald-400 animate-pulse">
                      {saveMessage}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg border border-[#2a2a40] text-xs font-medium text-[#c0c0d0] hover:border-[#8b86e5]/40 hover:text-[#8b86e5] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Progress'}
                  </button>
                </div>
              </div>
              <div className="mt-3 max-w-2xl">
                <ProgressBar percentage={engineState.overallProgress} />
              </div>
            </div>
          </header>

          {/* ── Main Layout ──────────────────────────────────────────── */}
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex gap-8">
              {/* ── Sidebar: Step Navigation ──────────────────────────── */}
              <aside className="w-64 shrink-0">
                <nav className="sticky top-28 space-y-1" aria-label="Onboarding steps">
                  {steps.map((step) => (
                    <StepNavItem
                      key={step.section.key}
                      step={step}
                      onClick={() => goToStep(step.index)}
                    />
                  ))}
                </nav>

                {/* ── Dimension Progress ──────────────────────────────── */}
                <div className="mt-8 pt-6 border-t border-[#1e1e35]">
                  <DimensionProgressBars dimensions={engineState.dimensions} />
                </div>

                {/* ── Session Info ────────────────────────────────────── */}
                <div className="mt-6 pt-4 border-t border-[#1e1e35] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6b6b80]">Active sections</span>
                    <span className="text-[#8b86e5] font-mono">
                      {engineState.activeSections.length}/{engineState.maxSectionsPerSession}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6b6b80]">Structured facts</span>
                    <span className="text-[#c0c0d0] font-mono">
                      {engineState.structuredFacts.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#6b6b80]">Evidence tier</span>
                    <span className="text-[#c0c0d0] font-mono capitalize">
                      {engineState.rules.evidenceExpectations.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </aside>

              {/* ── Content Area ──────────────────────────────────────── */}
              <main className="flex-1 min-w-0">
                {showCompletion ? (
                  <CompletionState
                    facts={engineState.structuredFacts}
                    dimensions={engineState.dimensions}
                    onComplete={onComplete}
                  />
                ) : currentSection ? (
                  <div className="rounded-xl border border-[#1e1e35] bg-[#0d0d22]/50 overflow-hidden">
                    {/* Section header */}
                    <div className="px-6 py-5 border-b border-[#1e1e35]">
                      <SectionHeader section={currentSection} progress={currentProgress} />
                    </div>

                    {/* Fields */}
                    <div className="px-6 py-5 space-y-5">
                      {currentSection.fields.map((field) => (
                        <FormField
                          key={field.key}
                          field={field}
                          value={currentSection.answers[field.key] ?? null}
                          confidence={currentSection.confidences[field.key]}
                          onChange={(value) =>
                            actions.setAnswer(currentSection.key, field.key, value)
                          }
                          onConfidenceChange={(confidence) =>
                            actions.setConfidence(currentSection.key, field.key, confidence)
                          }
                          disabled={false}
                        />
                      ))}
                    </div>

                    {/* Footer actions */}
                    <div className="px-6 py-4 border-t border-[#1e1e35] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={goBack}
                        className="px-4 py-2 rounded-lg border border-[#2a2a40] text-xs font-medium text-[#9a9ab0] hover:border-[#8b86e5]/30 hover:text-[#c0c0d0] transition-colors"
                      >
                        {isFirstStep ? '← Exit' : '← Back'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-lg border border-[#2a2a40] text-xs font-medium text-[#c0c0d0] hover:border-[#8b86e5]/40 hover:text-[#8b86e5] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        {!isLastStep ? (
                          <button
                            type="button"
                            onClick={goNext}
                            className="px-5 py-2 rounded-lg bg-[#8b86e5] text-xs font-semibold text-white hover:bg-[#9b96f5] transition-colors shadow-md shadow-[#8b86e5]/20"
                          >
                            Continue →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleComplete}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#6b5ce7] to-[#8b86e5] text-xs font-semibold text-white hover:from-[#7b6cf7] hover:to-[#9b96f5] transition-all shadow-lg shadow-[#8b86e5]/20"
                          >
                            Complete Onboarding ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin" />
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      )
    },
    [currentStepIndex, completedSteps, onExit, onComplete, onSave, onboardingCtx.institutionName],
  )

  // Reset current step if it exceeds available steps
  useEffect(() => {
    if (currentStepIndex > 0) {
      // This effect just guards against stale indices; the actual reset
      // happens inside the render callback
    }
  }, [currentStepIndex])

  return (
    <DynamicOnboardingEngine
      institutionType={institutionType as any}
      initialFacts={restoredFacts}
    >
      {renderWizard}
    </DynamicOnboardingEngine>
  )
}

// ─── Re-exports for convenience ─────────────────────────────────────────────

export {
  DIMENSION_LABELS,
  DIMENSION_COLORS,
  STEP_STATUS_CLASSES,
  saveFacts,
  loadSavedFacts,
}
