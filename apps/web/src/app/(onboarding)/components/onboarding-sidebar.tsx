'use client'

import { ONBOARDING_JOURNEY, type OnboardingDomain } from '@/lib/onboarding/onboarding-journey'
import { useOnboarding, useCompletionGate } from '@/lib/onboarding/onboarding-context'
import { COMPLETION_STATUS_LABELS } from '@/lib/onboarding/completion-gate'
import { usePathname } from 'next/navigation'

export function OnboardingSidebar() {
  const { state, onboardingCompleted } = useOnboarding()
  const completion = useCompletionGate()
  const pathname = usePathname()
  const currentDomain = getDomainFromPath(pathname)
  const currentIndex = ONBOARDING_JOURNEY.findIndex((step) => step.domain === currentDomain)

  const statusLabel = COMPLETION_STATUS_LABELS[completion.status]
  const isReady = completion.status === 'READY_FOR_PASSPORT' || completion.status === 'PASSPORT_GENERATED'
  const needsEvidence = completion.status === 'NEEDS_EVIDENCE'
  const isNotStarted = completion.status === 'NOT_STARTED'

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-5 overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Institution Setup</h2>
        <p className="text-xs text-gray-500 mt-1">
          {isReady
            ? '✅ Passport ready for review'
            : isNotStarted
              ? 'Start building your profile'
              : `${completion.overallPercentage}% complete · ${statusLabel}`}
        </p>
      </div>

      {/* OCP-1 Completion status */}
      <div
        className={`mb-5 p-3 rounded-lg ${
          onboardingCompleted
            ? 'bg-green-100 border border-green-300'
            : isReady
              ? 'bg-green-50 border border-green-200'
              : needsEvidence
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-medium ${
              isReady ? 'text-green-700' : needsEvidence ? 'text-amber-700' : 'text-blue-600'
            }`}
          >
            {statusLabel}
          </span>
          <span className="text-xs font-bold text-gray-600">{completion.overallPercentage}%</span>
        </div>
        <div className={`h-1.5 rounded-full mb-2 ${isReady ? 'bg-green-200' : 'bg-blue-200'}`}>
          <div
            className={`h-full rounded-full transition-all ${isReady ? 'bg-green-600' : 'bg-blue-600'}`}
            style={{ width: `${completion.overallPercentage}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-500">
          {completion.criticalCompleted}/{completion.criticalTotal} critical · {completion.completedDomains.length} domains done
        </div>
        {completion.nextBestAction && (
          <a
            href={completion.nextBestAction.href}
            className="block mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
          >
            → {completion.nextBestAction.action}
          </a>
        )}
      </div>

      {/* Generate Passport CTA */}
      {isReady && (
        <a
          href="/onboarding/passport"
          className="block w-full text-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors mb-4"
        >
          Review Your Passport →
        </a>
      )}

      {/* Draft Passport CTA */}
      {completion.canGenerateDraftPassport && !isReady && (
        <a
          href="/onboarding/passport"
          className="block w-full text-center px-3 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors mb-4 border border-amber-300"
        >
          View Draft Passport →
        </a>
      )}

      {/* Workspace link when completed */}
      {onboardingCompleted && (
        <a
          href="/workspace"
          className="block w-full text-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors mb-4"
        >
          Go to Workspace →
        </a>
      )}

      {/* Journey steps */}
      <nav className="space-y-0.5">
        {ONBOARDING_JOURNEY.map((step, idx) => {
          const isCurrent = step.domain === currentDomain
          const isPast = state.completedDomains.includes(step.domain) || idx < currentIndex
          const isFuture = !isCurrent && !isPast

          return (
            <a
              key={step.domain}
              href={`/onboarding/${step.domain === 'welcome' ? '' : step.domain}`}
              className={`
                flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors no-underline
                ${isCurrent ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                ${isPast ? 'text-green-600' : ''}
                ${isFuture ? 'text-gray-400' : ''}
                ${step.isDerived && isFuture ? 'italic' : ''}
              `}
            >
              <div
                className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isPast ? 'bg-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white' : ''}
                    ${isFuture && step.isDerived ? 'bg-purple-100 text-purple-400 border border-purple-200' : ''}
                    ${isFuture && !step.isDerived ? 'bg-gray-100 text-gray-400' : ''}
                  `}
              >
                {isPast ? '✓' : step.isDerived ? '⟐' : idx}
              </div>

              <div className="flex-1 min-w-0">
                <div className="truncate">{step.label}</div>
                {!isFuture && !step.isDerived && (
                  <div className="text-[10px] text-gray-400">{step.estimatedMinutes} min</div>
                )}
                {step.isDerived && !isFuture && (
                  <div className="text-[10px] text-purple-400">Auto-generated</div>
                )}
              </div>
            </a>
          )
        })}
      </nav>
    </aside>
  )
}

function getDomainFromPath(pathname: string): OnboardingDomain {
  const segment = pathname.split('/').filter(Boolean).at(-1)
  const match = ONBOARDING_JOURNEY.find((step) => step.domain === segment)
  return match?.domain ?? 'welcome'
}
