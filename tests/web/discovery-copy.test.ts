import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DISCOVERY_COPY,
  FORBIDDEN_UI_PHRASES,
  PREFERRED_UI_PHRASES,
} from '../../apps/web/src/components/discovery/discovery-copy'

const ROOT = join(__dirname, '..', '..')
const DISCOVERY_DIR = join(ROOT, 'apps', 'web', 'src', 'components', 'discovery')

function discoveryUiSources(): { file: string; source: string }[] {
  return readdirSync(DISCOVERY_DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => {
      const file = join(DISCOVERY_DIR, name)
      return { file, source: readFileSync(file, 'utf8') }
    })
}

function stripCommentsAndStrings(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, ' ')
}

describe('Discovery UI copy — forbidden language', () => {
  const uiSources = discoveryUiSources()

  for (const phrase of FORBIDDEN_UI_PHRASES) {
    it(`does not expose "${phrase}" in discovery UI components`, () => {
      for (const { file, source } of uiSources) {
        const normalized = stripCommentsAndStrings(source).toLowerCase()
        expect(normalized, file).not.toContain(phrase.toLowerCase())
      }
    })
  }

  it('does not use "Evidence Discovery" or "Discovery Dashboard" in user-facing strings', () => {
    const legacy = ['evidence discovery', 'discovery interaction dashboard', 'discovery dashboard']
    for (const { file, source } of uiSources) {
      const normalized = stripCommentsAndStrings(source).toLowerCase()
      for (const phrase of legacy) {
        expect(normalized, file).not.toContain(phrase)
      }
    }
  })
})

describe('Discovery UI copy — preferred language', () => {
  it('central copy module defines institutional discovery product names', () => {
    expect(DISCOVERY_COPY.eyebrow).toBe('Institutional Discovery')
    expect(DISCOVERY_COPY.workbenchTitle).toBe('Discovery Workbench')
    expect(DISCOVERY_COPY.signIn).toContain('Institutional Discovery')
  })

  it('dashboard shell uses Discovery Workbench and Institutional Discovery', () => {
    const dashboard = readFileSync(join(DISCOVERY_DIR, 'dashboard.tsx'), 'utf8')
    expect(dashboard).toContain('DISCOVERY_COPY.workbenchTitle')
    expect(dashboard).toContain('DISCOVERY_COPY.eyebrow')
  })

  it('tab labels include preferred institutional names', () => {
    const types = readFileSync(join(DISCOVERY_DIR, 'types.ts'), 'utf8')
    for (const label of [
      'Evidence Snapshot',
      'Institution Profile',
      'Capabilities Found',
      'Evidence Claims',
      'Validation Notes',
      'Source Trace',
    ]) {
      expect(types).toContain(label)
    }
  })

  it('preferred phrases appear across discovery copy and panels', () => {
    const copyModule = readFileSync(join(DISCOVERY_DIR, 'discovery-copy.ts'), 'utf8')
    const combined = [copyModule, ...discoveryUiSources().map(({ source }) => source)].join('\n')
    for (const phrase of PREFERRED_UI_PHRASES) {
      expect(combined.toLowerCase()).toContain(phrase.toLowerCase())
    }
  })

  it('workspace navigation uses Institutional Discovery label', () => {
    const nav = readFileSync(
      join(ROOT, 'apps', 'api', 'src', 'app', 'api', 'v1', 'workspace', 'navigation', 'route.ts'),
      'utf8',
    )
    expect(nav).toContain('Institutional Discovery')
    expect(nav).not.toContain('Evidence Discovery')
  })
})
