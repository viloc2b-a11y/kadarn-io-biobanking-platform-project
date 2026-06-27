// ==========================================================================
// Kadarn AI Layer — AI Capability Types
// ==========================================================================

export type AICapability =
  | 'natural_language_search'
  | 'capability_matching'
  | 'timeline_prediction'
  | 'anomaly_detection'
  | 'document_generation'
  | 'smart_negotiation';

export interface AIInferenceRequest {
  capability: AICapability;
  input: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
  programId?: string;
}

export interface AIInferenceResult {
  id: string;
  output: Record<string, unknown>;
  confidence: number;
  latencyMs: number;
}

export interface AISuggestion {
  id: string;
  type: string;
  engine: string;
  title: string;
  description: string;
  confidence: number;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Natural Language Search — Discovery Engine
// ---------------------------------------------------------------------------
export interface NLSearchInput {
  query: string;
  filters?: {
    sampleTypes?: string[];
    disease?: string;
    country?: string;
    commercialOnly?: boolean;
  };
}

export interface NLSearchResult {
  interpretedQuery: string;
  filters: Record<string, unknown>;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Capability Matching — Feasibility Engine
// ---------------------------------------------------------------------------
export interface CapabilityMatchInput {
  requiredCapabilities: string[];
  disease?: string;
  country?: string;
  minScore?: number;
}

export interface CapabilityMatchResult {
  organizationId: string;
  organizationName: string;
  score: number;
  matchedCapabilities: string[];
  missingCapabilities: string[];
}

// ---------------------------------------------------------------------------
// Timeline Prediction — Feasibility Engine
// ---------------------------------------------------------------------------
export interface TimelinePredictionInput {
  programType: string;
  sampleCount: number;
  siteCount: number;
  countries: string[];
}

export interface TimelinePredictionResult {
  estimatedDays: number;
  confidenceInterval: [number, number];
  riskFactors: string[];
}

// ---------------------------------------------------------------------------
// Anomaly Detection — Chain/Logistics Engine
// ---------------------------------------------------------------------------
export interface AnomalyDetectionInput {
  shipmentId: string;
  temperatureReadings: number[];
  timestamps: string[];
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  anomalyScore: number;
  detectedPatterns: string[];
  recommendation: string;
}
