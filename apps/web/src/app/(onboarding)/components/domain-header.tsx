'use client'

import type { OnboardingDomain } from '@/lib/onboarding/onboarding-journey'
import { ONBOARDING_JOURNEY } from '@/lib/onboarding/onboarding-journey'

interface DomainHeaderProps {
  domain: OnboardingDomain
  questionCount: number
  questionsAnswered: number
}

export function DomainHeader({ domain, questionCount, questionsAnswered }: DomainHeaderProps) {
  const step = ONBOARDING_JOURNEY.find((s) => s.domain === domain)
  if (!step) return null

  const pct = questionCount > 0 ? Math.round((questionsAnswered / questionCount) * 100) : 0

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-2">
        Institution Setup / {step.label}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">{step.label}</h1>
      <p className="text-lg text-gray-600 mb-4">{step.description}</p>

      {/* Why this matters */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-1">Why This Matters</h3>
        <p className="text-amber-700">{step.whyItMatters}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="flex-shrink-0">{questionsAnswered} of {questionCount}</span>
      </div>
    </div>
  )
}

interface InterviewQuestionProps {
  number: number
  question: string
  help?: string
  children: React.ReactNode
}

export function InterviewQuestion({ number, question, help, children }: InterviewQuestionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
          {number}
        </div>
        <div className="flex-1">
          <label className="block text-lg font-medium text-gray-900 mb-1">
            {question}
          </label>
          {help && (
            <p className="text-sm text-gray-500 mb-3">{help}</p>
          )}
          <div className="mt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

interface DomainWhatYouGetProps {
  domain: OnboardingDomain
}

export function DomainWhatYouGet({ domain }: DomainWhatYouGetProps) {
  const step = ONBOARDING_JOURNEY.find((s) => s.domain === domain)
  if (!step) return null

  const generatesClaims = step.generatesClaims ?? []
  const derivesCapabilities = step.derivesCapabilities ?? []

  if (generatesClaims.length === 0 && derivesCapabilities.length === 0) return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8">
      <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">
        What You Will Get From This Section
      </h3>
      {generatesClaims.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-semibold text-green-700">Claims Generated:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {generatesClaims.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
      {derivesCapabilities.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-green-700">Capabilities Derived:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {derivesCapabilities.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
      {step.readinessImpact && <p className="text-sm text-green-700 mt-2">{step.readinessImpact}</p>}
    </div>
  )
}
