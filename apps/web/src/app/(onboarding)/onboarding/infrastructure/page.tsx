'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { DomainHeader, DomainWhatYouGet } from '../../components/domain-header'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import { createInstitutionalLocation, normalizeLocations, type InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import {
  BACKUP_POWER_OPTIONS,
  BIOSPECIMEN_OPERATION_OPTIONS,
  DEDICATED_RESEARCH_SPACE_OPTIONS,
  FACILITY_TYPE_OPTIONS,
  SHIPPING_CAPABILITY_OPTIONS,
  STORAGE_EQUIPMENT_OPTIONS,
  TEMPERATURE_MONITORING_OPTIONS,
  normalizeLocationInfrastructure,
  type LocationInfrastructure,
} from '@/lib/onboarding/location-infrastructure'

export default function InfrastructurePage() {
  const { state, setAnswer } = useOnboarding()
  const answers = state.answers
  const locations = Array.isArray(answers['org_locations'])
    ? normalizeLocations(answers['org_locations'] as InstitutionalLocation[])
    : [createInstitutionalLocation(0)]
  const infrastructure = Array.isArray(answers['infra_location_infrastructure'])
    ? normalizeLocationInfrastructure(locations, answers['infra_location_infrastructure'] as LocationInfrastructure[])
    : normalizeLocationInfrastructure(locations, [])
  const configuredCount = infrastructure.filter(isConfigured).length

  const updateInfrastructure = (locationId: string, patch: Partial<LocationInfrastructure>) => {
    const next = infrastructure.map((item) => item.locationId === locationId ? { ...item, ...patch } : item)
    setAnswer('infra_location_infrastructure', next)
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader
        domain="infrastructure"
        questionCount={locations.length}
        questionsAnswered={configuredCount}
      />

      <div style={introCardStyle}>
        <h2 style={introTitleStyle}>Infrastructure — Location-Specific Capabilities</h2>
        <p style={introTextStyle}>
          Now tell us what exists at each operational location. Locations come from Organization / Operational Footprint.
        </p>
      </div>

      <DomainWhatYouGet domain="infrastructure" />

      <div style={summaryCardStyle}>
        <strong>Derived Infrastructure Summary</strong>
        <div style={summaryGridStyle}>
          <span>{locations.length} locations</span>
          <span>{infrastructure.filter((item) => item.laboratoryPresent).length} with lab</span>
          <span>{infrastructure.filter((item) => item.biospecimenProcessingPresent).length} with biospecimen processing</span>
          <span>{infrastructure.filter((item) => item.storageEquipment.includes('-80C Freezer')).length} with -80C storage</span>
          <span>{infrastructure.filter((item) => item.backupPower && item.backupPower !== 'No backup power').length} with backup power</span>
        </div>
      </div>

      <div style={locationListStyle}>
        {locations.map((location) => {
          const item = infrastructure.find((infra) => infra.locationId === location.id) ?? infrastructure[0]

          return (
            <LocationInfrastructureCard
              key={location.id}
              location={location}
              infrastructure={item}
              onChange={(patch) => updateInfrastructure(location.id, patch)}
            />
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/people" className="text-gray-500 hover:text-gray-700 text-sm">
          ← People & Team
        </a>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.alert('Your onboarding progress is saved locally on this device.')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Save & Continue Later
          </button>
          <a href="/onboarding/documents" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            Continue to Documents →
          </a>
        </div>
      </div>
    </div>
  )
}

function LocationInfrastructureCard({
  location,
  infrastructure,
  onChange,
}: {
  location: InstitutionalLocation
  infrastructure: LocationInfrastructure
  onChange: (patch: Partial<LocationInfrastructure>) => void
}) {
  const [isOpen, setIsOpen] = useState(location.isPrimary)
  const locationSummary = [location.city, location.state].filter(Boolean).join(', ') || 'Location details pending'

  useEffect(() => {
    if (location.isPrimary) setIsOpen(true)
  }, [location.isPrimary])

  return (
    <section style={locationCardStyle}>
      <div style={locationHeaderStyle}>
        <div style={locationSummaryStyle}>
          <strong>{location.name || 'Operational Location'}</strong>
          <span style={mutedStyle}>{location.type || 'Location type pending'} · {locationSummary}</span>
        </div>
        <button type="button" onClick={() => setIsOpen((open) => !open)} style={secondaryButtonStyle}>
          {isOpen ? 'Collapse' : 'Configure Infrastructure'}
        </button>
      </div>

      {isOpen && (
        <div style={fieldsStyle}>
          <label style={fieldBlockStyle}>
            <span>What type of facility is this location?</span>
            <select value={infrastructure.facilityType} onChange={(event) => onChange({ facilityType: event.target.value })} style={inputStyle}>
              <option value="">Select facility type...</option>
              {FACILITY_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label style={fieldBlockStyle}>
            <span>Dedicated research space</span>
            <select value={infrastructure.dedicatedResearchSpace} onChange={(event) => onChange({ dedicatedResearchSpace: event.target.value })} style={inputStyle}>
              <option value="">Select...</option>
              {DEDICATED_RESEARCH_SPACE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <input type="number" min={0} value={infrastructure.examRooms} onChange={(event) => onChange({ examRooms: event.target.value })} placeholder="Exam rooms" style={inputStyle} />
          <input type="number" min={0} value={infrastructure.procedureRooms} onChange={(event) => onChange({ procedureRooms: event.target.value })} placeholder="Procedure rooms" style={inputStyle} />

          <BooleanToggle label="Infusion capability" checked={infrastructure.infusionCapability} onChange={(value) => onChange({ infusionCapability: value })} />
          <BooleanToggle label="Overnight / early phase capacity" checked={infrastructure.overnightEarlyPhaseCapacity} onChange={(value) => onChange({ overnightEarlyPhaseCapacity: value })} />
          <BooleanToggle label="Does this location operate a laboratory?" checked={infrastructure.laboratoryPresent} onChange={(value) => onChange({ laboratoryPresent: value })} />
          <BooleanToggle label="Pharmacy present?" checked={infrastructure.pharmacyPresent} onChange={(value) => onChange({ pharmacyPresent: value })} />
          <BooleanToggle label="Imaging present?" checked={infrastructure.imagingPresent} onChange={(value) => onChange({ imagingPresent: value })} />
          <BooleanToggle label="Biospecimen processing present?" checked={infrastructure.biospecimenProcessingPresent} onChange={(value) => onChange({ biospecimenProcessingPresent: value })} />

          <label style={fieldBlockStyle}>
            <span>Backup power</span>
            <select value={infrastructure.backupPower} onChange={(event) => onChange({ backupPower: event.target.value })} style={inputStyle}>
              <option value="">Select...</option>
              {BACKUP_POWER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <MultiSelectBlock
            title="Storage equipment"
            options={STORAGE_EQUIPMENT_OPTIONS}
            selectedValues={infrastructure.storageEquipment}
            onToggle={(value) => onChange({ storageEquipment: toggleValue(infrastructure.storageEquipment, value) })}
          />

          <label style={fieldBlockStyle}>
            <span>Temperature monitoring</span>
            <select value={infrastructure.temperatureMonitoring} onChange={(event) => onChange({ temperatureMonitoring: event.target.value })} style={inputStyle}>
              <option value="">Select...</option>
              {TEMPERATURE_MONITORING_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label style={fieldBlockStyle}>
            <span>Shipping capability</span>
            <select value={infrastructure.shippingCapability} onChange={(event) => onChange({ shippingCapability: event.target.value })} style={inputStyle}>
              <option value="">Select...</option>
              {SHIPPING_CAPABILITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <MultiSelectBlock
            title="At this location, do you collect, process, store, or ship biospecimens?"
            options={BIOSPECIMEN_OPERATION_OPTIONS}
            selectedValues={infrastructure.biospecimenOperations}
            onToggle={(value) => onChange({ biospecimenOperations: toggleValue(infrastructure.biospecimenOperations, value) })}
          />
        </div>
      )}
    </section>
  )
}

function BooleanToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={toggleStyle}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function MultiSelectBlock({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string
  options: readonly string[]
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div style={multiSelectStyle}>
      <strong>{title}</strong>
      <div style={optionGridStyle}>
        {options.map((option) => (
          <label key={option} style={{ ...optionStyle, ...(selectedValues.includes(option) ? selectedOptionStyle : {}) }}>
            <input type="checkbox" checked={selectedValues.includes(option)} onChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function isConfigured(infrastructure: LocationInfrastructure): boolean {
  return Boolean(
    infrastructure.facilityType ||
    infrastructure.dedicatedResearchSpace ||
    infrastructure.examRooms ||
    infrastructure.procedureRooms ||
    infrastructure.backupPower ||
    infrastructure.laboratoryPresent ||
    infrastructure.pharmacyPresent ||
    infrastructure.imagingPresent ||
    infrastructure.biospecimenProcessingPresent ||
    infrastructure.storageEquipment.length > 0 ||
    infrastructure.temperatureMonitoring ||
    infrastructure.shippingCapability ||
    infrastructure.biospecimenOperations.length > 0
  )
}

const introCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  marginBottom: 24,
  padding: 24,
} satisfies CSSProperties

const introTitleStyle = {
  color: '#111827',
  fontSize: 18,
  fontWeight: 700,
  margin: '0 0 8px',
} satisfies CSSProperties

const introTextStyle = {
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.5,
  margin: 0,
} satisfies CSSProperties

const summaryCardStyle = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  color: '#111827',
  display: 'grid',
  gap: 10,
  marginBottom: 24,
  padding: 16,
} satisfies CSSProperties

const summaryGridStyle = {
  color: '#4b5563',
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
} satisfies CSSProperties

const locationListStyle = {
  display: 'grid',
  gap: 14,
  marginBottom: 32,
} satisfies CSSProperties

const locationCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  display: 'grid',
  gap: 12,
  padding: 16,
} satisfies CSSProperties

const locationHeaderStyle = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
} satisfies CSSProperties

const locationSummaryStyle = {
  color: '#111827',
  display: 'grid',
  gap: 4,
} satisfies CSSProperties

const mutedStyle = {
  color: '#6b7280',
  fontSize: 13,
} satisfies CSSProperties

const secondaryButtonStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#374151',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  padding: '8px 10px',
} satisfies CSSProperties

const fieldsStyle = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} satisfies CSSProperties

const inputStyle = {
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  color: '#111827',
  fontSize: 14,
  minHeight: 44,
  padding: '10px 12px',
  width: '100%',
} satisfies CSSProperties

const fieldBlockStyle = {
  color: '#374151',
  display: 'grid',
  fontSize: 13,
  fontWeight: 700,
  gap: 6,
} satisfies CSSProperties

const toggleStyle = {
  alignItems: 'center',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  gap: 8,
  minHeight: 44,
  padding: '10px 12px',
} satisfies CSSProperties

const multiSelectStyle = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  display: 'grid',
  gap: 10,
  gridColumn: '1 / -1',
  padding: 12,
} satisfies CSSProperties

const optionGridStyle = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
} satisfies CSSProperties

const optionStyle = {
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  gap: 8,
  padding: '8px 10px',
} satisfies CSSProperties

const selectedOptionStyle = {
  background: '#eff6ff',
  borderColor: '#60a5fa',
  color: '#1d4ed8',
  fontWeight: 700,
} satisfies CSSProperties
