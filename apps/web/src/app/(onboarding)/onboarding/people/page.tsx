'use client'

import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import { normalizeLocations, type InstitutionalLocation } from '@/lib/onboarding/institutional-locations'
import {
  EMPLOYMENT_STATUS_OPTIONS,
  PHASE_EXPERIENCE_OPTIONS,
  PROFESSIONAL_CREDENTIAL_OPTIONS,
  RESEARCH_LEADERSHIP_OPTIONS,
  RESEARCH_ROLE_OPTIONS,
  TEAM_LANGUAGE_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  CERTIFICATION_TYPE_OPTIONS,
  createStaffCertification,
  createResearchTeamMember,
  normalizeResearchTeamMembers,
  type StaffCertification,
  type ResearchTeamMember,
} from '@/lib/onboarding/research-team'
import { THERAPEUTIC_AREA_GROUPS } from '@/lib/onboarding/research-experience-taxonomy'
import { DomainHeader, InterviewQuestion, DomainWhatYouGet } from '../../components/domain-header'

const THERAPEUTIC_EXPERTISE_OPTIONS = THERAPEUTIC_AREA_GROUPS.flatMap((group) => group.options)

export default function PeoplePage() {
  const { state, setAnswer } = useOnboarding()
  const a = state.answers
  const teamMembers = Array.isArray(a['people_team_members'])
    ? normalizeResearchTeamMembers(a['people_team_members'] as ResearchTeamMember[])
    : [createResearchTeamMember(0)]
  const locations = Array.isArray(a['org_locations'])
    ? normalizeLocations(a['org_locations'] as InstitutionalLocation[])
    : []
  const questionsAnswered = Object.entries(a).filter(([key, value]) =>
    key.startsWith('people_') && key !== 'people_pi_name' && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
  ).length

  const input = (key: string) => ({
    value: (a[key] as string) ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAnswer(key, e.target.value),
  })

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader domain="people" questionCount={3} questionsAnswered={questionsAnswered} />
      <DomainWhatYouGet domain="people" />

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Primary Research Leadership</h2>
        <p className="text-gray-500 mb-4">Identify who leads research. This does not limit the institution to one PI.</p>

        <InterviewQuestion number={1} question="Who leads research at your institution?" help="This identifies the primary research leadership role or contact function.">
          <select style={inputStyle} {...input('people_research_leadership_role')}>
            <option value="">Select leadership role...</option>
            {RESEARCH_LEADERSHIP_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </InterviewQuestion>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Research Team</h2>
        <p className="text-gray-500 mb-4">Build the institutional research team as an organizational chart, not a single PI record.</p>

        <InterviewQuestion number={2} question="Who is on your research team?" help="Add Principal Investigators, directors, coordinators, nurses, lab leaders, recruiters, and other research operations staff.">
          <ResearchTeamEditor
            members={teamMembers}
            locations={locations}
            onChange={(members) => setAnswer('people_team_members', normalizeResearchTeamMembers(members))}
          />
        </InterviewQuestion>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Derived Compliance Summary</h2>
        <p className="text-gray-500 mb-4">Institution-level certification coverage is derived from individual staff records.</p>

        <InterviewQuestion number={3} question="Research Certifications" help="No manual institution-level entry. Add certifications inside each staff member card.">
          <CertificationSummary members={teamMembers} />
        </InterviewQuestion>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/organization" className="text-gray-500 hover:text-gray-700 text-sm">← Organization</a>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.alert('Your onboarding progress is saved locally on this device.')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Save & Continue Later
          </button>
          <a href="/onboarding/infrastructure" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">Continue to Infrastructure →</a>
        </div>
      </div>
    </div>
  )
}

