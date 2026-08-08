'use client'

import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react'
import {
  WIZARD_STEPS,
  STEP_LABELS,
  STEP_DESCRIPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  THERAPEUTIC_AREA_OPTIONS,
  RESEARCH_MODALITY_OPTIONS,
  EMPTY_DRAFT,
  type WizardStep,
  type WizardDraft,
  type InstitutionType,
  type TherapeuticArea,
  type ResearchModality,
  type WizardLocation,
  type WizardPerson,
  type WizardInfrastructure,
  type WizardCapability,
  type WizardDocument,
} from '@/lib/onboarding-wizard/types'
import { submitOnboarding, type SubmissionResult } from '@/lib/onboarding-wizard/api'

const DRAFT_STORAGE_KEY = 'kadarn-onboarding-wizard-v1'

// ==========================================================================
// Helpers
// ==========================================================================

function loadDraft(): WizardDraft {
  if (typeof window === 'undefined') return { ...EMPTY_DRAFT }
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as WizardDraft
      if (parsed.version === 1) return parsed
    }
  } catch {
    // ignore
  }
  return { ...EMPTY_DRAFT }
}

function saveDraft(draft: WizardDraft): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }))
  } catch {
    // ignore
  }
}

function newId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ==========================================================================
// Main Page
// ==========================================================================

