'use client'

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useOnboarding, type OnboardingAnswers, type OnboardingAnswerValue } from '@/lib/onboarding/onboarding-context'
import {
  LOCATION_TYPE_OPTIONS,
  createInstitutionalLocation,
  normalizeLocations,
  type InstitutionalLocation,
} from '@/lib/onboarding/institutional-locations'
import {
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  OPERATIONAL_ASSET_OPTIONS,
  PRIMARY_COVERAGE_OPTIONS,
  RECRUITMENT_REACH_OPTIONS,
  SAMPLE_LOGISTICS_OPTIONS,
  TIME_ZONE_OPTIONS,
  US_STATE_OPTIONS,
} from '@/lib/onboarding/operational-footprint-taxonomy'
import { RESEARCH_FOCUS_GROUPS, type ResearchFocusGroup } from '@/lib/onboarding/research-focus-taxonomy'
import { RESEARCH_MODALITY_GROUPS, THERAPEUTIC_AREA_GROUPS, type ResearchExperienceDomainGroup } from '@/lib/onboarding/research-experience-taxonomy'
import { DomainHeader, InterviewQuestion, DomainWhatYouGet } from '../../components/domain-header'

const INSTITUTION_TYPE_OPTIONS = [
  'Independent Research Site',
  'Hospital',
  'Academic Medical Center',
  'Biobank',
  'Laboratory',
  'SMO',
  'Research Network',
  'Reference / Central Laboratory',
  'Contract Research Organization (CRO)',
  'Physician Practice / Clinic',
  'University',
  'Non-Profit Research Organization',
  'Other',
]

