// ==========================================================================
// Evidence Discovery — Institutional Evidence Snapshot
// ==========================================================================
// Sprint 20A.5.
//
// First user-facing output of Evidence Discovery.
// NOT canonical evidence. NOT certification. NOT sponsor-facing.
// A discovery summary that says "this is what Kadarn could reconstruct."
// ==========================================================================

import type { DiscoveryResult, DocumentClassification, Entity, Relationship } from '../orchestrator.js';

// --------------------------------------------------------------------------
// Snapshot types
// --------------------------------------------------------------------------

export interface SnapshotSummary {
  artifactsProcessed: number;
  documentsClassified: number;
  entitiesDetected: number;
  relationshipsDetected: number;
  unknownDocuments: number;
  requiresReview: number;
  coverageIndicator: 'high' | 'medium' | 'low';
}

export interface SnapshotDocumentInventoryItem {
  filename: string;
  documentType: string;
  confidence: number;
  requiresHumanReview: boolean;
  sourceArtifactId: string;
}

export interface SnapshotEntityGroup {
  type: string;
  label: string;
  entities: { value: string; normalizedValue: string | null; confidence: number }[];
}

export interface SnapshotRelationshipItem {
  type: string;
  sourceValue: string;
  targetValue: string;
  confidence: number;
}

export interface SnapshotTimelineEvent {
  date: string;
  description: string;
  sourceEntityValues: string[];
  confidence: number;
}

export interface SnapshotUncertaintyItem {
  type: 'unknown_document' | 'low_confidence_classification' | 'ambiguous_entity' | 'missing_date' | 'conflicting_signal';
  description: string;
  sourceArtifactId: string;
}

export interface SnapshotNextBestAction {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InstitutionalEvidenceSnapshot {
  id: string;
  generatedAt: string;
  pipelineVersion: string;

  summary: SnapshotSummary;
  documentInventory: SnapshotDocumentInventoryItem[];
  entityGroups: SnapshotEntityGroup[];
  relationshipSummary: SnapshotRelationshipItem[];
  timeline: SnapshotTimelineEvent[];
  uncertainty: SnapshotUncertaintyItem[];
  nextBestAction: SnapshotNextBestAction;
}

// --------------------------------------------------------------------------
// Entity group labels
// --------------------------------------------------------------------------

const ENTITY_GROUP_LABELS: Record<string, string> = {
  INVESTIGATOR: 'Investigators',
  INSTITUTION: 'Institutions',
  SPONSOR: 'Sponsors',
  CRO: 'Contract Research Organizations',
  STUDY: 'Studies',
  PROTOCOL_ID: 'Protocol Identifiers',
  EQUIPMENT: 'Equipment',
  TEMPERATURE: 'Temperatures',
  LOCATION: 'Locations',
  DATE: 'Dates',
  DOCUMENT_VERSION: 'Document Versions',
  REGULATORY_BODY: 'Regulatory Bodies',
  LAB_VENDOR: 'Lab Vendors',
};

// --------------------------------------------------------------------------
// SnapshotBuilder
// --------------------------------------------------------------------------

export class SnapshotBuilder {
  /**
   * Build an InstitutionalEvidenceSnapshot from a DiscoveryResult.
   * Deterministic. Does not write to Evidence Core.
   */
  build(result: DiscoveryResult): InstitutionalEvidenceSnapshot {
    const now = new Date().toISOString();
    const snapshotId = `snapshot-${result.runId}-${Date.now()}`;

    const documentInventory = this.buildDocumentInventory(result);
    const entityGroups = this.buildEntityGroups(result);
    const relationshipSummary = this.buildRelationshipSummary(result);
    const timeline = this.buildTimeline(result, entityGroups);
    const uncertainty = this.buildUncertainty(result, documentInventory);
    const nextBestAction = this.buildNextBestAction(uncertainty, documentInventory);

    const unknownDocs = documentInventory.filter(d => d.documentType === 'UNKNOWN').length;
    const requiresReview = documentInventory.filter(d => d.requiresHumanReview).length;

    const summary: SnapshotSummary = {
      artifactsProcessed: result.artifacts.length,
      documentsClassified: documentInventory.length,
      entitiesDetected: result.entities.length,
      relationshipsDetected: result.relationships.length,
      unknownDocuments: unknownDocs,
      requiresReview,
      coverageIndicator: unknownDocs > documentInventory.length / 2 ? 'low'
        : requiresReview > documentInventory.length / 2 ? 'medium'
        : 'high',
    };

    return {
      id: snapshotId,
      generatedAt: now,
      pipelineVersion: result.pipelineVersion,
      summary,
      documentInventory,
      entityGroups,
      relationshipSummary,
      timeline,
      uncertainty,
      nextBestAction,
    };
  }

  // --------------------------------------------------------------------------
  // Builders
  // --------------------------------------------------------------------------

  private buildDocumentInventory(result: DiscoveryResult): SnapshotDocumentInventoryItem[] {
    return result.classifications.map(c => ({
      filename: result.artifacts.find(a => a.artifactId === c.artifactId)?.filename ?? 'unknown',
      documentType: c.documentType,
      confidence: c.confidence,
      requiresHumanReview: c.requiresHumanReview,
      sourceArtifactId: c.artifactId,
    }));
  }