export default function OnboardingWizardPage() {
  const [draft, setDraft] = useState<WizardDraft>(() => loadDraft())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedIndicator, setSavedIndicator] = useState(false)

  const currentStep = draft.currentStep
  const stepIndex = WIZARD_STEPS.indexOf(currentStep)

  // Persist draft to localStorage on changes
  useEffect(() => {
    if (draft.currentStep !== EMPTY_DRAFT.currentStep || draft.identity_name) {
      saveDraft(draft)
    }
  }, [draft])

  // Persist every 30 seconds for safety
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(draft)
    }, 30_000)
    return () => clearInterval(interval)
  }, [draft])

  const update = useCallback((patch: Partial<WizardDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const goToStep = useCallback((step: WizardStep) => {
    setDraft((prev) => ({ ...prev, currentStep: step }))
    window.scrollTo(0, 0)
  }, [])

  const goNext = useCallback(() => {
    if (stepIndex < WIZARD_STEPS.length - 1) {
      goToStep(WIZARD_STEPS[stepIndex + 1])
    }
  }, [stepIndex, goToStep])

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      goToStep(WIZARD_STEPS[stepIndex - 1])
    }
  }, [stepIndex, goToStep])

  const saveDraftManually = useCallback(() => {
    saveDraft(draft)
    setSavedIndicator(true)
    setTimeout(() => setSavedIndicator(false), 2000)
  }, [draft])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await submitOnboarding(draft)
      setSubmissionResult(result)
      setDraft((prev) => ({
        ...prev,
        submitted: true,
        institutionId: result.institution.id,
        currentStep: 'results',
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }, [draft])

  const resetWizard = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setDraft({ ...EMPTY_DRAFT })
    setSubmissionResult(null)
    setSubmitError(null)
  }, [])

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1
  const isResultsStep = currentStep === 'results'

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Institution Setup
        </h1>
        <p className="text-lg text-gray-600">
          Complete the steps below to build your institutional profile.
        </p>
      </div>

      {/* Progress bar */}
      {!isResultsStep && (
        <div className="mb-8">
          <ProgressBar currentStep={currentStep} />
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
        {isResultsStep ? (
          <ResultsStep result={submissionResult} error={submitError} onReset={resetWizard} draft={draft} />
        ) : (
          <>
            <StepHeader step={currentStep} />

            {currentStep === 'identity' && (
              <IdentityStep draft={draft} update={update} />
            )}

            {currentStep === 'institution-type' && (
              <InstitutionTypeStep draft={draft} update={update} />
            )}

            {currentStep === 'research-focus' && (
              <ResearchFocusStep draft={draft} update={update} />
            )}

            {currentStep === 'locations' && (
              <LocationsStep draft={draft} update={update} />
            )}

            {currentStep === 'people' && (
              <PeopleStep draft={draft} update={update} />
            )}

            {currentStep === 'infrastructure' && (
              <InfrastructureStep draft={draft} update={update} />
            )}

            {currentStep === 'capabilities' && (
              <CapabilitiesStep draft={draft} update={update} />
            )}

            {currentStep === 'evidence' && (
              <EvidenceStep draft={draft} update={update} />
            )}

            {currentStep === 'review' && (
              <ReviewStep draft={draft} isSubmitting={isSubmitting} submitError={submitError} onSubmit={handleSubmit} />
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      {!isResultsStep && (
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                type="button"
                onClick={goBack}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveDraftManually}
              className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 text-sm transition-colors"
            >
              {savedIndicator ? '✓ Saved' : 'Save Draft'}
            </button>

            {currentStep === 'review' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit & Generate'}
              </button>
            ) : !isLastStep ? (
              <button
                type="button"
                onClick={goNext}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
              >
                Next →
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Step stepper navigation */}
      {!isResultsStep && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-0">
            {WIZARD_STEPS.filter((s) => s !== 'results').map((s, i) => (
              <div key={s} className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => goToStep(s)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    i === stepIndex
                      ? 'bg-blue-600 text-white shadow-md scale-110'
                      : i < stepIndex
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                  title={`Go to ${STEP_LABELS[s]}`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    i === stepIndex
                      ? 'bg-white text-blue-600'
                      : i < stepIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-500'
                  }`}>
                    {i < stepIndex ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                </button>
                {i < WIZARD_STEPS.filter((s) => s !== 'results').length - 1 && (
                  <div className={`w-6 h-0.5 ${
                    i < stepIndex ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================================================
// Progress Bar
// ==========================================================================

function ProgressBar({ currentStep }: { currentStep: WizardStep }) {
  const visibleSteps: WizardStep[] = WIZARD_STEPS.filter((s) => s !== 'results')
  const currentIdx = visibleSteps.indexOf(currentStep as WizardStep)
  const pct = currentIdx >= 0 ? Math.round(((currentIdx + 1) / visibleSteps.length) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Step {currentIdx >= 0 ? currentIdx + 1 : 1} of {visibleSteps.length}</span>
        <span>{STEP_LABELS[currentStep]}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ==========================================================================
// Step Header
// ==========================================================================

function StepHeader({ step }: { step: WizardStep }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{STEP_LABELS[step]}</h2>
      <p className="text-gray-500">{STEP_DESCRIPTIONS[step]}</p>
    </div>
  )
}

// ==========================================================================
// Step 1 — Identity
// ==========================================================================

function IdentityStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Institution Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={draft.identity_name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => update({ identity_name: e.target.value })}
          placeholder="e.g., Vilo Research Institute"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={draft.identity_description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update({ identity_description: e.target.value })}
          rows={4}
          placeholder="Briefly describe your institution, its mission, and what makes it unique..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">
          This description appears on your Passport and helps sponsors understand your institution.
        </p>
      </div>
    </div>
  )
}

// ==========================================================================
// Step 2 — Institution Type
// ==========================================================================

function InstitutionTypeStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Select the category that best describes your institution. This helps determine applicable readiness dimensions.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {INSTITUTION_TYPE_OPTIONS.map((type: InstitutionType) => {
          const selected = draft.institution_type === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => update({ institution_type: type })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{type}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================================================
// Step 3 — Research Focus
// ==========================================================================

function ResearchFocusStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const toggleTA = (ta: TherapeuticArea) => {
    const next = draft.research_therapeuticAreas.includes(ta)
      ? draft.research_therapeuticAreas.filter((t) => t !== ta)
      : [...draft.research_therapeuticAreas, ta]
    update({ research_therapeuticAreas: next })
  }

  const toggleModality = (m: ResearchModality) => {
    const next = draft.research_modalities.includes(m)
      ? draft.research_modalities.filter((t) => t !== m)
      : [...draft.research_modalities, m]
    update({ research_modalities: next })
  }

  return (
    <div className="space-y-8">
      {/* Therapeutic Areas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Therapeutic Areas</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select all therapeutic areas where your institution has research experience.
        </p>
        <div className="flex flex-wrap gap-2">
          {THERAPEUTIC_AREA_OPTIONS.map((ta: TherapeuticArea) => {
            const selected = draft.research_therapeuticAreas.includes(ta)
            return (
              <button
                key={ta}
                type="button"
                onClick={() => toggleTA(ta)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {ta}
              </button>
            )
          })}
        </div>
      </div>

      {/* Research Modalities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Modalities</h3>
        <p className="text-sm text-gray-500 mb-4">
          What types of research can your institution execute?
        </p>
        <div className="flex flex-wrap gap-2">
          {RESEARCH_MODALITY_OPTIONS.map((m: ResearchModality) => {
            const selected = draft.research_modalities.includes(m)
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleModality(m)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* Research Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Research Description</h3>
        <textarea
          value={draft.research_description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update({ research_description: e.target.value })}
          rows={3}
          placeholder="Describe your institution's research capabilities and focus areas..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
      </div>
    </div>
  )
}

// ==========================================================================
// Step 4 — Locations
// ==========================================================================

function LocationsStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const addLocation = () => {
    const newLoc: WizardLocation = {
      id: newId(),
      name: '',
      type: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zip: '',
      isPrimary: draft.locations.length === 0,
    }
    update({ locations: [...draft.locations, newLoc] })
  }

  const updateLocation = (id: string, patch: Partial<WizardLocation>) => {
    update({
      locations: draft.locations.map((loc) =>
        loc.id === id ? { ...loc, ...patch } : loc,
      ),
    })
  }

  const removeLocation = (id: string) => {
    if (draft.locations.length <= 1) return
    const next = draft.locations.filter((loc) => loc.id !== id)
    // If we removed the primary, make the first one primary
    if (!next.some((loc) => loc.isPrimary) && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true }
    }
    update({ locations: next })
  }

  const setPrimary = (id: string) => {
    update({
      locations: draft.locations.map((loc) => ({
        ...loc,
        isPrimary: loc.id === id,
      })),
    })
  }

  return (
    <div className="space-y-4">
      {draft.locations.map((loc, idx) => (
        <div key={loc.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                Location {idx + 1}
              </span>
              {loc.isPrimary && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Primary
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!loc.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPrimary(loc.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Set Primary
                </button>
              )}
              {draft.locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLocation(loc.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location Name</label>
              <input
                type="text"
                value={loc.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { name: e.target.value })}
                placeholder="e.g., Main Campus"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={loc.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateLocation(loc.id, { type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select Type</option>
                <option value="Headquarters">Headquarters</option>
                <option value="Clinical Site">Clinical Site</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Biobank">Biobank</option>
                <option value="Office">Office</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Street Address</label>
            <input
              type="text"
              value={loc.street}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { street: e.target.value })}
              placeholder="123 Research Blvd"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">City</label>
              <input
                type="text"
                value={loc.city}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">State / Province</label>
              <input
                type="text"
                value={loc.state}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { state: e.target.value })}
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country</label>
              <input
                type="text"
                value={loc.country}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { country: e.target.value })}
                placeholder="Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={loc.zip}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateLocation(loc.id, { zip: e.target.value })}
                placeholder="ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addLocation}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add Another Location
      </button>
    </div>
  )
}

// ==========================================================================
// Step 5 — People
// ==========================================================================

function PeopleStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const addPerson = () => {
    const newPerson: WizardPerson = {
      id: newId(),
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      isPI: draft.people.length === 0,
      yearsExperience: 0,
      therapeuticExpertise: [],
    }
    update({ people: [...draft.people, newPerson] })
  }

  const updatePerson = (id: string, patch: Partial<WizardPerson>) => {
    update({
      people: draft.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })
  }

  const removePerson = (id: string) => {
    update({ people: draft.people.filter((p) => p.id !== id) })
  }

  const ROLES = [
    'Principal Investigator',
    'Sub-Investigator',
    'Clinical Research Coordinator',
    'Data Manager',
    'Regulatory Specialist',
    'Laboratory Director',
    'Lab Technician',
    'Biobank Manager',
    'Project Manager',
    'Other',
  ]

  return (
    <div className="space-y-4">
      {draft.people.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-2">No team members added yet.</p>
          <p>Add key research personnel including your Principal Investigator.</p>
        </div>
      )}

      {draft.people.map((person, idx) => (
        <div key={person.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              Person {idx + 1}
              {person.isPI && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  Principal Investigator
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => removePerson(person.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">First Name</label>
              <input
                type="text"
                value={person.firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updatePerson(person.id, { firstName: e.target.value })}
                placeholder="First name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Last Name</label>
              <input
                type="text"
                value={person.lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updatePerson(person.id, { lastName: e.target.value })}
                placeholder="Last name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={person.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updatePerson(person.id, { email: e.target.value })}
                placeholder="email@institution.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select
                value={person.role}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updatePerson(person.id, { role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select Role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={person.isPI}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updatePerson(person.id, { isPI: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Principal Investigator</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Years Exp.</label>
              <input
                type="number"
                value={person.yearsExperience}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updatePerson(person.id, { yearsExperience: parseInt(e.target.value) || 0 })
                }
                min={0}
                max={60}
                className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addPerson}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add Team Member
      </button>
    </div>
  )
}

// ==========================================================================
// Step 6 — Infrastructure
// ==========================================================================

function InfrastructureStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const addInfra = () => {
    const newInfra: WizardInfrastructure = {
      id: newId(),
      facilityType: '',
      dedicatedResearchSpace: '',
      laboratoryPresent: false,
      labCertifications: [],
      equipmentTypes: [],
      backupPower: '',
      temperatureMonitoring: '',
      biospecimenOperations: [],
      storageEquipment: [],
    }
    update({ infrastructure: [...draft.infrastructure, newInfra] })
  }

  const updateInfra = (id: string, patch: Partial<WizardInfrastructure>) => {
    update({
      infrastructure: draft.infrastructure.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })
  }

  const removeInfra = (id: string) => {
    update({ infrastructure: draft.infrastructure.filter((i) => i.id !== id) })
  }

  const FACILITY_TYPES = [
    'Inpatient Unit',
    'Outpatient Clinic',
    'Dedicated Research Center',
    'Academic Medical Center',
    'Private Practice',
    'Mobile Research Unit',
    'Reference Laboratory',
    'Biorepository',
    'Other',
  ]

  const LAB_CERTS = ['CLIA', 'CAP', 'ISO 15189', 'GMP', 'GLP', 'FDA Registered', 'EMA Approved', 'None']

  const EQUIPMENT_TYPES = [
    'Centrifuge', 'Freezer (-20°C)', 'Freezer (-80°C)', 'LN2 Storage',
    'PCR Machine', 'Flow Cytometer', 'Sequencer', 'Mass Spectrometer',
    'HPLC', 'ELISA Reader', 'Microscope', 'Biosafety Cabinet',
  ]

  const BIOSPECIMEN_OPS = ['Collection', 'Processing', 'Storage', 'Shipping', 'None']

  const STORAGE_EQUIP = [
    '-20°C Freezer', '-80°C Freezer', '-150°C Freezer',
    'LN2 Dewar', 'LN2 Tank', 'Temperature-monitored fridge',
  ]

  return (
    <div className="space-y-4">
      {draft.infrastructure.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-2">No infrastructure entries added yet.</p>
          <p>Add your facilities, labs, and equipment details.</p>
        </div>
      )}

      {draft.infrastructure.map((infra, idx) => (
        <div key={infra.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Facility {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeInfra(infra.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Facility Type</label>
              <select
                value={infra.facilityType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateInfra(infra.id, { facilityType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select</option>
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Research Space</label>
              <input
                type="text"
                value={infra.dedicatedResearchSpace}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateInfra(infra.id, { dedicatedResearchSpace: e.target.value })}
                placeholder="e.g., 5,000 sq ft"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Backup Power</label>
              <select
                value={infra.backupPower}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateInfra(infra.id, { backupPower: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select</option>
                <option value="None">None</option>
                <option value="UPS only">UPS Only</option>
                <option value="Generator only">Generator Only</option>
                <option value="Generator + UPS">Generator + UPS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Temperature Monitoring</label>
              <select
                value={infra.temperatureMonitoring}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateInfra(infra.id, { temperatureMonitoring: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select</option>
                <option value="None">None</option>
                <option value="Manual logging">Manual Logging</option>
                <option value="Continuous logging">Continuous Logging</option>
                <option value="Continuous logging with alarms">With Alarms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
              <input
                type="checkbox"
                checked={infra.laboratoryPresent}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateInfra(infra.id, { laboratoryPresent: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Laboratory Present</span>
            </label>
          </div>

          {/* Lab Certifications */}
          {infra.laboratoryPresent && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lab Certifications</label>
              <div className="flex flex-wrap gap-1.5">
                {LAB_CERTS.map((cert) => {
                  const sel = infra.labCertifications.includes(cert)
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => {
                        const next = sel
                          ? infra.labCertifications.filter((c) => c !== cert)
                          : [...infra.labCertifications, cert]
                        updateInfra(infra.id, { labCertifications: next })
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        sel
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {cert}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Equipment */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Equipment</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_TYPES.map((eq) => {
                const sel = infra.equipmentTypes.includes(eq)
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const next = sel
                        ? infra.equipmentTypes.filter((e) => e !== eq)
                        : [...infra.equipmentTypes, eq]
                      updateInfra(infra.id, { equipmentTypes: next })
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sel
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {eq}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Biospecimen Ops */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Biospecimen Operations</label>
            <div className="flex flex-wrap gap-1.5">
              {BIOSPECIMEN_OPS.map((op) => {
                const sel = infra.biospecimenOperations.includes(op)
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => {
                      const next = sel
                        ? infra.biospecimenOperations.filter((o) => o !== op)
                        : [...infra.biospecimenOperations, op]
                      updateInfra(infra.id, { biospecimenOperations: next })
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sel
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {op}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Storage */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Storage Equipment</label>
            <div className="flex flex-wrap gap-1.5">
              {STORAGE_EQUIP.map((se) => {
                const sel = infra.storageEquipment.includes(se)
                return (
                  <button
                    key={se}
                    type="button"
                    onClick={() => {
                      const next = sel
                        ? infra.storageEquipment.filter((s) => s !== se)
                        : [...infra.storageEquipment, se]
                      updateInfra(infra.id, { storageEquipment: next })
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sel
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {se}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addInfra}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add Infrastructure Entry
      </button>
    </div>
  )
}

// ==========================================================================
// Step 7 — Capabilities
// ==========================================================================

function CapabilitiesStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const addCap = () => {
    const newCap: WizardCapability = {
      id: newId(),
      name: '',
      description: '',
      confidence: 'Medium',
    }
    update({ capabilities: [...draft.capabilities, newCap] })
  }

  const updateCap = (id: string, patch: Partial<WizardCapability>) => {
    update({
      capabilities: draft.capabilities.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const removeCap = (id: string) => {
    update({ capabilities: draft.capabilities.filter((c) => c.id !== id) })
  }

  const CONFIDENCE_LEVELS: WizardCapability['confidence'][] = ['High', 'Medium', 'Low']

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Declare your institution&apos;s core capabilities. Each capability will be associated with evidence you provide.
      </p>

      {draft.capabilities.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No capabilities declared yet. Add your first capability.</p>
        </div>
      )}

      {draft.capabilities.map((cap, idx) => (
        <div key={cap.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Capability {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeCap(cap.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Capability Name</label>
              <input
                type="text"
                value={cap.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateCap(cap.id, { name: e.target.value })}
                placeholder="e.g., Phase II Oncology Trials"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Confidence Level</label>
              <div className="flex gap-1.5">
                {CONFIDENCE_LEVELS.map((level) => {
                  const sel = cap.confidence === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateCap(cap.id, { confidence: level })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        sel
                          ? level === 'High'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : level === 'Medium'
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              value={cap.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateCap(cap.id, { description: e.target.value })}
              rows={2}
              placeholder="Describe this capability and the evidence that supports it..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCap}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add Capability
      </button>
    </div>
  )
}

// ==========================================================================
// Step 8 — Evidence (Document Upload)
// ==========================================================================

function EvidenceStep({
  draft,
  update,
}: {
  draft: WizardDraft
  update: (patch: Partial<WizardDraft>) => void
}) {
  const addDoc = () => {
    const newDoc: WizardDocument = {
      id: newId(),
      label: '',
      type: '',
      uploaded: false,
    }
    update({ documents: [...draft.documents, newDoc] })
  }

  const updateDoc = (id: string, patch: Partial<WizardDocument>) => {
    update({
      documents: draft.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })
  }

  const removeDoc = (id: string) => {
    update({ documents: draft.documents.filter((d) => d.id !== id) })
  }

  const handleFileUpload = (docId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    updateDoc(docId, {
      fileName: file.name,
      fileSize: file.size,
      uploaded: true,
    })
  }

  const DOC_TYPES = [
    'Certification',
    'License',
    'SOP',
    'Quality Manual',
    'CV / Resume',
    'Protocol',
    'Audit Report',
    'Inspection Report',
    'Equipment Validation',
    'Training Record',
    'Contract',
    'Other',
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Upload documents that provide evidence for your claims and capabilities.
        Each document strengthens your institutional profile.
      </p>

      {draft.documents.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No documents added yet. Upload supporting evidence.</p>
        </div>
      )}

      {draft.documents.map((doc, idx) => (
        <div key={doc.id} className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Document {idx + 1}</span>
              {doc.uploaded && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeDoc(doc.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Document Label</label>
              <input
                type="text"
                value={doc.label}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateDoc(doc.id, { label: e.target.value })}
                placeholder="e.g., CLIA Certificate 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Document Type</label>
              <select
                value={doc.type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => updateDoc(doc.id, { type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select Type</option>
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">File Upload</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                <span>{doc.fileName || 'Choose File'}</span>
                <input
                  type="file"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileUpload(doc.id, e)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.txt"
                />
              </label>
              {doc.fileSize && (
                <span className="text-xs text-gray-400">
                  {(doc.fileSize / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addDoc}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors"
      >
        + Add Document
      </button>
    </div>
  )
}

// ==========================================================================
// Step 9 — Review & Submit
// ==========================================================================

function ReviewStep({
  draft,
  isSubmitting,
  submitError,
  onSubmit,
}: {
  draft: WizardDraft
  isSubmitting: boolean
  submitError: string | null
  onSubmit: () => void
}) {
  const sections = [
    {
      title: 'Identity',
      step: 'identity' as WizardStep,
      items: [
        { label: 'Name', value: draft.identity_name || '(not set)' },
        { label: 'Description', value: draft.identity_description || '(not set)' },
      ],
    },
    {
      title: 'Institution Type',
      step: 'institution-type' as WizardStep,
      items: [
        { label: 'Type', value: draft.institution_type || '(not set)' },
      ],
    },
    {
      title: 'Research Focus',
      step: 'research-focus' as WizardStep,
      items: [
        { label: 'Therapeutic Areas', value: draft.research_therapeuticAreas.length > 0 ? draft.research_therapeuticAreas.join(', ') : '(none)' },
        { label: 'Modalities', value: draft.research_modalities.length > 0 ? draft.research_modalities.join(', ') : '(none)' },
      ],
    },
    {
      title: 'Locations',
      step: 'locations' as WizardStep,
      items: [
        { label: 'Count', value: `${draft.locations.length} location(s)` },
      ],
    },
    {
      title: 'People',
      step: 'people' as WizardStep,
      items: [
        { label: 'Team Size', value: `${draft.people.length} member(s)` },
      ],
    },
    {
      title: 'Infrastructure',
      step: 'infrastructure' as WizardStep,
      items: [
        { label: 'Facilities', value: `${draft.infrastructure.length} entry(ies)` },
      ],
    },
    {
      title: 'Capabilities',
      step: 'capabilities' as WizardStep,
      items: [
        { label: 'Declared', value: `${draft.capabilities.length} capability(ies)` },
      ],
    },
    {
      title: 'Documents',
      step: 'evidence' as WizardStep,
      items: [
        { label: 'Uploaded', value: `${draft.documents.filter((d) => d.uploaded).length} of ${draft.documents.length}` },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Review your institution details before submitting. After submission, your Capability Portfolio,
        Readiness Assessment, and Institution Passport will be generated.
      </p>

      {/* Summary cards */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              <a
                href={`#step-${section.step}`}
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={(e) => {
                  e.preventDefault()
                  // Navigate to step — we call it via the parent but we don't have access to goToStep here
                  // We'll use a simple approach: scroll to section
                }}
              >
                Edit
              </a>
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${
                    item.value.includes('(not set)') || item.value.includes('(none)')
                      ? 'text-red-500'
                      : 'text-gray-700'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {submitError}
        </div>
      )}

      {/* Submit Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
        <strong>Important:</strong> Submitting will create your institution record and
        generate your Capability Portfolio, Readiness Assessment, and Institution Passport.
        You can update these later from your workspace.
      </div>
    </div>
  )
}

// ==========================================================================
// Step 10 — Results
// ==========================================================================

function ResultsStep({
  result,
  error,
  draft,
  onReset,
}: {
  result: SubmissionResult | null
  error: string | null
  draft: WizardDraft
  onReset: () => void
}) {
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Submission Failed</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Loading Results...</h2>
        <p className="text-gray-500">Generating your institution profile.</p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const { institution, readiness, passport } = result

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Institution Created!</h2>
        <p className="text-green-700">
          Your institutional profile has been created. Below are your three products.
        </p>
      </div>

      {/* 1. Institution Identity */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          🏛️ Institution Profile
        </h3>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{' '}
            <span className="font-medium text-gray-900">{institution.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>{' '}
            <span className="font-medium text-gray-900">{institution.type}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Description:</span>{' '}
            <span className="text-gray-700">{institution.description}</span>
          </div>
        </div>
      </div>

      {/* 2. Readiness */}
      {readiness?.data ? (
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            📊 Readiness Assessment
          </h3>
          <div className="flex items-center gap-3 mt-4 mb-4">
            <div className="text-4xl font-bold text-blue-700">
              {readiness.data.dimensions?.length ?? 0}
            </div>
            <div className="text-sm text-gray-500">Dimensions Assessed</div>
          </div>
          <div className="space-y-2">
            {readiness.data.dimensions?.map((dim) => (
              <div key={dim.dimension}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-gray-700">{dim.label}</span>
                  <span className="text-gray-500">{dim.score}/{dim.max_score}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${dim.max_score > 0 ? (dim.score / dim.max_score) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-400">
          Readiness assessment will be available shortly after data processing.
        </div>
      )}

      {/* 3. Passport Preview */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          📋 Institution Passport — Preview
        </h3>
        {passport?.data ? (
          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <span className="text-gray-500">Capabilities:</span>{' '}
              <span className="font-medium text-gray-900">{passport.data.capabilities?.length ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Members:</span>{' '}
              <span className="font-medium text-gray-900">{passport.data.members_count ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Locations:</span>{' '}
              <span className="font-medium text-gray-900">{passport.data.locations_count ?? 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Evidence Items:</span>{' '}
              <span className="font-medium text-gray-900">{passport.data.evidence_count ?? 0}</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-4">
            Passport will be available shortly after data processing.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <a
          href="/workspace"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
        >
          Go to Workspace →
        </a>
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
        >
          Start New Onboarding
        </button>
      </div>
    </div>
  )
}
