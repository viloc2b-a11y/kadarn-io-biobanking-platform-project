// ==========================================================================
// Evidence Discovery — Document Classifier Agent v1
// ==========================================================================
// Sprint 20A.4A.
//
// Deterministic, rule-based document classifier.
// No LLM dependency. Classifies based on keyword signals in Layer 1 Markdown.
// ==========================================================================

import type { DiscoveryAgent, AgentContext, AgentResult, AgentProvenance } from './framework/types.js';
import type { SemanticRequestType } from '../preparation/types.js';
import crypto from 'node:crypto';

// --------------------------------------------------------------------------
// Document types
// --------------------------------------------------------------------------

export type DocumentType =
  | 'SOP'
  | 'CALIBRATION_RECORD'
  | 'TRAINING_RECORD'
  | 'STUDY_CLOSEOUT_LETTER'
  | 'SHIPMENT_LOG'
  | 'PROTOCOL'
  | 'FDA_LETTER'
  | 'IRB_DOCUMENT'
  | 'LAB_MANUAL'
  | 'UNKNOWN';

export interface ClassifierOutput {
  documentType: DocumentType;
  documentTypeConfidence: number;
  detectedSignals: string[];
  rationale: string;
  requiresHumanReview: boolean;
}

// --------------------------------------------------------------------------
// Signal-based classification
// --------------------------------------------------------------------------

interface ClassificationRule {
  type: DocumentType;
  keywords: string[];
  weight: number;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    type: 'SOP',
    keywords: ['standard operating procedure', 'sop', 'procedure number', 'revision history', 'approved by'],
    weight: 0.3,
  },
  {
    type: 'CALIBRATION_RECORD',
    keywords: ['calibration', 'calibrated', 'calibration certificate', 'certificate of calibration', 'due date', 'calibration due'],
    weight: 0.25,
  },
  {
    type: 'TRAINING_RECORD',
    keywords: ['training record', 'training log', 'gcp training', 'completed training', 'training certificate', 'curriculum vitae', 'cv'],
    weight: 0.2,
  },
  {
    type: 'STUDY_CLOSEOUT_LETTER',
    keywords: ['closeout', 'close-out', 'study completion', 'final report', 'study closed', 'termination letter'],
    weight: 0.25,
  },
  {
    type: 'SHIPMENT_LOG',
    keywords: ['shipment', 'shipping', 'tracking number', 'temperature log', 'cold chain', 'chain of custody', 'shipped'],
    weight: 0.2,
  },
  {
    type: 'PROTOCOL',
    keywords: ['protocol', 'study protocol', 'clinical study', 'investigational', 'inclusion criteria', 'exclusion criteria', 'informed consent'],
    weight: 0.3,
  },
  {
    type: 'FDA_LETTER',
    keywords: ['fda', 'warning letter', 'form 483', 'inspection', 'food and drug administration', 'regulatory action'],
    weight: 0.25,
  },
  {
    type: 'IRB_DOCUMENT',
    keywords: ['irb', 'institutional review board', 'ethics committee', 'approval letter', 'expedited review', 'continuing review'],
    weight: 0.25,
  },
  {
    type: 'LAB_MANUAL',
    keywords: ['laboratory manual', 'lab manual', 'assay procedure', 'sample preparation', 'reagent', 'protocol for'],
    weight: 0.2,
  },
];

export class DocumentClassifierAgent implements DiscoveryAgent {
  readonly name = 'document-classifier';
  readonly version = '0.1.0';

  supports(requestType: SemanticRequestType): boolean {
    return requestType === 'DOCUMENT_CLASSIFICATION';
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const markdown = context.layer1Markdown.toLowerCase();

    // Score each document type
    const scores = CLASSIFICATION_RULES.map(rule => {
      let matches = 0;
      const matchedSignals: string[] = [];

      for (const keyword of rule.keywords) {
        if (markdown.includes(keyword)) {
          matches++;
          matchedSignals.push(keyword);
        }
      }

      const score = (matches / rule.keywords.length) * rule.weight;
      return { type: rule.type, score, matchedSignals };
    }).filter(s => s.score > 0);

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    let documentType: DocumentType;
    let confidence: number;
    let detectedSignals: string[];
    let rationale: string;
    let requiresHumanReview: boolean;

    if (scores.length === 0) {
      documentType = 'UNKNOWN';
      confidence = 0;
      detectedSignals = [];
      rationale = 'No classification signals detected in document content.';
      requiresHumanReview = true;
    } else {
      documentType = scores[0].type;
      confidence = Math.min(scores[0].score * 2, 0.95);
      detectedSignals = scores[0].matchedSignals;
      rationale = `Classified as ${documentType} based on ${detectedSignals.length} signal(s): ${detectedSignals.join(', ')}`;
      requiresHumanReview = confidence < 0.5 || scores.length > 1 && scores[1].score > scores[0].score * 0.5;
    }

    const output: ClassifierOutput = {
      documentType,
      documentTypeConfidence: Math.round(confidence * 100) / 100,
      detectedSignals,
      rationale,
      requiresHumanReview,
    };

    const completedAt = new Date().toISOString();
    const provenance: AgentProvenance = {
      agentName: this.name,
      agentVersion: this.version,
      pipelineVersion: context.pipelineVersion,
      modelVersion: null,
      startedAt,
      completedAt,
      inputHash: crypto.createHash('sha256').update(markdown).digest('hex').slice(0, 16),
      layer1Id: context.layer1Id,
      artifactId: context.artifactId,
    };

    return {
      requestId: context.requestId,
      agentName: this.name,
      agentVersion: this.version,
      status: 'COMPLETED',
      output: output as unknown as Record<string, unknown>,
      confidence,
      warnings: requiresHumanReview ? ['Low confidence or ambiguous classification — human review recommended.'] : [],
      provenance,
    };
  }
}
