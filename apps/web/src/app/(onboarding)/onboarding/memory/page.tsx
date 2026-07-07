'use client'

import { useState, type CSSProperties } from 'react'
import { DomainHeader } from '../../components/domain-header'
import { useOnboarding, useDerivedReadModel } from '@/lib/onboarding/onboarding-context'
import type { PassportData } from '@/lib/passport/passport-assembler'
import { normalizeLocations, type InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import {
  MEMORY_DOMAIN_OPTIONS,
  createInstitutionalMemoryEvent,
  normalizeMemoryEvents,
  type InstitutionalMemoryEvent,
  type MemoryDomain,
} from '@/lib/onboarding/institutional-memory'
import type { LocationInfrastructure } from '@/lib/onboarding/location-infrastructure'
import type { ResearchTeamMember } from '@/lib/onboarding/research-team'

export default function InstitutionalMemoryPage() {
  const { state, setAnswer } = useOnboarding()
  const passport = useDerivedReadModel()
  const answers = state.answers
  const manualEvents = Array.isArray(answers['memory_events'])
    ? normalizeMemoryEvents(answers['memory_events'] as InstitutionalMemoryEvent[])
    : []
  const [domainFilter, setDomainFilter] = useState<MemoryDomain | 'All'>('All')
  const [draft, setDraft] = useState(() => createInstitutionalMemoryEvent(0))
  const locations = Array.isArray(answers['org_locations'])
    ? normalizeLocations(answers['org_locations'] as InstitutionalLocation[])
    : []
  const teamMembers = Array.isArray(answers['people_team_members'])
    ? (answers['people_team_members'] as ResearchTeamMember[])
    : []
  const locationInfrastructure = Array.isArray(answers['infra_location_infrastructure'])
    ? (answers['infra_location_infrastructure'] as LocationInfrastructure[])
    : []
  const derivedEvents = deriveInstitutionalMemoryEvents({ answers, locations, teamMembers, locationInfrastructure, passport })
  const events = [...derivedEvents, ...manualEvents].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
  const filteredEvents = domainFilter === 'All' ? events : events.filter((event) => event.domain === domainFilter)
  const evidenceOptions = [
    ...state.uploadedDocs.map((document) => document.label),
    ...passport.capabilities.map((capability) => capability.name),
    ...locations.map((location) => location.name || location.type || 'Location'),
  ].filter(Boolean)

  const addEvent = () => {
    if (!draft.title.trim()) return
    const next = [...manualEvents, { ...draft, id: `memory-event-${Date.now()}-${manualEvents.length}` }]
    setAnswer('memory_events', next)
    setDraft(createInstitutionalMemoryEvent(next.length))
  }

  const toggleDraftEvidence = (value: string) => {
    setDraft((current) => ({
      ...current,
      linkedEvidence: current.linkedEvidence.includes(value)
        ? current.linkedEvidence.filter((item) => item !== value)
        : [...current.linkedEvidence, value],
    }))
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader domain="memory" questionCount={1} questionsAnswered={events.length > 0 ? 1 : 0} />

      <div style={heroStyle}>
        <div className="text-sm text-gray-400 mb-2">Institutional Memory</div>
        <h1 style={heroTitleStyle}>How did this institution become what it is today?</h1>
        <p style={heroTextStyle}>
          Institutional Memory preserves the cumulative history that usually gets lost when staff changes, studies end,
          documents expire, or sponsors move on. This is not the Passport; it is the historical layer behind it.
        </p>
      </div>

      <div style={filterBarStyle}>
        <button type="button" onClick={() => setDomainFilter('All')} style={filterButtonStyle(domainFilter === 'All')}>All</button>
        {MEMORY_DOMAIN_OPTIONS.map((domain) => (
          <button key={domain} type="button" onClick={() => setDomainFilter(domain)} style={filterButtonStyle(domainFilter === domain)}>
            {domain}
          </button>
        ))}
      </div>

      <section style={addEventStyle}>
        <h2 style={sectionTitleStyle}>Add Historical Event</h2>
        <div style={formGridStyle}>
          <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} style={inputStyle} />
          <select value={draft.domain} onChange={(event) => setDraft({ ...draft, domain: event.target.value as MemoryDomain })} style={inputStyle}>
            {MEMORY_DOMAIN_OPTIONS.map((domain) => <option key={domain} value={domain}>{domain}</option>)}
          </select>
          <input type="text" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Event title" style={inputStyle} />
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What happened, and why does it matter?" style={{ ...inputStyle, minHeight: 88 }} />
        </div>
        {evidenceOptions.length > 0 && (
          <div style={evidencePickerStyle}>
            <div style={miniLabelStyle}>Link event to evidence/documents when available</div>
            <div style={chipGridStyle}>
              {evidenceOptions.slice(0, 18).map((option) => (
                <label key={option} style={chipStyle(draft.linkedEvidence.includes(option))}>
                  <input type="checkbox" checked={draft.linkedEvidence.includes(option)} onChange={() => toggleDraftEvidence(option)} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <button type="button" onClick={addEvent} style={primaryButtonStyle}>+ Add historical event</button>
      </section>

      <section>
        <h2 style={sectionTitleStyle}>Institutional Timeline</h2>
        <div style={timelineStyle}>
          {filteredEvents.length === 0 ? (
            <div style={emptyStyle}>No memory events match this filter yet.</div>
          ) : (
            filteredEvents.map((event) => (
              <article key={event.id} style={timelineCardStyle}>
                <div style={timelineRailStyle} />
                <div>
                  <div style={eventMetaStyle}>
                    <span>{event.date || 'Date unknown'}</span>
                    <span>{event.domain}</span>
                  </div>
                  <h3 style={eventTitleStyle}>{event.title}</h3>
                  <p style={eventTextStyle}>{event.description}</p>
                  {event.linkedEvidence.length > 0 && (
                    <div style={linkedEvidenceStyle}>
                      {event.linkedEvidence.map((evidence) => (
                        <span key={evidence} style={evidenceChipStyle}>{evidence}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/documents" className="text-gray-500 hover:text-gray-700 text-sm">← Documents</a>
        <a href="/onboarding/capabilities" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">See Derived Capabilities →</a>
      </div>
    </div>
  )
}

function deriveInstitutionalMemoryEvents({
  answers,
  locations,
  teamMembers,
  locationInfrastructure,
  passport,
}: {
  answers: Record<string, unknown>
  locations: InstitutionalLocation[]
  teamMembers: ResearchTeamMember[]
  locationInfrastructure: LocationInfrastructure[]
  passport: PassportData
}): InstitutionalMemoryEvent[] {
  const events: InstitutionalMemoryEvent[] = []
  const foundedYear = String(answers['org_founded_year'] ?? '').trim()

  if (foundedYear) {
    events.push({
      id: 'memory-founded',
      date: `${foundedYear}-01-01`,
      title: 'Institution founded',
      domain: 'Institutional Timeline',
      description: 'The institution began its operating history.',
      linkedEvidence: ['Institution identity'],
    })
  }

  locations.forEach((location, index) => {
    events.push({
      id: `memory-location-${location.id}`,
      date: '',
      title: `${location.name || `Location ${index + 1}`} added to institutional footprint`,
      domain: 'Location / Infrastructure History',
      description: `${location.type || 'Operational location'} · ${[location.city, location.state].filter(Boolean).join(', ') || 'Location details pending'}`,
      linkedEvidence: [location.name || location.type || 'Location'],
    })
  })

  locationInfrastructure
    .filter((item) => item.laboratoryPresent || item.storageEquipment.length > 0 || item.biospecimenOperations.length > 0)
    .forEach((item) => {
      const location = locations.find((candidate) => candidate.id === item.locationId)
      events.push({
        id: `memory-infra-${item.locationId}`,
        date: '',
        title: `${location?.name ?? 'Location'} infrastructure documented`,
        domain: 'Location / Infrastructure History',
        description: [
          item.laboratoryPresent && 'Laboratory present',
          item.storageEquipment.length > 0 && `${item.storageEquipment.length} storage equipment type(s)`,
          item.biospecimenOperations.length > 0 && `${item.biospecimenOperations.join(', ')} biospecimen operations`,
        ].filter(Boolean).join(' · '),
        linkedEvidence: [location?.name ?? 'Location infrastructure'],
      })
    })

  teamMembers.forEach((member) => {
    const name = [member.firstName, member.lastName].filter(Boolean).join(' ')
    if (!name) return
    events.push({
      id: `memory-person-${member.id}`,
      date: '',
      title: `${name} added to research team`,
      domain: 'People History',
      description: `${member.primaryRole || 'Research staff'}${member.isPrincipalInvestigator ? ' · Principal Investigator' : ''}`,
      linkedEvidence: [name, ...member.certifications.map((certification) => certification.type).filter(Boolean)],
    })
  })

  passport.capabilities.forEach((capability) => {
    events.push({
      id: `memory-capability-${capability.name}`,
      date: '',
      title: `${capability.name} capability identified`,
      domain: 'Capability Evolution',
      description: `${capability.level}: ${capability.evidence}`,
      linkedEvidence: capability.supportingEvidence.map((evidence) => evidence.label),
    })
  })

  passport.evidence.documents
    .filter((document) => document.status !== 'missing')
    .forEach((document) => {
      events.push({
        id: `memory-document-${document.label}`,
        date: document.expiresAt ?? '',
        title: `${document.label} evidence captured`,
        domain: 'Document History',
        description: `Status: ${document.status}. Supports ${document.proves.join(', ')}.`,
        linkedEvidence: [document.label],
      })
    })

  if (Array.isArray(answers['org_research_focus']) && answers['org_research_focus'].length > 0) {
    events.push({
      id: 'memory-research-focus',
      date: '',
      title: 'Research operating model documented',
      domain: 'Research History',
      description: (answers['org_research_focus'] as string[]).join(', '),
      linkedEvidence: ['Research focus'],
    })
  }

  return events
}

function eventSortKey(event: InstitutionalMemoryEvent): string {
  return event.date || '9999-12-31'
}

const heroStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  marginBottom: 24,
  padding: 24,
} satisfies CSSProperties

const heroTitleStyle = {
  color: '#111827',
  fontSize: 30,
  fontWeight: 800,
  lineHeight: 1.15,
  margin: '0 0 10px',
} satisfies CSSProperties

const heroTextStyle = {
  color: '#4b5563',
  fontSize: 16,
  lineHeight: 1.6,
  margin: 0,
} satisfies CSSProperties

const filterBarStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 24,
} satisfies CSSProperties

function filterButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? '#2563eb' : '#ffffff',
    border: active ? '1px solid #2563eb' : '1px solid #d1d5db',
    borderRadius: 999,
    color: active ? '#ffffff' : '#374151',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 10px',
  }
}

const addEventStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  display: 'grid',
  gap: 14,
  marginBottom: 28,
  padding: 20,
} satisfies CSSProperties

const sectionTitleStyle = {
  color: '#111827',
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 14px',
} satisfies CSSProperties

const formGridStyle = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} satisfies CSSProperties

const inputStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  fontSize: 14,
  padding: '10px 12px',
  width: '100%',
} satisfies CSSProperties

const evidencePickerStyle = {
  display: 'grid',
  gap: 8,
} satisfies CSSProperties

const miniLabelStyle = {
  color: '#6b7280',
  fontSize: 12,
  fontWeight: 700,
} satisfies CSSProperties

const chipGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
} satisfies CSSProperties

function chipStyle(active: boolean): CSSProperties {
  return {
    alignItems: 'center',
    background: active ? '#eff6ff' : '#f9fafb',
    border: active ? '1px solid #60a5fa' : '1px solid #e5e7eb',
    borderRadius: 999,
    color: active ? '#1d4ed8' : '#4b5563',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 12,
    gap: 6,
    padding: '6px 9px',
  }
}

const primaryButtonStyle = {
  background: '#2563eb',
  border: 0,
  borderRadius: 10,
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 800,
  justifySelf: 'start',
  padding: '10px 14px',
} satisfies CSSProperties

const timelineStyle = {
  display: 'grid',
  gap: 12,
  marginBottom: 32,
} satisfies CSSProperties

const timelineCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '12px 1fr',
  padding: 16,
} satisfies CSSProperties

const timelineRailStyle = {
  background: 'linear-gradient(#2563eb, #8b5cf6)',
  borderRadius: 999,
  minHeight: 72,
  width: 4,
} satisfies CSSProperties

const eventMetaStyle = {
  color: '#6b7280',
  display: 'flex',
  flexWrap: 'wrap',
  fontSize: 12,
  fontWeight: 700,
  gap: 8,
  marginBottom: 4,
} satisfies CSSProperties

const eventTitleStyle = {
  color: '#111827',
  fontSize: 16,
  fontWeight: 800,
  margin: '0 0 6px',
} satisfies CSSProperties

const eventTextStyle = {
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.5,
  margin: 0,
} satisfies CSSProperties

const linkedEvidenceStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 10,
} satisfies CSSProperties

const evidenceChipStyle = {
  background: '#f3f4f6',
  borderRadius: 999,
  color: '#4b5563',
  fontSize: 11,
  fontWeight: 700,
  padding: '4px 8px',
} satisfies CSSProperties

const emptyStyle = {
  background: '#f9fafb',
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  color: '#6b7280',
  padding: 18,
} satisfies CSSProperties
