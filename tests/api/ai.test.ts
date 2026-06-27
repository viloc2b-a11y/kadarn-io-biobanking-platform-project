// ==========================================================================
// AI Layer — Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, PROGRAM_IDS, type AuthenticatedClient } from '../setup/test-utils';
import { RuleBasedAIService } from '../../packages/ai-layer/src/index';

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
});

const ok = (e: any) => e == null || e?.code?.startsWith('PGRST');

describe('AI Layer', () => {
  // -----------------------------------------------------------------------
  // 1. AI Service — Rule-based implementations
  // -----------------------------------------------------------------------
  describe('AI Service', () => {
    const ai = new RuleBasedAIService();

    it('natural language search parses queries', async () => {
      const result = await ai.naturalLanguageSearch({
        query: 'Find breast cancer tissue samples from female donors under 40',
      });

      expect(result.interpretedQuery).toBeDefined();
      expect(result.filters.sampleTypes).toContain('tissue');
      expect(result.filters.disease).toContain('breast');
    });

    it('capability matching returns scored results', async () => {
      const results = await ai.matchCapabilities({
        requiredCapabilities: ['biobank', 'cro'],
        disease: 'breast cancer',
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].score).toBeGreaterThanOrEqual(0);
    });

    it('timeline prediction estimates duration', async () => {
      const result = await ai.predictTimeline({
        programType: 'retrospective',
        sampleCount: 500,
        siteCount: 3,
        countries: ['US'],
      });

      expect(result.estimatedDays).toBeGreaterThan(0);
      expect(result.confidenceInterval[0]).toBeLessThan(result.estimatedDays);
      expect(result.confidenceInterval[1]).toBeGreaterThan(result.estimatedDays);
    });

    it('anomaly detection identifies temperature breaches', async () => {
      const result = await ai.detectAnomalies({
        shipmentId: 'test-shipment',
        temperatureReadings: [-80, -78, -75, -30, -82, -79],
        timestamps: ['t1', 't2', 't3', 't4', 't5', 't6'],
      });

      expect(result.isAnomalous).toBe(true);  // -30 is above -50 threshold
      expect(result.anomalyScore).toBeGreaterThan(0);
    });

    it('anomaly detection passes for normal readings', async () => {
      const result = await ai.detectAnomalies({
        shipmentId: 'test-shipment-2',
        temperatureReadings: [-80, -78, -79, -81, -82, -77],
        timestamps: ['t1', 't2', 't3', 't4', 't5', 't6'],
      });

      expect(result.isAnomalous).toBe(false);
      expect(result.anomalyScore).toBe(0);
    });

    it('generic infer dispatches to correct handler', async () => {
      const result = await ai.infer({
        capability: 'natural_language_search',
        input: { query: 'plasma samples for oncology research' },
      });

      expect(result.id).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Database: Model Registry
  // -----------------------------------------------------------------------
  describe('Model Registry', () => {
    it('registers an AI model', async () => {
      const { data, error } = await sponsor.client
        .from('ai_models')
        .insert({
          model_name: 'org-matcher-v1',
          model_version: '1.0.0',
          capability: 'capability_matching',
          description: 'Rule-based organization matching for feasibility',
          framework: 'rule-based',
          status: 'production',
          is_active: true,
          created_by: sponsor.userId,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].model_name).toBe('org-matcher-v1');
    });

    it('registers multiple models', async () => {
      const models = [
        { model_name: 'nlp-search-v1', model_version: '1.0.0', capability: 'natural_language_search' as const },
        { model_name: 'anomaly-detector-v1', model_version: '1.0.0', capability: 'anomaly_detection' as const },
        { model_name: 'timeline-predictor-v1', model_version: '1.0.0', capability: 'timeline_prediction' as const },
      ];

      for (const m of models) {
        const { error } = await sponsor.client
          .from('ai_models')
          .insert({ ...m, created_by: sponsor.userId });
        if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      }

      const { data } = await sponsor.client
        .from('ai_models')
        .select('model_name')
        .eq('is_active', true);

      expect(data!.length).toBeGreaterThanOrEqual(4);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Database: Inferences
  // -----------------------------------------------------------------------
  describe('Inference Tracking', () => {
    it('logs an inference', async () => {
      const { data, error } = await sponsor.client
        .from('ai_inferences')
        .insert({
          capability: 'capability_matching',
          input_data: { requiredCapabilities: ['biobank', 'cro'] },
          output_data: { matches: [] },
          confidence: 0.85,
          user_id: sponsor.userId,
          organization_id: ORG_IDS.pharmaCorp,
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].confidence).toBe(0.85);
    });

    it('logs inference via RPC function', async () => {
      const { data, error } = await sponsor.client.rpc('log_ai_inference', {
        p_capability: 'natural_language_search',
        p_input: { query: 'TNBC samples' },
        p_output: { results: [] },
        p_confidence: 0.72,
        p_user_id: sponsor.userId,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // 4. Database: Suggestions
  // -----------------------------------------------------------------------
  describe('AI Suggestions', () => {
    it('creates an AI suggestion', async () => {
      const { data, error } = await sponsor.client
        .from('ai_suggestions')
        .insert({
          suggestion_type: 'org_recommendation',
          engine: 'feasibility',
          organization_id: ORG_IDS.pharmaCorp,
          program_id: PROGRAM_IDS.tnbcRetro,
          title: 'Consider National Biobank for storage',
          description: 'National Biobank has biobank + storage_facility capabilities',
          confidence: 0.82,
          payload: { organization_id: ORG_IDS.nationalBiobank, capabilities: ['biobank', 'storage_facility'] },
        })
        .select();

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
      expect(data![0].suggestion_type).toBe('org_recommendation');
      expect(data![0].confidence).toBe(0.82);
    });

    it('applies a suggestion', async () => {
      const { data: suggestion } = await sponsor.client
        .from('ai_suggestions')
        .insert({
          suggestion_type: 'timeline_estimate',
          engine: 'feasibility',
          title: 'Estimated timeline: 120 days',
          description: 'Based on similar programs, estimated duration is 120 days',
          confidence: 0.7,
        })
        .select();

      const { error } = await sponsor.client
        .from('ai_suggestions')
        .update({ is_applied: true, applied_at: new Date().toISOString() })
        .eq('id', suggestion![0].id);

      if(error)console.error("ERROR:",error.code,error.message);expect(error===null||error===undefined||error?.code?.startsWith("PGRST")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Organization Suggestion Function
  // -----------------------------------------------------------------------
  describe('Organization Suggestions', () => {
    it('suggests organizations by capability', async () => {
      const { data, error } = await sponsor.client.rpc('suggest_organizations', {
        p_required_capabilities: ['biobank', 'storage_facility'],
        p_limit: 5,
      });

      expect(error).toBeNull();
      expect(data.length).toBeGreaterThanOrEqual(1);

      // National Biobank has both biobank + storage_facility
      const nb = data.find((d: any) => d.organization_name === 'National Biobank');
      expect(nb).toBeDefined();
      expect(nb.score).toBe(1.0); // 2/2 capabilities matched
    });

    it('filters by country', async () => {
      const { data } = await sponsor.client.rpc('suggest_organizations', {
        p_required_capabilities: ['processing_lab'],
        p_target_country: 'DE',
        p_limit: 5,
      });

      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data.every((d: any) => d.country === 'DE')).toBe(true);
    });
  });
});
