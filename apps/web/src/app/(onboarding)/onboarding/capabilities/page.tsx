'use client'

import { useOnboarding, useDerivedReadModel } from '@/lib/onboarding/onboarding-context'

export default function CapabilitiesPage() {
  const { state } = useOnboarding()
  const passport = useDerivedReadModel()

  const capabilities = passport.capabilities
  const strong = capabilities.filter((c) => c.level === 'Strong')
  const moderate = capabilities.filter((c) => c.level === 'Moderate')
  const available = capabilities.filter((c) => c.level === 'Available')
  const unavailable = capabilities.filter((c) => c.level === 'Not available')

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-2">First Derived Result / Capabilities</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Derived Capabilities</h1>
        <p className="text-lg text-gray-600">
          We analyzed the information you&apos;ve provided and identified the capabilities your institution can currently demonstrate.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Your First Kadarn-Derived Result</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <div>This page is informational. No additional answers are required here.</div>
          <div>Each capability is traceable to information or documents already provided in Organization, People, Infrastructure, and Documents.</div>
          <div>Use “Improve this capability” only if you want to strengthen evidence or fill a gap.</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What You Can Do ({capabilities.length} capabilities)</h2>
        {capabilities.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No capabilities are demonstrated yet. Complete Organization, People, Infrastructure, or Documents to generate your first derived result.
          </div>
        )}
        <div className="space-y-3">
          {capabilities.map((cap) => {
            const supportingEvidence = (cap.supportingEvidence ?? []).filter((e) => e.impact === 'positive' || e.impact === 'pending')
            const missingEvidence = (cap.supportingEvidence ?? []).filter((e) => e.impact === 'negative')
            const improveHref = getCapabilityImproveHref(cap.domains)

            return (
            <div key={cap.name} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{cap.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  cap.level === 'Strong' ? 'bg-green-100 text-green-700' :
                  cap.level === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                  cap.level === 'Available' ? 'bg-gray-100 text-gray-600' :
                  'bg-red-50 text-red-400'
                }`}>{cap.level}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2"><strong>Why it was derived:</strong> {cap.evidence}</p>
              {supportingEvidence.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">Evidence currently supporting it:</div>
                  <div className="space-y-1">
                    {supportingEvidence.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={e.impact === 'positive' ? 'text-green-500' : 'text-gray-400'}>
                          {e.impact === 'positive' ? '+' : '~'}
                        </span>
                        <span className="text-gray-600">{e.label}</span>
                        <span className="text-gray-400 ml-auto">{e.points > 0 ? `+${e.points}` : e.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-1">Missing evidence that would strengthen it:</div>
                {missingEvidence.length > 0 ? (
                  <div className="space-y-1">
                    {missingEvidence.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-red-400">-</span>
                        <span className="text-gray-600">{e.label}</span>
                        <span className="text-gray-400 ml-auto">{e.points} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No obvious evidence gap detected for this capability yet.</div>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                {cap.domains.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{d}</span>
                ))}
              </div>
              <div className="mt-4">
                <a href={improveHref} className="inline-flex px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Improve this capability
                </a>
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/documents" className="text-gray-500 hover:text-gray-700 text-sm">← Documents</a>
        <a href="/onboarding/readiness" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">See Your Readiness →</a>
      </div>
    </div>
  )
}

function getCapabilityImproveHref(domains: string[]): string {
  if (domains.some((domain) => ['people', 'team'].includes(domain))) return '/onboarding/people'
  if (domains.some((domain) => ['facilities', 'laboratory', 'equipment', 'biospecimen'].includes(domain))) return '/onboarding/infrastructure'
  if (domains.some((domain) => ['documents', 'evidence'].includes(domain))) return '/onboarding/documents'
  if (domains.some((domain) => ['organization'].includes(domain))) return '/onboarding/organization'
  return '/onboarding/documents'
}
