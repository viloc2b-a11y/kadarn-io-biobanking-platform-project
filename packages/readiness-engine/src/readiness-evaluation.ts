// ==========================================================================
// Kadarn Readiness Engine — Readiness Evaluation Pipeline
// ==========================================================================
// KTP-1.3 Mission 4.
//
// Implements the KEMS flow:
//   Evidence → Claims → Confidence → Capability → Readiness → Sponsor Intelligence
//
// Boundaries:
//   - Readiness is DERIVED — evaluation_snapshot is a cache, not source of truth
//   - Does NOT write to evidence-core tables
//   - Does NOT interpret evidence content — only aggregates confidence
//
// Uses evaluateClaim from readiness-engine (moved per AMB-3 / ADR-011).
// evaluateClaim accepts pre-loaded evidence data (claims, evidenceNodes, etc.).
//
// KTP-1.3 additions:
//   - EvidenceSupport type and evidenceSupport field
//   - isReadinessType: skips org_capabilities for readiness program types
//   - N/A and UNKNOWN exclusion from mandatory/optional counts
//   - Self-report caps via shared computeEvidenceSupportLevel helper
//   - computeOverallConfidence excludes N/A and UNKNOWN
// ==========================================================================

import { evaluateClaim } from './output.js';
import type { ConfidenceReport } from './output.js';
import { computeEvidenceSupportLevel } from './readiness-helpers.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ReadinessStatus = 'not_ready' | 'partial' | 'conditionally_ready' | 'ready';

export type EvidenceSupport =
  | 'SUPPORTED_BY_EVIDENCE'
  | 'DECLARED_ONLY'
  | 'NEEDS_EVIDENCE'
  | 'PARTIALLY_SUPPORTED'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE'
  | 'NEEDS_REVIEW'
  | 'EXPIRED_OR_OUTDATED';

export interface CapabilityRequirement {
  id: string;
  capability_type_id: string;
  capability_type_key: string;
  capability_type_name: string;
  is_mandatory: boolean;
  minimum_confidence: number | null;
  display_order: number;
  evidence_requirements: EvidenceRequirement[];
}

export interface EvidenceRequirement {
  id: string;
  capability_requirement_id: string;
  evidence_class: string;
  is_mandatory: boolean;
  minimum_count: number;
  description: string | null;
}

export interface CapabilityReadinessResult {
  capabilityTypeId: string;
  capabilityTypeKey: string;
  capabilityTypeName: string;
  isMandatory: boolean;
  requiredConfidence: number;
  achievedConfidence: number;
  met: boolean;
  claims: ClaimAssessment[];
  evidenceGaps: EvidenceGap[];
  /** KTP-1.3: Evidence support level — drives N/A skip, UNKNOWN exclusion, and self-report cap */
  evidenceSupport: EvidenceSupport;
}

export interface ClaimAssessment {
  claimId: string;
  claimTitle: string;
  evidenceClass: string;
  confidenceValue: number;
  confidenceLevel: string;
  supportingEvidenceCount: number;
  contradictingEvidenceCount: number;
}

export interface EvidenceGap {
  evidenceClass: string;
  isMandatory: boolean;
  required: number;
  present: number;
  missing: number;
}

export interface ReadinessEvaluationResult {
  organizationId: string;
  programTypeKey: string;
  programTypeName: string;
  readinessStatus: ReadinessStatus;
  overallConfidence: number;
  readinessThreshold: number;
  capabilities: CapabilityReadinessResult[];
  mandatoryCapsMet: number;
  mandatoryCapsTotal: number;
  optionalCapsMet: number;
  optionalCapsTotal: number;
  computedAt: string;
  evidenceGraphCorrelationId: string;
}

export interface ReadinessEvaluationInput {
  organizationId: string;
  programTypeKey: string;
  /** Supabase-compatible client (full chain: .from().select().eq().order().single()) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  /** KTP-1.3: When true, skips org_capabilities requirement and applies readiness rules */
  isReadinessType?: boolean;
}

// --------------------------------------------------------------------------
// Main Pipeline
// --------------------------------------------------------------------------

