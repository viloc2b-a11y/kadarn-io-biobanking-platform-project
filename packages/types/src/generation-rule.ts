export type GenerationRule = {
    id: string; // UUID
    rule_name: string;
    rule_version: number;
    event_pattern: string;
    required_inputs: object;
    output_evidence_type: string;
    preconditions: object;
    review_mode: 'manual' | 'automatic' | 'conditional';
    confidence_policy: object;
    owner?: string; // UUID
    active: boolean;
    effective_from: Date;
    effective_until?: Date;
    created_at: Date;
    updated_at: Date;
};
