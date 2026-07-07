'use client'

import { DomainHeader } from '../../components/domain-header'
import { useOnboarding, useDerivedReadModel } from '@/lib/onboarding/onboarding-context'
import {
  ROADMAP_SECTION,
  type InstitutionRoadmapAction,
  type RoadmapSection,
} from '@/lib/onboarding/institution-roadmap'
import { deriveRoadmapReadModel } from '@/lib/onboarding/derived-read-models'
import type { InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import type { LocationInfrastructure } from '@/lib/onboarding/location-infrastructure'
import type { ResearchTeamMember } from '@/lib/onboarding/research-team'

const SECTION_ORDER = [
  ROADMAP_SECTION.IMMEDIATE_ACTIONS,
  ROADMAP_SECTION.CAPABILITY_EXPANSION,
  ROADMAP_SECTION.READINESS_IMPROVEMENT,
  ROADMAP_SECTION.COMPLIANCE_RENEWAL,
  ROADMAP_SECTION.STRATEGIC_GROWTH,
] as const

export default function InstitutionRoadmapPage() {
  const { state } = useOnboarding()
  const passport = useDerivedReadModel()

  const locations: InstitutionalLocation[] = Array.isArray(state.answers['org_locations'])
    ? (state.answers['org_locations'] as InstitutionalLocation[])
    : []
  const teamMembers: ResearchTeamMember[] = Array.isArray(state.answers['people_team_members'])
    ? (state.answers['people_team_members'] as ResearchTeamMember[])
    : []
  const infrastructure: LocationInfrastructure[] = Array.isArray(state.answers['infra_location_infrastructure'])
    ? (state.answers['infra_location_infrastructure'] as LocationInfrastructure[])
    : []
  const strategicGoals: string[] = Array.isArray(state.answers['roadmap_strategic_growth_goals'])
    ? (state.answers['roadmap_strategic_growth_goals'] as string[])
    : []

  const roadmap = deriveRoadmapReadModel({
    passport,
    locations,
    teamMembers,
    infrastructure,
    strategicGoals,
  })
  const highPriorityCount = roadmap.actions.filter((action) => action.priority === 'High').length

  return (
    <div className="max-w-4xl mx-auto py-8">
      <DomainHeader domain="roadmap" questionCount={0} questionsAnswered={roadmap.actions.length} />

      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-8 text-white mb-8">
        <div className="text-sm text-indigo-200 uppercase tracking-wide mb-1">Institution Roadmap</div>
        <h1 className="text-3xl font-bold mb-2">What should this institution build next?</h1>
        <p className="text-indigo-100 max-w-2xl">
          A future-facing plan derived from Passport gaps, readiness gaps, missing evidence, expiring documents,
          weak capabilities, incomplete locations, staff certification gaps, infrastructure gaps, and growth goals.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
          <RoadmapMetric label="Current readiness" value={roadmap.currentReadinessLevel} />
          <RoadmapMetric label="Target readiness" value={roadmap.targetReadinessLevel} />
          <RoadmapMetric label="High priority actions" value={String(highPriorityCount)} />
        </div>
      </div>

      <div className="grid gap-4 mb-8 md:grid-cols-5">
        {SECTION_ORDER.map((section) => (
          <a key={section} href={`#${sectionId(section)}`} className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 no-underline hover:border-indigo-300 hover:bg-indigo-50">
            {section}
            <div className="mt-1 text-xs font-normal text-gray-400">
              {roadmap.actions.filter((action) => action.section === section).length} action(s)
            </div>
          </a>
        ))}
      </div>

      {SECTION_ORDER.map((section) => (
        <RoadmapSectionBlock
          key={section}
          section={section}
          actions={roadmap.actions.filter((action) => action.section === section)}
        />
      ))}

      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/passport" className="text-gray-500 hover:text-gray-700 text-sm">← Passport Snapshot</a>
        <a href="/onboarding/documents" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Start With Evidence →</a>
      </div>
    </div>
  )
}

function RoadmapMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="text-xs uppercase text-indigo-200">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}

function RoadmapSectionBlock({
  section,
  actions,
}: {
  section: RoadmapSection
  actions: InstitutionRoadmapAction[]
}) {
  return (
    <section id={sectionId(section)} className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{section}</h2>
          <p className="text-sm text-gray-500">{sectionDescription(section)}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
          {actions.length} action(s)
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
          No roadmap actions in this section yet. As the Passport becomes more complete, Kadarn will derive more precise recommendations.
        </div>
      ) : (
        <div className="grid gap-4">
          {actions.map((action) => <ActionCard key={action.id} action={action} />)}
        </div>
      )}
    </section>
  )
}

function ActionCard({ action }: { action: InstitutionRoadmapAction }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{action.section}</div>
          <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${priorityClassName(action.priority)}`}>
          {action.priority} Priority
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RoadmapDetail title="Why it matters" value={action.whyItMatters} />
        <RoadmapDetail title="What it improves" value={action.improves} />
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Required evidence</div>
          <ul className="space-y-1 text-sm text-gray-600">
            {action.requiredEvidence.length === 0 ? (
              <li>No additional evidence specified.</li>
            ) : (
              action.requiredEvidence.map((evidence, index) => <li key={`${action.id}-${index}-${evidence}`}>• {evidence}</li>)
            )}
          </ul>
        </div>
        <RoadmapDetail title="Estimated impact" value={action.estimatedImpact} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50 p-3">
        <div className="text-sm text-indigo-900">
          Linked section to fix it: <span className="font-semibold">{action.linkedSection}</span>
        </div>
        <a href={action.href} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white no-underline hover:bg-indigo-700">
          Fix this →
        </a>
      </div>
    </article>
  )
}

function RoadmapDetail({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</div>
      <p className="text-sm leading-relaxed text-gray-600">{value}</p>
    </div>
  )
}

function priorityClassName(priority: InstitutionRoadmapAction['priority']): string {
  if (priority === 'High') return 'bg-red-100 text-red-700'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function sectionId(section: RoadmapSection): string {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function sectionDescription(section: RoadmapSection): string {
  if (section === ROADMAP_SECTION.IMMEDIATE_ACTIONS) return 'The fastest fixes that make the institution stronger now.'
  if (section === ROADMAP_SECTION.CAPABILITY_EXPANSION) return 'Capabilities that can be unlocked or strengthened with the right proof.'
  if (section === ROADMAP_SECTION.READINESS_IMPROVEMENT) return 'Steps to move from current readiness toward target readiness.'
  if (section === ROADMAP_SECTION.COMPLIANCE_RENEWAL) return 'Expirations, renewals, and reminders needed to keep evidence current.'
  return 'Programs and sponsor opportunities the institution can prepare for next.'
}