export default function OrganizationPage() {
  const { state, setAnswer, setAnswers, setInstitutionName } = useOnboarding()
  const a = state.answers
  const locations = Array.isArray(a['org_locations']) ? normalizeLocations(a['org_locations'] as InstitutionalLocation[]) : [createInstitutionalLocation(0)]
  const questionsAnswered = Object.entries(a).filter(([key, value]) =>
    key.startsWith('org_') && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
  ).length

  const handleCheckbox = (key: string, value: string) => {
    const current = Array.isArray(a[key]) ? [...a[key] as string[]] : []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setAnswer(key, next)
  }

  const input = (key: string) => ({
    value: (a[key] as string) ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.value
      setAnswer(key, val)
      if (key === 'org_name') setInstitutionName(val)
    },
  })

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader domain="organization" questionCount={11} questionsAnswered={questionsAnswered} />
      <DomainWhatYouGet domain="organization" />

      {/* Identity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Institutional Identity</h2>
        <p className="text-gray-500 mb-4">Tell us about your institution. This is the foundation everything builds on.</p>

        <InterviewQuestion number={1} question="What is the legal name of your institution?" help="Official registered name on your licenses, certifications, and legal documents.">
          <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Vilo Research Institute" {...input('org_name')} />
        </InterviewQuestion>

        <InterviewQuestion number={2} question="Does your institution operate under any other names?" help="DBAs, trade names, or alternative names sponsors might know.">
          <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" {...input('org_dba')} />
        </InterviewQuestion>

        <InterviewQuestion number={3} question="What type of institution are you?" help="This helps us understand your operational context.">
          <InstitutionTypeSelect
            value={(a['org_type'] as string) ?? ''}
            onChange={(value) => setAnswer('org_type', value)}
          />
        </InterviewQuestion>
      </div>

      {/* Mission & Purpose */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mission & Purpose</h2>
        <p className="text-gray-500 mb-4">What drives your institution?</p>

        <InterviewQuestion number={4} question="What is your institutional mission?" help="Appears on your Passport and helps sponsors understand your purpose.">
          <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="e.g., Advancing precision medicine through innovative clinical research..." {...input('org_mission')} />
        </InterviewQuestion>

        <InterviewQuestion number={5} question="When was your institution or research program founded?" help="Track record matters.">
          <input type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., 1995" min={1800} max={2030} {...input('org_founded_year')} />
        </InterviewQuestion>
      </div>

      {/* Research Focus */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Research Focus</h2>
        <p className="text-gray-500 mb-4">This is the #1 filter sponsors use.</p>

        <InterviewQuestion number={6} question="Which research programs and operational capabilities does your institution actively perform?" help="Select every research model your institution can execute today.">
          <ResearchFocusMultiSelect
            groups={RESEARCH_FOCUS_GROUPS}
            selectedValues={Array.isArray(a['org_research_focus']) ? (a['org_research_focus'] as string[]) : []}
            onToggle={handleCheckbox}
          />
        </InterviewQuestion>

        <InterviewQuestion number={7} question="Which therapeutic areas do you have experience in?" help="Disease areas and clinical specialties where your institution has research experience.">
          <ResearchExperienceMultiSelect
            groups={THERAPEUTIC_AREA_GROUPS}
            selectedValues={Array.isArray(a['org_therapeutic_areas']) ? (a['org_therapeutic_areas'] as string[]) : []}
            storageKey="org_therapeutic_areas"
            searchPlaceholder="Search therapeutic areas..."
            onToggle={handleCheckbox}
          />
        </InterviewQuestion>

        <InterviewQuestion number={8} question="Which research modalities can your institution execute?" help="The types of research your institution knows how to run beyond traditional drug trials.">
          <ResearchExperienceMultiSelect
            groups={RESEARCH_MODALITY_GROUPS}
            selectedValues={Array.isArray(a['org_research_modalities']) ? (a['org_research_modalities'] as string[]) : []}
            storageKey="org_research_modalities"
            searchPlaceholder="Search research modalities..."
            onToggle={handleCheckbox}
          />
        </InterviewQuestion>
      </div>

      {/* Operational Footprint */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Operational Footprint</h2>

        <InterviewQuestion number={9} question="Institutional Locations" help="Add the operational locations that make up your institutional footprint. Minimum one location is required.">
          <InstitutionalLocationsEditor
            locations={locations}
            addLabel={a['org_type'] === 'Research Network' ? 'Add network member' : 'Add another location'}
            onChange={(nextLocations) => {
              const normalized = normalizeLocations(nextLocations)
              setAnswers({
                org_locations: normalized,
              })
            }}
          />
        </InterviewQuestion>

        <InterviewQuestion number={10} question="Operational Footprint" help="Describe where your institution operates, recruits, collects samples, and supports research.">
          <OperationalFootprintEditor
            locations={locations}
            answers={a}
            onSetAnswer={setAnswer}
            onSetAnswers={setAnswers}
            onToggle={handleCheckbox}
          />
        </InterviewQuestion>
      </div>

      {/* Web & Contact */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact & Online Presence</h2>
        <InterviewQuestion number={11} question="What is your institutional website?" help="Sponsors will use this to learn more about you.">
          <input type="url" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.your-institution.org" {...input('org_website')} />
        </InterviewQuestion>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding" className="text-gray-500 hover:text-gray-700 text-sm">← Back to Overview</a>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.alert('Your onboarding progress is saved locally on this device.')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Save & Continue Later
          </button>
          <a href="/onboarding/people" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Continue to People →</a>
        </div>
      </div>
    </div>
  )
}

function InstitutionalLocationsEditor({
  locations,
  addLabel,
  onChange,
}: {
  locations: InstitutionalLocation[]
  addLabel: string
  onChange: (locations: InstitutionalLocation[]) => void
}) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(locations.map((location) => location.id)))
  const normalizedLocations = normalizeLocations(locations)
  const locationIds = normalizedLocations.map((location) => location.id).join('|')

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current)
      let changed = false
      normalizedLocations.forEach((location) => {
        if ((next.size === 0 || location.isPrimary) && !next.has(location.id)) {
          next.add(location.id)
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [locationIds])

  const updateLocation = (id: string, patch: Partial<InstitutionalLocation>) => {
    onChange(normalizedLocations.map((location) => (
      location.id === id ? { ...location, ...patch } : location
    )))
  }

  const addLocation = () => {
    const nextLocation = createInstitutionalLocation(normalizedLocations.length)
    onChange([...normalizedLocations, nextLocation])
    setExpandedIds((current) => new Set([...current, nextLocation.id]))
  }

  const duplicateLocation = (location: InstitutionalLocation) => {
    const duplicate = {
      ...location,
      id: `location-${Date.now()}-${normalizedLocations.length}`,
      name: location.name ? `${location.name} Copy` : '',
      isPrimary: false,
    }
    onChange([...normalizedLocations, duplicate])
    setExpandedIds((current) => new Set([...current, duplicate.id]))
  }

  const deleteLocation = (id: string) => {
    if (normalizedLocations.length === 1) return
    onChange(normalizedLocations.filter((location) => location.id !== id))
    setExpandedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const setPrimary = (id: string) => {
    onChange(normalizedLocations.map((location) => ({
      ...location,
      isPrimary: location.id === id,
    })))
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={locationsEditorStyle}>
      <div style={locationsIntroStyle}>
        <strong>First Location</strong>
        <span>The institution begins with one location. Add more locations or network members as needed.</span>
      </div>

      {normalizedLocations.map((location, index) => {
        const isExpanded = expandedIds.has(location.id)
        const summary = [location.city, location.state].filter(Boolean).join(', ') || 'Location details pending'

        return (
          <section key={location.id} style={locationCardStyle}>
            <div style={locationCardHeaderStyle}>
              <div style={locationSummaryStyle}>
                <div style={locationTitleRowStyle}>
                  <strong>{location.name || `Location ${index + 1}`}</strong>
                  {location.isPrimary && <span style={primaryBadgeStyle}>Primary</span>}
                </div>
                <span style={locationMetaStyle}>{summary}</span>
                <span style={locationMetaStyle}>{location.type || 'Location type pending'}</span>
              </div>
              <div style={locationActionsStyle}>
                {!location.isPrimary && (
                  <button type="button" onClick={() => setPrimary(location.id)} style={secondaryActionButtonStyle}>
                    Set as Primary
                  </button>
                )}
                <button type="button" onClick={() => toggleExpanded(location.id)} style={secondaryActionButtonStyle}>
                  {isExpanded ? 'Collapse' : 'Edit'}
                </button>
                <button type="button" onClick={() => duplicateLocation(location)} style={secondaryActionButtonStyle}>
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => deleteLocation(location.id)}
                  disabled={normalizedLocations.length === 1}
                  style={{
                    ...dangerActionButtonStyle,
                    ...(normalizedLocations.length === 1 ? disabledActionButtonStyle : {}),
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {isExpanded && (
              <div style={locationFieldsStyle}>
                <input
                  type="text"
                  value={location.name}
                  onChange={(event) => updateLocation(location.id, { name: event.target.value })}
                  placeholder="Location Name"
                  style={locationInputStyle}
                />
                <select
                  value={location.type}
                  onChange={(event) => updateLocation(location.id, { type: event.target.value as InstitutionalLocation['type'] })}
                  style={locationInputStyle}
                >
                  <option value="">Location Type</option>
                  {LOCATION_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={location.street}
                  onChange={(event) => updateLocation(location.id, { street: event.target.value })}
                  placeholder="Street"
                  style={locationInputStyle}
                />
                <input
                  type="text"
                  value={location.city}
                  onChange={(event) => updateLocation(location.id, { city: event.target.value })}
                  placeholder="City"
                  style={locationInputStyle}
                />
                <input
                  type="text"
                  value={location.state}
                  onChange={(event) => updateLocation(location.id, { state: event.target.value })}
                  placeholder="State / Province"
                  style={locationInputStyle}
                />
                <input
                  type="text"
                  value={location.country}
                  onChange={(event) => updateLocation(location.id, { country: event.target.value })}
                  placeholder="Country"
                  style={locationInputStyle}
                />
                <input
                  type="text"
                  value={location.zip}
                  onChange={(event) => updateLocation(location.id, { zip: event.target.value })}
                  placeholder="ZIP / Postal Code"
                  style={locationInputStyle}
                />
                <input
                  type="text"
                  value={location.timeZone}
                  onChange={(event) => updateLocation(location.id, { timeZone: event.target.value })}
                  placeholder="Time Zone"
                  style={locationInputStyle}
                />
              </div>
            )}
          </section>
        )
      })}

      <button type="button" onClick={addLocation} style={addLocationButtonStyle}>
        + {addLabel}
      </button>
    </div>
  )
}

function OperationalFootprintEditor({
  locations,
  answers,
  onSetAnswer,
  onSetAnswers,
  onToggle,
}: {
  locations: InstitutionalLocation[]
  answers: OnboardingAnswers
  onSetAnswer: (questionId: string, value: OnboardingAnswerValue) => void
  onSetAnswers: (answers: OnboardingAnswers) => void
  onToggle: (key: string, value: string) => void
}) {
  const coverage = String(answers['org_operational_coverage'] ?? '')
  const inferredTimeZones = Array.from(new Set(locations.map((location) => location.timeZone).filter(Boolean)))
  const selectedTimeZones = answerArray(answers, 'org_time_zones')
  const displayedTimeZones = selectedTimeZones.length > 0 ? selectedTimeZones : inferredTimeZones
  const showAdvancedFootprint = coverage !== 'Single City' || locations.length > 1

  const setCoverage = (value: string) => {
    onSetAnswers({
      org_operational_coverage: value,
    })
  }

  const toggleWithInference = (key: string, value: string) => {
    if (key === 'org_time_zones' && selectedTimeZones.length === 0 && inferredTimeZones.length > 0) {
      const next = inferredTimeZones.includes(value)
        ? inferredTimeZones.filter((timeZone) => timeZone !== value)
        : [...inferredTimeZones, value]
      onSetAnswer(key, next)
      return
    }

    onToggle(key, value)
  }

  return (
    <div style={operationalFootprintRootStyle}>
      <OperationalFootprintSection title="Primary Coverage" defaultOpen>
        <div style={coverageOptionsStyle}>
          {PRIMARY_COVERAGE_OPTIONS.map((option) => (
            <label
              key={option}
              style={{
                ...coverageOptionStyle,
                ...(coverage === option ? researchExperienceOptionSelectedStyle : {}),
              }}
            >
              <input
                type="radio"
                name="operational_coverage"
                checked={coverage === option}
                onChange={() => setCoverage(option)}
                style={researchExperienceCheckboxStyle}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </OperationalFootprintSection>

      {showAdvancedFootprint ? (
        <>
          <OperationalFootprintSection title="Active States / Provinces">
            <SearchableOperationalMultiSelect
              options={US_STATE_OPTIONS}
              selectedValues={answerArray(answers, 'org_active_regions')}
              storageKey="org_active_regions"
              searchPlaceholder="Search states or provinces..."
              onToggle={onToggle}
            />
          </OperationalFootprintSection>

          <OperationalFootprintSection title="Countries">
            <SearchableOperationalMultiSelect
              options={COUNTRY_OPTIONS}
              selectedValues={answerArray(answers, 'org_countries')}
              storageKey="org_countries"
              searchPlaceholder="Search countries..."
              onToggle={onToggle}
            />
          </OperationalFootprintSection>

          <OperationalFootprintSection title="Recruitment Reach">
            <OperationalCheckboxGrid
              options={RECRUITMENT_REACH_OPTIONS}
              selectedValues={answerArray(answers, 'org_recruitment_reach')}
              storageKey="org_recruitment_reach"
              onToggle={onToggle}
            />
          </OperationalFootprintSection>

          <OperationalFootprintSection title="Sample Logistics">
            <OperationalCheckboxGrid
              options={SAMPLE_LOGISTICS_OPTIONS}
              selectedValues={answerArray(answers, 'org_sample_logistics')}
              storageKey="org_sample_logistics"
              onToggle={onToggle}
            />
          </OperationalFootprintSection>

          <OperationalFootprintSection title="Operational Presence">
            <OperationalCheckboxGrid
              options={OPERATIONAL_ASSET_OPTIONS}
              selectedValues={answerArray(answers, 'org_operational_assets')}
              storageKey="org_operational_assets"
              onToggle={onToggle}
            />
          </OperationalFootprintSection>
        </>
      ) : (
        <div style={operationalFootprintNoticeStyle}>
          Advanced footprint sections appear when you select broader coverage or add more locations.
        </div>
      )}

      <OperationalFootprintSection title="Languages" defaultOpen>
        <OperationalCheckboxGrid
          options={LANGUAGE_OPTIONS}
          selectedValues={answerArray(answers, 'org_languages')}
          storageKey="org_languages"
          onToggle={onToggle}
        />
      </OperationalFootprintSection>

      <OperationalFootprintSection title="Time Zones" defaultOpen={inferredTimeZones.length > 0}>
        {inferredTimeZones.length > 0 && selectedTimeZones.length === 0 && (
          <p style={operationalFootprintHintStyle}>
            Inferred from locations. Select or clear values below to manually override.
          </p>
        )}
        <SearchableOperationalMultiSelect
          options={TIME_ZONE_OPTIONS}
          selectedValues={displayedTimeZones}
          storageKey="org_time_zones"
          searchPlaceholder="Search time zones..."
          onToggle={toggleWithInference}
        />
      </OperationalFootprintSection>
    </div>
  )
}

function OperationalFootprintSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details style={operationalFootprintSectionStyle} open={defaultOpen}>
      <summary style={operationalFootprintSummaryStyle}>{title}</summary>
      <div style={operationalFootprintSectionBodyStyle}>{children}</div>
    </details>
  )
}

function SearchableOperationalMultiSelect({
  options,
  selectedValues,
  storageKey,
  searchPlaceholder,
  onToggle,
}: {
  options: readonly string[]
  selectedValues: string[]
  storageKey: string
  searchPlaceholder: string
  onToggle: (key: string, value: string) => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.toLowerCase().includes(normalizedQuery))
    : options

  return (
    <div style={researchExperienceRootStyle}>
      <div style={researchExperienceSearchRowStyle}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          style={researchExperienceSearchStyle}
        />
        <span style={researchExperienceCountStyle}>{selectedValues.length} selected</span>
      </div>
      <OperationalCheckboxGrid
        options={filteredOptions}
        selectedValues={selectedValues}
        storageKey={storageKey}
        onToggle={onToggle}
      />
    </div>
  )
}

function OperationalCheckboxGrid({
  options,
  selectedValues,
  storageKey,
  onToggle,
}: {
  options: readonly string[]
  selectedValues: string[]
  storageKey: string
  onToggle: (key: string, value: string) => void
}) {
  return (
    <div style={researchExperienceOptionsStyle}>
      {options.map((option) => {
        const checked = selectedValues.includes(option)

        return (
          <label
            key={option}
            style={{
              ...researchExperienceOptionStyle,
              ...(checked ? researchExperienceOptionSelectedStyle : {}),
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(storageKey, option)}
              style={researchExperienceCheckboxStyle}
            />
            <span>{option}</span>
          </label>
        )
      })}
    </div>
  )
}

function answerArray(answers: OnboardingAnswers, key: string): string[] {
  const value = answers[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function ResearchFocusMultiSelect({
  groups,
  selectedValues,
  onToggle,
}: {
  groups: readonly ResearchFocusGroup[]
  selectedValues: string[]
  onToggle: (key: string, value: string) => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      options: normalizedQuery
        ? group.options.filter((option) =>
            option.value.toLowerCase().includes(normalizedQuery) ||
            option.description.toLowerCase().includes(normalizedQuery) ||
            group.label.toLowerCase().includes(normalizedQuery)
          )
        : group.options,
    }))
    .filter((group) => group.options.length > 0)

  return (
    <div style={researchExperienceRootStyle}>
      <div style={researchExperienceSearchRowStyle}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search research programs and capabilities..."
          style={researchExperienceSearchStyle}
        />
        <span style={researchExperienceCountStyle}>{selectedValues.length} selected</span>
      </div>

      <div style={researchExperienceGroupsStyle}>
        {filteredGroups.length === 0 ? (
          <div style={researchExperienceEmptyStyle}>No matching research focus found.</div>
        ) : (
          filteredGroups.map((group) => (
            <section key={group.id} style={researchExperienceGroupStyle}>
              <div style={researchExperienceGroupHeaderStyle}>
                <h3 style={researchExperienceGroupTitleStyle}>{group.label}</h3>
              </div>
              <div style={researchExperienceOptionsStyle}>
                {group.options.map((option) => {
                  const checked = selectedValues.includes(option.value)

                  return (
                    <label
                      key={option.value}
                      style={{
                        ...researchExperienceOptionStyle,
                        alignItems: 'flex-start',
                        ...(checked ? researchExperienceOptionSelectedStyle : {}),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle('org_research_focus', option.value)}
                        style={{ ...researchExperienceCheckboxStyle, marginTop: 2 }}
                      />
                      <span style={researchFocusOptionTextStyle}>
                        <strong>{option.value}</strong>
                        <span>{option.description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function ResearchExperienceMultiSelect({
  groups,
  selectedValues,
  storageKey,
  searchPlaceholder,
  onToggle,
}: {
  groups: readonly ResearchExperienceDomainGroup[]
  selectedValues: string[]
  storageKey: string
  searchPlaceholder: string
  onToggle: (key: string, value: string) => void
}) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      options: normalizedQuery
        ? group.options.filter((option) =>
            option.toLowerCase().includes(normalizedQuery) ||
            group.label.toLowerCase().includes(normalizedQuery) ||
            group.description.toLowerCase().includes(normalizedQuery)
          )
        : group.options,
    }))
    .filter((group) => group.options.length > 0)

  return (
    <div style={researchExperienceRootStyle}>
      <div style={researchExperienceSearchRowStyle}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          style={researchExperienceSearchStyle}
        />
        <span style={researchExperienceCountStyle}>
          {selectedValues.length} selected
        </span>
      </div>

      <div style={researchExperienceGroupsStyle}>
        {filteredGroups.length === 0 ? (
          <div style={researchExperienceEmptyStyle}>No matching domains found.</div>
        ) : (
          filteredGroups.map((group) => (
            <section key={group.id} style={researchExperienceGroupStyle}>
              <div style={researchExperienceGroupHeaderStyle}>
                <h3 style={researchExperienceGroupTitleStyle}>{group.label}</h3>
                <p style={researchExperienceGroupDescriptionStyle}>{group.description}</p>
              </div>
              <div style={researchExperienceOptionsStyle}>
                {group.options.map((option) => {
                  const checked = selectedValues.includes(option)

                  return (
                    <label
                      key={option}
                      style={{
                        ...researchExperienceOptionStyle,
                        ...(checked ? researchExperienceOptionSelectedStyle : {}),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(storageKey, option)}
                        style={researchExperienceCheckboxStyle}
                      />
                      <span>{option}</span>
                    </label>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function InstitutionTypeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, INSTITUTION_TYPE_OPTIONS.findIndex((option) => option === value)),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const activeOption = INSTITUTION_TYPE_OPTIONS[activeIndex]

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    const selectedIndex = INSTITUTION_TYPE_OPTIONS.findIndex((option) => option === value)
    if (selectedIndex >= 0) setActiveIndex(selectedIndex)
  }, [value])

  const selectOption = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => Math.min(current + 1, INSTITUTION_TYPE_OPTIONS.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) {
        selectOption(activeOption)
      } else {
        setIsOpen(true)
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="institution-type-options"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleKeyDown}
        style={institutionSelectTriggerStyle}
      >
        <span style={{ color: value ? '#111827' : '#9ca3af' }}>
          {value || 'Select your institution type...'}
        </span>
        <span aria-hidden="true" style={{ color: '#6b7280', fontSize: 12 }}>▾</span>
      </button>

      {isOpen && (
        <div
          id="institution-type-options"
          role="listbox"
          aria-label="Institution type options"
          style={institutionSelectMenuStyle}
        >
          {INSTITUTION_TYPE_OPTIONS.map((option, index) => {
            const isSelected = value === option
            const isActive = activeIndex === index

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                style={{
                  ...institutionSelectOptionStyle,
                  ...(isActive ? institutionSelectOptionActiveStyle : {}),
                  ...(isSelected ? institutionSelectOptionSelectedStyle : {}),
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const institutionSelectTriggerStyle = {
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  cursor: 'pointer',
  display: 'flex',
  fontSize: 14,
  justifyContent: 'space-between',
  minHeight: 48,
  padding: '12px 16px',
  textAlign: 'left',
  width: '100%',
} satisfies CSSProperties

const institutionSelectMenuStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 10,
  boxShadow: '0 20px 35px rgba(15, 23, 42, 0.16)',
  display: 'grid',
  left: 0,
  maxHeight: 320,
  overflowY: 'auto',
  padding: 6,
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 6px)',
  zIndex: 50,
} satisfies CSSProperties

const institutionSelectOptionStyle = {
  background: 'transparent',
  border: 0,
  borderRadius: 8,
  color: '#374151',
  cursor: 'pointer',
  fontSize: 14,
  padding: '10px 12px',
  textAlign: 'left',
  width: '100%',
} satisfies CSSProperties

const institutionSelectOptionActiveStyle = {
  background: '#eff6ff',
  color: '#1d4ed8',
} satisfies CSSProperties

const institutionSelectOptionSelectedStyle = {
  fontWeight: 700,
} satisfies CSSProperties

const researchExperienceRootStyle = {
  display: 'grid',
  gap: 12,
} satisfies CSSProperties

const researchExperienceSearchRowStyle = {
  alignItems: 'center',
  display: 'flex',
  gap: 12,
} satisfies CSSProperties

const researchExperienceSearchStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  flex: '1 1 auto',
  fontSize: 14,
  minHeight: 42,
  padding: '10px 12px',
  width: '100%',
} satisfies CSSProperties

const researchExperienceCountStyle = {
  color: '#4b5563',
  flex: '0 0 auto',
  fontSize: 13,
  fontWeight: 600,
} satisfies CSSProperties

const researchExperienceGroupsStyle = {
  display: 'grid',
  gap: 12,
  maxHeight: 620,
  overflowY: 'auto',
  paddingRight: 4,
} satisfies CSSProperties

const researchExperienceGroupStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  display: 'grid',
  gap: 10,
  padding: 12,
} satisfies CSSProperties

const researchExperienceGroupHeaderStyle = {
  display: 'grid',
  gap: 2,
} satisfies CSSProperties

const researchExperienceGroupTitleStyle = {
  color: '#111827',
  fontSize: 14,
  fontWeight: 700,
  margin: 0,
} satisfies CSSProperties

const researchExperienceGroupDescriptionStyle = {
  color: '#6b7280',
  fontSize: 12,
  lineHeight: 1.4,
  margin: 0,
} satisfies CSSProperties

const researchExperienceOptionsStyle = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
} satisfies CSSProperties

const researchExperienceOptionStyle = {
  alignItems: 'center',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  gap: 8,
  minHeight: 40,
  padding: '9px 10px',
} satisfies CSSProperties

const researchExperienceOptionSelectedStyle = {
  background: '#eff6ff',
  borderColor: '#60a5fa',
  color: '#1d4ed8',
  fontWeight: 700,
} satisfies CSSProperties

const researchFocusOptionTextStyle = {
  display: 'grid',
  gap: 2,
  lineHeight: 1.35,
} satisfies CSSProperties

const researchExperienceCheckboxStyle = {
  flex: '0 0 auto',
  height: 16,
  width: 16,
} satisfies CSSProperties

const researchExperienceEmptyStyle = {
  background: '#ffffff',
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  color: '#6b7280',
  fontSize: 14,
  padding: 16,
} satisfies CSSProperties

const locationsEditorStyle = {
  display: 'grid',
  gap: 12,
} satisfies CSSProperties

const locationsIntroStyle = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 12,
  color: '#1e40af',
  display: 'grid',
  fontSize: 13,
  gap: 4,
  padding: 12,
} satisfies CSSProperties

const locationCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  display: 'grid',
  gap: 12,
  padding: 14,
} satisfies CSSProperties

const locationCardHeaderStyle = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
} satisfies CSSProperties

const locationSummaryStyle = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
} satisfies CSSProperties

const locationTitleRowStyle = {
  alignItems: 'center',
  color: '#111827',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
} satisfies CSSProperties

const primaryBadgeStyle = {
  background: '#dcfce7',
  borderRadius: 999,
  color: '#166534',
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 8px',
} satisfies CSSProperties

const locationMetaStyle = {
  color: '#6b7280',
  fontSize: 13,
} satisfies CSSProperties

const locationActionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'flex-end',
} satisfies CSSProperties

const secondaryActionButtonStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#374151',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  padding: '7px 9px',
} satisfies CSSProperties

const dangerActionButtonStyle = {
  ...secondaryActionButtonStyle,
  color: '#b91c1c',
} satisfies CSSProperties

const disabledActionButtonStyle = {
  color: '#9ca3af',
  cursor: 'not-allowed',
  opacity: 0.7,
} satisfies CSSProperties

const locationFieldsStyle = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} satisfies CSSProperties

const locationInputStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  fontSize: 14,
  minHeight: 44,
  padding: '10px 12px',
  width: '100%',
} satisfies CSSProperties

const addLocationButtonStyle = {
  background: '#2563eb',
  border: 0,
  borderRadius: 12,
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 800,
  justifySelf: 'start',
  padding: '11px 14px',
} satisfies CSSProperties

const operationalFootprintRootStyle = {
  display: 'grid',
  gap: 12,
} satisfies CSSProperties

const operationalFootprintSectionStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
} satisfies CSSProperties

const operationalFootprintSummaryStyle = {
  color: '#111827',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 800,
  padding: '12px 14px',
} satisfies CSSProperties

const operationalFootprintSectionBodyStyle = {
  borderTop: '1px solid #f3f4f6',
  display: 'grid',
  gap: 12,
  padding: 14,
} satisfies CSSProperties

const coverageOptionsStyle = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
} satisfies CSSProperties

const coverageOptionStyle = {
  alignItems: 'center',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  gap: 8,
  minHeight: 40,
  padding: '9px 10px',
} satisfies CSSProperties

const operationalFootprintNoticeStyle = {
  background: '#f9fafb',
  border: '1px dashed #d1d5db',
  borderRadius: 12,
  color: '#6b7280',
  fontSize: 13,
  padding: 14,
} satisfies CSSProperties

const operationalFootprintHintStyle = {
  color: '#6b7280',
  fontSize: 12,
  lineHeight: 1.45,
  margin: 0,
} satisfies CSSProperties
