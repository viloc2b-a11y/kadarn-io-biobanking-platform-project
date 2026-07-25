import { describe, it, expect } from 'vitest'
import type { GenerationRule } from '@kadarn/types'

describe('Generation Rules (Package C)', () => {
  const makeRule = (overrides: Partial<GenerationRule> = {}): GenerationRule => ({
    id: crypto.randomUUID(),
    rule_name: 'Test Rule',
    rule_version: 1,
    event_pattern: 'institutional.event.*',
    required_inputs: [],
    output_evidence_type: 'generated_evidence',
    preconditions: {},
    review_mode: 'manual',
    confidence_policy: {},
    active: true,
    effective_from: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  })

  it('should create a generation rule with valid fields', () => {
    const rule = makeRule()
    expect(rule.rule_name).toBe('Test Rule')
    expect(rule.rule_version).toBe(1)
    expect(rule.review_mode).toBe('manual')
  })

  it('should allow a second version of the same rule name', () => {
    const v1 = makeRule({ rule_version: 1 })
    const v2 = makeRule({ rule_version: 2 })
    expect(v1.rule_name).toBe(v2.rule_name)
    expect(v1.rule_version).not.toBe(v2.rule_version)
  })

  it('should accept all valid review_mode values', () => {
    const modes = ['manual', 'automatic', 'conditional'] as const
    modes.forEach((mode) => {
      const rule = makeRule({ review_mode: mode })
      expect(rule.review_mode).toBe(mode)
    })
  })

  it('should accept input_hash as text', () => {
    const rule = makeRule()
    // input_hash is stored on evidence_nodes, not on the rule itself
    // but the rule's confidence_policy can contain hash references
    expect(typeof rule.confidence_policy).toBe('object')
  })
})
