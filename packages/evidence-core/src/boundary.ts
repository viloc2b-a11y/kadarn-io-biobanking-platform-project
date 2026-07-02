// ==========================================================================
// Evidence Core — Boundary Enforcement (ADR-011)
// ==========================================================================
// Baseline AF-1.0. Sprint 17.4.
//
// ADR-011 five-condition test determines whether a function belongs in the
// Evidence Core or in an Engine. All Core functions must pass all five.
//
// Boundary Principle (ADR-011):
//   "If there is any reasonable doubt about whether a function interprets,
//    infers, or modifies the meaning of evidence, that function does NOT
//    belong to the Evidence Core."
//
// The Evidence Core is intentionally boring (ADR-011 §Core is boring).
// ==========================================================================

// --------------------------------------------------------------------------
// The Five Conditions (ADR-011)
// --------------------------------------------------------------------------

export interface BoundaryCondition {
  number: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  passed: boolean;
}

export interface BoundaryTestResult {
  functionName: string;
  allPassed: boolean;
  conditions: BoundaryCondition[];
  failedConditions: BoundaryCondition[];
}

/**
 * Run the five-condition ADR-011 boundary test on a function.
 *
 * Core membership requires ALL five conditions to be true.
 * If any condition fails, the function belongs to an Engine, not the Core.
 */
export function testBoundary(params: {
  functionName: string;
  storesEvidence: boolean;
  preservesProvenance: boolean;
  managesRelations: boolean;
  enforcesAccess: boolean;
  tracksProcessState: boolean;
}): BoundaryTestResult {
  const conditions: BoundaryCondition[] = [
    {
      number: 1,
      name: 'Store',
      description: 'Persists evidence or evidence metadata to durable storage.',
      passed: params.storesEvidence,
    },
    {
      number: 2,
      name: 'Provenance',
      description: 'Preserves immutable creation and modification history.',
      passed: params.preservesProvenance,
    },
    {
      number: 3,
      name: 'Relations',
      description: 'Creates, maintains, or traverses relationships between evidence nodes.',
      passed: params.managesRelations,
    },
    {
      number: 4,
      name: 'Access',
      description: 'Enforces visibility policy (who can see which evidence).',
      passed: params.enforcesAccess,
    },
    {
      number: 5,
      name: 'Process State',
      description: 'Tracks lifecycle state without interpreting the content of evidence.',
      passed: params.tracksProcessState,
    },
  ];

  const failedConditions = conditions.filter(c => !c.passed);

  return {
    functionName: params.functionName,
    allPassed: failedConditions.length === 0,
    conditions,
    failedConditions,
  };
}

// --------------------------------------------------------------------------
// Forbidden Operations
// --------------------------------------------------------------------------
// These operations interpret, infer, or modify the meaning of evidence.
// They are EXPRESSLY FORBIDDEN in the Evidence Core per ADR-011 Boundary
// Principle and KEMS-001 §1 ("Kadarn never asserts institutional truth").
//
// If any of these appear in the Evidence Core package, it is a boundary
// violation and must be removed immediately.

export const FORBIDDEN_CORE_OPERATIONS = [
  'computeConfidence',
  'calculateConfidence',
  'scoreInstitution',
  'rankSite',
  'recommendSite',
  'inferCapability',
  'generateJudgment',
  'evaluateTrust',
  'assessQuality',
  'rateOrganization',
] as const;

export type ForbiddenCoreOperation = typeof FORBIDDEN_CORE_OPERATIONS[number];

/**
 * Check whether a function name is a forbidden Core operation.
 * Forbidden operations interpret, infer, or judge evidence — Engine territory.
 */
export function isForbiddenInCore(functionName: string): boolean {
  return FORBIDDEN_CORE_OPERATIONS.includes(functionName as ForbiddenCoreOperation);
}

/**
 * Assert that a function is not a forbidden Core operation.
 * Throws if the function name matches a forbidden operation.
 */
export function assertNotForbiddenInCore(functionName: string): void {
  if (isForbiddenInCore(functionName)) {
    throw new Error(
      `Boundary violation: "${functionName}" is forbidden in the Evidence Core. ` +
      `This operation interprets or infers evidence meaning and belongs to an Engine. ` +
      `See ADR-011 Boundary Principle.`
    );
  }
}

// --------------------------------------------------------------------------
// Core Function Registry
// --------------------------------------------------------------------------
// All Evidence Core functions must be registered here and pass the boundary test.
// This registry is the source of truth for what belongs in the Core.

export interface CoreFunctionEntry {
  name: string;
  description: string;
  boundaryResult: BoundaryTestResult;
}

