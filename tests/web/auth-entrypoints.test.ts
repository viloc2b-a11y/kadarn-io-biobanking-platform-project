import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')
const AUTH_APP = join(ROOT, 'apps', 'web', 'src', 'app', '(auth)')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

describe('auth entry points', () => {
  it('preserves login authentication behavior while adding safe entry links', () => {
    const page = read(join(AUTH_APP, 'login', 'page.tsx'))

    expect(page).toContain('supabase.auth.signInWithPassword')
    expect(page).toContain('resolveRole(data.user.user_metadata)')
    expect(page).toContain('defaultRedirect(role, hasMembership)')
    expect(page).toContain('Forgot password?')
    expect(page).toContain('Register your organization')
    expect(page).toContain('href="/forgot-password"')
    expect(page).toContain('href="/join"')
  })

  it('exposes join actor selection without unfinished registration behavior', () => {
    const pagePath = join(AUTH_APP, 'join', 'page.tsx')
    const page = read(pagePath)
    const actors = read(join(ROOT, 'apps', 'web', 'src', 'lib', 'join', 'actor-types.ts'))

    expect(existsSync(pagePath)).toBe(true)
    expect(page).toContain('Register your organization')
    expect(actors).toContain('Institution / Research Site')
    expect(actors).toContain('Sponsor')
    expect(actors).toContain('CRO')
    expect(actors).toContain('Network / SMO / Academic Network')
    expect(actors).toContain('Vendor / Central Lab / Technology Partner')
    expect(page).toContain('Object.values(JOIN_ACTORS)')
    expect(`${page}\n${actors}`).not.toContain('Kadarn Platform (Internal)')
    expect(`${page}\n${actors}`).not.toContain('signUp(')
    expect(`${page}\n${actors}`).not.toContain('fetch(')
  })

  it('wires supported actor routes to the registration form without provisioning', () => {
    const pagePath = join(AUTH_APP, 'join', '[actor]', 'page.tsx')
    const page = read(pagePath)

    expect(existsSync(pagePath)).toBe(true)
    expect(page).toContain('OrganizationRegistrationForm')
    expect(page).toContain('JOIN_ACTORS[actor]')
    expect(page).toContain('generateStaticParams')
    expect(page).not.toContain('kadarn_internal')
    expect(page).not.toContain('signUp(')
    expect(page).not.toContain('fetch(')
  })

  it('validates organization registration UI locally without API or auth calls', () => {
    const componentPath = join(ROOT, 'apps', 'web', 'src', 'components', 'auth', 'organization-registration-form.tsx')
    const component = read(componentPath)

    expect(existsSync(componentPath)).toBe(true)
    for (const field of [
      'Organization Name',
      'Organization Type',
      'Country',
      'Website (optional)',
      'First Name',
      'Last Name',
      'Email',
      'Password',
      'Confirm Password',
      'Terms acceptance',
      'Privacy acknowledgement',
    ]) {
      expect(component).toContain(field)
    }
    expect(component).toContain('Provisioning will be implemented in PCP-1.1d.')
    expect(component).toContain('event.preventDefault()')
    expect(component).not.toContain('fetch(')
    expect(component).not.toContain('supabase')
    expect(component).not.toContain('signUp(')
  })

  it('exposes forgot-password placeholder without reset behavior', () => {
    const pagePath = join(AUTH_APP, 'forgot-password', 'page.tsx')
    const page = read(pagePath)

    expect(existsSync(pagePath)).toBe(true)
    expect(page).toContain('Forgot password?')
    expect(page).toContain('implemented')
    expect(page).toContain('PCP-1.1g')
    expect(page).not.toContain('resetPasswordForEmail')
    expect(page).not.toContain('updateUser(')
  })
})