export async function evaluateReadiness(
  input: ReadinessEvaluationInput,
): Promise<ReadinessEvaluationResult> {
  const { organizationId, programTypeKey, db } = input;

  // Step 1: Load program type taxonomy
  const taxonomy = await loadProgramTypeTaxonomy(db, programTypeKey);
  if (!taxonomy) {
    throw new Error(`Program type not found in taxonomy: ${programTypeKey}`);
  }

  // Step 2: Load capability requirements
  const capReqs = await loadCapabilityRequirements(db, taxonomy.id);
  if (capReqs.length === 0) {
    return emptyResult(organizationId, programTypeKey, taxonomy.name, taxonomy.readiness_threshold);
  }

  // Step 3: Evaluate each capability
  const capabilities: CapabilityReadinessResult[] = [];
  let mandatoryCapsMet = 0;
  let mandatoryCapsTotal = 0;
  let optionalCapsMet = 0;
  let optionalCapsTotal = 0;
  const isReadiness = input.isReadinessType ?? taxonomy.category === 'readiness';

  for (const req of capReqs) {
    const result = await evaluateCapabilityReadiness(
      db, organizationId, req, taxonomy.readiness_threshold, isReadiness,
    );

    // KTP-1.3: Skip N/A and UNKNOWN claims from mandatory/optional counts
    if (result.evidenceSupport === 'NOT_APPLICABLE') {
      result.met = false;
      capabilities.push(result);
      continue;
    }
    if (result.evidenceSupport === 'UNKNOWN') {
      result.met = false;
      capabilities.push(result);
      continue;
    }

    capabilities.push(result);

    if (req.is_mandatory) {
      mandatoryCapsTotal++;
      if (result.met) mandatoryCapsMet++;
    } else {
      optionalCapsTotal++;
      if (result.met) optionalCapsMet++;
    }
  }

  // Step 4: Determine readiness status
  const readinessStatus = determineReadinessStatus(
    mandatoryCapsMet, mandatoryCapsTotal,
    optionalCapsMet, optionalCapsTotal,
  );

  // Step 5: Compute overall confidence (excludes N/A and UNKNOWN)
  const overallConfidence = computeOverallConfidence(capabilities);

  // Step 6: Compute correlation ID (hash of capability states for idempotency)
  const evidenceGraphCorrelationId = computeCorrelationId(capabilities);

  return {
    organizationId,
    programTypeKey,
    programTypeName: taxonomy.name,
    readinessStatus,
    overallConfidence,
    readinessThreshold: taxonomy.readiness_threshold,
    capabilities,
    mandatoryCapsMet,
    mandatoryCapsTotal,
    optionalCapsMet,
    optionalCapsTotal,
    computedAt: new Date().toISOString(),
    evidenceGraphCorrelationId,
  };
}

// --------------------------------------------------------------------------
// Database Helpers — require Supabase-compatible client
// --------------------------------------------------------------------------