function ResearchTeamEditor({
  members,
  locations,
  onChange,
}: {
  members: ResearchTeamMember[]
  locations: InstitutionalLocation[]
  onChange: (members: ResearchTeamMember[]) => void
}) {
  const normalizedMembers = normalizeResearchTeamMembers(members)
  const [expandedIds, setExpandedIds] = useState(() => new Set(normalizedMembers.map((member) => member.id)))
  const memberIds = normalizedMembers.map((member) => member.id).join('|')

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current)
      let changed = false
      normalizedMembers.forEach((member) => {
        if ((next.size === 0 || member.isPrincipalInvestigator) && !next.has(member.id)) {
          next.add(member.id)
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [memberIds])

  const updateMember = (id: string, patch: Partial<ResearchTeamMember>) => {
    onChange(normalizedMembers.map((member) => member.id === id ? { ...member, ...patch } : member))
  }

  const toggleMemberArrayValue = (id: string, key: 'languages' | 'researchRoles' | 'therapeuticExpertise' | 'phaseExperience', value: string) => {
    const member = normalizedMembers.find((item) => item.id === id)
    if (!member) return

    const current = member[key]
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    const patch: Partial<ResearchTeamMember> = { [key]: next }
    if (key === 'researchRoles') {
      patch.isPrincipalInvestigator = next.includes('Principal Investigator') || member.isPrincipalInvestigator
    }
    updateMember(id, patch)
  }

  const addCertification = (memberId: string) => {
    const member = normalizedMembers.find((item) => item.id === memberId)
    if (!member) return

    updateMember(memberId, {
      certifications: [...(member.certifications ?? []), createStaffCertification(member.certifications.length)],
    })
  }

  const updateCertification = (memberId: string, certificationId: string, patch: Partial<StaffCertification>) => {
    const member = normalizedMembers.find((item) => item.id === memberId)
    if (!member) return

    updateMember(memberId, {
      certifications: (member.certifications ?? []).map((certification) =>
        certification.id === certificationId ? { ...certification, ...patch } : certification
      ),
    })
  }

  const removeCertification = (memberId: string, certificationId: string) => {
    const member = normalizedMembers.find((item) => item.id === memberId)
    if (!member) return

    updateMember(memberId, {
      certifications: (member.certifications ?? []).filter((certification) => certification.id !== certificationId),
    })
  }

  const addMember = () => {
    const nextMember = createResearchTeamMember(normalizedMembers.length)
    onChange([...normalizedMembers, nextMember])
    setExpandedIds((current) => new Set([...current, nextMember.id]))
  }

  const duplicateMember = (member: ResearchTeamMember) => {
    const duplicate = {
      ...member,
      id: `team-member-${Date.now()}-${normalizedMembers.length}`,
      firstName: member.firstName ? `${member.firstName} Copy` : '',
      isPrincipalInvestigator: false,
      researchRoles: member.researchRoles.filter((role) => role !== 'Principal Investigator'),
    }
    onChange([...normalizedMembers, duplicate])
    setExpandedIds((current) => new Set([...current, duplicate.id]))
  }

  const removeMember = (id: string) => {
    if (normalizedMembers.length === 1) return
    onChange(normalizedMembers.filter((member) => member.id !== id))
    setExpandedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
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
    <div style={teamEditorStyle}>
      {normalizedMembers.map((member, index) => {
        const isExpanded = expandedIds.has(member.id)
        const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ') || `Team Member ${index + 1}`
        const roleSummary = member.researchRoles.join(', ') || member.primaryRole || 'Role pending'

        return (
          <section key={member.id} style={teamCardStyle}>
            <div style={teamCardHeaderStyle}>
              <div style={teamSummaryStyle}>
                <div style={teamTitleRowStyle}>
                  <strong>{fullName}</strong>
                  {member.isPrincipalInvestigator && <span style={piBadgeStyle}>Principal Investigator</span>}
                </div>
                <span style={teamMetaStyle}>{roleSummary}</span>
                <span style={teamMetaStyle}>{member.email || 'Email pending'}</span>
              </div>
              <div style={teamActionsStyle}>
                <button type="button" onClick={() => toggleExpanded(member.id)} style={secondaryActionButtonStyle}>
                  {isExpanded ? 'Collapse' : 'Edit'}
                </button>
                <button type="button" onClick={() => duplicateMember(member)} style={secondaryActionButtonStyle}>
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  disabled={normalizedMembers.length === 1}
                  style={{
                    ...dangerActionButtonStyle,
                    ...(normalizedMembers.length === 1 ? disabledActionButtonStyle : {}),
                  }}
                >
                  Remove
                </button>
              </div>
            </div>

            {isExpanded && (
              <div style={teamFieldsStyle}>
                <input type="text" value={member.firstName} onChange={(event) => updateMember(member.id, { firstName: event.target.value })} placeholder="First Name" style={inputStyle} />
                <input type="text" value={member.lastName} onChange={(event) => updateMember(member.id, { lastName: event.target.value })} placeholder="Last Name" style={inputStyle} />
                <select value={member.credentials} onChange={(event) => updateMember(member.id, { credentials: event.target.value })} style={inputStyle}>
                  <option value="">Professional Credentials</option>
                  {PROFESSIONAL_CREDENTIAL_OPTIONS.map((credential) => <option key={credential} value={credential}>{credential}</option>)}
                </select>
                <select value={member.primaryRole} onChange={(event) => updateMember(member.id, { primaryRole: event.target.value })} style={inputStyle}>
                  <option value="">Primary Role</option>
                  {RESEARCH_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <input type="email" value={member.email} onChange={(event) => updateMember(member.id, { email: event.target.value })} placeholder="Email" style={inputStyle} />
                <input type="tel" value={member.phone} onChange={(event) => updateMember(member.id, { phone: event.target.value })} placeholder="Phone (optional)" style={inputStyle} />
                <select value={member.primaryLocationId} onChange={(event) => updateMember(member.id, { primaryLocationId: event.target.value })} style={inputStyle}>
                  <option value="">Primary Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name || location.type || 'Location'}</option>
                  ))}
                </select>
                <select value={member.employmentStatus} onChange={(event) => updateMember(member.id, { employmentStatus: event.target.value })} style={inputStyle}>
                  <option value="">Employment Status</option>
                  {EMPLOYMENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>

                <label style={piFlagStyle}>
                  <input
                    type="checkbox"
                    checked={member.isPrincipalInvestigator}
                    onChange={() => {
                      const nextIsPi = !member.isPrincipalInvestigator
                      updateMember(member.id, {
                        isPrincipalInvestigator: nextIsPi,
                        researchRoles: nextIsPi && !member.researchRoles.includes('Principal Investigator')
                          ? [...member.researchRoles, 'Principal Investigator']
                          : member.researchRoles.filter((role) => role !== 'Principal Investigator'),
                      })
                    }}
                  />
                  <span>Principal Investigator</span>
                </label>

                <input type="number" min={0} value={member.yearsExperience} onChange={(event) => updateMember(member.id, { yearsExperience: event.target.value })} placeholder="Years of research experience" style={inputStyle} />
                <input type="number" min={0} value={member.completedStudies} onChange={(event) => updateMember(member.id, { completedStudies: event.target.value })} placeholder="Completed studies" style={inputStyle} />
                <input type="number" min={0} value={member.currentStudies} onChange={(event) => updateMember(member.id, { currentStudies: event.target.value })} placeholder="Current studies" style={inputStyle} />

                <TeamMultiSelect title="Research Roles" options={RESEARCH_ROLE_OPTIONS} selectedValues={member.researchRoles} onToggle={(value) => toggleMemberArrayValue(member.id, 'researchRoles', value)} />
                <TeamMultiSelect title="Therapeutic Expertise" options={THERAPEUTIC_EXPERTISE_OPTIONS} selectedValues={member.therapeuticExpertise} onToggle={(value) => toggleMemberArrayValue(member.id, 'therapeuticExpertise', value)} />
                <TeamMultiSelect title="Research Experience" options={PHASE_EXPERIENCE_OPTIONS} selectedValues={member.phaseExperience} onToggle={(value) => toggleMemberArrayValue(member.id, 'phaseExperience', value)} />
                <TeamMultiSelect title="Languages" options={TEAM_LANGUAGE_OPTIONS} selectedValues={member.languages} onToggle={(value) => toggleMemberArrayValue(member.id, 'languages', value)} />
                <StaffCertificationEditor
                  certifications={member.certifications ?? []}
                  onAdd={() => addCertification(member.id)}
                  onUpdate={(certificationId, patch) => updateCertification(member.id, certificationId, patch)}
                  onRemove={(certificationId) => removeCertification(member.id, certificationId)}
                />
              </div>
            )}
          </section>
        )
      })}

      <button type="button" onClick={addMember} style={addTeamMemberButtonStyle}>
        + Add Team Member
      </button>
    </div>
  )
}

