// ==========================================================================
// Kadarn AI Layer — AI Service Interface
// ==========================================================================

import type {
  AICapability, AIInferenceRequest, AIInferenceResult,
  NLSearchInput, NLSearchResult,
  CapabilityMatchInput, CapabilityMatchResult,
  TimelinePredictionInput, TimelinePredictionResult,
  AnomalyDetectionInput, AnomalyDetectionResult,
} from './types';

export interface AIService {
  /** Run inference for a given capability */
  infer(request: AIInferenceRequest): Promise<AIInferenceResult>;

  /** Natural Language Search — parse and expand search queries */
  naturalLanguageSearch(input: NLSearchInput): Promise<NLSearchResult>;

  /** Capability Matching — find best orgs for program requirements */
  matchCapabilities(input: CapabilityMatchInput): Promise<CapabilityMatchResult[]>;

  /** Timeline Prediction — estimate program duration */
  predictTimeline(input: TimelinePredictionInput): Promise<TimelinePredictionResult>;

  /** Anomaly Detection — detect temperature/supply chain anomalies */
  detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult>;
}

// ---------------------------------------------------------------------------
// Rule-based implementation (no ML dependencies)
// Used as fallback until ML models are deployed.
// ---------------------------------------------------------------------------
export class RuleBasedAIService implements AIService {
  async infer(request: AIInferenceRequest): Promise<AIInferenceResult> {
    const start = Date.now();
    let output: Record<string, unknown>;

    switch (request.capability) {
      case 'natural_language_search':
        output = await this.handleNLSearch(request.input as any);
        break;
      case 'capability_matching':
        output = await this.handleCapabilityMatch(request.input as any);
        break;
      case 'timeline_prediction':
        output = await this.handleTimelinePrediction(request.input as any);
        break;
      case 'anomaly_detection':
        output = await this.handleAnomalyDetection(request.input as any);
        break;
      default:
        output = { message: 'Capability not yet implemented', fallback: true };
    }

    return {
      id: crypto.randomUUID(),
      output,
      confidence: output.fallback ? 0.5 : 0.7,
      latencyMs: Date.now() - start,
    };
  }

  async naturalLanguageSearch(input: NLSearchInput): Promise<NLSearchResult> {
    const text = input.query.toLowerCase();
    const filters: Record<string, unknown> = {};

    // Simple keyword extraction
    const sampleTypes = ['tissue', 'blood', 'plasma', 'serum', 'dna', 'rna', 'ffpe', 'biopsy'];
    const foundTypes = sampleTypes.filter(t => text.includes(t));
    if (foundTypes.length > 0) filters.sampleTypes = foundTypes;

    const diseases = ['cancer', 'tumor', 'breast', 'lung', 'colon', 'melanoma'];
    const foundDisease = diseases.find(d => text.includes(d));
    if (foundDisease) filters.disease = foundDisease;

    return {
      interpretedQuery: input.query,
      filters,
      suggestions: ['Try adding sample type filters', 'Specify a disease for better results'],
    };
  }

  async matchCapabilities(input: CapabilityMatchInput): Promise<CapabilityMatchResult[]> {
    // Rule-based scoring — replace with ML model in production
    return input.requiredCapabilities.map(cap => ({
      organizationId: '',
      organizationName: `${cap} provider`,
      score: 0.5,
      matchedCapabilities: [cap],
      missingCapabilities: [],
    }));
  }

  async predictTimeline(input: TimelinePredictionInput): Promise<TimelinePredictionResult> {
    const baseDays = 90;
    const perSampleDays = Math.ceil(input.sampleCount / 100) * 10;
    const perSiteDays = input.siteCount * 15;
    const estimatedDays = baseDays + perSampleDays + perSiteDays;

    return {
      estimatedDays,
      confidenceInterval: [Math.floor(estimatedDays * 0.7), Math.ceil(estimatedDays * 1.3)],
      riskFactors: input.countries.length > 1 ? ['Multi-country coordination risk'] : [],
    };
  }

  async detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
    const threshold = -50; // standard frozen threshold
    const breaches = input.temperatureReadings.filter(t => t > threshold);
    const isAnomalous = breaches.length > 0;

    return {
      isAnomalous,
      anomalyScore: isAnomalous ? breaches.length / input.temperatureReadings.length : 0,
      detectedPatterns: isAnomalous ? [`${breaches.length} temperature excursions detected`] : [],
      recommendation: isAnomalous ? 'Review chain of custody and data logger calibration' : 'No action needed',
    };
  }

  private async handleNLSearch(input: any): Promise<Record<string, unknown>> {
    const result = await this.naturalLanguageSearch(input);
    return result as any;
  }

  private async handleCapabilityMatch(input: any): Promise<Record<string, unknown>> {
    return { matches: await this.matchCapabilities(input) };
  }

  private async handleTimelinePrediction(input: any): Promise<Record<string, unknown>> {
    return await this.predictTimeline(input) as any;
  }

  private async handleAnomalyDetection(input: any): Promise<Record<string, unknown>> {
    return await this.detectAnomalies(input) as any;
  }
}
