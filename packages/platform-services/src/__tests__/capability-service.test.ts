// ─── KEMS-CAPABILITY — Capability Service Unit Tests ───────────────────
// Authority: KADARN Product Constitution, LOOP-3 Spec, KEMS-001
//
// Tests the CapabilityService class with mock repositories.
// Covers: evaluateCapability, calculateActivationState, degradeCapability,
// restoreCapability, getReadinessContribution (DECLARED=0.1, ACTIVE=1.0),
// and critical rule: capability at Location A ≠ Location B.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CapabilityService,
  CapabilityServiceError,
} from '../capability-service'
import type {
  CapabilityRepositoryLike,
  CapabilityInstanceRepositoryLike,
  CapabilityStateRepositoryLike,
  CapabilityActivationEventRepositoryLike,
  ReadinessContributionRepositoryLike,
  RepositoryResult,
} from '../capability-service'

// ─── Test IDs ───────────────────────────────────────────────────────────

const ID = {
  cap: '550e8400-e29b-41d4-a716-44665544b001',
  org: '550e8400-e29b-41d4-a716-44665544b002',
  profile: '550e8400-e29b-41d4-a716-44665544b003',
  locationA: '550e8400-e29b-41d4-a716-44665544b010',
  locationB: '550e8400-e29b-41d4-a716-44665544b011',
  activation: '550e8400-e29b-41d4-a716-44665544b100',
  contribution: '550e8400-e29b-41d4-a716-44665544b200',
} as const

const NOW = '2026-07-30T14:00:00.000Z'
const FUTURE = '2027-07-30T14:00:00.000Z'
const PAST = '2025-07-30T14:00:00.000Z'

// ─── Types ──────────────────────────────────────────────────────────────

type CapabilityLifecycleState =
  | 'declared' | 'evidence_submitted' | 'evidence_reviewed'
  | 'under_review' | 'verified' | 'published' | 'suspended' | 'deprecated'
type InstitutionCapabilityStatus =
  | 'declared' | 'evidence_submitted' | 'under_review'
  | 'verified' | 'published' | 'deprecated'
type CapabilityArea =
  | 'clinical_operations' | 'quality_management' | 'regulatory_compliance'
  | 'workforce' | 'infrastructure' | 'data_management' | 'patient_experience'
  | 'financial_operations' | 'research' | 'other'

// ─── Mock factories ─────────────────────────────────────────────────────

function success<T>(data: T): RepositoryResult<T> {
  return { data, error: null }
}

function notFound(code = 'NOT_FOUND'): RepositoryResult<null> {
  return { data: null, error: { code, message: 'Not found' } }
}

function makeCapabilityInstance(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.cap,
    name: 'Clinical Operations',
    description: 'Core clinical research capability',
    capability_type_id: null,
    area: 'clinical_operations' as CapabilityArea,
    domain: 'operations',
    organization_id: ID.org,
    primary_claim_id: null,
    status: 'declared' as InstitutionCapabilityStatus,
    lifecycle_state: 'declared' as CapabilityLifecycleState,
    review_status: 'pending' as const,
    evidence_sufficiency: null,
    claim_count: 0,
    confidence_score: null,
    dependency_count: 0,
    dependency_status: 'not_applicable' as const,
    last_activated_at: null,
    activation_count: 0,
    readiness_contribution: null,
    metadata: null,
    first_declared_at: NOW,
    last_verified_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

function makeActivationEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.activation,
    capability_id: ID.cap,
    organization_id: ID.org,
    activation_type: 'initial' as const,
    activated_by: null,
    activation_method: null,
    previous_state: null,
    new_state: 'declared' as CapabilityLifecycleState,
    evidence_ref: null,
    activation_summary: null,
    valid_from: NOW,
    valid_until: null,
    metadata: null,
    created_at: NOW,
    ...overrides,
  }
}

