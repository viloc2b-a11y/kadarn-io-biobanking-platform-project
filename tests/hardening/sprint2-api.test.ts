// ==========================================================================
// Sprint 2 — API Production Hardening: static source gate
// ==========================================================================
// Ensures placeholder/fake API patterns cannot re-enter the codebase.
// Runs in default `npm test` (no Supabase required).
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const API_ROOT = path.join(REPO_ROOT, 'apps/api/src/app/api')

const BANNED_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'org-default fallback', pattern: /org-default/ },
  { name: 'readyForAudit hardcode', pattern: /readyForAudit\s*:\s*true/ },
  { name: 'fake policy id pol-001', pattern: /pol-001/ },
  { name: 'x-org-id header fallback', pattern: /x-org-id/i },
]

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(full))
    } else if (entry.name === 'route.ts') {
      files.push(full)
    }
  }
  return files
}

function relativeFromRepo(abs: string): string {
  return path.relative(REPO_ROOT, abs).replace(/\\/g, '/')
}

describe('Sprint 2 — API hardening static gate', () => {
  const routeFiles = collectRouteFiles(API_ROOT)

  it('discovers API route files', () => {
    expect(routeFiles.length).toBeGreaterThan(50)
  })

  for (const { name, pattern } of BANNED_PATTERNS) {
    it(`has zero matches for ${name}`, () => {
      const hits: string[] = []
      for (const file of routeFiles) {
        const source = fs.readFileSync(file, 'utf-8')
        if (pattern.test(source)) {
          hits.push(relativeFromRepo(file))
        }
      }
      expect(hits, hits.join('\n')).toEqual([])
    })
  }

  it('legacy /api/* routes only redirect to v1', () => {
    const legacyRoutes = routeFiles.filter(f => {
      const rel = relativeFromRepo(f)
      return rel.startsWith('apps/api/src/app/api/') && !rel.includes('/api/v1/')
    })

    const violations: string[] = []
    for (const file of legacyRoutes) {
      if (relativeFromRepo(file) === 'apps/api/src/app/api/health/route.ts') continue
      if (relativeFromRepo(file) === 'apps/api/src/app/api/health/ready/route.ts') continue
      if (relativeFromRepo(file) === 'apps/api/src/app/api/metrics/route.ts') continue
      if (relativeFromRepo(file) === 'apps/api/src/app/api/route.ts') continue

      const source = fs.readFileSync(file, 'utf-8')
      if (!source.includes('legacyRedirectAuto') && !source.includes('legacyRedirect(')) {
        violations.push(relativeFromRepo(file))
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('v1 workspace routes require active org (no header fallback)', () => {
    const workspaceRoutes = routeFiles.filter(f =>
      relativeFromRepo(f).includes('/api/v1/workspace/'),
    )

    const missing: string[] = []
    for (const file of workspaceRoutes) {
      const rel = relativeFromRepo(file)
      if (rel.includes('/active-org/') || rel.includes('/navigation/') || rel.includes('/overview/') || rel.includes('/profile/')) {
        continue
      }
      const source = fs.readFileSync(file, 'utf-8')
      if (!source.includes('requireActiveOrg')) {
        missing.push(rel)
      }
    }

    expect(missing, missing.join('\n')).toEqual([])
  })

  it('middleware sets API version header', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/middleware.ts'),
      'utf-8',
    )
    expect(source).toContain('X-Kadarn-Api-Version')
    expect(source).toContain("'v1'")
  })

  it('health endpoint reports hardening version', () => {
    const source = fs.readFileSync(
      path.join(API_ROOT, 'health/route.ts'),
      'utf-8',
    )
    expect(source).toMatch(/1\.0\.0-hardening\.\d+/)
    expect(source).toContain("api_version: 'v1'")
  })

  it('legacy redirect maps /api/me to v1 account path', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/api/src/lib/legacy-redirect.ts'),
      'utf-8',
    )
    expect(source).toContain("pathname === '/api/me'")
    expect(source).toContain("'/api/v1/account/me'")
    expect(source).toContain("pathname.replace(/^\\/api/, '/api/v1')")
  })
})
