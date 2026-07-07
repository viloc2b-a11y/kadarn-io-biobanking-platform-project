'use client'

import { ONBOARDING_JOURNEY, type OnboardingDomain } from '@/lib/onboarding/onboarding-journey'
import { PASSPORT_LEVELS } from '@/lib/onboarding/fast-track'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import { usePathname } from 'next/navigation'

export function OnboardingSidebar() {
  const { state, fastTrack, progress } = useOnboarding()
  const pathname = usePathname()
  const currentDomain = getDomainFromPath(pathname)
  const currentIndex = ONBOARDING_JOURNEY.findIndex((step) => step.domain === currentDomain)
  const levelInfo = PASSPORT_LEVELS[fastTrack.currentLevel]
  const canGenerate = fastTrack.canGeneratePassport

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-5 overflow-y-auto">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Institution Setup</h2>
        <p className="text-xs text-gray-500 mt-1">
          {canGenerate ? 'Passport ready!' : `~${fastTrack.estimatedMinutesToNextLevel} min to first Passport`}
        </p>
      </div>

      {/* Fast-track progress */}
      <div className="mb-5 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-blue-600 font-medium">Progress</span>
          <span className="text-xs text-blue-600 font-bold">{levelInfo.label}</span>
        </div>
        <div className="h-1.5 bg-blue-200 rounded-full mb-2">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${Math.round((fastTrack.criticalCompleted / fastTrack.criticalTotal) * 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-blue-500">
          {progress.criticalCompleted}/{progress.criticalTotal} critical · {progress.answeredCount} answers · {progress.documentCount} docs
        </div>
      </div>

      {/* Generate Passport CTA */}
      {canGenerate && (
        <a
          href="/onboarding/passport"
          className="block w-full text-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors mb-4"
        >
          View Your Passport →
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
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isPast ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? 'bg-blue-600 text-white' : ''}
                ${isFuture && step.isDerived ? 'bg-purple-100 text-purple-400 border border-purple-200' : ''}
                ${isFuture && !step.isDerived ? 'bg-gray-100 text-gray-400' : ''}
              `}>
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
