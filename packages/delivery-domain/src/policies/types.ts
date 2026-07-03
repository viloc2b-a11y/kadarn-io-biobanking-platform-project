// ==========================================================================
// Delivery Policies — Core Authorization Types (KEMS-007 §D)
// Controls WHO can access WHAT artifacts under WHICH conditions.
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ArtifactStatus } from '../value-objects/delivery-status.js';
import type { DeliveryRole } from './roles.js';

// --- Actions ---

/** Actions an actor can perform on delivery artifacts. */
export type DeliveryAction =
  | 'artifact:read'
  | 'artifact:deliver'
  | 'artifact:revoke'
  | 'artifact:expire'
  | 'policy:manage'
  | 'channel:manage'
  | 'lineage:view';

export const DELIVERY_ACTIONS: DeliveryAction[] = [
  'artifact:read',
  'artifact:deliver',
  'artifact:revoke',
  'artifact:expire',
  'policy:manage',
  'channel:manage',
  'lineage:view',
];

// --- Policy Decision ---

/** Result of a policy evaluation. */
export interface PolicyDecision {
  readonly decision: 'ALLOW' | 'DENY';
  readonly reason: string;
  /** Which evaluator made the final decision. */
  readonly evaluatedBy: 'rbac' | 'abac' | 'visibility' | 'actor-policy';
}

// --- Actor ---

/** The actor (principal) making the access request. */
export interface PolicyActor {
  readonly actorId: string;
  readonly roles: DeliveryRole[];
  readonly attributes: Record<string, unknown>;
}

// --- Context ---

/** Context for a policy evaluation — describes the artifact and environment. */
export interface PolicyContext {
  readonly artifact: {
    readonly type?: ArtifactType;
    readonly status?: ArtifactStatus;
    readonly metadata?: Record<string, unknown>;
    /** Access classification: public, confidential, counter-evidence, restricted. */
    readonly classification?: string;
    readonly ownerId?: string;
    readonly recipientIds?: string[];
  };
  readonly environment?: Record<string, unknown>;
}

// --- ABAC Rule ---

/** A single ABAC (Attribute-Based Access Control) rule. */
export interface AbacRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Higher priority rules are evaluated first and win on conflict. */
  readonly priority: number;
  /** All conditions must match for the rule to fire. */
  readonly conditions: AbacCondition[];
  readonly effect: 'ALLOW' | 'DENY';
}

/** A single condition within an ABAC rule. */
export interface AbacCondition {
  /** Dot-notation field path, e.g. 'artifact.classification', 'artifact.metadata.confidentiality'. */
  readonly field: string;
  readonly operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'exists' | 'not_exists';
  readonly value: unknown;
}

// --- Actor Policy ---

/** Actor-specific policy override — highest priority in evaluation. */
export interface ActorPolicy {
  readonly actorId: string;
  readonly rules: ActorPolicyRule[];
}

export interface ActorPolicyRule {
  readonly action: DeliveryAction;
  /** Artifact type to match against, or '*' for all. */
  readonly resourcePattern: string;
  readonly effect: 'ALLOW' | 'DENY';
  readonly priority: number;
  /** Optional ABAC-style conditions. */
  readonly conditions?: AbacCondition[];
}
