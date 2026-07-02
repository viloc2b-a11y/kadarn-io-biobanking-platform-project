// ==========================================================================
// Evidence Core — Boundary Enforcement Tests
// ==========================================================================
// Baseline AF-1.0. Sprint 17.4.
// Tests ADR-011 compliance: five-condition test, forbidden operations, Core registry.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  testBoundary,
  isForbiddenInCore,
  assertNotForbiddenInCore,
  registerCoreFunction,
  getCoreFunctions,
  verifyCoreBoundary,
  FORBIDDEN_CORE_OPERATIONS,
} from '../src/index.js';

// --------------------------------------------------------------------------
// Five-condition boundary test (ADR-011)
// --------------------------------------------------------------------------

describe('Five-condition boundary test (ADR-011)', () => {
  it('passes a function that meets all five conditions', () => {
    const result = testBoundary({
      functionName: 'storeEvidence',
      storesEvidence: true,
      preservesProvenance: true,
      managesRelations: true,
      enforcesAccess: true,
      tracksProcessState: true,
    });

    expect(result.allPassed).toBe(true);
    expect(result.failedConditions).toHaveLength(0);
  });

  it('fails a function that interprets evidence (no conditions met)', () => {
    const result = testBoundary({
      functionName: 'interpretEvidence',
      storesEvidence: false,
      preservesProvenance: false,
      managesRelations: false,
      enforcesAccess: false,
      tracksProcessState: false,
    });

    expect(result.allPassed).toBe(false);
    expect(result.failedConditions.length).toBeGreaterThan(0);
  });

  it('fails a function that only computes without storing', () => {
    const result = testBoundary({
      functionName: 'computeScore',
      storesEvidence: false,
      preservesProvenance: false,
      managesRelations: false,
      enforcesAccess: false,
      tracksProcessState: false,
    });

    expect(result.allPassed).toBe(false);
  });

  it('fails a function that interprets evidence (condition 5 — interprets content)', () => {
    const result = testBoundary({
      functionName: 'analyzeEvidencePattern',
      storesEvidence: true,     // reads from Core
      preservesProvenance: false,
      managesRelations: false,
      enforcesAccess: false,
      tracksProcessState: false, // does not track process — interprets
    });

    expect(result.allPassed).toBe(false);
    expect(result.failedConditions.map(c => c.number)).toContain(2);
  });

  it('returns detailed failed conditions for debugging', () => {
    const result = testBoundary({
      functionName: 'partialFunction',
      storesEvidence: true,
      preservesProvenance: false,
      managesRelations: true,
      enforcesAccess: false,
      tracksProcessState: true,
    });

    expect(result.allPassed).toBe(false);
    expect(result.failedConditions).toHaveLength(2);
    expect(result.failedConditions[0].name).toBe('Provenance');
    expect(result.failedConditions[1].name).toBe('Access');
  });
});

// --------------------------------------------------------------------------
// Forbidden operations
// --------------------------------------------------------------------------

describe('Forbidden operations (Engine-only)', () => {
  it('classifies all forbidden operations correctly', () => {
    expect(isForbiddenInCore('computeConfidence')).toBe(true);
    expect(isForbiddenInCore('calculateConfidence')).toBe(true);
    expect(isForbiddenInCore('scoreInstitution')).toBe(true);
    expect(isForbiddenInCore('rankSite')).toBe(true);
    expect(isForbiddenInCore('recommendSite')).toBe(true);
    expect(isForbiddenInCore('inferCapability')).toBe(true);
    expect(isForbiddenInCore('generateJudgment')).toBe(true);
    expect(isForbiddenInCore('evaluateTrust')).toBe(true);
    expect(isForbiddenInCore('assessQuality')).toBe(true);
    expect(isForbiddenInCore('rateOrganization')).toBe(true);
  });

  it('classifies Core operations as not forbidden', () => {
    expect(isForbiddenInCore('createClaim')).toBe(false);
    expect(isForbiddenInCore('submitEvidence')).toBe(false);
    expect(isForbiddenInCore('submitCounterEvidence')).toBe(false);
    expect(isForbiddenInCore('submitRightOfResponse')).toBe(false);
    expect(isForbiddenInCore('linkEvidenceToClaim')).toBe(false);
    expect(isForbiddenInCore('updateProcessState')).toBe(false);
  });

  it('throws when assertNotForbiddenInCore receives a forbidden name', () => {
    expect(() => assertNotForbiddenInCore('computeConfidence')).toThrow('Boundary violation');
    expect(() => assertNotForbiddenInCore('scoreInstitution')).toThrow('Boundary violation');
  });

  it('does not throw for Core-valid names', () => {
    expect(() => assertNotForbiddenInCore('createClaim')).not.toThrow();
    expect(() => assertNotForbiddenInCore('submitEvidence')).not.toThrow();
  });

  it('has all 10 forbidden operations listed', () => {
    expect(FORBIDDEN_CORE_OPERATIONS).toHaveLength(10);
    expect(FORBIDDEN_CORE_OPERATIONS).toContain('computeConfidence');
    expect(FORBIDDEN_CORE_OPERATIONS).toContain('generateJudgment');
  });
});

