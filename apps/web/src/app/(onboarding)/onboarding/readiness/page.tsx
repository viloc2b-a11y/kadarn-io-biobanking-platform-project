'use client'

import { useOnboarding, useDerivedReadModel } from '@/lib/onboarding/onboarding-context'
import type { ContributionItem, PassportCapability, PassportReadinessDimension } from '@/lib/passport/passport-assembler'

export default function ReadinessPage() {
  const { state } = useOnboarding()
  const passport = useDerivedReadModel()

  const { readiness, capabilities, evidence, nextSteps, institution } = passport
  const maturity = getMaturity(readiness.overallScore)
  const targetMaturity = getTargetMaturity(readiness.overallScore)
  const programReadiness = getProgramReadiness(readiness.eligiblePrograms, readiness.partialPrograms, capabilities)
  const quickWins = getQuickWins(readiness.dimensions, nextSteps)

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-2">Institution Setup / Readiness</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Institution Readiness Profile</h1>
        <p className="text-lg text-gray-600">
          This profile explains what your institution appears ready to support today, why Kadarn reached that conclusion,
          what evidence supports it, and what improvements would expand your readiness.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">Current Maturity</div>
        <div className="text-5xl font-bold text-blue-700 mb-2">{maturity}</div>
        <p className="text-gray-600">
          {getMaturityDescription(maturity)} This is a profile of your institution today, not a report card.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-400 text-xs uppercase">Current</div>
            <div className="font-semibold text-gray-900">{maturity}</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <div className="text-blue-500 text-xs uppercase">Target</div>
            <div className="font-semibold text-blue-900">{targetMaturity}</div>
          </div>
          <div className="rounded-xl bg-green-50 p-3">
            <div className="text-green-600 text-xs uppercase">Trend</div>
            <div className="font-semibold text-green-900">{quickWins.length > 0 ? 'Improving with quick wins' : 'Stable'}</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Programs You Are Currently Ready To Support</h2>
        <div className="grid gap-3">
          {programReadiness.map((program) => (
            <div key={program.name} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div>
                <div className="font-semibold text-gray-900">{program.name}</div>
                <div className="text-xs text-gray-500">{program.reason}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${program.status === 'ready' ? 'bg-green-100 text-green-700' : program.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                {program.status === 'ready' ? '✓ Ready' : program.status === 'partial' ? '⚠ Needs strengthening' : '✕ Not ready yet'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {quickWins.length > 0 && (
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Wins</h2>
          <div className="space-y-3">
            {quickWins.map((win) => (
              <div key={win.action} className="rounded-lg bg-white p-4">
                <div className="font-semibold text-gray-900">{win.action}</div>
                <div className="text-sm text-gray-600">{win.impact}</div>
                <div className="mt-2 text-xs font-semibold text-blue-700">Estimated readiness gain: {win.gain}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Readiness Domains</h2>
        {readiness.dimensions.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            Complete the interview to see your readiness assessment.
          </div>
        )}
        <div className="space-y-4">
          {readiness.dimensions.map((dim) => (
            <div key={dim.name} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{dim.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  dim.status === 'Ready' ? 'bg-green-100 text-green-700' :
                  dim.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>{dim.status} &middot; {dim.score}/100</span>
              </div>
              <p className="text-sm text-gray-500 mb-4"><strong>Current status:</strong> {dim.detail}</p>

              {dim.contributions && dim.contributions.length > 0 && (
                <ReadinessDimensionDetail
                  dimension={dim}
                  capabilities={capabilities}
                  documentLabels={evidence.documents.map((document) => document.label)}
                  locationLabel={institution.primaryLocation ?? 'Institution locations'}
                  peopleLabels={institution.team.roles}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/capabilities" className="text-gray-500 hover:text-gray-700 text-sm">← Capabilities</a>
        <a href="/onboarding/passport" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">View Your Institution Passport →</a>
      </div>
    </div>
  )
}

function ReadinessDimensionDetail({
  dimension,
  capabilities,
  documentLabels,
  locationLabel,
  peopleLabels,
}: {
  dimension: PassportReadinessDimension
  capabilities: PassportCapability[]
  documentLabels: string[]
  locationLabel: string
  peopleLabels: string[]
}) {
  const strengths = dimension.contributions.filter((item) => item.impact === 'positive')
  const gaps = dimension.contributions.filter((item) => item.impact === 'negative')
  const linkedCapabilities = capabilities.filter((capability) =>
    capability.domains.some((domain) => dimension.name.toLowerCase().includes(domain.toLowerCase())) ||
    dimension.contributions.some((item) => capability.name.toLowerCase().includes(item.label.toLowerCase()))
  )

  return (
    <div className="space-y-4 border-t border-gray-100 pt-4">
      <EvidenceList title="Strengths" items={strengths} empty="No strengths have been detected for this domain yet." />
      <EvidenceList title="Evidence supporting this assessment" items={dimension.contributions.filter((item) => item.impact !== 'negative')} empty="No supporting evidence has been attached yet." />
      <EvidenceList title="What is preventing higher readiness" items={gaps} empty="No major gap detected for this domain yet." />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Recommended actions</div>
        <div className="space-y-1">
          {(gaps.length > 0 ? gaps : dimension.contributions).slice(0, 3).map((item) => (
            <div key={item.label} className="text-xs text-gray-600">
              Improve: {item.description} <span className="font-semibold text-blue-700">Estimated readiness gain {estimateGain(item)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-2">
        <LinkedList title="Linked capabilities" values={linkedCapabilities.map((capability) => capability.name)} fallback="No linked capability yet" />
        <LinkedList title="Linked documents" values={documentLabels.slice(0, 5)} fallback="No documents uploaded yet" />
        <LinkedList title="Linked locations" values={[locationLabel]} fallback="No linked location yet" />
        <LinkedList title="Linked people" values={peopleLabels.slice(0, 5)} fallback="No linked people yet" />
      </div>
    </div>
  )
}

function EvidenceList({ title, items, empty }: { title: string; items: ContributionItem[]; empty: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-gray-500">{empty}</div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className={item.impact === 'positive' ? 'text-green-500' : item.impact === 'negative' ? 'text-red-400' : 'text-gray-400'}>
                {item.impact === 'positive' ? '+' : item.impact === 'negative' ? '-' : '~'}
              </span>
              <span className="text-gray-600">{item.label}</span>
              <span className="text-gray-400 ml-auto">{item.points > 0 ? `+${item.points}` : item.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LinkedList({ title, values, fallback }: { title: string; values: string[]; fallback: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="font-semibold text-gray-800">{title}</div>
      <div>{values.length > 0 ? values.join(', ') : fallback}</div>
    </div>
  )
}

function getMaturity(score: number): 'Foundational' | 'Emerging' | 'Advanced' | 'Comprehensive' {
  if (score >= 85) return 'Comprehensive'
  if (score >= 70) return 'Advanced'
  if (score >= 45) return 'Emerging'
  return 'Foundational'
}

function getTargetMaturity(score: number): string {
  if (score >= 85) return 'Sustain Comprehensive'
  if (score >= 70) return 'Comprehensive'
  if (score >= 45) return 'Advanced'
  return 'Emerging'
}

function getMaturityDescription(maturity: string): string {
  if (maturity === 'Comprehensive') return 'Your institution has broad evidence-backed readiness across domains.'
  if (maturity === 'Advanced') return 'Your institution can support multiple research programs with several evidence-backed capabilities.'
  if (maturity === 'Emerging') return 'Your institution has meaningful readiness signals, with some gaps still limiting program breadth.'
  return 'Your institution has the foundation for a Passport, but key evidence and infrastructure gaps remain.'
}

function getProgramReadiness(eligiblePrograms: string[], partialPrograms: string[], capabilities: PassportCapability[]) {
  const capabilityNames = capabilities.map((capability) => capability.name)
  return [
    { name: 'Phase II-IV Trials', status: eligiblePrograms.length > 0 ? 'ready' : 'partial', reason: 'Based on clinical operations, people, and documentation readiness.' },
    { name: 'Biospecimen Collections', status: capabilityNames.includes('Biospecimen Collection') ? 'ready' : 'partial', reason: 'Depends on biospecimen operations, storage, and shipping evidence.' },
    { name: 'Community Recruitment', status: capabilityNames.includes('Patient Recruitment') ? 'ready' : 'partial', reason: 'Depends on people, operational footprint, and recruitment evidence.' },
    { name: 'IVD Studies', status: capabilityNames.includes('Molecular Testing') || capabilityNames.includes('Sample Processing') ? 'partial' : 'not-ready', reason: 'Requires lab, quality, validation, and diagnostic evidence.' },
    { name: 'Early Phase', status: partialPrograms.some((program) => program.toLowerCase().includes('phase ii')) ? 'partial' : 'not-ready', reason: 'Requires early phase infrastructure, staffing, and documentation.' },
  ] as const
}

function getQuickWins(dimensions: PassportReadinessDimension[], nextSteps: { action: string; impact: string; priority: string; domain: string }[]) {
  const fromGaps = dimensions
    .flatMap((dimension) => dimension.contributions
      .filter((item) => item.impact === 'negative')
      .map((item) => ({
        action: item.description,
        impact: `${Math.abs(item.points)} point opportunity in ${dimension.name}`,
        gain: estimateGain(item),
      })))
    .sort((a, b) => Number(b.gain.replace(/\D/g, '')) - Number(a.gain.replace(/\D/g, '')))

  const fromNextSteps = nextSteps.map((step) => ({
    action: step.action,
    impact: step.impact,
    gain: step.priority === 'High' ? '+12 readiness' : step.priority === 'Medium' ? '+8 readiness' : '+4 readiness',
  }))

  return [...fromGaps, ...fromNextSteps].slice(0, 5)
}

function estimateGain(item: ContributionItem): string {
  const gain = Math.max(4, Math.min(15, Math.abs(item.points)))
  return `+${gain} readiness`
}
