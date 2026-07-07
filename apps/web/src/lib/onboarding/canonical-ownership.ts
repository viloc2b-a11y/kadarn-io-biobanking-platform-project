export const CANONICAL_OWNER = {
  INSTITUTION: 'Institution',
  LOCATION: 'Location',
  PERSON: 'Person',
  EQUIPMENT: 'Equipment',
  LABORATORY: 'Laboratory',
  DOCUMENT: 'Document',
  EVIDENCE: 'Evidence',
  TIMELINE_EVENT: 'TimelineEvent',
  CLAIM: 'Claim',
} as const

export type CanonicalOwner = (typeof CANONICAL_OWNER)[keyof typeof CANONICAL_OWNER]

export const ONBOARDING_CANONICAL_OWNERSHIP = {
  org_name: CANONICAL_OWNER.INSTITUTION,
  org_dba: CANONICAL_OWNER.INSTITUTION,
  org_type: CANONICAL_OWNER.INSTITUTION,
  org_mission: CANONICAL_OWNER.INSTITUTION,
  org_founded_year: CANONICAL_OWNER.INSTITUTION,
  org_website: CANONICAL_OWNER.INSTITUTION,
  org_research_focus: CANONICAL_OWNER.CLAIM,
  org_therapeutic_areas: CANONICAL_OWNER.CLAIM,
  org_research_modalities: CANONICAL_OWNER.CLAIM,
  org_operational_coverage: CANONICAL_OWNER.INSTITUTION,
  org_active_regions: CANONICAL_OWNER.INSTITUTION,
  org_countries: CANONICAL_OWNER.INSTITUTION,
  org_recruitment_reach: CANONICAL_OWNER.INSTITUTION,
  org_sample_logistics: CANONICAL_OWNER.INSTITUTION,
  org_operational_assets: CANONICAL_OWNER.INSTITUTION,
  org_languages: CANONICAL_OWNER.INSTITUTION,
  org_time_zones: CANONICAL_OWNER.INSTITUTION,
  org_locations: CANONICAL_OWNER.LOCATION,
  people_research_leadership_role: CANONICAL_OWNER.PERSON,
  people_team_members: CANONICAL_OWNER.PERSON,
  infra_location_infrastructure: CANONICAL_OWNER.LABORATORY,
  memory_events: CANONICAL_OWNER.TIMELINE_EVENT,
  roadmap_strategic_growth_goals: CANONICAL_OWNER.CLAIM,
} as const satisfies Record<string, CanonicalOwner>

export type CanonicalOnboardingKey = keyof typeof ONBOARDING_CANONICAL_OWNERSHIP

export const LEGACY_FLAT_PROJECTION_KEYS = [
  'org_street',
  'org_city',
  'org_state',
  'org_country',
  'org_zip',
  'org_time_zone',
  'org_geographic_reach',
  'people_pi_name',
  'people_pi_first_name',
  'people_pi_last_name',
  'people_pi_title',
  'people_pi_email',
  'people_pi_experience',
  'people_pi_ta',
  'people_total_team',
  'people_roles',
  'people_languages',
  'people_certs',
  'infra_location_count',
  'infra_facility_type',
  'infra_research_space',
  'infra_backup_power',
  'infra_has_lab',
  'infra_has_biospecimen',
  'infra_storage_equip',
  'infra_temp_monitoring',
  'infra_specimen_types',
  'docs_uploaded_count',
] as const

const LEGACY_FLAT_PROJECTION_KEY_SET = new Set<string>(LEGACY_FLAT_PROJECTION_KEYS)

export function isLegacyFlatProjectionKey(key: string): boolean {
  return LEGACY_FLAT_PROJECTION_KEY_SET.has(key)
}

export function getCanonicalOwner(questionId: string): CanonicalOwner | null {
  return ONBOARDING_CANONICAL_OWNERSHIP[questionId as CanonicalOnboardingKey] ?? null
}

export function removeLegacyFlatProjectionAnswers<TValue>(
  answers: Record<string, TValue>,
): Record<string, TValue> {
  return Object.fromEntries(
    Object.entries(answers).filter(([key]) => !isLegacyFlatProjectionKey(key)),
  )
}
