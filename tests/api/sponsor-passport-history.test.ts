/**
 * RC-11.7 — Sponsor passport history runtime tests.
 */

import { afterEach, describe, expect, it } from 'vitest'
import {
  createClaim,
  createProvenance,
  insertClaim,
  insertEvidenceNode,
  siteVisibility,
  submitEvidence,
} from '../../packages/evidence-core/src/index.js'
import type { DbClient } from '../../packages/evidence-core/src/db.js'
import {
  isClaimEvidenceAuditAction,
  mapAuditEventToPassportHistoryEvent,
  mapAuditEventsToPassportHistory,
} from '../../apps/api/src/lib/sponsor-passport/adapter/map-history'
import { setPortfolioAllowlistForTests } from '../../apps/api/src/lib/sponsor-passport/adapter/portfolio-allowlist'
import { readInstitutionAuditEvents, type AuditEventRecord } from '../../apps/api/src/lib/sponsor-passport/adapter/queries'
import { EvidenceCorePassportStore } from '../../apps/api/src/lib/sponsor-passport/evidence-core-passport-store'

function createFakeDb(): DbClient {
  const tables: Record<string, Record<string, Record<string, unknown>>> = {}

  return {
    from(table: string) {
      if (!tables[table]) tables[table] = {}
      const rows = tables[table]

      return {
        async insert(data) {
          const record = Array.isArray(data) ? data[0] : data
          const id = (record.id as string) ?? crypto.randomUUID()
          rows[id] = { ...record, id }
          return { data: rows[id], error: null }
        },
        select(_columns: string) {
          return {
            async eq(col: string, val: unknown) {
              const results = Object.values(rows).filter((r) => r[col] === val)
              return { data: results, error: null }
            },
          }
        },
      }
    },
    async rpc(_fn: string, _params: Record<string, unknown>) {
      return { data: null, error: null }
    },
  }
}

async function seedAuditEvent(
  db: DbClient,
  fields: Record<string, unknown>,
): Promise<void> {
  await db.from('audit_events').insert({
    action: fields.action,
    actor_id: fields.actor_id ?? 'actor-history',
    actor_email: fields.actor_email ?? null,
    organization_id: fields.organization_id,
    resource_type: fields.resource_type ?? 'evidence_core',
    resource_id: fields.resource_id ?? crypto.randomUUID(),
    summary: fields.summary,
    created_at: fields.created_at ?? new Date().toISOString(),
  })
}

const SPONSOR_ORG = 'org-sponsor-rc117'
const SITE_ORG = 'org-site-rc117'

