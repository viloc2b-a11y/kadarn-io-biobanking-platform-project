'use client'

import { useMemo, type CSSProperties } from 'react'
import { DomainHeader, InterviewQuestion, DomainWhatYouGet } from '../../components/domain-header'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import { HYBRID_TRIAL_INTERVIEW, HYBRID_TRIAL_TOTAL_QUESTIONS } from '@/lib/onboarding/interviews/hybrid-trial-interview'
import { computeVisibleQuestions } from '@/lib/onboarding/interview-engine'

// ==========================================================================
// KTP-1.3 — Hybrid Trial Readiness Onboarding Page
// ==========================================================================
// Thin renderer over HYBRID_TRIAL_INTERVIEW. Uses computeVisibleQuestions to
// respect gate logic and conditional questions. No hardcoded form — the
// interview definition is the single source of truth.
//
// Design:
//   - Reads HYBRID_TRIAL_INTERVIEW data at runtime
//   - Computes visible questions via computeVisibleQuestions (gate-aware)
//   - Renders each question using reusable InterviewQuestion component
//   - Stores answers via useOnboarding().setAnswer
//   - Unknown = unanswered, N/A = explicit 'na' or 'no' value
// ==========================================================================

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const introCardStyle: CSSProperties = {
  backgroundColor: '#f0f7ff',
  border: '1px solid #bfdbfe',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
}

const introTitleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1e40af',
  marginBottom: '8px',
}

const introTextStyle: CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: 1.6,
}

const gateNoticeStyle: CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '16px',
  fontSize: '13px',
  color: '#92400e',
}

const moduleHeaderStyle: CSSProperties = {
  fontSize: '17px',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: '4px',
  marginTop: '24px',
}

const moduleDescStyle: CSSProperties = {
  fontSize: '13px',
  color: '#6b7280',
  marginBottom: '12px',
}

const evidenceBadgeStyle: CSSProperties = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  fontSize: '11px',
  padding: '1px 6px',
  borderRadius: '100px',
  marginLeft: '6px',
}

const sectionDividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '20px 0',
}

// --------------------------------------------------------------------------
// Form control renderers
// --------------------------------------------------------------------------

