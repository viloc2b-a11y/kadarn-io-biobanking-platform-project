// ==========================================================================
// Evidence Gap Detection — Detector
// ==========================================================================
// Sprint 20B.4.
//
// Analyzes Candidate Claims against available Discovery evidence and Timeline
// to identify gaps, calculate coverage, and recommend missing evidence.
// No Evidence Core modification. No fictitious evidence generation.
// ==========================================================================

import { ClaimMappingRegistry } from '../claim-candidate/mapping.js';
import type { CandidateClaim } from '../claim-candidate/types.js';
import type { DiscoveryResult } from '../orchestrator.js';
import type { InstitutionalTimeline } from '../timeline/types.js';
import type {
  EvidenceGap,
  RecommendedEvidence,
  GapAnalysisResult,
  GapAnalysisReport,
  GapSeverity,
  GapCategory,
} from './types.js';

// --------------------------------------------------------------------------
// Gap Detector
// --------------------------------------------------------------------------

export class EvidenceGapDetector {
  private mappingRegistry: ClaimMappingRegistry;

  constructor(mappingRegistry: ClaimMappingRegistry) {
    this.mappingRegistry = mappingRegistry;
  }

  /**
   * Analyze multiple claims and produce a consolidated report.
   */
  analyze(
    claims: CandidateClaim[],
    discoveryResult: DiscoveryResult,
    timeline?: InstitutionalTimeline,
  ): GapAnalysisReport {
    if (claims.length === 0) {
      return {
        results: [],
        totalClaims: 0,
        averageCoverage: 0,
        totalGaps: 0,
        generatedAt: new Date().toISOString(),
      };
    }

    const results = claims.map(claim =>
      this.analyzeSingle(claim, discoveryResult, timeline),
    );

    const totalGaps = results.reduce((sum, r) => sum + r.gaps.length, 0);
    const averageCoverage =
      results.reduce((sum, r) => sum + r.coveragePercent, 0) / results.length;

    return {
      results,
      totalClaims: claims.length,
      averageCoverage: Math.round(averageCoverage * 100) / 100,
      totalGaps,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze a single claim against available evidence.
   */
  analyzeSingle(
    claim: CandidateClaim,
    discoveryResult: DiscoveryResult,
    timeline?: InstitutionalTimeline,
  ): GapAnalysisResult {
    const rule = this.mappingRegistry.getRule(claim.sourceCapabilityId);

    // Build existing evidence inventory
    const entityTypesPresent = new Set(discoveryResult.entities.map(e => e.type));
    const documentTypesPresent = new Set(
      discoveryResult.classifications.map(c => c.documentType),
    );
    const relationshipTypesPresent = new Set(
      discoveryResult.relationships.map(r => r.type),
    );
    const eventCategoriesPresent = timeline
      ? new Set(timeline.events.map(e => e.category))
      : new Set<string>();

    // Determine required items from mapping rule, or fall back to claim evidence
    const requiredEntityTypes = rule?.requiredEntityTypes ?? [];
    const requiredDocumentTypes = rule?.requiredDocumentTypes ?? [];
    const requiredRelationshipTypes = rule?.requiredRelationshipTypes ?? [];
    const relevantEventCategories = rule?.relevantEventCategories ?? [];

    // Calculate coverage per axis
    const entityCoverage = calcAxisCoverage(
      requiredEntityTypes,
      t => entityTypesPresent.has(t),
    );
    const docCoverage = calcAxisCoverage(
      requiredDocumentTypes,
      t => documentTypesPresent.has(t),
    );
    const relCoverage = calcAxisCoverage(
      requiredRelationshipTypes,
      t => relationshipTypesPresent.has(t),
    );
    const eventCoverage = timeline
      ? calcAxisCoverage(relevantEventCategories, t => eventCategoriesPresent.has(t))
      : 1; // no timeline = no penalty

    // Overall coverage: average of axes that have requirements
    const axes = [
      { coverage: entityCoverage, hasRequirements: requiredEntityTypes.length > 0 },
      { coverage: docCoverage, hasRequirements: requiredDocumentTypes.length > 0 },
      { coverage: relCoverage, hasRequirements: requiredRelationshipTypes.length > 0 },
      { coverage: eventCoverage, hasRequirements: timeline ? relevantEventCategories.length > 0 : false },
    ];

    const applicableAxes = axes.filter(a => a.hasRequirements);
    const overallCoverage =
      applicableAxes.length > 0
        ? applicableAxes.reduce((sum, a) => sum + a.coverage, 0) / applicableAxes.length
        : 1;

    const coveragePercent = Math.round(overallCoverage * 100);

    // Generate gaps for missing items
    const gaps: EvidenceGap[] = [];
    const gapIdCounter = { next: 1 };
    const severity = severityFromCoverage(coveragePercent);

    const existingEvidence = {
      entityTypes: Array.from(entityTypesPresent),
      documentTypes: Array.from(documentTypesPresent),
      relationshipTypes: Array.from(relationshipTypesPresent),
      eventCategories: Array.from(eventCategoriesPresent),
    };

    // Missing entity types
    for (const reqType of requiredEntityTypes) {
      if (!entityTypesPresent.has(reqType)) {
        gaps.push(
          makeGap(gapIdCounter, 'missing_entity_type', severity,
            `Required entity type "${reqType}" not found in discovery results`, reqType, false),
        );
      }
    }

    // Missing document types
    for (const reqType of requiredDocumentTypes) {
      if (!documentTypesPresent.has(reqType)) {
        gaps.push(
          makeGap(gapIdCounter, 'missing_document_type', severity,
            `Required document type "${reqType}" not found in discovery results`, reqType, true),
        );
      }
    }

    // Missing relationship types
    for (const reqType of requiredRelationshipTypes) {
      if (!relationshipTypesPresent.has(reqType)) {
        gaps.push(
          makeGap(gapIdCounter, 'missing_relationship_type', severity,
            `Required relationship type "${reqType}" not found in discovery results`, reqType, false),
        );
      }
    }

    // Missing event categories (only if timeline is provided)
    if (timeline) {
      for (const cat of relevantEventCategories) {
        if (!eventCategoriesPresent.has(cat)) {
          gaps.push(
            makeGap(gapIdCounter, 'missing_event_category', 'moderate',
              `Relevant event category "${cat}" not found in institutional timeline`, cat, false),
          );
        }
      }
    }

    // Low confidence gap
    if (claim.confidence < 0.4) {
      gaps.push(
        makeGap(gapIdCounter, 'low_confidence', 'significant',
          `Claim confidence (${claim.confidence}) is below 0.4`, String(claim.confidence), false),
      );
    }

    // Insufficient coverage gap
    if (coveragePercent < 50) {
      gaps.push(
        makeGap(gapIdCounter, 'insufficient_coverage', 'critical',
          `Overall evidence coverage (${coveragePercent}%) is below 50%`, `${coveragePercent}%`, true),
      );
    }

    // Generate recommendations
    const recommendedEvidence = generateRecommendations(gaps, gapIdCounter);

    // Severity counts
    const severityCounts = {
      critical: gaps.filter(g => g.severity === 'critical').length,
      significant: gaps.filter(g => g.severity === 'significant').length,
      moderate: gaps.filter(g => g.severity === 'moderate').length,
      minor: gaps.filter(g => g.severity === 'minor').length,
    };

    // Build human explanation
    const humanExplanation = buildExplanation(
      claim, coveragePercent, gaps, recommendedEvidence, existingEvidence,
    );

    return {
      claimId: claim.claimId,
      sourceCapabilityId: claim.sourceCapabilityId,
      coveragePercent,
      existingEvidence,
      gaps,
      recommendedEvidence,
      severityCounts,
      humanExplanation,
    };
  }
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function calcAxisCoverage(required: string[], predicate: (item: string) => boolean): number {
  if (required.length === 0) return 1;
  const found = required.filter(predicate).length;
  return found / required.length;
}

function severityFromCoverage(coverage: number): GapSeverity {
  if (coverage < 30) return 'critical';
  if (coverage < 50) return 'significant';
  if (coverage < 75) return 'moderate';
  return 'minor';
}

function makeGap(
  counter: { next: number },
  category: GapCategory,
  severity: GapSeverity,
  description: string,
  missingItem: string,
  fillableByUpload: boolean,
): EvidenceGap {
  return {
    gapId: `gap-${crypto.randomUUID().slice(0, 8)}`,
    category,
    description,
    severity,
    missingItem,
    fillableByUpload,
  };
}

function generateRecommendations(
  gaps: EvidenceGap[],
  counter: { next: number },
): RecommendedEvidence[] {
  const recs: RecommendedEvidence[] = [];
  const seen = new Set<string>();

  for (const gap of gaps) {
    switch (gap.category) {
      case 'missing_document_type': {
        const key = `doc:${gap.missingItem}`;
        if (!seen.has(key)) {
          seen.add(key);
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'document_upload',
            description: `Upload a document of type "${gap.missingItem}" (e.g. SOP, protocol, or training record)`,
            priority: gap.severity === 'critical' ? 'high' : 'medium',
            rationale: `A "${gap.missingItem}" document would directly satisfy the missing document requirement and strengthen evidence coverage`,
          });
        }
        break;
      }

      case 'missing_entity_type': {
        const key = `entity:${gap.missingItem}`;
        if (!seen.has(key)) {
          seen.add(key);
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'document_upload',
            description: `Upload documents that reference "${gap.missingItem}" entities (equipment records, calibration logs, investigator CVs)`,
            priority: gap.severity === 'critical' ? 'high' : 'medium',
            rationale: `Entities of type "${gap.missingItem}" are required to support this claim`,
          });
        }
        break;
      }

      case 'missing_relationship_type': {
        const key = `rel:${gap.missingItem}`;
        if (!seen.has(key)) {
          seen.add(key);
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'relationship_verification',
            description: `Verify and document relationships of type "${gap.missingItem}" (e.g. equipment calibration, training completion, study sponsorship)`,
            priority: 'medium',
            rationale: `Relationships of type "${gap.missingItem}" provide structural evidence linking entities`,
          });
        }
        break;
      }

      case 'missing_event_category': {
        const key = `event:${gap.missingItem}`;
        if (!seen.has(key)) {
          seen.add(key);
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'timeline_event',
            description: `Add timeline events in category "${gap.missingItem}" (e.g. equipment acquisition, training completed, regulatory event)`,
            priority: 'medium',
            rationale: `Timeline events in category "${gap.missingItem}" would provide temporal evidence supporting this claim`,
          });
        }
        break;
      }

      case 'insufficient_coverage': {
        if (!seen.has('coverage')) {
          seen.add('coverage');
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'document_upload',
            description: 'Upload additional documents across all required evidence categories to raise overall coverage',
            priority: 'high',
            rationale: 'Overall evidence coverage is below the minimum threshold. Multiple evidence types are needed.',
          });
        }
        break;
      }

      case 'low_confidence': {
        if (!seen.has('confidence')) {
          seen.add('confidence');
          recs.push({
            recommendationId: `rec-${crypto.randomUUID().slice(0, 8)}`,
            evidenceType: 'external_confirmation',
            description: 'Seek external confirmation or additional sources to increase claim confidence',
            priority: 'medium',
            rationale: 'Low claim confidence indicates the supporting evidence is weak or contradictory',
          });
        }
        break;
      }
    }
  }

  return recs;
}