function TeamMultiSelect({
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
    <div style={multiSelectBlockStyle}>
      <strong style={multiSelectTitleStyle}>{title}</strong>
      <div style={multiSelectGridStyle}>
        {options.map((option) => {
          const checked = selectedValues.includes(option)

          return (
            <label
              key={option}
              style={{
                ...multiSelectOptionStyle,
                ...(checked ? multiSelectOptionSelectedStyle : {}),
              }}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(option)} />
              <span>{option}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function StaffCertificationEditor({
  certifications,
  onAdd,
  onUpdate,
  onRemove,
}: {
  certifications: StaffCertification[]
  onAdd: () => void
  onUpdate: (certificationId: string, patch: Partial<StaffCertification>) => void
  onRemove: (certificationId: string) => void
}) {
  return (
    <div style={multiSelectBlockStyle}>
      <div style={certificationHeaderStyle}>
        <strong style={multiSelectTitleStyle}>Certifications & Training</strong>
        <button type="button" onClick={onAdd} style={secondaryActionButtonStyle}>
          + Add Certification
        </button>
      </div>

      {certifications.length === 0 ? (
        <p style={certificationEmptyStyle}>No certifications added for this staff member yet.</p>
      ) : (
        <div style={certificationListStyle}>
          {certifications.map((certification) => (
            <div key={certification.id} style={certificationCardStyle}>
              <select
                value={certification.type}
                onChange={(event) => onUpdate(certification.id, { type: event.target.value })}
                style={inputStyle}
              >
                <option value="">Certification Type</option>
                {CERTIFICATION_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                value={certification.certificationNumber}
                onChange={(event) => onUpdate(certification.id, { certificationNumber: event.target.value })}
                placeholder="Certification Number (optional)"
                style={inputStyle}
              />
              <input
                type="text"
                value={certification.issuingOrganization}
                onChange={(event) => onUpdate(certification.id, { issuingOrganization: event.target.value })}
                placeholder="Issuing Organization (optional)"
                style={inputStyle}
              />
              <input
                type="date"
                value={certification.issueDate}
                onChange={(event) => onUpdate(certification.id, { issueDate: event.target.value })}
                aria-label="Issue Date"
                style={inputStyle}
              />
              <input
                type="date"
                value={certification.expirationDate}
                onChange={(event) => onUpdate(certification.id, { expirationDate: event.target.value })}
                aria-label="Expiration Date"
                style={inputStyle}
              />
              <select
                value={certification.currentStatus}
                onChange={(event) => onUpdate(certification.id, { currentStatus: event.target.value })}
                style={inputStyle}
              >
                {CERTIFICATION_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button type="button" onClick={() => onRemove(certification.id)} style={dangerActionButtonStyle}>
                Remove Certification
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CertificationSummary({ members }: { members: ResearchTeamMember[] }) {
  const certifications = members.flatMap((member) => member.certifications ?? [])
  const activeCounts = certifications
    .filter((certification) => certification.type && certification.currentStatus === 'Active')
    .reduce<Record<string, number>>((counts, certification) => {
      counts[certification.type] = (counts[certification.type] ?? 0) + 1
      return counts
    }, {})
  const expiringCount = certifications.filter((certification) => certification.currentStatus === 'Expiring Soon').length
  const expiredCount = certifications.filter((certification) => certification.currentStatus === 'Expired').length
  const activeEntries = Object.entries(activeCounts)

  return (
    <div style={summaryCardStyle}>
      {activeEntries.length === 0 && expiringCount === 0 && expiredCount === 0 ? (
        <p style={certificationEmptyStyle}>
          Add certifications inside staff member cards. Kadarn will derive institutional coverage automatically.
        </p>
      ) : (
        <>
          {activeEntries.map(([type, count]) => (
            <div key={type} style={summaryLineStyle}>✓ {count} {type} Active</div>
          ))}
          {expiringCount > 0 && <div style={warningLineStyle}>⚠ {expiringCount} Expiring within 60 days</div>}
          {expiredCount > 0 && <div style={warningLineStyle}>⚠ {expiredCount} Expired</div>}
        </>
      )}
    </div>
  )
}

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

const teamEditorStyle = {
  display: 'grid',
  gap: 12,
} satisfies CSSProperties

const teamCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  display: 'grid',
  gap: 12,
  padding: 14,
} satisfies CSSProperties

const teamCardHeaderStyle = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
} satisfies CSSProperties

const teamSummaryStyle = {
  display: 'grid',
  gap: 4,
  minWidth: 0,
} satisfies CSSProperties

const teamTitleRowStyle = {
  alignItems: 'center',
  color: '#111827',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
} satisfies CSSProperties

const piBadgeStyle = {
  background: '#dcfce7',
  borderRadius: 999,
  color: '#166534',
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 8px',
} satisfies CSSProperties

const teamMetaStyle = {
  color: '#6b7280',
  fontSize: 13,
} satisfies CSSProperties

const teamActionsStyle = {
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

const teamFieldsStyle = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} satisfies CSSProperties

const piFlagStyle = {
  alignItems: 'center',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 10,
  color: '#1d4ed8',
  cursor: 'pointer',
  display: 'flex',
  fontWeight: 700,
  gap: 8,
  padding: '10px 12px',
} satisfies CSSProperties

const multiSelectBlockStyle = {
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  display: 'grid',
  gap: 10,
  gridColumn: '1 / -1',
  padding: 12,
} satisfies CSSProperties

const multiSelectTitleStyle = {
  color: '#111827',
  fontSize: 14,
} satisfies CSSProperties

const multiSelectGridStyle = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
} satisfies CSSProperties

const multiSelectOptionStyle = {
  alignItems: 'center',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  color: '#374151',
  cursor: 'pointer',
  display: 'flex',
  gap: 8,
  minHeight: 38,
  padding: '8px 10px',
} satisfies CSSProperties

const multiSelectOptionSelectedStyle = {
  background: '#eff6ff',
  borderColor: '#60a5fa',
  color: '#1d4ed8',
  fontWeight: 700,
} satisfies CSSProperties

const certificationHeaderStyle = {
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
} satisfies CSSProperties

const certificationEmptyStyle = {
  color: '#6b7280',
  fontSize: 13,
  lineHeight: 1.45,
  margin: 0,
} satisfies CSSProperties

const certificationListStyle = {
  display: 'grid',
  gap: 10,
} satisfies CSSProperties

const certificationCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  padding: 10,
} satisfies CSSProperties

const summaryCardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  display: 'grid',
  gap: 8,
  padding: 14,
} satisfies CSSProperties

const summaryLineStyle = {
  color: '#166534',
  fontSize: 14,
  fontWeight: 700,
} satisfies CSSProperties

const warningLineStyle = {
  color: '#92400e',
  fontSize: 14,
  fontWeight: 700,
} satisfies CSSProperties

const addTeamMemberButtonStyle = {
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