interface TaxonomyRow {
  id: string;
  type_key: string;
  name: string;
  readiness_threshold: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadProgramTypeTaxonomy(db: any, programTypeKey: string): Promise<TaxonomyRow | null> {
  const { data, error } = await db
    .from('program_type_taxonomy')
    .select('id, type_key, name, readiness_threshold')
    .eq('type_key', programTypeKey)
    .eq('is_active', true)
    .single();
  if (error || !data) return null;
  return data as TaxonomyRow;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadCapabilityRequirements(db: any, programTypeId: string): Promise<CapabilityRequirement[]> {
  const { data: capReqs, error } = await db
    .from('readiness_capability_requirements')
    .select(`
      id, capability_type_id, is_mandatory, minimum_confidence, display_order,
      capability_type:organization_capability_types!inner(key, name),
      evidence_reqs:readiness_evidence_requirements(id, evidence_class, is_mandatory, minimum_count, description)
    `)
    .eq('program_type_id', programTypeId)
    .order('display_order', { ascending: true });
  if (error || !capReqs) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return capReqs.map((r: any) => ({
    id: r.id,
    capability_type_id: r.capability_type_id,
    capability_type_key: r.capability_type.key,
    capability_type_name: r.capability_type.name,
    is_mandatory: r.is_mandatory,
    minimum_confidence: r.minimum_confidence,
    display_order: r.display_order,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evidence_requirements: (r.evidence_reqs || []).map((er: any) => ({
      id: er.id,
      capability_requirement_id: er.capability_requirement_id,
      evidence_class: er.evidence_class,
      is_mandatory: er.is_mandatory,
      minimum_count: er.minimum_count,
      description: er.description,
    })),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function evaluateCapabilityReadiness(
  db: any, organizationId: string, req: CapabilityRequirement, threshold: number,
  isReadinessType = false,
): Promise<CapabilityReadinessResult> {
  // KTP-1.3: For readiness program types, capability declaration is optional
  let orgCap: { id: string } | null = null;
  if (!isReadinessType) {
    const { data } = await db
      .from('organization_capabilities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('capability_type_id', req.capability_type_id)
      .maybeSingle();
    orgCap = data as { id: string } | null;
  }

  // Get claims for this org
  const { data: claims } = await db
    .from('claims')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(50);

  const claimAssessments: ClaimAssessment[] = [];
  let totalConfidence = 0;
  let claimCount = 0;

  if (claims) {
    for (const claim of claims) {
      try {
        const report: ConfidenceReport = evaluateClaim({
          claimId: claim.id,
          actorId: 'system',
          correlationId: `readiness-${organizationId}`,
        });
        const expl = report.explanation;
        claimAssessments.push({
          claimId: claim.id,
          claimTitle: claim.title || claim.id,
          evidenceClass: 'B',
          confidenceValue: report.confidenceValue,
          confidenceLevel: report.confidenceLevel,
          supportingEvidenceCount: expl?.evidenceUsed?.length || 0,
          contradictingEvidenceCount: expl?.counterEvidenceConsidered?.length || 0,
        });
        totalConfidence += report.confidenceValue;
        claimCount++;
      } catch {
        // Skip unevaluable claims
      }
    }
  }

  const requiredConfidence = req.minimum_confidence ?? threshold;

  // KTP-1.3: Compute evidence support using canonical shared helper
  const rawConfidence = claimCount > 0 ? totalConfidence / claimCount / 100 : 0;
  const evidenceClassArray = claimAssessments.map(ca => ca.evidenceClass);
  const { evidenceSupport, cappedConfidence } = computeEvidenceSupportLevel(
    evidenceClassArray,
    rawConfidence,
  );
  const achievedConfidence = cappedConfidence;

  const hasCapability = isReadinessType || orgCap !== null;
  const confidenceMet = achievedConfidence >= requiredConfidence;
  const met = hasCapability && confidenceMet;
  const evidenceGaps = buildEvidenceGaps(claimAssessments, req.evidence_requirements);

  return {
    capabilityTypeId: req.capability_type_id,
    capabilityTypeKey: req.capability_type_key,
    capabilityTypeName: req.capability_type_name,
    isMandatory: req.is_mandatory,
    requiredConfidence,
    achievedConfidence,
    met,
    claims: claimAssessments,
    evidenceGaps,
    evidenceSupport,
  };
}

// --------------------------------------------------------------------------
// Pure Functions
// --------------------------------------------------------------------------

function buildEvidenceGaps(
  assessments: ClaimAssessment[],
  requirements: EvidenceRequirement[],
): EvidenceGap[] {
  return requirements
    .filter((req) => {
      const present = assessments.filter((a) => a.evidenceClass === req.evidence_class).length;
      return present < req.minimum_count;
    })
    .map((req) => {
      const present = assessments.filter((a) => a.evidenceClass === req.evidence_class).length;
      return {
        evidenceClass: req.evidence_class,
        isMandatory: req.is_mandatory,
        required: req.minimum_count,
        present,
        missing: req.minimum_count - present,
      };
    });
}

export function determineReadinessStatus(
  mandatoryMet: number,
  mandatoryTotal: number,
  optionalMet: number,
  optionalTotal: number,
): ReadinessStatus {
  if (mandatoryTotal === 0) {
    return optionalTotal === 0 || optionalMet === optionalTotal ? 'ready' : 'partial';
  }
  const allMandatoryMet = mandatoryMet === mandatoryTotal;
  const allOptionalMet = optionalTotal === 0 || optionalMet === optionalTotal;
  const someOptionalMet = optionalMet > 0;

  if (!allMandatoryMet) return 'not_ready';
  if (allOptionalMet) return 'ready';
  if (someOptionalMet && optionalTotal > 0) return 'conditionally_ready';
  return 'partial';
}

export function computeOverallConfidence(
  capabilities: CapabilityReadinessResult[],
): number {
  // KTP-1.3: Exclude N/A and UNKNOWN from confidence averaging
  const active = capabilities.filter(
    c => c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN',
  );
  if (active.length === 0) return 0;
  const sum = active.reduce((acc, c) => acc + c.achievedConfidence, 0);
  return Math.round((sum / active.length) * 100) / 100;
}

function computeCorrelationId(capabilities: CapabilityReadinessResult[]): string {
  const parts = capabilities.map((c) =>
    `${c.capabilityTypeId}:${c.met}:${c.achievedConfidence.toFixed(2)}`,
  );
  return `eval-${parts.length}-${capabilities.length}`;
}

function emptyResult(
  organizationId: string, programTypeKey: string,
  programTypeName: string, threshold: number,
): ReadinessEvaluationResult {
  return {
    organizationId, programTypeKey, programTypeName,
    readinessStatus: 'not_ready',
    overallConfidence: 0,
    readinessThreshold: threshold,
    capabilities: [],
    mandatoryCapsMet: 0, mandatoryCapsTotal: 0,
    optionalCapsMet: 0, optionalCapsTotal: 0,
    computedAt: new Date().toISOString(),
    evidenceGraphCorrelationId: 'empty',
  };
}

// --------------------------------------------------------------------------
// Persistence
// --------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function persistReadinessEvaluation(
  db: any, result: ReadinessEvaluationResult, triggeredBy: string,
): Promise<string> {
  const { data, error } = await db
    .from('readiness_evaluations')
    .upsert(
      {
        organization_id: result.organizationId,
        program_type_key: result.programTypeKey,
        readiness_status: result.readinessStatus,
        overall_confidence: result.overallConfidence,
        evaluation_snapshot: result,
        computed_at: result.computedAt,
        evidence_graph_correlation_id: result.evidenceGraphCorrelationId,
        created_by: triggeredBy,
      },
      { onConflict: 'organization_id, program_type_key', ignoreDuplicates: false },
    )
    .select('id')
    .single();

  if (error) throw new Error(`Failed to persist readiness evaluation: ${error.message}`);
  return (data as { id: string }).id;
}
