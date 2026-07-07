import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CANONICAL_OWNER,
  LEGACY_FLAT_PROJECTION_KEYS,
  getCanonicalOwner,
  isLegacyFlatProjectionKey,
  removeLegacyFlatProjectionAnswers,
} from '../../apps/web/src/lib/onboarding/canonical-ownership'

const ROOT = join(__dirname, '..', '..')
const ORGANIZATION_PAGE = join(ROOT, 'apps', 'web', 'src', 'app', '(onboarding)', 'onboarding', 'organization', 'page.tsx')
const ONBOARDING_CONTEXT = join(ROOT, 'apps', 'web', 'src', 'lib', 'onboarding', 'onboarding-context.tsx')

describe('ORP-1.2 canonical onboarding ownership', () => {
  it('maps active onboarding inputs to canonical owners', () => {
    expect(getCanonicalOwner('org_name')).toBe(CANONICAL_OWNER.INSTITUTION)
    expect(getCanonicalOwner('org_locations')).toBe(CANONICAL_OWNER.LOCATION)
    expect(getCanonicalOwner('people_team_members')).toBe(CANONICAL_OWNER.PERSON)
    expect(getCanonicalOwner('infra_location_infrastructure')).toBe(CANONICAL_OWNER.LABORATORY)
    expect(getCanonicalOwner('memory_events')).toBe(CANONICAL_OWNER.TIMELINE_EVENT)
    expect(getCanonicalOwner('org_research_focus')).toBe(CANONICAL_OWNER.CLAIM)
  })

  it('classifies legacy flat projections as read compatibility only', () => {
    expect(isLegacyFlatProjectionKey('people_pi_name')).toBe(true)
    expect(isLegacyFlatProjectionKey('infra_has_lab')).toBe(true)
    expect(isLegacyFlatProjectionKey('docs_uploaded_count')).toBe(true)
    expect(isLegacyFlatProjectionKey('org_locations')).toBe(false)
  })

  it('removes legacy flat projections before persistence', () => {
    const canonical = removeLegacyFlatProjectionAnswers({
      org_name: 'Vilo Research Institute',
      org_locations: [{ id: 'location-1' }],
      people_team_members: [{ id: 'person-1' }],
      people_pi_name: 'Legacy PI',
      infra_has_lab: 'yes',
      docs_uploaded_count: 3,
    })

    expect(canonical).toEqual({
      org_name: 'Vilo Research Institute',
      org_locations: [{ id: 'location-1' }],
      people_team_members: [{ id: 'person-1' }],
    })
  })

  it('persists the sanitized canonical payload, not the read model', () => {
    const source = readFileSync(ONBOARDING_CONTEXT, 'utf8')

    expect(source).toContain('createPersistedOnboardingState(state)')
    expect(source).toContain('removeLegacyFlatProjectionAnswers(state.answers)')
    expect(source).not.toContain("JSON.stringify(state))")
  })

  it('keeps Organization writes on canonical keys', () => {
    const source = readFileSync(ORGANIZATION_PAGE, 'utf8')

    expect(source).toContain('org_locations: normalized')
    expect(source).toContain('org_operational_coverage: value')
    LEGACY_FLAT_PROJECTION_KEYS.filter((key) => key.startsWith('org_')).forEach((legacyKey) => {
      expect(source).not.toContain(`${legacyKey}:`)
    })
  })
})