describe('Sponsor passport history (RC-11.7)', () => {
  afterEach(() => {
    setPortfolioAllowlistForTests(null)
  })

  it('maps audit rows to PassportHistoryEvent with required fields', () => {
    const row: AuditEventRecord = {
      id: 'audit-001',
      action: 'evidence.submitted',
      actorId: 'actor-1',
      actorEmail: 'reviewer@example.com',
      organizationId: SITE_ORG,
      resourceType: 'evidence_core',
      resourceId: 'node-1',
      summary: 'Evidence submitted for claim claim-1: Class B',
      createdAt: '2026-06-28T09:00:00.000Z',
    }

    const event = mapAuditEventToPassportHistoryEvent(row)

    expect(event).toEqual({
      id: 'audit-001',
      occurredAt: '2026-06-28T09:00:00.000Z',
      eventType: 'Evidence submitted',
      description: 'Evidence submitted for claim claim-1: Class B',
      actor: 'reviewer@example.com',
    })
  })

  it('includes only claim/evidence lifecycle audit actions from evidence_core', () => {
    const rows: AuditEventRecord[] = [
      {
        id: 'a1',
        action: 'claim.created',
        actorId: 'actor-1',
        actorEmail: null,
        organizationId: SITE_ORG,
        resourceType: 'evidence_core',
        resourceId: 'claim-1',
        summary: 'Claim created: PBMC',
        createdAt: '2026-06-01T08:00:00.000Z',
      },
      {
        id: 'a2',
        action: 'relationship.created',
        actorId: 'actor-1',
        actorEmail: null,
        organizationId: SITE_ORG,
        resourceType: 'evidence_core',
        resourceId: 'rel-1',
        summary: 'Relationship created',
        createdAt: '2026-06-02T08:00:00.000Z',
      },
      {
        id: 'a3',
        action: 'create',
        actorId: 'actor-1',
        actorEmail: null,
        organizationId: SITE_ORG,
        resourceType: 'program',
        resourceId: 'prog-1',
        summary: 'Program created',
        createdAt: '2026-06-03T08:00:00.000Z',
      },
      {
        id: 'a4',
        action: 'evidence.submitted',
        actorId: 'actor-1',
        actorEmail: null,
        organizationId: SITE_ORG,
        resourceType: 'evidence_core',
        resourceId: 'node-1',
        summary: 'Evidence submitted for claim claim-1',
        createdAt: '2026-06-04T08:00:00.000Z',
      },
    ]

    const history = mapAuditEventsToPassportHistory(rows)

    expect(history.map((event) => event.id)).toEqual(['a4', 'a1'])
    expect(isClaimEvidenceAuditAction('relationship.created')).toBe(false)
    expect(isClaimEvidenceAuditAction('claim.created')).toBe(true)
  })

  it('returns empty history when no audit events exist', async () => {
    const db = createFakeDb()
    const rows = await readInstitutionAuditEvents(db, SITE_ORG)
    expect(mapAuditEventsToPassportHistory(rows)).toEqual([])
  })

  it('EvidenceCorePassportStore populates history from lifecycle audit trail', async () => {
    setPortfolioAllowlistForTests({
      [SPONSOR_ORG]: [{ institutionId: SITE_ORG }],
    })

    const db = createFakeDb()
    await db.from('organizations').insert({
      id: SITE_ORG,
      name: 'History Test Site',
      legal_name: null,
      city: 'Boston',
      region: 'MA',
      country: 'US',
      created_by: '00000000-0000-0000-0000-000000000001',
    })

    const ctx = {
      actorId: 'actor-lifecycle',
      organizationId: SITE_ORG,
      correlationId: 'corr-rc117',
    }

    const claim = await createClaim(db, ctx, {
      claimTypeId: 'biospecimen.processing.pbmc',
      name: 'PBMC processing',
      description: 'On-site PBMC isolation',
      domain: 'biospecimen',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 6,
    })

    await submitEvidence(db, ctx, {
      claimId: (claim as { id: string }).id,
      evidenceClass: 'B' as never,
      content: 'SOP excerpt for same-day processing',
      source: 'SOP: PBMC Isolation v3.2',
      date: '2025-09-14',
      weight: 0.5,
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_ORG)

    expect(passport).toBeDefined()
    expect(passport!.history.length).toBe(2)
    expect(passport!.history[0].eventType).toBe('Evidence submitted')
    expect(passport!.history[1].eventType).toBe('Claim created')
    expect(passport!.history.every((event) => event.description.length > 0)).toBe(true)
    expect(passport!.history.every((event) => event.occurredAt.length > 0)).toBe(true)
    expect(passport!.recommendations).toEqual([])
    expect(passport!.claims.length).toBeGreaterThan(0)
    expect(passport!.identity.names.length).toBeGreaterThan(0)
    expect(passport!.capabilities.length).toBeGreaterThan(0)
  })

  it('does not invent portfolio or confidence movement events', async () => {
    setPortfolioAllowlistForTests({
      [SPONSOR_ORG]: [{ institutionId: SITE_ORG }],
    })

    const db = createFakeDb()
    const provenance = createProvenance({
      actorId: 'actor-1',
      organizationId: SITE_ORG,
      correlationId: 'corr-seed',
      summary: 'Seed',
    })

    const claimRow = await insertClaim(db, {
      claimTypeId: 'logistics.cold_chain.storage',
      name: 'Cold-chain storage',
      description: 'Monitored cold-chain storage',
      organizationId: SITE_ORG,
      domain: 'logistics',
      validEvidenceClasses: ['B'] as never,
      requiredEvidenceClasses: ['B'] as never,
      decays: true,
      decayPeriodMonths: 12,
      provenance,
    })

    await insertEvidenceNode(db, {
      claimId: (claimRow as { id: string }).id,
      evidenceClass: 'B' as never,
      content: 'Calibration log excerpt',
      source: 'Equipment maintenance log',
      date: '2024-11-02',
      weight: 0.4,
      provenance,
      visibility: siteVisibility(SITE_ORG),
    })

    await seedAuditEvent(db, {
      action: 'create',
      organization_id: SITE_ORG,
      resource_type: 'portfolio',
      summary: 'Institution added to sponsor portfolio',
      created_at: '2025-11-08T10:00:00.000Z',
    })

    await seedAuditEvent(db, {
      action: 'process_state.updated',
      organization_id: SITE_ORG,
      resource_type: 'evidence_core',
      summary: 'claim claim-1 → archived: confidence review',
      created_at: '2026-06-12T14:30:00.000Z',
    })

    const store = new EvidenceCorePassportStore(async () => db)
    const passport = await store.getInstitutionalPassport(SPONSOR_ORG, SITE_ORG)

    expect(passport!.history).toHaveLength(1)
    expect(passport!.history[0].eventType).toBe('Process state updated')
    expect(passport!.history[0].description).toContain('archived')
  })
})