  private buildEntityGroups(result: DiscoveryResult): SnapshotEntityGroup[] {
    const grouped = new Map<string, { value: string; normalizedValue: string | null; confidence: number }[]>();

    for (const entity of result.entities) {
      if (!grouped.has(entity.type)) grouped.set(entity.type, []);
      grouped.get(entity.type)!.push({
        value: entity.value,
        normalizedValue: entity.normalizedValue,
        confidence: entity.confidence,
      });
    }

    return Array.from(grouped.entries()).map(([type, entities]) => ({
      type,
      label: ENTITY_GROUP_LABELS[type] ?? type,
      entities,
    }));
  }

  private buildRelationshipSummary(result: DiscoveryResult): SnapshotRelationshipItem[] {
    // Build entity lookup by entityId
    const entityMap = new Map(result.entities.map(e => [e.entityId, e]));

    return result.relationships.map(r => ({
      type: r.type,
      sourceValue: entityMap.get(r.sourceEntityId)?.value ?? r.sourceEntityId,
      targetValue: entityMap.get(r.targetEntityId)?.value ?? r.targetEntityId,
      confidence: r.confidence,
    }));
  }

  private buildTimeline(
    result: DiscoveryResult,
    entityGroups: SnapshotEntityGroup[],
  ): SnapshotTimelineEvent[] {
    // Extract date entities
    const dateGroup = entityGroups.find(g => g.type === 'DATE');
    if (!dateGroup) return [];

    // Build timeline events from dates + relationships
    const events: SnapshotTimelineEvent[] = [];

    for (const dateEntity of dateGroup.entities) {
      // Find relationships involving this date
      const dateRelationships = result.relationships.filter(r => {
        const sourceEnt = result.entities.find(e => e.entityId === r.sourceEntityId);
        const targetEnt = result.entities.find(e => e.entityId === r.targetEntityId);
        return sourceEnt?.value === dateEntity.value || targetEnt?.value === dateEntity.value;
      });

      const relatedValues = dateRelationships.map(r => {
        const sourceEnt = result.entities.find(e => e.entityId === r.sourceEntityId);
        const targetEnt = result.entities.find(e => e.entityId === r.targetEntityId);
        return [sourceEnt?.value, targetEnt?.value].filter(Boolean) as string[];
      }).flat();

      const uniqueRelated = [...new Set(relatedValues)];

      events.push({
        date: dateEntity.value,
        description: uniqueRelated.length > 0
          ? `Date referenced with: ${uniqueRelated.join(', ')}`
          : `Date detected in document`,
        sourceEntityValues: uniqueRelated,
        confidence: dateEntity.confidence,
      });
    }

    // Sort chronologically by date
    events.sort((a, b) => a.date.localeCompare(b.date));

    return events;
  }

  private buildUncertainty(
    result: DiscoveryResult,
    inventory: SnapshotDocumentInventoryItem[],
  ): SnapshotUncertaintyItem[] {
    const items: SnapshotUncertaintyItem[] = [];

    for (const doc of inventory) {
      if (doc.documentType === 'UNKNOWN') {
        items.push({
          type: 'unknown_document',
          description: `Document "${doc.filename}" could not be classified.`,
          sourceArtifactId: doc.sourceArtifactId,
        });
      }
      if (doc.confidence < 0.4) {
        items.push({
          type: 'low_confidence_classification',
          description: `Document "${doc.filename}" classified as ${doc.documentType} with low confidence (${(doc.confidence * 100).toFixed(0)}%).`,
          sourceArtifactId: doc.sourceArtifactId,
        });
      }
    }

    return items;
  }

  private buildNextBestAction(
    uncertainty: SnapshotUncertaintyItem[],
    inventory: SnapshotDocumentInventoryItem[],
  ): SnapshotNextBestAction {
    // Deterministic priority logic

    // Priority 1: Unknown documents need classification
    const unknownDocs = uncertainty.filter(u => u.type === 'unknown_document');
    if (unknownDocs.length > 0) {
      return {
        action: `Review ${unknownDocs.length} unclassified document(s)`,
        rationale: `${unknownDocs.length} document(s) could not be automatically classified. Manual review will determine whether they contain relevant institutional evidence. This is the highest-leverage action because unclassified documents may contain critical capability evidence.`,
        priority: 'high',
      };
    }

    // Priority 2: Low confidence classifications
    const lowConf = uncertainty.filter(u => u.type === 'low_confidence_classification');
    if (lowConf.length > 0) {
      return {
        action: `Review ${lowConf.length} low-confidence classification(s)`,
        rationale: `${lowConf.length} document(s) were classified with low confidence. Confirming or correcting their type will improve the accuracy of the institutional evidence inventory.`,
        priority: 'medium',
      };
    }

    // Priority 3: All good — recommend enrichment
    if (inventory.length > 0) {
      return {
        action: 'Upload additional documents to strengthen coverage',
        rationale: `${inventory.length} document(s) processed successfully. Adding more documents (SOPs, training records, calibration certificates, study close-out letters) will increase institutional evidence coverage.`,
        priority: 'medium',
      };
    }

    // Fallback
    return {
      action: 'Upload a document to begin evidence discovery',
      rationale: 'No documents were processed. Upload SOPs, calibration certificates, training records, or study documents to start building the institutional evidence profile.',
      priority: 'high',
    };
  }
}