function buildExplanation(
  claim: CandidateClaim,
  coveragePercent: number,
  gaps: EvidenceGap[],
  recommendations: RecommendedEvidence[],
  existingEvidence: { entityTypes: string[]; documentTypes: string[]; relationshipTypes: string[]; eventCategories: string[] },
): string {
  const parts: string[] = [];

  parts.push(`Claim: ${claim.summary}`);
  parts.push(`Evidence coverage: ${coveragePercent}%`);
  parts.push(`Status: ${coveragePercent >= 50 ? 'Partially supported' : 'Insufficient evidence'}`);

  // What exists
  const existParts: string[] = [];
  if (existingEvidence.entityTypes.length > 0) {
    existParts.push(`${existingEvidence.entityTypes.length} entity type(s)`);
  }
  if (existingEvidence.documentTypes.length > 0) {
    existParts.push(`${existingEvidence.documentTypes.length} document type(s)`);
  }
  if (existingEvidence.relationshipTypes.length > 0) {
    existParts.push(`${existingEvidence.relationshipTypes.length} relationship type(s)`);
  }
  if (existingEvidence.eventCategories.length > 0) {
    existParts.push(`${existingEvidence.eventCategories.length} event categor(ies)`);
  }
  parts.push(`Evidence present: ${existParts.length > 0 ? existParts.join(', ') : 'None'}`);

  // What's missing
  if (gaps.length > 0) {
    const criticalCount = gaps.filter(g => g.severity === 'critical').length;
    const totalCount = gaps.length;
    parts.push(`Evidence gaps: ${totalCount} total (${criticalCount} critical)`);
    parts.push(`Missing items: ${gaps.slice(0, 5).map(g => g.missingItem).join(', ')}${gaps.length > 5 ? ` and ${gaps.length - 5} more` : ''}`);
  } else {
    parts.push('Evidence gaps: None — all required evidence is present');
  }

  // Recommendations
  if (recommendations.length > 0) {
    const highPriority = recommendations.filter(r => r.priority === 'high').length;
    parts.push(`Recommendations: ${recommendations.length} (${highPriority} high priority)`);
  }

  return parts.join('. ');
}
