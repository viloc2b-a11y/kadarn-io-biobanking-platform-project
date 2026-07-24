'use client'

import { type ReactNode } from 'react'
import { useOnboarding, useDerivedReadModel, useCompletionGate } from '@/lib/onboarding/onboarding-context'
import { useState } from 'react'
import { COMPLETION_STATUS_LABELS } from '@/lib/onboarding/completion-gate'
import type { PassportData, PassportDocument } from '@/lib/passport/passport-assembler'
import { normalizeLocations, type InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import { deriveStudyExperienceClaims, deriveHistoricalPerformanceSignals, COMPONENT_LABELS, type StudyExperienceRecord } from '@/lib/onboarding/study-experience-record'

export default function PassportPage() {
  const { state, completeOnboarding, onboardingCompleted } = useOnboarding()
  const passport = useDerivedReadModel()
  const completion = useCompletionGate()

  const isReady = completion.status === 'READY_FOR_PASSPORT' || completion.status === 'PASSPORT_GENERATED'
  const isDraft = completion.canGenerateDraftPassport && !isReady
  const statusLabel = COMPLETION_STATUS_LABELS[completion.status]

  const { institution, evidence, capabilities, readiness, nextSteps } = passport
  const locations = Array.isArray(state.answers['org_locations'])
    ? normalizeLocations(state.answers['org_locations'] as InstitutionalLocation[])
    : []
  const activeEvidence = evidence.documents.filter(isCurrentEvidence)
  const criticalDocuments = evidence.documents.filter((document) => document.evidenceClass === 'A' || document.evidenceClass === 'B')
  const validCertifications = [
    ...institution.team.certifications,
    ...activeEvidence.filter((document) => document.type === 'certification' || document.type === 'training').map((document) => document.label),
  ]
  const activeLicenses = activeEvidence.filter((document) => document.type === 'license').map((document) => document.label)
  const capabilityGaps = capabilities.flatMap((capability) =>
    capability.supportingEvidence
      .filter((evidenceItem) => evidenceItem.impact === 'negative' || capability.level === 'Not available')
      .map((evidenceItem) => `${capability.name}: ${evidenceItem.description}`)
  )
  const readinessGaps = readiness.dimensions.flatMap((dimension) =>
    dimension.contributions
      .filter((contribution) => contribution.impact === 'negative')
      .map((contribution) => `${dimension.name}: ${contribution.description}`)
  )
  const missingDocuments = evidence.documents.filter((document) => document.status === 'missing')
  const expiringDocuments = evidence.documents.filter((document) => document.status === 'expiring_soon' || document.status === 'expired')

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Passport Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 text-white mb-8">
        <div className="text-sm text-blue-200 uppercase tracking-wide mb-1">Current Institution Passport</div>
        <h1 className="text-3xl font-bold mb-1">{institution.name}</h1>
        <p className="text-blue-200">
          Who is this institution today, and what can it currently demonstrate?
        </p>
        <p className="text-sm text-blue-100 mt-3 max-w-2xl">
          This Passport is a present-time snapshot for sponsors and partners. Historical milestones stay in Institutional Memory.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">{institution.type}</span>
          {institution.primaryLocation && <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">{institution.primaryLocation}</span>}
          {institution.therapeuticAreas.slice(0, 4).map((ta) => (
            <span key={ta} className="px-3 py-1 bg-blue-600 rounded-full text-sm">{ta}</span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-blue-300 mt-4">
          <span>Snapshot generated {new Date(passport.generatedAt).toLocaleDateString()}</span>
          <a href="/onboarding/memory" className="text-blue-100 underline">View Institutional Memory</a>
        </div>
      </div>

      {/* Section 1: Who We Are */}
      <SectionCard number={1} title="Who We Are" color="blue">
        <p className="text-sm text-gray-500 mb-5">Current identity and operating profile.</p>
        <div className="grid grid-cols-2 gap-6">
          <InfoBlock title="Identity" content={`${institution.name}. ${institution.mission || 'Mission not specified.'}`} />
          <InfoBlock title="Institution Type" content={institution.type} />
          <InfoBlock title="Locations" content={locations.length > 0 ? locations.map((location) => [location.name, location.city, location.state].filter(Boolean).join(' · ')).join('; ') : institution.primaryLocation || 'Not specified'} />
          <InfoBlock title="Team Summary" content={`Primary PI: ${institution.team.piName || 'Not specified'}. ${institution.team.totalTeam} current team member(s). Roles: ${institution.team.roles.join(', ') || 'Not specified'}.`} />
          <InfoBlock title="Languages" content={institution.languages.join(', ') || 'Not specified'} />
          <InfoBlock title="Research Focus" content={institution.researchFocus.join(', ') || institution.therapeuticAreas.join(', ') || 'Not specified'} />
        </div>
      </SectionCard>

      {/* Section 2: What We Can Prove */}
      <SectionCard number={2} title="What We Can Prove" color="green">
        <p className="text-sm text-gray-500 mb-5">Current active evidence, critical documents, valid certifications, active licenses, and supporting proof.</p>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{activeEvidence.length}</div>
            <div className="text-xs text-gray-500">current evidence item(s)</div>
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${evidence.coverageScore}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-700">{evidence.coverageScore}%</span>
        </div>

        <SnapshotGrid>
          <ListBlock title="Current Active Evidence" items={activeEvidence.map((document) => `${document.label} · ${document.proves.join(', ')}`)} empty="No active evidence uploaded yet." />
          <ListBlock title="Critical Documents" items={criticalDocuments.map((document) => `${document.label} · ${formatDocumentStatus(document.status)}`)} empty="No critical document templates available." />
          <ListBlock title="Valid Certifications" items={Array.from(new Set(validCertifications))} empty="No valid certifications captured yet." />
          <ListBlock title="Active Licenses" items={activeLicenses} empty="No active licenses captured yet." />
        </SnapshotGrid>

        <div className="space-y-2 mt-5">
          {evidence.documents.slice(0, 8).map((doc) => <DocumentRow key={doc.label} document={doc} />)}
        </div>
      </SectionCard>

      {/* Section 3: What We Can Do */}
      <SectionCard number={3} title="What We Can Do" color="purple">
        <p className="text-sm text-gray-500 mb-5">Current capabilities with strength, supporting evidence, and missing evidence.</p>
        <div className="grid grid-cols-2 gap-3">
          {capabilities.map((cap) => (
            <div key={cap.name} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-sm font-medium text-gray-800">{cap.name}</div>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                  cap.level === 'Strong' ? 'bg-green-100 text-green-700' :
                  cap.level === 'Moderate' ? 'bg-blue-100 text-blue-700' :
                  cap.level === 'Available' ? 'bg-gray-100 text-gray-600' :
                  'bg-red-50 text-red-400'
                }`}>{cap.level}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{cap.evidence}</p>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Supporting Evidence</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  {cap.supportingEvidence.filter((item) => item.impact === 'positive').slice(0, 3).map((item) => (
                    <li key={`${cap.name}-${item.label}`}>✓ {item.label}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Missing Evidence</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  {cap.supportingEvidence.filter((item) => item.impact === 'negative').slice(0, 2).map((item) => (
                    <li key={`${cap.name}-${item.label}`}>• {item.description}</li>
                  ))}
                  {cap.supportingEvidence.every((item) => item.impact !== 'negative') && <li>No major missing evidence identified.</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Section 4: How Ready We Are */}
      <SectionCard number={4} title="How Ready We Are" color="amber">
        <p className="text-sm text-gray-500 mb-5">Current readiness profile, domain readiness, gaps, and programs currently supportable.</p>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-blue-700">{readiness.overallScore}<span className="text-xl text-blue-400">/100</span></div>
          <div className="text-sm text-gray-500 mt-1">Current Program Readiness</div>
        </div>

        <div className="space-y-3 mb-6">
          {readiness.dimensions.map((dim) => (
            <div key={dim.name} className="flex items-center gap-3">
              <span className="w-32 text-sm text-gray-600 flex-shrink-0">{dim.name}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full">
                <div className={`h-full rounded-full ${dim.score >= 70 ? 'bg-green-500' : dim.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dim.score}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-700 w-10 text-right">{dim.score}</span>
            </div>
          ))}
        </div>

        {readiness.eligiblePrograms.length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 mb-3">
            <div className="text-xs font-semibold text-green-700 uppercase mb-2">Programs Currently Supportable</div>
            <div className="flex flex-wrap gap-1">
              {readiness.eligiblePrograms.map((p) => (
                <span key={p} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}
        {readiness.partialPrograms.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-700 uppercase mb-2">Partially Supportable Programs</div>
            <div className="flex flex-wrap gap-1">
              {readiness.partialPrograms.map((p) => (
                <span key={p} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">{p}</span>
              ))}
            </div>
          </div>
        )}
        {readinessGaps.length > 0 && (
          <ListBlock title="Current Readiness Gaps" items={readinessGaps.slice(0, 5)} empty="No readiness gaps identified." />
        )}
      </SectionCard>

      {/* KTP-1.3: Sponsor-Facing Hybrid Trial Readiness Package */}
          {readiness.programTypeReadiness && readiness.programTypeReadiness.length > 0 && (
            <SectionCard number={4.5} title="Hybrid Trial Readiness" color="teal">
              <p className="text-sm text-gray-500 mb-5">
                Based on available evidence and onboarding answers. This assessment reflects current documented capabilities.
                It does not certify or guarantee future performance. Sponsors should verify critical claims independently.
              </p>

              {readiness.programTypeReadiness.map((ht) => {
                const mandatoryMet = ht.capabilities.filter(c => c.isMandatory && c.met).length
                const mandatoryTotal = ht.capabilities.filter(c => c.isMandatory).length
                const naCount = ht.capabilities.filter(c => c.achievedConfidence === 1.0 && !c.met).length
                const declaredCount = ht.capabilities.filter(c => c.achievedConfidence <= 0.40 && c.achievedConfidence > 0).length
                const supportedCount = ht.capabilities.filter(c => c.met).length
                const criticalNames = ['Site-Based Execution', 'Hybrid Data Integrity', 'At-Home Coordination', 'Biospecimen-at-Home', 'Safety Escalation']

                return (
                  <div key={ht.programTypeKey}>

                    {/* Executive Summary */}
                    <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-6 text-white mb-6">
                      <div className="text-sm text-teal-200 uppercase tracking-wide mb-1">Hybrid Trial Readiness Package</div>
                      <div className="flex items-end gap-6 mt-3">
                        <div>
                          <div className="text-4xl font-bold">{Math.round(ht.overallConfidence * 100)}%</div>
                          <div className="text-teal-200 text-sm">Overall Confidence</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold">Status: {ht.readinessStatus.replace(/_/g, ' ')}</div>
                          <div className="text-teal-200 text-sm mt-1">
                            {mandatoryMet} of {mandatoryTotal} mandatory met
                            {naCount > 0 ? ' \u00b7 ' + naCount + ' not applicable' : ''}
                            {declaredCount > 0 ? ' \u00b7 ' + declaredCount + ' self-declared' : ''}
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-teal-600 text-teal-100">Based on onboarding answers</span>
                      </div>
                    </div>

                    {/* Decision Guidance */}
                    <div className="p-4 rounded-lg mb-6" style={{
                      backgroundColor: ht.readinessStatus === 'ready' ? '#f0fdf4' : ht.readinessStatus === 'conditionally_ready' ? '#fffbeb' : '#fef2f2',
                      border: '1px solid ' + (ht.readinessStatus === 'ready' ? '#bbf7d0' : ht.readinessStatus === 'conditionally_ready' ? '#fde68a' : '#fecaca'),
                    }}>
                      <div className="text-sm font-semibold mb-2" style={{
                        color: ht.readinessStatus === 'ready' ? '#166534' : ht.readinessStatus === 'conditionally_ready' ? '#92400e' : '#991b1b',
                      }}>
                        {ht.readinessStatus === 'ready' ? 'Suitable for Hybrid Trial Participation' :
                         ht.readinessStatus === 'conditionally_ready' ? 'Conditionally Suitable \u2014 Verify Critical Claims' :
                         'Not Ready \u2014 Significant Evidence Gaps'}
                      </div>
                      <p className="text-xs" style={{
                        color: ht.readinessStatus === 'ready' ? '#166534' : ht.readinessStatus === 'conditionally_ready' ? '#92400e' : '#991b1b',
                      }}>
                        {ht.readinessStatus === 'ready'
                          ? 'This institution has demonstrated evidence across mandatory hybrid trial dimensions. Sponsor due diligence is still required for protocol-specific qualification.'
                          : ht.readinessStatus === 'conditionally_ready'
                          ? 'This institution meets core requirements but has gaps in optional or supporting capabilities. Review critical claims below before proceeding.'
                          : 'This institution has insufficient evidence for hybrid trial participation. Address the gaps below or request additional documentation.'}
                      </p>
                    </div>

                    {/* Critical Claims for Sponsor Review */}
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Critical Claims for Sponsor Review</div>
                      <div className="space-y-2">
                        {ht.capabilities.filter(c => criticalNames.includes(c.capabilityTypeName)).map((cap) => {
                          const isMet = cap.met
                          const confPct = Math.round(cap.achievedConfidence * 100)
                          return (
                            <div key={cap.capabilityTypeKey} className="flex items-center justify-between p-3 rounded-lg border" style={{
                              borderColor: isMet ? '#bbf7d0' : '#fecaca',
                              backgroundColor: isMet ? '#f0fdf4' : '#fef2f2',
                            }}>
                              <div className="flex items-center gap-2">
                                <span>{isMet ? '\u2713' : '\u2717'}</span>
                                <span className="text-sm font-medium">{cap.capabilityTypeName}</span>
                                {cap.isMandatory && <span className="text-xs text-gray-400">(required)</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                                  <div className="h-full rounded-full" style={{ width: confPct + '%', backgroundColor: isMet ? '#16a34a' : '#dc2626' }} />
                                </div>
                                <span className="text-xs font-medium">{confPct}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* All Claims (collapsible) */}
                    <details className="mb-4">
                      <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                        All 10 Capabilities ({supportedCount} supported)
                      </summary>
                      <div className="space-y-1.5 mt-3">
                        {ht.capabilities.map((cap) => {
                          const isNA = cap.achievedConfidence === 1.0 && !cap.met
                          const isUnk = cap.achievedConfidence === 0 && !cap.met
                          const isDec = cap.achievedConfidence <= 0.40 && cap.achievedConfidence > 0
                          const isPar = cap.achievedConfidence > 0.40 && cap.achievedConfidence <= 0.65
                          let label = isNA ? 'N/A' : isUnk ? 'Not answered' : isDec ? 'Declared only' : isPar ? 'Partially supported' : cap.met ? 'Supported' : 'Needs evidence'
                          let clr = isNA || isUnk ? '#6b7280' : isDec ? '#92400e' : isPar ? '#1e40af' : cap.met ? '#166534' : '#6b7280'
                          return (
                            <div key={cap.capabilityTypeKey} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-gray-50">
                              <span className="text-gray-700">{cap.capabilityTypeName}{cap.isMandatory ? ' *' : ''}</span>
                              <span className="font-medium" style={{ color: clr }}>{label} ({Math.round(cap.achievedConfidence * 100)}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </details>

                    {/* Known Limitations */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Known Limitations</div>
                      <ul className="space-y-1 text-xs text-gray-500">
                        <li>\u2022 Evaluation based on onboarding answers \u2014 evidence nodes not persisted in database.</li>
                        <li>\u2022 Self-declared claims (Declared only) are capped at 40% confidence. Request supporting documents.</li>
                        <li>\u2022 This assessment does not replace sponsor qualification or protocol-specific due diligence.</li>
                        <li>\u2022 Historical experience claims require ClinicalTrials.gov records or sponsor references.</li>
                        {ht.evidenceGaps && ht.evidenceGaps.length > 0 && (
                          <li>{'\\u2022'} {ht.evidenceGaps.length} evidence gap(s) identified.</li>
                        )}
                      </ul>
                    </div>

                    {/* Site-Facing Improvement Actions */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-700 uppercase mb-2">Improvement Actions</div>
                      <ul className="space-y-1 text-xs text-blue-600">
                        {mandatoryMet < mandatoryTotal && (
                          <li>{'\\u2022'} Complete {mandatoryTotal - mandatoryMet} remaining mandatory claim(s).</li>
                        )}
                        {declaredCount > 0 && (
                          <li>{'\\u2022'} Upload documents for {declaredCount} self-declared claim(s).</li>
                        )}
                        <li>\u2022 Upload SOPs, certifications, and workflow documentation in the Documents section.</li>
                        <li>\u2022 Hybrid trial experience can be documented via ClinicalTrials.gov references.</li>
                      </ul>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      {ht.verifiableVia}
                    </div>
                  </div>
                )
              })}
            </SectionCard>
          )}

{/* KTP-1.4: Study Experience Evidence Section */}
          {(() => {
            const studies: StudyExperienceRecord[] = Array.isArray(state.answers['study_experience_records'])
              ? (state.answers['study_experience_records'] as StudyExperienceRecord[])
              : []
            if (studies.length === 0) return null
            const claims = deriveStudyExperienceClaims(studies)
            const withNCT = studies.filter(s => s.clinicaltrialsGovNct).length
            const withDocs = studies.filter(s => s.documents.some(d => d.isUploaded)).length
            const withEnrollment = studies.filter(s => s.enrollmentEnrolledReported !== null || s.enrollmentCompletedReported !== null).length
            const withExternal = studies.filter(s => s.evidenceStatus.site_participation === 'EXTERNALLY_CORROBORATED').length

            return (
              <SectionCard number={4.6} title="Study Experience Evidence" color="indigo">
                <p className="text-sm text-gray-500 mb-5">
                  Study participation history with evidence classification per component.
                  Enrollment is self-reported by default. External corroboration requires sponsor/CRO confirmation.
                </p>

                <div className="grid grid-cols-4 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-800">{studies.length}</div>
                    <div className="text-xs text-gray-500">studies recorded</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-700">{withNCT}</div>
                    <div className="text-xs text-amber-600">with NCT anchor</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">{withDocs}</div>
                    <div className="text-xs text-blue-600">with documents</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">{withExternal}</div>
                    <div className="text-xs text-green-600">externally corroborated</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {claims.map(c => (
                    <span key={c.claimId} className="px-2 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: c.evidenceStatus === 'EXTERNALLY_CORROBORATED' ? '#dcfce7' :
                        c.evidenceStatus === 'DOCUMENT_SUPPORTED' ? '#dbeafe' :
                        c.evidenceStatus === 'ANCHORED' ? '#fef3c7' :
                        c.evidenceStatus === 'SELF_REPORTED' ? '#ffedd5' : '#f3f4f6',
                      color: c.evidenceStatus === 'EXTERNALLY_CORROBORATED' ? '#166534' :
                        c.evidenceStatus === 'DOCUMENT_SUPPORTED' ? '#1e40af' :
                        c.evidenceStatus === 'ANCHORED' ? '#92400e' :
                        c.evidenceStatus === 'SELF_REPORTED' ? '#9a3412' : '#6b7280',
                    }}>
                      {COMPONENT_LABELS[c.evidenceStatus]}: {c.claimLabel} ({c.studyCount})
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  {studies.slice(0, 10).map(s => {
                    const es = s.evidenceStatus
                    const hasEnrollment = s.enrollmentEnrolledReported !== null || s.enrollmentCompletedReported !== null
                    const badges = []
                    if (es.study_existence === 'ANCHORED') badges.push('NCT anchored')
                    if (es.site_irb_approval === 'DOCUMENT_SUPPORTED') badges.push('IRB letter')
                    if (es.operational_execution === 'DOCUMENT_SUPPORTED') badges.push('Activation/Closeout')
                    if (es.site_participation === 'EXTERNALLY_CORROBORATED') badges.push('Sponsor-confirmed')
                    if (es.enrollment_performance === 'EXTERNALLY_CORROBORATED') badges.push('Enrollment corroborated')
                    else if (es.enrollment_performance === 'DOCUMENT_SUPPORTED') badges.push('Enrollment documented')
                    else if (es.enrollment_performance === 'SELF_REPORTED') badges.push('Enrollment self-reported')
                    if (es.biospecimen_handling === 'DOCUMENT_SUPPORTED') badges.push('Biospecimen evidence')

                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">{s.studyTitle || 'Untitled Study'}</div>
                          <div className="text-gray-500">
                            {s.protocolNumber && <span>{s.protocolNumber}</span>}
                            {s.clinicaltrialsGovNct && <span className="ml-2">NCT: {s.clinicaltrialsGovNct}</span>}
                            {s.sponsorName && <span className="ml-2">{s.sponsorName}</span>}
                            {s.phase && <span className="ml-2">{s.phase}</span>}
                          </div>
                          {hasEnrollment && (
                            <div className="text-gray-400 mt-0.5">
                              Enrolled: {s.enrollmentEnrolledReported ?? '-'} / Completed: {s.enrollmentCompletedReported ?? '-'}
                              {s.enrollmentTarget ? ' (target: ' + s.enrollmentTarget + ')' : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 flex-shrink-0 ml-3 max-w-[220px] justify-end">
                          {badges.length === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">No evidence</span>
                          ) : (
                            badges.slice(0, 3).map((b, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px]" style={{
                                backgroundColor: b.includes('NCT') ? '#fef3c7' :
                                  b.includes('Sponsor') || b.includes('corroborated') ? '#dcfce7' :
                                  b.includes('self-reported') ? '#ffedd5' : '#dbeafe',
                                color: b.includes('NCT') ? '#92400e' :
                                  b.includes('Sponsor') || b.includes('corroborated') ? '#166534' :
                                  b.includes('self-reported') ? '#9a3412' : '#1e40af',
                              }}>{b}</span>
                            ))
                          )}
                          {badges.length > 3 && <span className="text-gray-400 text-[10px]">+{badges.length - 3}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {withEnrollment > 0 && (
                  <div className="mt-3 text-xs text-gray-400">
                    Enrollment data is self-reported unless marked as document-supported or externally corroborated.
                  </div>
                )}
              
                {/* Historical Performance Signals */}
                {(() => {
                  const sigs = deriveHistoricalPerformanceSignals(studies)
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Historical Performance Signals</div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Complexity Tier</div>
                          <div className="text-sm font-semibold text-gray-800">{sigs.studyComplexityTier}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Biospecimen Intensity</div>
                          <div className="text-sm font-semibold text-gray-800">{sigs.biospecimenIntensityTier}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500">Enrollment Band</div>
                          <div className="text-sm font-semibold text-gray-800">{sigs.enrollmentOutcomeBand.replace(/_/g, ' ')}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500">Startup Evidence</div>
                          <div className="text-xs font-medium" style={{
                            color: sigs.startupEvidenceStatus === 'externally_corroborated' ? '#166534' :
                              sigs.startupEvidenceStatus === 'document_supported' ? '#1e40af' :
                              sigs.startupEvidenceStatus === 'partial' ? '#92400e' : '#6b7280',
                          }}>{sigs.startupEvidenceStatus.replace(/_/g, ' ')}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500">Site Role Certainty</div>
                          <div className="text-xs font-medium" style={{
                            color: sigs.siteRoleCertainty === 'externally_corroborated' ? '#166534' :
                              sigs.siteRoleCertainty === 'document_supported' ? '#1e40af' :
                              sigs.siteRoleCertainty === 'anchored' ? '#92400e' : '#9a3412',
                          }}>{sigs.siteRoleCertainty.replace(/_/g, ' ')}</div>
                        </div>
                      </div>

                      {sigs.therapeuticAreaExperience.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Therapeutic Areas</div>
                          <div className="flex flex-wrap gap-1">
                            {sigs.therapeuticAreaExperience.slice(0, 6).map(ta => (
                              <span key={ta.area} className="px-2 py-0.5 rounded-full text-xs" style={{
                                backgroundColor: ta.evidenceBasis === 'EXTERNALLY_CORROBORATED' ? '#dcfce7' :
                                  ta.evidenceBasis === 'DOCUMENT_SUPPORTED' ? '#dbeafe' : '#ffedd5',
                                color: ta.evidenceBasis === 'EXTERNALLY_CORROBORATED' ? '#166534' :
                                  ta.evidenceBasis === 'DOCUMENT_SUPPORTED' ? '#1e40af' : '#9a3412',
                              }}>{ta.area} ({ta.studyCount})</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sigs.phaseExperience.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Phase Experience</div>
                          <div className="flex flex-wrap gap-1">
                            {sigs.phaseExperience.map(p => (
                              <span key={p.phase} className="px-2 py-0.5 rounded-full text-xs" style={{
                                backgroundColor: p.evidenceBasis === 'EXTERNALLY_CORROBORATED' ? '#dcfce7' :
                                  p.evidenceBasis === 'DOCUMENT_SUPPORTED' ? '#dbeafe' : '#ffedd5',
                                color: p.evidenceBasis === 'EXTERNALLY_CORROBORATED' ? '#166534' :
                                  p.evidenceBasis === 'DOCUMENT_SUPPORTED' ? '#1e40af' : '#9a3412',
                              }}>{p.phase} ({p.studyCount})</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {sigs.executionPatternTags.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Execution Patterns</div>
                          <div className="flex flex-wrap gap-1">
                            {sigs.executionPatternTags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{tag.replace(/_/g, ' ')}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-semibold text-gray-500 mb-1">Signal Limitations</div>
                        <ul className="space-y-0.5 text-[11px] text-gray-500">
                          {sigs.limitations.map((l, i) => (
                            <li key={i}>- {l}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })()}
</SectionCard>
            )
          })()}

          {/* Section 5: What We Should Do Next */}
      <SectionCard number={5} title="What We Should Do Next" color="red">
        <p className="text-sm text-gray-500 mb-5">Highest-impact current actions across missing documents, expirations, capability gaps, and readiness improvements.</p>
        <SnapshotGrid>
          <ListBlock title="Missing Documents" items={missingDocuments.map((document) => document.label)} empty="No missing documents identified." />
          <ListBlock title="Expiring Documents" items={expiringDocuments.map((document) => `${document.label}${document.expiresAt ? ` · ${document.expiresAt}` : ''}`)} empty="No expiring documents identified." />
          <ListBlock title="Capability Gaps" items={capabilityGaps.slice(0, 5)} empty="No capability gaps identified." />
          <ListBlock title="Readiness Improvements" items={readinessGaps.slice(0, 5)} empty="No readiness improvements identified." />
        </SnapshotGrid>
        <div className="space-y-3">
          {nextSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{step.action}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    step.priority === 'High' ? 'bg-red-100 text-red-700' :
                    step.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{step.priority}</span>
                </div>
                <p className="text-sm text-gray-500">{step.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Share / Export */}
      <div className="flex justify-center gap-4 pb-12">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const url = window.location.href
              navigator.clipboard?.writeText(url).then(() => alert('Passport link copied to clipboard!'))
            }
          }}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-sm"
        >
          Share Passport
        </button>
        <a
          href="/onboarding/memory"
          className="px-8 py-3 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-50 font-medium"
        >
          Supporting History
        </a>
        <a
          href="/onboarding/roadmap"
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-sm"
        >
          View Roadmap
        </a>
        <button
          onClick={() => window.print()}
          className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
        >
          Export as PDF
        </button>
      </div>
    </div>
  )
}

// ==========================================================================
// Section Card Component
// ==========================================================================

function SectionCard({ number, title, color, children }: {
  number: number; title: string; color: string; children: ReactNode
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-8 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colorMap[color]}`}>
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">{title}</h3>
      <p className="text-sm text-gray-800 leading-relaxed">{content || 'Not specified'}</p>
    </div>
  )
}

function SnapshotGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 mb-5">{children}</div>
}

function ListBlock({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-1 text-xs text-gray-600">
          {items.slice(0, 6).map((item) => <li key={item}>• {item}</li>)}
        </ul>
      )}
    </div>
  )
}

function DocumentRow({ document }: { document: PassportDocument }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
          document.evidenceClass === 'A' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>{document.evidenceClass}</span>
        <div>
          <div className="font-medium text-gray-800 text-sm">{document.label}</div>
          <div className="text-xs text-gray-400">{document.proves.join(', ')}</div>
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        document.status === 'active' ? 'bg-green-100 text-green-700' :
        document.status === 'missing' ? 'bg-red-50 text-red-500' :
        'bg-amber-100 text-amber-700'
      }`}>
        {formatDocumentStatus(document.status)}
      </span>
    </div>
  )
}

function isCurrentEvidence(document: PassportDocument): boolean {
  return document.status === 'active' || document.status === 'expiring_soon' || document.status === 'pending'
}

function formatDocumentStatus(status: PassportDocument['status']): string {
  if (status === 'missing') return 'Needed'
  if (status === 'expiring_soon') return 'Expiring soon'
  return status
}

// ==========================================================================
// States
// ==========================================================================

function PassportSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl mb-8" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-40 bg-gray-100 rounded-2xl mb-6" />
      ))}
    </div>
  )
}

function EmptyPassport() {
  return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <div className="text-6xl mb-4">📋</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">No Passport Yet</h1>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Complete your institution interview to generate your first Institution Passport.
      </p>
      <a href="/onboarding/organization" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
        Start Institution Setup
      </a>
    </div>
  )
}
