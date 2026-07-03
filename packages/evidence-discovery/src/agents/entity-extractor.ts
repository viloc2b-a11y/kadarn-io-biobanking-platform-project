// ==========================================================================
// Evidence Discovery — Entity Extractor Agent
// ==========================================================================
// Sprint 20A.4B.
//
// Deterministic, pattern-based entity extraction from Layer 1 Markdown.
// No LLM dependency. Extracts based on regex patterns and keyword signals.
// ==========================================================================

import type { DiscoveryAgent, AgentContext, AgentResult, AgentProvenance } from './framework/types';
import type { SemanticRequestType } from '../preparation/types.js';
import crypto from 'node:crypto';

// --------------------------------------------------------------------------
// Entity types
// --------------------------------------------------------------------------

export type EntityType =
  | 'INVESTIGATOR'
  | 'INSTITUTION'
  | 'SPONSOR'
  | 'CRO'
  | 'STUDY'
  | 'PROTOCOL_ID'
  | 'EQUIPMENT'
  | 'TEMPERATURE'
  | 'LOCATION'
  | 'DATE'
  | 'DOCUMENT_VERSION'
  | 'REGULATORY_BODY'
  | 'LAB_VENDOR'
  | 'UNKNOWN';

export interface ExtractedEntity {
  entityId: string;
  type: EntityType;
  value: string;
  normalizedValue: string | null;
  confidence: number;
  sourceSpan: string;
  signals: string[];
  requiresHumanReview: boolean;
}

export interface EntityExtractorOutput {
  entities: ExtractedEntity[];
}

// --------------------------------------------------------------------------
// Extraction patterns
// --------------------------------------------------------------------------

interface ExtractionPattern {
  type: EntityType;
  patterns: RegExp[];
  weight: number;
  normalize?: (match: string) => string;
}