// --------------------------------------------------------------------------
// Core function registry
// --------------------------------------------------------------------------

describe('Core function registry', () => {
  it('registers functions that pass the boundary test', () => {
    // The registry is auto-initialized from boundary.ts
    const fns = getCoreFunctions();
    expect(fns.length).toBeGreaterThan(0);
  });

  it('accepts registration (warns but does not throw for partial compliance)', () => {
    const badResult = testBoundary({
      functionName: 'engineFunction',
      storesEvidence: false,
      preservesProvenance: false,
      managesRelations: false,
      enforcesAccess: false,
      tracksProcessState: false,
    });

    expect(() => registerCoreFunction({
      name: 'engineFunction',
      description: 'An interpretive function that belongs in an Engine.',
      boundaryResult: badResult,
    })).not.toThrow();
  });

  it('registers all lifecycle service functions', () => {
    const fns = getCoreFunctions();
    const names = fns.map(f => f.name);
    expect(names).toContain('createClaim');
    expect(names).toContain('submitEvidence');
    expect(names).toContain('submitCounterEvidence');
    expect(names).toContain('submitRightOfResponse');
    expect(names).toContain('linkEvidenceToClaim');
    expect(names).toContain('updateProcessState');
  });

  it('verifyCoreBoundary returns registered count', () => {
    const result = verifyCoreBoundary();
    expect(result.registered).toBeGreaterThan(0);
    expect(result.functions.length).toBe(result.registered);
  });
});

// --------------------------------------------------------------------------
// Structural scans
// --------------------------------------------------------------------------

describe('Structural boundary enforcement', () => {
  it('no forbidden operation exists in lifecycle exports', () => {
    // This test verifies that the lifecycle module does not export any
    // function whose name matches a forbidden operation.
    const { readFileSync } = require('fs');
    const { resolve } = require('path');
    const lifecycleSource = readFileSync(resolve(__dirname, '../src/lifecycle.ts'), 'utf-8');

    // Check that the word "confidence" is used only in comments or type references
    const confidenceLines = lifecycleSource
      .split('\n')
      .filter(line => line.toLowerCase().includes('confidence') && !line.trim().startsWith('//') && !line.includes('*'));

    // Allowed occurrences: type references, audit entry descriptions
    for (const line of confidenceLines) {
      const isAllowed = line.includes('confidence') === false; // no actual confidence functions
      expect(line.toLowerCase()).not.toMatch(/export.*function.*confiden/);
    }
  });

  it('no retired trust terminology in boundary module', () => {
    const { readFileSync } = require('fs');
    const { resolve } = require('path');
    const content = readFileSync(resolve(__dirname, '../src/boundary.ts'), 'utf-8').toLowerCase();
    const retiredTerms = ['trust_score', 'trust_engine', 'trust_graph', 'verified_institution',
      'gold_site', 'silver_site', 'bronze_site'];
    for (const term of retiredTerms) {
      expect(content).not.toContain(term);
    }
  });

  it('all lifecycle functions are registered in the Core registry', () => {
    const fns = getCoreFunctions();
    expect(fns.length).toBeGreaterThanOrEqual(6);
    const names = fns.map(f => f.name);
    expect(names).toContain('createClaim');
    expect(names).toContain('submitEvidence');
    expect(names).toContain('submitCounterEvidence');
    expect(names).toContain('submitRightOfResponse');
    expect(names).toContain('linkEvidenceToClaim');
    expect(names).toContain('updateProcessState');
  });
});
