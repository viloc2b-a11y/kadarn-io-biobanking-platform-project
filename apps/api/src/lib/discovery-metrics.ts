// ==========================================================================
// Discovery Metrics — single source of truth for dashboard metrics
// ==========================================================================
// Discovery pipeline metrics only. Not Claim Confidence. Not Trust Score.
// Never writes to Evidence Core.
// ==========================================================================

const LOW_CONFIDENCE_THRESHOLD = 0.6;

type AgentOutput = {
  output: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
};

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function agentOutput(
  outputs: Record<string, AgentOutput>,
  ...names: string[]
): Record<string, unknown> | undefined {
  for (const name of names) {
    if (outputs[name]?.output) return outputs[name].output;
  }
  return undefined;
}

function countLowConfidenceItems(outputs: Record<string, AgentOutput>): number {
  let count = 0;

  const entityOutput = agentOutput(outputs, 'entity-extractor', 'entity_extractor');
  for (const entity of asArray(entityOutput?.entities)) {
    const confidence = Number(entity.confidence ?? 1);
    if (confidence < LOW_CONFIDENCE_THRESHOLD || entity.requiresHumanReview === true) count += 1;
  }

  const relationshipOutput = agentOutput(outputs, 'relationship-extractor', 'relationship_extractor');
  for (const rel of asArray(relationshipOutput?.relationships)) {
    if (Number(rel.confidence ?? 1) < LOW_CONFIDENCE_THRESHOLD) count += 1;
  }

  const snapshotOutput = agentOutput(outputs, 'evidence_snapshot', 'snapshot_builder');
  const inventory = asArray(snapshotOutput?.documentInventory);
  for (const doc of inventory) {
    const confidence = Number(doc.confidence ?? 1);
    if (
      doc.requiresHumanReview === true
      || confidence < LOW_CONFIDENCE_THRESHOLD
      || String(doc.documentType ?? '').toUpperCase() === 'UNKNOWN'
    ) {
      count += 1;
    }
  }

  const uncertainty = asArray(snapshotOutput?.uncertainty);
  for (const item of uncertainty) {
    if (item.type === 'low_confidence_classification' || item.type === 'ambiguous_entity') {
      count += 1;
    }
  }

  return count;
}

function countEvidenceGaps(outputs: Record<string, AgentOutput>): number {
  const gapOutput = agentOutput(outputs, 'evidence_gap_detector');
  if (!gapOutput) return 0;
  const reports = asArray(gapOutput.reports);
  return reports.reduce(
    (sum, report) => sum + asArray(report.gaps).length,
    0,
  );
}

function countHighPriorityLeverage(outputs: Record<string, AgentOutput>): number {
  const gapOutput = agentOutput(outputs, 'evidence_gap_detector');
  if (!gapOutput) return 0;
  let count = 0;
  for (const report of asArray(gapOutput.reports)) {
    for (const rec of asArray(report.recommendedEvidence)) {
      if (String(rec.priority ?? '').toLowerCase() === 'high') count += 1;
    }
  }
  return count;
}

function coverageIndicatorToPercent(indicator: unknown): number | null {
  switch (String(indicator ?? '').toLowerCase()) {
    case 'high': return 85;
    case 'medium': return 55;
    case 'low': return 25;
    default: return null;
  }
}

export interface DiscoveryMetrics {
  artifactsProcessed: number;
  documentsClassified: number;
  entitiesDetected: number;
  relationshipsDetected: number;
  capabilitiesDetected: number;
  claimCandidatesDetected: number;
  evidenceGapsDetected: number;
  unknownDocuments: number;
  lowConfidenceItems: number;
  curationEvents: number;
  validationNotes: number;
  nextBestActionPresent: boolean;
  ttfvMinutes: number | null;
  institutionReconstructionCoverage: number | null;
  evidenceLeverageScore: number | null;
}

export function buildDiscoveryMetrics(input: {
  counts: {
    artifacts: number;
    entities: number;
    relationships: number;
    candidates: number;
  };
  agentOutputs: Record<string, AgentOutput>;
  curationEvents: unknown[];
  validationNotes: unknown[];
  sessionCreatedAt: string;
  latestRun: { started_at: string; completed_at: string | null } | null;
}): DiscoveryMetrics {
  const { counts, agentOutputs, curationEvents, validationNotes, sessionCreatedAt, latestRun } = input;

  const snapshotOutput = agentOutput(agentOutputs, 'evidence_snapshot', 'snapshot_builder');
  const summary = snapshotOutput?.summary as Record<string, unknown> | undefined;

  const capabilityOutput = agentOutput(agentOutputs, 'capability_detector');
  const claimsOutput = agentOutput(agentOutputs, 'claim_candidate_detector');
  const profileOutput = agentOutput(agentOutputs, 'profile_builder', 'institutional_profile');
  const profileSummary = profileOutput?.summary as Record<string, unknown> | undefined;

  const capabilitiesDetected = asArray(capabilityOutput?.capabilities).length;
  const claimCandidatesDetected = asArray(claimsOutput?.candidates).length;

  const documentsClassified = Number(
    summary?.documentsClassified
    ?? asArray(snapshotOutput?.documentInventory).filter(
      (d) => String(d.documentType ?? '').toUpperCase() !== 'UNKNOWN',
    ).length
    ?? 0,
  );

  const unknownDocuments = Number(
    summary?.unknownDocuments
    ?? asArray(snapshotOutput?.documentInventory).filter(
      (d) => String(d.documentType ?? '').toUpperCase() === 'UNKNOWN',
    ).length
    ?? asArray(snapshotOutput?.uncertainty).filter(
      (u) => u.type === 'unknown_document',
    ).length
    ?? 0,
  );

  const nextBestAction = snapshotOutput?.nextBestAction as Record<string, unknown> | undefined;
  const nextBestActionPresent = Boolean(
    nextBestAction?.action && String(nextBestAction.action).length > 0,
  );

  let ttfvMinutes: number | null = null;
  if (latestRun?.completed_at) {
    const start = new Date(sessionCreatedAt).getTime();
    const end = new Date(latestRun.completed_at).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      ttfvMinutes = Math.round((end - start) / 60_000);
    }
  }

  let institutionReconstructionCoverage: number | null = coverageIndicatorToPercent(summary?.coverageIndicator);
  if (institutionReconstructionCoverage == null && profileSummary) {
    const readiness = Number(profileSummary.readinessScore);
    if (Number.isFinite(readiness) && readiness >= 0 && readiness <= 100) {
      institutionReconstructionCoverage = Math.round(readiness);
    }
  }

  const highPriorityLeverage = countHighPriorityLeverage(agentOutputs);
  let evidenceLeverageScore: number | null = null;
  if (highPriorityLeverage > 0) {
    evidenceLeverageScore = Math.min(100, highPriorityLeverage * 20);
  } else if (nextBestActionPresent) {
    const priority = String(nextBestAction?.priority ?? '').toLowerCase();
    evidenceLeverageScore = priority === 'high' ? 75 : priority === 'medium' ? 50 : 25;
  }

  return {
    artifactsProcessed: counts.artifacts,
    documentsClassified,
    entitiesDetected: counts.entities,
    relationshipsDetected: counts.relationships,
    capabilitiesDetected,
    claimCandidatesDetected,
    evidenceGapsDetected: countEvidenceGaps(agentOutputs),
    unknownDocuments,
    lowConfidenceItems: countLowConfidenceItems(agentOutputs),
    curationEvents: curationEvents.length,
    validationNotes: validationNotes.length,
    nextBestActionPresent,
    ttfvMinutes,
    institutionReconstructionCoverage,
    evidenceLeverageScore,
  };
}