const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  {
    type: 'INVESTIGATOR',
    patterns: [
      /([A-Z][a-z]+ [A-Z][a-z]+)(?:,?\s*(?:MD|PhD|DO|PharmD|RN|BSN|MS|MPH))?/g,
      /(Dr\.\s+[A-Z][a-z]+ [A-Z][a-z]+)/g,
      /(Principal Investigator|PI)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/gi,
    ],
    weight: 0.15,
  },
  {
    type: 'INSTITUTION',
    patterns: [
      /([A-Z][A-Za-z\s]+(?:University|College|Institute|Hospital|Clinic|Medical Center|School of Medicine|Health System))/g,
      /(Mayo Clinic|Cleveland Clinic|Johns Hopkins|Mass General|Stanford|UCLA|UCSF|MD Anderson)/g,
    ],
    weight: 0.2,
  },
  {
    type: 'SPONSOR',
    patterns: [
      /(Sponsored by|Sponsor)[:\s]+([A-Z][A-Za-z0-9\s.,]+)/gi,
      /(Funding|Funded by)[:\s]+([A-Z][A-Za-z0-9\s.,]+)/gi,
    ],
    weight: 0.15,
  },
  {
    type: 'CRO',
    patterns: [
      /(CRO|Contract Research Organization)[:\s]+([A-Z][A-Za-z0-9\s.,]+)/gi,
      /(LABORATORY|CENTRAL LAB|REFERENCE LAB)[:\s]+([A-Z][A-Za-z0-9\s.,]+)/gi,
    ],
    weight: 0.15,
  },
  {
    type: 'EQUIPMENT',
    patterns: [
      /\b(Freezer|Centrifuge|Thermometer|Incubator|Hood|Microscope|Spectrophotometer|Thermocycler|PCR|HPLC|Mass Spectrometer)\s*[#:]?\s*[A-Za-z0-9-]*/gi,
      /\b(Equipment|Instrument|Device)[:\s]+([A-Z][A-Za-z0-9\s-]+)/gi,
    ],
    weight: 0.15,
  },
  {
    type: 'TEMPERATURE',
    patterns: [
      /(-?\d+\s*[°]\s*(?:C|F|K))|(-?\d+\s*(?:degrees? C|degrees? F))/gi,
      /(-80\s*°?\s*C|minus\s*80|2-8\s*°?\s*C|room\s*temp|ambient)/gi,
      /\b(-20|4|25|37|60|80)\s*°\s*C\b/g,
    ],
    weight: 0.2,
    normalize: (m: string) => {
      const num = m.replace(/[°\s]/g, '').toLowerCase();
      if (num.includes('minus') || num.includes('-80')) return '-80°C';
      if (num.includes('2-8') || num.includes('2to8')) return '2-8°C';
      if (num.includes('-20')) return '-20°C';
      return m.trim();
    },
  },
  {
    type: 'DATE',
    patterns: [
      /\b(20\d{2})[-/]\d{2}[-/]\d{2}\b/g,
      /\b(\d{1,2}\/\d{1,2}\/(?:20\d{2}))\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/g,
    ],
    weight: 0.1,
  },
  {
    type: 'PROTOCOL_ID',
    patterns: [
      /\b(Protocol|PROTOCOL|PROTOCOL NUMBER|Study ID|ClinicalTrials\.gov ID|NCT\d{8})\s*[#:]?\s*([A-Za-z0-9-]+)/gi,
      /\b(NCT\d{8})\b/g,
      /\b(PRO\d{3,6})\b/g,
    ],
    weight: 0.2,
  },
  {
    type: 'LOCATION',
    patterns: [
      /\b([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY))\b/g,
    ],
    weight: 0.1,
  },
  {
    type: 'REGULATORY_BODY',
    patterns: [
      /\b(FDA|EMA|MHRA|ANVISA|PMDA|TGA|CFDA|IRB|EC|Ethics Committee)\b/g,
    ],
    weight: 0.15,
  },
];

export class EntityExtractorAgent implements DiscoveryAgent {
  readonly name = 'entity-extractor';
  readonly version = '0.1.0';

  supports(requestType: SemanticRequestType): boolean {
    return requestType === 'ENTITY_EXTRACTION';
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const startedAt = new Date().toISOString();
    const markdown = context.layer1Markdown;
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();

    for (const pattern of EXTRACTION_PATTERNS) {
      for (const regex of pattern.patterns) {
        const matches = markdown.matchAll(regex);
        for (const match of matches) {
          // Use the actual captured value or the full match
          const value = match[2] || match[1] || match[0];
          const normalized = value.trim();

          if (normalized.length < 2 || normalized.length > 200) continue;
          if (seen.has(normalized.toLowerCase())) continue;
          seen.add(normalized.toLowerCase());

          const signals = [`Matched pattern: ${regex.source.slice(0, 40)}`];
          const normalizedValue = pattern.normalize ? pattern.normalize(normalized) : null;

          entities.push({
            entityId: `ent-${crypto.randomUUID().slice(0, 8)}`,
            type: pattern.type,
            value: normalized,
            normalizedValue,
            confidence: Math.min(pattern.weight * match.length / 10 + 0.3, 0.9),
            sourceSpan: match[0].slice(0, 100),
            signals,
            requiresHumanReview: pattern.weight < 0.15,
          });
        }
      }
    }

    // Deduplicate by value + type
    const unique: ExtractedEntity[] = [];
    const uniqueKey = new Set<string>();
    for (const e of entities) {
      const key = `${e.type}:${e.value.toLowerCase()}`;
      if (!uniqueKey.has(key)) {
        uniqueKey.add(key);
        unique.push(e);
      }
    }

    const output: EntityExtractorOutput = { entities: unique };
    const confidence = unique.length > 0 ? Math.min(unique.reduce((s, e) => s + e.confidence, 0) / unique.length, 0.9) : 0;
    const completedAt = new Date().toISOString();

    const provenance: AgentProvenance = {
      agentName: this.name, agentVersion: this.version,
      pipelineVersion: context.pipelineVersion, modelVersion: null,
      startedAt, completedAt,
      inputHash: crypto.createHash('sha256').update(markdown).digest('hex').slice(0, 16),
      layer1Id: context.layer1Id, artifactId: context.artifactId,
    };

    return {
      requestId: context.requestId, agentName: this.name, agentVersion: this.version,
      status: 'COMPLETED',
      output: output as unknown as Record<string, unknown>,
      confidence,
      warnings: [],
      provenance,
    };
  }
}