function RadioControl({
  questionId,
  options,
  currentValue,
  onChange,
}: {
  questionId: string
  options: { value: string; label: string; description?: string }[]
  currentValue: string | null
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            currentValue === opt.value
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name={questionId}
            value={opt.value}
            checked={currentValue === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{opt.label}</div>
            {opt.description && (
              <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

function CheckboxControl({
  questionId,
  options,
  currentValue,
  onChange,
}: {
  questionId: string
  options: { value: string; label: string; description?: string }[]
  currentValue: string[]
  onChange: (value: string[]) => void
}) {
  const selected = new Set(currentValue)
  const toggle = (value: string) => {
    const next = selected.has(value)
      ? currentValue.filter((v) => v !== value)
      : [...currentValue, value]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selected.has(opt.value)
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.has(opt.value)}
            onChange={() => toggle(opt.value)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{opt.label}</div>
            {opt.description && (
              <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  type = 'text',
}: {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'date'
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  )
}

function TextAreaInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
    />
  )
}

function SelectControl({
  options,
  currentValue,
  onChange,
}: {
  options: { value: string; label: string; description?: string }[]
  currentValue: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={currentValue}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select an option...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// --------------------------------------------------------------------------
// Main Page
// --------------------------------------------------------------------------

export default function HybridTrialPage() {
  const { state, setAnswer, markDomainCompleted } = useOnboarding()

  // Compute visible questions based on current answers (gates + conditions)
  const { visible, hidden } = useMemo(
    () => computeVisibleQuestions(HYBRID_TRIAL_INTERVIEW, state.answers),
    [state.answers],
  )

  // Count answered among visible questions
  const answeredCount = useMemo(
    () =>
      visible.filter((q) => {
        const a = state.answers[q.id]
        return a !== undefined && a !== null && a !== '' && (!Array.isArray(a) || a.length > 0)
      }).length,
    [visible, state.answers],
  )

  // Group visible questions by section for rendering with module headers
  const sections = useMemo(() => {
    // Get unique section IDs in display order from the interview definition
    const sectionOrder = HYBRID_TRIAL_INTERVIEW.map((s) => s.id)
    return HYBRID_TRIAL_INTERVIEW.filter(
      (section) => visible.some((q) => q.section === section.id || section.questions.some((sq) => sq.id === q.id)),
    )
  }, [visible])

  const renderQuestion = (q: (typeof visible)[0]) => {
    const currentValue = state.answers[q.id]
    const isGate = q.isGate
    const isConditional = !!q.condition
    const claimShort = q.generatesClaim?.split('.').pop() ?? null

    return (
      <InterviewQuestion key={q.id} number={q.number} question={q.question} help={q.help}>
        {/* Gate indicator */}
        {isGate && (
          <div style={gateNoticeStyle}>
            ⚠️ Your answer here determines which sections appear below.
            {' N/A or No → related modules are skipped without penalty.'}
          </div>
        )}

        {/* Conditional indicator */}
        {isConditional && (
          <div style={{ ...gateNoticeStyle, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
            📎 This question appears because of your previous answer.
          </div>
        )}

        {/* Evidence class hint */}
        {q.affectsReadiness && (
          <div style={{ marginBottom: '8px' }}>
            <span style={evidenceBadgeStyle}>
              {q.generatesClaim ? `Claim: ${claimShort}` : ''}
              {q.feedsCapability ? ` · ${q.feedsCapability}` : ''}
            </span>
          </div>
        )}

        {/* Render based on type */}
        {q.type === 'radio' && q.options && (
          <RadioControl
            questionId={q.id}
            options={q.options}
            currentValue={typeof currentValue === 'string' ? currentValue : null}
            onChange={(value) => setAnswer(q.id, value)}
          />
        )}

        {q.type === 'checkbox' && q.options && (
          <CheckboxControl
            questionId={q.id}
            options={q.options}
            currentValue={Array.isArray(currentValue) ? (currentValue as string[]) : []}
            onChange={(value) => setAnswer(q.id, value)}
          />
        )}

        {q.type === 'select' && q.options && (
          <SelectControl
            options={q.options}
            currentValue={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => setAnswer(q.id, value)}
          />
        )}

        {(q.type === 'text' || q.type === 'number' || q.type === 'date') && (
          <TextInput
            type={q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => setAnswer(q.id, q.type === 'number' ? value : value)}
          />
        )}

        {q.type === 'textarea' && (
          <TextAreaInput
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) => setAnswer(q.id, value)}
          />
        )}
      </InterviewQuestion>
    )
  }

  // Group questions by their parent section for rendering with module headers
  const sectionQuestions = useMemo(() => {
    const map = new Map<string, typeof visible>()
    for (const q of visible) {
      // Find which interview section this question belongs to
      const parentSection = HYBRID_TRIAL_INTERVIEW.find((s) =>
        s.questions.some((sq) => sq.id === q.id),
      )
      const sectionKey = parentSection?.id ?? 'other'
      if (!map.has(sectionKey)) map.set(sectionKey, [])
      map.get(sectionKey)!.push(q)
    }
    return map
  }, [visible])

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader
        domain="hybrid-trial"
        questionCount={HYBRID_TRIAL_TOTAL_QUESTIONS}
        questionsAnswered={answeredCount}
      />

      {/* Intro card */}
      <div style={introCardStyle}>
        <h2 style={introTitleStyle}>Hybrid Trial Readiness Passport</h2>
        <p style={introTextStyle}>
          This section evaluates your institution&apos;s readiness to participate in hybrid,
          decentralized, and at-home clinical trials. You will only see questions relevant
          to your operations — gate questions determine which modules appear.
        </p>
        <p style={{ ...introTextStyle, marginTop: '8px' }}>
          <strong>How this works:</strong> Answer honestly. &quot;No&quot; or &quot;Not applicable&quot;
          closes the branch without penalizing readiness. Unanswered questions are treated as
          UNKNOWN — not as absence of capability. Self-declared answers without evidence are
          capped at lower confidence levels.
        </p>
      </div>

      <DomainWhatYouGet domain="hybrid-trial" />

      {/* Hidden questions summary */}
      {hidden.length > 0 && (
        <div style={gateNoticeStyle}>
          <strong>{hidden.length} questions hidden</strong> based on your gate answers.
          These modules are not relevant to your current operational model and are
          excluded from readiness evaluation.
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        {visible.length} questions visible · {answeredCount} answered · {hidden.length} hidden
        {' · '}
        {visible.length > 0 ? Math.round((answeredCount / visible.length) * 100) : 0}% complete
      </div>

      {/* Render questions grouped by module */}
      {Array.from(sectionQuestions.entries()).map(([sectionId, questions], sectionIdx) => {
        const section = HYBRID_TRIAL_INTERVIEW.find((s) => s.id === sectionId)
        if (!section) return null

        return (
          <div key={sectionId}>
            {sectionIdx > 0 && <hr style={sectionDividerStyle} />}
            <div style={moduleHeaderStyle}>
              {section.title}
              {section.gateCondition && (
                <span style={{ ...evidenceBadgeStyle, marginLeft: '8px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                  Gated
                </span>
              )}
            </div>
            <div style={moduleDescStyle}>{section.description}</div>
            {questions.map(renderQuestion)}
          </div>
        )
      })}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
        <a href="/onboarding/infrastructure" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Infrastructure
        </a>
        <span className="text-xs text-gray-400">
          {answeredCount} of {visible.length} visible answered
        </span>
        <a href="/onboarding/documents" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Documents →
        </a>
      </div>
          {/* KTP-1.3: Completion action */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: state.completedDomains.includes("hybrid-trial") ? "#f0fdf4" : "#fffbeb",
              border: state.completedDomains.includes("hybrid-trial") ? "1px solid #bbf7d0" : "1px solid #fde68a",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            {state.completedDomains.includes("hybrid-trial") ? (
              <div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#166534" }}>
                  Hybrid Trial section completed
                </span>
                <p style={{ fontSize: "12px", color: "#166534", marginTop: "4px" }}>
                  Your hybrid trial readiness answers have been saved.
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => markDomainCompleted("hybrid-trial")}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Complete Hybrid Trial Section
                </button>
                <p style={{ fontSize: "12px", color: "#92400e", marginTop: "8px" }}>
                  Mark this section as complete when you have answered all visible questions.
                </p>
              </div>
            )}
          </div>
    </div>
  )
}
