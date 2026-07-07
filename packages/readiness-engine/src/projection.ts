// ==========================================================================
// Kadarn Readiness Engine — Sponsor Projection (Readiness Report)
// ==========================================================================
// KTP-1.3 Mission 4.
//
// A PROJECTION — read-only, derived from evaluation_snapshot JSONB.
// No new tables. No UI. No Marketplace integration.
// Pure function: evaluation_snapshot → ReadinessReport.
// ==========================================================================

import type { ReadinessEvaluationResult, CapabilityReadinessResult } from './readiness-evaluation.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface ReadinessReport {
  /** Report metadata */
  reportId: string;
  generatedAt: string;
  evidenceGraphCorrelationId: string;

  /** Organization context */
  organizationId: string;
  organizationName: string;

  /** Program type context */
  programTypeKey: string;
  programTypeName: string;

  /** Readiness status */
  readinessStatus: string;
  overallConfidence: number;
  readinessThreshold: number;

  /** Capability breakdown */
  capabilities: ReadinessReportCapability[];

  /** Summary counts */
  summary: ReadinessReportSummary;

  /** Verifiable provenance chain reference */
  verifiableVia: string;
}

export interface ReadinessReportCapability {
  capabilityTypeKey: string;
  capabilityTypeName: string;
  isMandatory: boolean;
  met: boolean;
  achievedConfidence: number;
  requiredConfidence: number;
  evidenceGaps: ReadinessReportGap[];
}

export interface ReadinessReportGap {
  evidenceClass: string;
  isMandatory: boolean;
  required: number;
  present: number;
  missing: number;
}

export interface ReadinessReportSummary {
  totalCapabilities: number;
  mandatoryCapabilities: number;
  mandatoryCapabilitiesMet: number;
  optionalCapabilities: number;
  optionalCapabilitiesMet: number;
  totalEvidenceGaps: number;
}

// --------------------------------------------------------------------------
// Projection Function
// --------------------------------------------------------------------------

/**
 * Generate a ReadinessReport from an evaluation result.
 *
 * This is a PURE projection — no side effects, no database writes.
 * Transforms evaluation_snapshot JSONB into a structured, exportable report
 * suitable for Sponsor Discovery consumption.
 */
export function projectReadinessReport(
  result: ReadinessEvaluationResult,
  organizationName: string,
): ReadinessReport {
  const capabilities = result.capabilities.map(projectCapability);

  const mandatory = capabilities.filter((c) => c.isMandatory);
  const optional = capabilities.filter((c) => !c.isMandatory);

  const totalEvidenceGaps = capabilities.reduce(
    (sum, c) => sum + c.evidenceGaps.length,
    0,
  );

  return {
    reportId: `rr-${result.organizationId}-${result.programTypeKey}-${Date.now()}`,
    generatedAt: result.computedAt,
    evidenceGraphCorrelationId: result.evidenceGraphCorrelationId,

    organizationId: result.organizationId,
    organizationName,

    programTypeKey: result.programTypeKey,
    programTypeName: result.programTypeName,

    readinessStatus: result.readinessStatus,
    overallConfidence: result.overallConfidence,
    readinessThreshold: result.readinessThreshold,

    capabilities,

    summary: {
      totalCapabilities: capabilities.length,
      mandatoryCapabilities: mandatory.length,
      mandatoryCapabilitiesMet: mandatory.filter((c) => c.met).length,
      optionalCapabilities: optional.length,
      optionalCapabilitiesMet: optional.filter((c) => c.met).length,
      totalEvidenceGaps,
    },

    verifiableVia: `provenance://organizations/${result.organizationId}/readiness/${result.programTypeKey}/${result.evidenceGraphCorrelationId}`,
  };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function projectCapability(c: CapabilityReadinessResult): ReadinessReportCapability {
  return {
    capabilityTypeKey: c.capabilityTypeKey,
    capabilityTypeName: c.capabilityTypeName,
    isMandatory: c.isMandatory,
    met: c.met,
    achievedConfidence: c.achievedConfidence,
    requiredConfidence: c.requiredConfidence,
    evidenceGaps: c.evidenceGaps.map((g) => ({
      evidenceClass: g.evidenceClass,
      isMandatory: g.isMandatory,
      required: g.required,
      present: g.present,
      missing: g.missing,
    })),
  };
}