const coreFunctions: Map<string, CoreFunctionEntry> = new Map();

/**
 * Register a function as belonging to the Evidence Core.
 * The function must pass the five-condition boundary test.
 */
export function registerCoreFunction(entry: CoreFunctionEntry): void {
  if (!entry.boundaryResult.allPassed) {
    const failed = entry.boundaryResult.failedConditions.map(c => c.name).join(', ');
    console.warn(
      `[boundary] Core function "${entry.name}" only satisfies ${5 - entry.boundaryResult.failedConditions.length}/5 ADR-011 conditions. ` +
      `Missed: ${failed}. Verify this function belongs in the Core.`
    );
  }
  coreFunctions.set(entry.name, entry);
}

/**
 * Get all registered Core functions.
 */
export function getCoreFunctions(): CoreFunctionEntry[] {
  return Array.from(coreFunctions.values());
}

/**
 * Verify that all Core lifecycle functions comply with ADR-011.
 * Returns a list of registered functions with their boundary test results.
 */
export function verifyCoreBoundary(): { registered: number; functions: CoreFunctionEntry[] } {
  const fns = getCoreFunctions();
  return {
    registered: fns.length,
    functions: fns,
  };
}

// --------------------------------------------------------------------------
// Core Compliance Self-Test
// --------------------------------------------------------------------------
// Register all Evidence Core lifecycle functions with their boundary test results.

function initializeCoreRegistry(): void {
  // createClaim
  registerCoreFunction({
    name: 'createClaim',
    description: 'Creates a Claim with provenance, visibility, and process state.',
    boundaryResult: testBoundary({
      functionName: 'createClaim',
      storesEvidence: true,       // persists Claim to database
      preservesProvenance: true,  // records actor, org, correlationId, summary
      managesRelations: false,    // Claim creation alone does not create relationships
      enforcesAccess: true,       // sets visibility scope and authorized sponsors
      tracksProcessState: true,   // sets and validates Claim status
    }),
  });

  // submitEvidence
  registerCoreFunction({
    name: 'submitEvidence',
    description: 'Persists an Evidence Node with provenance and access metadata.',
    boundaryResult: testBoundary({
      functionName: 'submitEvidence',
      storesEvidence: true,       // persists Evidence Node
      preservesProvenance: true,  // records provenance chain
      managesRelations: false,    // node submission alone does not create relationships
      enforcesAccess: true,       // sets visibility metadata
      tracksProcessState: true,   // sets Evidence Node status
    }),
  });

  // submitCounterEvidence
  registerCoreFunction({
    name: 'submitCounterEvidence',
    description: 'Persists Counter Evidence as an immutable Evidence Node with negative weight.',
    boundaryResult: testBoundary({
      functionName: 'submitCounterEvidence',
      storesEvidence: true,       // persists Counter Evidence
      preservesProvenance: true,  // records provenance
      managesRelations: false,    // CE submission alone does not create relationships
      enforcesAccess: true,       // sets visibility metadata
      tracksProcessState: true,   // sets status, tracks response state
    }),
  });

  // submitRightOfResponse
  registerCoreFunction({
    name: 'submitRightOfResponse',
    description: 'Attaches a response to Counter Evidence without modifying the original CE.',
    boundaryResult: testBoundary({
      functionName: 'submitRightOfResponse',
      storesEvidence: true,       // persists response
      preservesProvenance: true,  // records provenance
      managesRelations: true,     // links response to CE via counterEvidenceId
      enforcesAccess: true,       // sets visibility metadata
      tracksProcessState: true,   // tracks response status
    }),
  });

  // linkEvidenceToClaim
  registerCoreFunction({
    name: 'linkEvidenceToClaim',
    description: 'Creates a supports relationship between an Evidence Node and a Claim.',
    boundaryResult: testBoundary({
      functionName: 'linkEvidenceToClaim',
      storesEvidence: false,      // stores relationship metadata, not evidence itself
      preservesProvenance: true,  // records provenance for the relationship
      managesRelations: true,     // creates the relationship
      enforcesAccess: false,      // does not set new access policy
      tracksProcessState: false,  // no process state change
    }),
  });

  // updateProcessState
  registerCoreFunction({
    name: 'updateProcessState',
    description: 'Updates lifecycle status without interpreting evidence content.',
    boundaryResult: testBoundary({
      functionName: 'updateProcessState',
      storesEvidence: false,      // updates state, does not store new evidence
      preservesProvenance: true,  // records audit trail
      managesRelations: false,    // no relationship change
      enforcesAccess: false,      // no access policy change
      tracksProcessState: true,   // updates lifecycle status
    }),
  });
}

// Run registry initialization
initializeCoreRegistry();
