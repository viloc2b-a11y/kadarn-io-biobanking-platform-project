// ─── KAD-LOOP-002 — Generation Pipeline Service ─────────────────────────
// Authority: KADARN Engineering Playbook, Evidence Core
// Core evidence generation executor.
// Fetches source_record + generation_rule, validates inputs, executes a
// registered generator, persists the evidence_node, and supports replay
// for determinism verification.

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import type {
  Evidence,
  GenerateEvidenceInput,
  GenerationRule,
  ReplayResult,
  SourceRecord,
} from '@kadarn/types';

// ─── Generator Registry ──────────────────────────────────────────────────

export interface Generator {
  name: string;
  version: string;
  execute(inputs: Record<string, unknown>): string;
}

export interface GenerationMetadata {
  rule_id: string;
  rule_version: number;
  generator: string;
  input_hash: string;
  generated_at: string;
}

export interface GenerateResult {
  evidence: Evidence;
  metadata: GenerationMetadata;
}

// ─── Service ─────────────────────────────────────────────────────────────

export class GenerationPipelineService {
  private generators: Map<string, Generator> = new Map();
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase =
      supabase ??
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
  }

  // ─── Generator Registration ────────────────────────────────────────────

  /**
   * Register a named generator. The key is `rule.output_evidence_type`.
   */
  registerGenerator(gen: Generator): void {
    this.generators.set(gen.name, gen);
  }

  /**
   * Look up a generator by its name (matches `rule.output_evidence_type`).
   */
  private getGenerator(name: string): Generator {
    const gen = this.generators.get(name);
    if (!gen) {
      throw new Error(`No generator registered for output_evidence_type "${name}"`);
    }
    return gen;
  }

  // ─── Input Hash ────────────────────────────────────────────────────────

  /**
   * Compute a deterministic input_hash:
   * SHA-256(source_record.content_hash | rule.id | rule.rule_version)
   */
  private computeInputHash(
    sourceRecord: SourceRecord,
    rule: GenerationRule,
  ): string {
    const hashInput = [
      sourceRecord.content_hash || '',
      rule.id,
      String(rule.rule_version),
    ].join('|');
    return createHash('sha256').update(hashInput).digest('hex');
  }

  // ─── Input Validation ──────────────────────────────────────────────────

  /**
   * Validate that all required_inputs declared on the rule are present
   * in the assembled inputs map.
   */
  private validateInputs(
    rule: GenerationRule,
    sourceRecord: SourceRecord,
  ): Record<string, unknown> {
    const required = rule.required_inputs ?? {};
    const inputs: Record<string, unknown> = {
      source_record_id: sourceRecord.id,
      content_hash: sourceRecord.content_hash,
      record_type: sourceRecord.record_type,
      raw_metadata: sourceRecord.raw_metadata,
      locator_uri: sourceRecord.locator_uri,
      rule_id: rule.id,
      rule_version: rule.rule_version,
    };

    for (const [key, spec] of Object.entries(required)) {
      if (!(key in inputs) && inputs[key] === undefined) {
        // If the rule declares a required input that we cannot source,
        // throw — the caller must supply it or the source record must have it.
        const specRecord = spec as Record<string, unknown>;
        if (specRecord?.default !== undefined) {
          inputs[key] = specRecord.default;
        } else {
          throw new Error(
            `Missing required input "${key}" for rule "${rule.rule_name}" (v${rule.rule_version})`,
          );
        }
      }
    }

    return inputs;
  }

  // ─── Generate ──────────────────────────────────────────────────────────

  /**
   * Generate evidence from a source_record + generation_rule.
   *
   * Steps:
   * 1. Fetch source_record by id
   * 2. Fetch generation_rule by id
   * 3. Validate inputs against rule.required_inputs
   * 4. Compute input_hash = SHA-256(source_record.content_hash + rule.id + rule.rule_version)
   * 5. Execute generator (looked up by rule.output_evidence_type)
   * 6. Insert evidence_node with generation provenance fields + lifecycle_status='generated'
   * 7. Return evidence + generation metadata
   */
  async generate(input: GenerateEvidenceInput): Promise<GenerateResult> {
    const { source_record_id, rule_id } = input;

    // 1. Fetch source record
    const { data: sourceRecord, error: srcError } = await this.supabase
      .from('source_records')
      .select('*')
      .eq('id', source_record_id)
      .single();

    if (srcError || !sourceRecord) {
      throw new Error(
        `Source record not found: ${source_record_id} — ${srcError?.message ?? 'no data'}`,
      );
    }

    // 2. Fetch generation rule
    const { data: ruleRow, error: ruleError } = await this.supabase
      .from('evidence_generation_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (ruleError || !ruleRow) {
      throw new Error(
        `Generation rule not found: ${rule_id} — ${ruleError?.message ?? 'no data'}`,
      );
    }

    const rule = ruleRow as unknown as GenerationRule;

    // 3. Validate rule is active
    if (!rule.active || rule.rule_status === 'retired') {
      throw new Error(
        `Generation rule "${rule.rule_name}" (v${rule.rule_version}) is not active (status=${rule.rule_status})`,
      );
    }

    // 4. Validate inputs
    const inputs = this.validateInputs(rule, sourceRecord as unknown as SourceRecord);

    // 5. Compute input hash
    const inputHash = this.computeInputHash(
      sourceRecord as unknown as SourceRecord,
      rule,
    );

    // 6. Execute generator
    const generator = this.getGenerator(rule.output_evidence_type);
    const generatedContent = generator.execute(inputs);

    const generatedAt = new Date().toISOString();
    const generatorName = `${generator.name}@v${generator.version}`;

    // 7. Insert evidence_node
    //    Cast through unknown to bypass Supabase client's strict generic insert typing.
    const insertPayload = {
      claim_id: null, // Unlinked initially — linked via claim_evidence_links later
      evidence_class: rule.output_evidence_type,
      content: generatedContent,
      status: 'active',
      lifecycle_status: 'generated',
      generation_rule_id: rule.id,
      input_hash: inputHash,
      generator: generatorName,
      generated_at: generatedAt,
      source_record_id: (sourceRecord as unknown as SourceRecord).id,
      provenance: {
        source_record_id: (sourceRecord as unknown as SourceRecord).id,
        rule_id: rule.id,
        rule_version: rule.rule_version,
        input_hash: inputHash,
        generator: generatorName,
      },
    };

    const insertResult = await (this.supabase as unknown as {
      from: (table: string) => {
        insert: (values: unknown) => {
          select: (columns: string) => {
            single: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
          }
        }
      }
    })
      .from('evidence_nodes')
      .insert(insertPayload)
      .select('*')
      .single();

    const evidenceRow = insertResult.data;
    const insertError = insertResult.error;

    if (insertError || !evidenceRow) {
      throw new Error(
        `Failed to insert generated evidence: ${insertError?.message ?? 'no data returned'}`,
      );
    }

    const evidence = evidenceRow as unknown as Evidence;

    // 8. Return evidence + metadata
    return {
      evidence,
      metadata: {
        rule_id: rule.id,
        rule_version: rule.rule_version,
        generator: generatorName,
        input_hash: inputHash,
        generated_at: generatedAt,
      },
    };
  }

  // ─── Replay ────────────────────────────────────────────────────────────

  /**
   * Replay a generation and verify determinism.
   *
   * Steps:
   * 1. Fetch evidence_node by id (get original input_hash, content, rule_id, source_record_id)
   * 2. Fetch source_record + generation_rule again
   * 3. Recompute input_hash
   * 4. Re-execute generator
   * 5. Compare input_hash and output content
   */
  async replay(evidenceId: string): Promise<ReplayResult> {
    // 1. Fetch the original evidence node
    const { data: evidenceRow, error: evError } = await this.supabase
      .from('evidence_nodes')
      .select('*')
      .eq('id', evidenceId)
      .single();

    if (evError || !evidenceRow) {
      throw new Error(
        `Evidence not found: ${evidenceId} — ${evError?.message ?? 'no data'}`,
      );
    }

    const evidence = evidenceRow as unknown as Evidence;
    const originalInputHash = evidence.input_hash ?? '';
    const originalContent = evidence.content;

    if (!evidence.generation_rule_id || !evidence.source_record_id) {
      throw new Error(
        `Evidence ${evidenceId} has no generation provenance — cannot replay`,
      );
    }

    // 2. Re-fetch source record + rule
    const { data: sourceRecord, error: srcError } = await this.supabase
      .from('source_records')
      .select('*')
      .eq('id', evidence.source_record_id)
      .single();

    if (srcError || !sourceRecord) {
      throw new Error(
        `Source record not found during replay: ${evidence.source_record_id}`,
      );
    }

    const { data: ruleRow, error: ruleError } = await this.supabase
      .from('evidence_generation_rules')
      .select('*')
      .eq('id', evidence.generation_rule_id)
      .single();

    if (ruleError || !ruleRow) {
      throw new Error(
        `Generation rule not found during replay: ${evidence.generation_rule_id}`,
      );
    }

    const rule = ruleRow as unknown as GenerationRule;

    // 3. Recompute input hash
    const replayedInputHash = this.computeInputHash(
      sourceRecord as unknown as SourceRecord,
      rule,
    );
    const inputHashMatches = replayedInputHash === originalInputHash;

    // 4. Re-execute generator
    const inputs = this.validateInputs(rule, sourceRecord as unknown as SourceRecord);
    const generator = this.getGenerator(rule.output_evidence_type);
    const replayedContent = generator.execute(inputs);

    // 5. Compare output content
    const outputMatches = replayedContent === originalContent;

    return {
      evidence_id: evidenceId,
      input_hash_matches: inputHashMatches,
      output_matches: outputMatches,
      replayed_content: replayedContent,
      original_content: originalContent,
      replayed_at: new Date().toISOString(),
    };
  }
}
