// ==========================================================================
// Sprint 4 — Domain Events Runtime: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../..')
const API_LIB = path.join(REPO_ROOT, 'apps/api/src')
const MIGRATION = path.join(REPO_ROOT, 'database/migrations/036_domain_events_runtime.sql')

const BANNED_INTEGRATION_PATTERNS = [
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]domain_event/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]workflow_signal/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]provenance_record/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]trust_evaluation/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]policy_shadow_check/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]approval_action/,
  /console\.log\(JSON\.stringify\(\{\s*type:\s*['"]catalog_search/,
]

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectTsFiles(full))
    else if (entry.name.endsWith('.ts')) files.push(full)
  }
  return files
}

describe('Sprint 4 — no console.log engine integration', () => {
  const apiFiles = collectTsFiles(API_LIB)

  for (const { source: name, pattern } of BANNED_INTEGRATION_PATTERNS.map((pattern, i) => ({
    source: `pattern-${i}`,
    pattern,
  }))) {
    it(`bans integration console.log pattern ${name}`, () => {
      const hits: string[] = []
      for (const file of apiFiles) {
        const source = fs.readFileSync(file, 'utf-8')
        if (pattern.test(source)) {
          hits.push(path.relative(REPO_ROOT, file).replace(/\\/g, '/'))
        }
      }
      expect(hits, hits.join('\n')).toEqual([])
    })
  }

  it('event-runtime module exists and uses publish_domain_event RPC', () => {
    const source = fs.readFileSync(
      path.join(API_LIB, 'lib/event-runtime.ts'),
      'utf-8',
    )
    expect(source).toContain('publish_domain_event')
    expect(source).toContain('OutboxEventBus')
    expect(source).toContain('replay_domain_events')
  })
})

describe('Sprint 4 — migration 036 domain events runtime', () => {
  const migration = fs.readFileSync(MIGRATION, 'utf-8')

  it('defines event store and outbox tables', () => {
    expect(migration).toContain('domain_event_store')
    expect(migration).toContain('domain_event_outbox')
  })

  it('defines publish, process, and replay functions', () => {
    expect(migration).toContain('publish_domain_event')
    expect(migration).toContain('process_domain_event_outbox')
    expect(migration).toContain('replay_domain_events')
  })

  it('enforces append-only on event store', () => {
    expect(migration).toContain("apply_append_only_triggers('public.domain_event_store'")
  })

  it('mirrors to supabase migrations', () => {
    const sb = fs.readFileSync(
      path.join(REPO_ROOT, 'supabase/migrations/036_domain_events_runtime.sql'),
      'utf-8',
    )
    expect(sb).toBe(migration)
  })
})

describe('Sprint 4 — platform-services outbox', () => {
  it('exports OutboxEventBus and InMemoryEventStore', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'packages/platform-services/src/index.ts'),
      'utf-8',
    )
    expect(source).toContain('OutboxEventBus')
    expect(source).toContain('InMemoryEventStore')
  })
})

describe('Sprint 4 — policy-engine no console.log integration', () => {
  it('shadow-mode uses injectable recorders instead of console.log', () => {
    const source = fs.readFileSync(
      path.join(REPO_ROOT, 'packages/policy-engine/src/opa/shadow-mode.ts'),
      'utf-8',
    )
    expect(source).not.toMatch(/console\.log\(/)
    expect(source).toContain('CallbackDecisionRecorder')
    expect(source).toContain('setPolicyShadowDecisionSink')
  })
})