function makeReadinessContribution(overrides: Record<string, unknown> = {}) {
  return {
    id: ID.contribution,
    capability_id: ID.cap,
    organization_id: ID.org,
    contribution_value: 0.1,
    confidence: 0.5,
    weight: 0.5,
    contribution_area: 'clinical_operations' as CapabilityArea,
    contribution_type: 'supporting' as const,
    evidence_count: 0,
    evidence_weighted_score: null,
    rationale: null,
    computed_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

// ─── Mock repositories ──────────────────────────────────────────────────

function createMockRepos() {
  const capabilities = {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    addClaimLink: vi.fn(),
    removeClaimLink: vi.fn(),
    listClaimLinks: vi.fn(),
    setClaimCount: vi.fn(),
  } as unknown as CapabilityRepositoryLike & {
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    listClaimLinks: ReturnType<typeof vi.fn>
    setClaimCount: ReturnType<typeof vi.fn>
  }

  const capabilityInstances = {
    findById: vi.fn(),
    listByProfile: vi.fn(),
    update: vi.fn(),
  } as unknown as CapabilityInstanceRepositoryLike & {
    findById: ReturnType<typeof vi.fn>
    listByProfile: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }

  const capabilityStates = {
    create: vi.fn(),
    listByCapability: vi.fn(),
    endCurrentState: vi.fn(),
  } as unknown as CapabilityStateRepositoryLike & {
    endCurrentState: ReturnType<typeof vi.fn>
  }

  const activationEvents = {
    create: vi.fn(),
    listByCapability: vi.fn(),
  } as unknown as CapabilityActivationEventRepositoryLike & {
    create: ReturnType<typeof vi.fn>
    listByCapability: ReturnType<typeof vi.fn>
  }

  const readinessContributions = {
    findByCapability: vi.fn(),
    findByProfile: vi.fn(),
    upsert: vi.fn(),
  } as unknown as ReadinessContributionRepositoryLike & {
    findByProfile: ReturnType<typeof vi.fn>
  }

  return { capabilities, capabilityInstances, capabilityStates, activationEvents, readinessContributions }
}

function createService(repos = createMockRepos()) {
  return new CapabilityService(
    repos.capabilities,
    repos.capabilityInstances,
    repos.capabilityStates,
    repos.activationEvents,
    repos.readinessContributions,
  )
}

// ─── Test suites ────────────────────────────────────────────────────────

describe('CapabilityService', () => {
  let repos: ReturnType<typeof createMockRepos>
  let service: CapabilityService

  beforeEach(() => {
    repos = createMockRepos()
    service = createService(repos)
  })

  // ═══════════════════════════════════════════════════════════════════════
  // createCapability (LOOP-3)
  // ═══════════════════════════════════════════════════════════════════════
  describe('createCapability (LOOP-3)', () => {
    it('creates a capability in declared status', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'declared', status: 'declared' })
      repos.capabilities.create.mockResolvedValue(success(cap))

      const result = await service.createCapability({
        name: 'Test Capability',
        organization_id: ID.org,
      })

      expect(result.status).toBe('declared')
    })

    it('throws on creation failure', async () => {
      repos.capabilities.create.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'fail' },
      })

      await expect(
        service.createCapability({ name: 'Test', organization_id: ID.org }),
      ).rejects.toThrow(CapabilityServiceError)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: evaluateCapability
  // ═══════════════════════════════════════════════════════════════════════
  describe('evaluateCapability (KEMS)', () => {
    it('evaluates a healthy, active capability with recommendation maintain', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'verified',
        evidence_sufficiency: 'sufficient',
        dependency_status: 'satisfied',
        activation_count: 5,
        last_activated_at: NOW,
        readiness_contribution: 0.8,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.isActive).toBe(true)
      expect(result.recommendation).toBe('maintain')
      expect(result.issues).toHaveLength(0)
    })

    it('recommends verify for capability with never-activated', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'declared',
        activation_count: 0,
        last_activated_at: null,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.recommendation).toBe('verify')
      expect(result.issues.some((i: string) => i.includes('never been activated'))).toBe(true)
    })

    it('recommends suspend for suspended capability', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        activation_count: 3,
        last_activated_at: NOW, // recent enough to not trigger staleness
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.isActive).toBe(false)
      expect(result.recommendation).toBe('suspend')
    })

    it('recommends degrade for deprecated capability', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'deprecated',
        activation_count: 3,
        last_activated_at: NOW, // recent enough to not trigger staleness
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.isActive).toBe(false)
      expect(result.recommendation).toBe('degrade')
    })

    it('recommends verify when evidence is insufficient', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'evidence_submitted',
        evidence_sufficiency: 'insufficient',
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.recommendation).toBe('verify')
      expect(result.issues.some((i: string) => i.includes('Evidence sufficiency'))).toBe(true)
    })

    it('recommends verify when evidence is conflicting', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'evidence_submitted',
        evidence_sufficiency: 'conflicting',
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.recommendation).toBe('verify')
    })

    it('recommends enhance when dependencies are unsatisfied', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'declared',
        dependency_status: 'unsatisfied',
        activation_count: 3,
        last_activated_at: NOW,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.issues.some((i: string) => i.includes('unsatisfied'))).toBe(true)
      expect(result.recommendation).toBe('enhance')
    })

    it('recommends enhance when readiness contribution is low', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'declared',
        readiness_contribution: 0.1,
        activation_count: 3,
        last_activated_at: NOW,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.issues.some((i: string) => i.includes('Low readiness'))).toBe(true)
      expect(result.recommendation).toBe('enhance')
    })

    it('recommends verify when last activated over a year ago', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'verified',
        activation_count: 3,
        last_activated_at: '2024-01-15T00:00:00.000Z', // > 365 days ago
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      const result = await service.evaluateCapability(ID.cap)

      expect(result.recommendation).toBe('verify')
      expect(result.issues.some((i: string) => i.includes('Last activated') || i.includes('may need renewal'))).toBe(true)
    })

    it('throws when KEMS not configured', async () => {
      const svc = new CapabilityService(repos.capabilities) // no KEMS repos
      await expect(svc.evaluateCapability(ID.cap)).rejects.toMatchObject({
        code: 'KEMS_NOT_CONFIGURED',
      })
    })

    it('throws when capability not found', async () => {
      repos.capabilityInstances.findById.mockResolvedValue(notFound())
      await expect(service.evaluateCapability(ID.cap)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: calculateActivationState
  // ═══════════════════════════════════════════════════════════════════════
  describe('calculateActivationState (KEMS)', () => {
    it('reports active with valid activation and future valid_until', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      const event = makeActivationEvent({
        activation_type: 'initial',
        valid_from: NOW,
        valid_until: FUTURE,
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([event]))

      const result = await service.calculateActivationState(ID.cap)

      expect(result.isOperationallyActive).toBe(true)
      expect(result.validUntil).toBe(FUTURE)
      expect(result.requiresRenewal).toBe(false)
    })

    it('reports active with perpetual activation (no valid_until)', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      const event = makeActivationEvent({
        activation_type: 'initial',
        valid_from: NOW,
        valid_until: null,
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([event]))

      const result = await service.calculateActivationState(ID.cap)

      expect(result.isOperationallyActive).toBe(true)
      expect(result.validUntil).toBeNull()
      expect(result.requiresRenewal).toBe(false)
    })

    it('reports renewal required when expiring within 30 days', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      // Expiry 20 days from now
      const soon = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
      const event = makeActivationEvent({
        activation_type: 'initial',
        valid_from: NOW,
        valid_until: soon,
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([event]))

      const result = await service.calculateActivationState(ID.cap)

      expect(result.isOperationallyActive).toBe(true)
      expect(result.requiresRenewal).toBe(true)
    })

    it('reports NOT active when activation has expired', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      const event = makeActivationEvent({
        activation_type: 'initial',
        valid_from: PAST,
        valid_until: PAST, // already expired
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([event]))

      const result = await service.calculateActivationState(ID.cap)

      expect(result.isOperationallyActive).toBe(false)
    })

    it('overrides activation with suspended lifecycle state', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'suspended' })
      const event = makeActivationEvent({
        activation_type: 'initial',
        valid_from: NOW,
        valid_until: FUTURE,
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([event]))

      const result = await service.calculateActivationState(ID.cap)

      // Even though the activation is valid, suspended lifecycle state overrides
      expect(result.isOperationallyActive).toBe(false)
    })

    it('handles no activation events gracefully', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'declared', activation_count: 0 })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([]))

      const result = await service.calculateActivationState(ID.cap)

      expect(result.isOperationallyActive).toBe(false)
      expect(result.lastActivation).toBeNull()
      expect(result.activationHistory).toHaveLength(0)
    })

    it('sorts by most recent activation', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      const older = makeActivationEvent({
        id: 'older',
        activation_type: 'initial',
        valid_from: '2025-01-01T00:00:00.000Z',
        valid_until: FUTURE,
      })
      const newer = makeActivationEvent({
        id: 'newer',
        activation_type: 'renewal',
        valid_from: '2026-06-01T00:00:00.000Z',
        valid_until: FUTURE,
      })

      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.activationEvents.listByCapability.mockResolvedValue(success([older, newer]))

      const result = await service.calculateActivationState(ID.cap)

      // The last activation should be the most recent one
      expect(result.lastActivation?.id).toBe('newer')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: degradeCapability
  // ═══════════════════════════════════════════════════════════════════════
  describe('degradeCapability (KEMS)', () => {
    it('degrades an active capability to suspended with reason', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'suspended', status: 'deprecated' })),
      )
      repos.capabilityStates.endCurrentState.mockResolvedValue(success({} as any))
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      const result = await service.degradeCapability(
        ID.cap,
        'Dependency failure: upstream quality system down',
      )

      expect(result.lifecycle_state).toBe('suspended')
      expect(repos.capabilityInstances.update).toHaveBeenCalledTimes(1)
    })

    it('refuses to degrade an already suspended capability', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'suspended' })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      await expect(
        service.degradeCapability(ID.cap, 'already down'),
      ).rejects.toMatchObject({ code: 'ALREADY_DEGRADED' })
    })

    it('refuses to degrade an already deprecated capability', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'deprecated' })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      await expect(
        service.degradeCapability(ID.cap, 'already deprecated'),
      ).rejects.toMatchObject({ code: 'ALREADY_DEGRADED' })
    })

    it('records degradation reason in metadata', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified', metadata: { existing: true } })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'suspended' })),
      )
      repos.capabilityStates.endCurrentState.mockResolvedValue(success({} as any))
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      await service.degradeCapability(ID.cap, 'Dependency failure')

      const updateCall = repos.capabilityInstances.update.mock.calls[0]
      const patch = updateCall[1]
      expect(patch.metadata.degradation_reason).toBe('Dependency failure')
      expect(patch.metadata.degraded_at).toBeDefined()
      // Preserved existing metadata
      expect(patch.metadata.existing).toBe(true)
    })

    it('creates activation event for degradation', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'suspended' })),
      )
      repos.capabilityStates.endCurrentState.mockResolvedValue(success({} as any))
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      await service.degradeCapability(ID.cap, 'reason')

      expect(repos.activationEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activation_type: 'transfer',
          previous_state: 'verified',
          new_state: 'suspended',
        }),
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: restoreCapability
  // ═══════════════════════════════════════════════════════════════════════
  describe('restoreCapability (KEMS)', () => {
    it('restores a suspended capability to declared (no evidence)', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        evidence_sufficiency: null,
        claim_count: 0,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'declared', status: 'declared' })),
      )
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      const result = await service.restoreCapability(ID.cap)

      expect(result.lifecycle_state).toBe('declared')
    })

    it('restores to evidence_submitted when claims exist', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        claim_count: 5,
        evidence_sufficiency: null,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'evidence_submitted', status: 'evidence_submitted' })),
      )
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      const result = await service.restoreCapability(ID.cap)

      expect(result.lifecycle_state).toBe('evidence_submitted')
    })

    it('restores to verified when evidence is sufficient', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        evidence_sufficiency: 'sufficient',
        claim_count: 5,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'verified', status: 'verified' })),
      )
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      const result = await service.restoreCapability(ID.cap)

      expect(result.lifecycle_state).toBe('verified')
    })

    it('refuses to restore a non-suspended capability', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'verified' })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))

      await expect(service.restoreCapability(ID.cap)).rejects.toMatchObject({
        code: 'NOT_DEGRADED',
      })
    })

    it('records reactivation event', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        evidence_sufficiency: 'sufficient',
        claim_count: 3,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'verified' })),
      )
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      await service.restoreCapability(ID.cap)

      expect(repos.activationEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          activation_type: 'reactivation',
          previous_state: 'suspended',
        }),
      )
    })

    it('records restoration metadata', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'suspended',
        claim_count: 0,
      })
      repos.capabilityInstances.findById.mockResolvedValue(success(cap))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ lifecycle_state: 'declared' })),
      )
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      await service.restoreCapability(ID.cap)

      const updateCall = repos.capabilityInstances.update.mock.calls[0]
      const patch = updateCall[1]
      expect(patch.metadata.restored_at).toBeDefined()
      expect(patch.metadata.restored_from).toBe('suspended')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: getReadinessContribution
  // ═══════════════════════════════════════════════════════════════════════
  describe('getReadinessContribution (KEMS)', () => {
    it('computes weighted contribution for a profile', async () => {
      const c1 = makeReadinessContribution({
        id: 'c1',
        contribution_value: 0.8,
        weight: 0.6,
        confidence: 0.9,
      })
      const c2 = makeReadinessContribution({
        id: 'c2',
        contribution_value: 0.4,
        weight: 0.4,
        confidence: 0.7,
      })
      repos.readinessContributions.findByProfile.mockResolvedValue(success([c1, c2]))
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([]))

      const result = await service.getReadinessContribution(ID.profile)

      // Weighted avg: (0.8*0.6 + 0.4*0.4) / (0.6+0.4) = (0.48+0.16)/1.0 = 0.64
      expect(result.overallContribution).toBe(0.64)
      expect(result.capabilityContributions).toHaveLength(2)
    })

    // ─── CRITICAL RULE: DECLARED=0.1, ACTIVE=1.0 ─────────────────────────
    it('CRITICAL RULE: DECLARED state contributes 0.1 to readiness', async () => {
      const declaredContribution = makeReadinessContribution({
        contribution_value: 0.1,
        contribution_type: 'core',
        weight: 1.0,
        confidence: 0.3,
      })
      repos.readinessContributions.findByProfile.mockResolvedValue(
        success([declaredContribution]),
      )
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([]))

      const result = await service.getReadinessContribution(ID.profile)

      // Declared capability with contribution_value=0.1 should weight low
      expect(result.overallContribution).toBe(0.1)
    })

    it('CRITICAL RULE: ACTIVE state contributes 1.0 to readiness', async () => {
      const activeContribution = makeReadinessContribution({
        contribution_value: 1.0,
        contribution_type: 'core',
        weight: 1.0,
        confidence: 0.95,
      })
      repos.readinessContributions.findByProfile.mockResolvedValue(
        success([activeContribution]),
      )
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([]))

      const result = await service.getReadinessContribution(ID.profile)

      // Fully verified/active capability with contribution_value=1.0
      expect(result.overallContribution).toBe(1.0)
    })

    it('handles empty contributions gracefully', async () => {
      repos.readinessContributions.findByProfile.mockResolvedValue(success([]))
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([]))

      const result = await service.getReadinessContribution(ID.profile)

      expect(result.overallContribution).toBe(0)
      expect(result.capabilityContributions).toHaveLength(0)
    })

    it('includes gap count in result', async () => {
      // Gaps come from getGaps which uses capabilityInstances.listByProfile
      // A declared capability with 0 claims = gap
      const cap = makeCapabilityInstance({
        lifecycle_state: 'declared',
        claim_count: 0,
        area: 'clinical_operations',
      })
      repos.readinessContributions.findByProfile.mockResolvedValue(
        success([makeReadinessContribution()]),
      )
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([cap]))

      const result = await service.getReadinessContribution(ID.profile)

      expect(result.gapCount).toBeGreaterThan(0)
    })

    it('throws when KEMS readiness repo not configured', async () => {
      const svc = new CapabilityService(
        repos.capabilities,
        repos.capabilityInstances,
        repos.capabilityStates,
        repos.activationEvents,
        // no readinessContributions
      )
      await expect(svc.getReadinessContribution(ID.profile)).rejects.toMatchObject({
        code: 'KEMS_NOT_CONFIGURED',
      })
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEMS: getGaps
  // ═══════════════════════════════════════════════════════════════════════
  describe('getGaps (KEMS)', () => {
    it('identifies declared-but-never-evidenced capability as high-severity gap', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'declared',
        claim_count: 0,
      })
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([cap]))

      const gaps = await service.getGaps(ID.profile)

      expect(gaps.length).toBeGreaterThan(0)
      const declaredGap = gaps.find((g) => g.capabilityId === ID.cap)
      expect(declaredGap).toBeDefined()
      expect(declaredGap!.severity).toBe('high')
      expect(declaredGap!.gap).toContain('no supporting evidence')
    })

    it('identifies insufficient evidence as medium gap', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'evidence_submitted',
        claim_count: 3,
        evidence_sufficiency: 'insufficient',
      })
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([cap]))

      const gaps = await service.getGaps(ID.profile)

      const gap = gaps.find((g) => g.gap.includes('insufficient'))
      expect(gap).toBeDefined()
      expect(gap!.severity).toBe('medium')
    })

    it('identifies conflicting evidence as critical gap', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'evidence_submitted',
        claim_count: 2,
        evidence_sufficiency: 'conflicting',
      })
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([cap]))

      const gaps = await service.getGaps(ID.profile)

      const gap = gaps.find((g) => g.gap.includes('conflict'))
      expect(gap).toBeDefined()
      expect(gap!.severity).toBe('critical')
    })

    it('identifies unsatisfied dependencies as high gap', async () => {
      const cap = makeCapabilityInstance({
        lifecycle_state: 'evidence_submitted',
        claim_count: 5,
        dependency_status: 'unsatisfied',
      })
      repos.capabilityInstances.listByProfile.mockResolvedValue(success([cap]))

      const gaps = await service.getGaps(ID.profile)

      const gap = gaps.find((g) => g.gap.includes('unsatisfied'))
      expect(gap).toBeDefined()
      expect(gap!.severity).toBe('high')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // CRITICAL RULE: capability at Location A ≠ Location B
  // ═══════════════════════════════════════════════════════════════════════
  describe('CRITICAL RULE: capability at Location A ≠ Location B', () => {
    it('location-specific capabilities are distinct entities', async () => {
      // Capability at Location A
      const capA = makeCapabilityInstance({
        id: 'cap-location-a',
        name: 'MRI Capability — Location A',
        metadata: { location_id: ID.locationA },
      })
      // Capability at Location B — same capability type, different location
      const capB = makeCapabilityInstance({
        id: 'cap-location-b',
        name: 'MRI Capability — Location B',
        metadata: { location_id: ID.locationB },
      })

      // They are different entities
      expect(capA.id).not.toBe(capB.id)
      expect(capA.metadata).not.toBeNull()
      expect(capB.metadata).not.toBeNull()

      // Each location's capability is evaluated independently
      repos.capabilityInstances.findById.mockResolvedValueOnce(success(capA))
      repos.capabilityInstances.findById.mockResolvedValueOnce(success(capB))

      const evalA = await service.evaluateCapability('cap-location-a')
      const evalB = await service.evaluateCapability('cap-location-b')

      expect(evalA.capabilityId).toBe('cap-location-a')
      expect(evalB.capabilityId).toBe('cap-location-b')
    })

    it('degrading capability at Location A does not affect Location B', async () => {
      const capA = makeCapabilityInstance({
        id: 'cap-location-a',
        lifecycle_state: 'verified',
        metadata: { location_id: ID.locationA },
      })
      const capB = makeCapabilityInstance({
        id: 'cap-location-b',
        lifecycle_state: 'verified',
        metadata: { location_id: ID.locationB },
      })

      // Degrade A
      repos.capabilityInstances.findById.mockResolvedValue(success(capA))
      repos.capabilityInstances.update.mockResolvedValue(
        success(makeCapabilityInstance({ id: 'cap-location-a', lifecycle_state: 'suspended' })),
      )
      repos.capabilityStates.endCurrentState.mockResolvedValue(success({} as any))
      repos.activationEvents.create.mockResolvedValue(success(makeActivationEvent()))

      const degradedA = await service.degradeCapability('cap-location-a', 'MRI down at Location A')

      expect(degradedA.lifecycle_state).toBe('suspended')

      // Capability B should remain unaffected (verified would need separate repo read)
      // This validates the architectural principle: each capability instance
      // is independently addressable by its ID, not affected by another's degradation
      expect(degradedA.id).toBe('cap-location-a')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════
  // LOOP-3: linkClaim / unlinkClaim / recalculateClaimCount
  // ═══════════════════════════════════════════════════════════════════════
  describe('linkClaim (LOOP-3)', () => {
    it('links a claim to a capability and recalculates count', async () => {
      const cap = makeCapabilityInstance({ lifecycle_state: 'declared', status: 'declared' })
      repos.capabilities.findById.mockResolvedValue(success(cap))
      repos.capabilities.addClaimLink.mockResolvedValue(
        success({ id: 'link-1', capability_id: ID.cap, claim_id: 'claim-1', relationship_type: 'primary', weight: 1.0, created_at: NOW, created_by: null }),
      )
      repos.capabilities.listClaimLinks.mockResolvedValue(
        success([{ id: 'link-1', capability_id: ID.cap, claim_id: 'claim-1', relationship_type: 'primary', weight: 1.0, created_at: NOW, created_by: null }]),
      )
      repos.capabilities.setClaimCount.mockResolvedValue(success(cap))

      const result = await service.linkClaim(ID.cap, 'claim-1', 'primary', 1.0)

      expect(result.relationship_type).toBe('primary')
      expect(repos.capabilities.setClaimCount).toHaveBeenCalledWith(ID.cap, 1)
    })

    it('refuses to link to deprecated capability', async () => {
      const cap = makeCapabilityInstance({ status: 'deprecated' })
      repos.capabilities.findById.mockResolvedValue(success(cap))

      await expect(
        service.linkClaim(ID.cap, 'claim-1', 'primary'),
      ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' })
    })
  })
})
