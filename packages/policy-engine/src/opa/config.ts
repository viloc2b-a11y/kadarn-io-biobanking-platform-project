// ==========================================================================
// Kadarn Policy Engine — Feature Flags & Configuration
// ==========================================================================
// Feature flags control OPA Shadow Mode behavior:
//
//   OPA_SHADOW_MODE=true   — Enable OPA evaluation (parallel, non-blocking)
//   OPA_ENFORCEMENT=false  — If true, OPA decisions become authoritative
//   OPA_FAIL_OPEN=true     — If OPA errors, request proceeds (fail-open)
//
// In Shadow Mode (OPA_ENFORCEMENT=false):
//   - RLS remains the final enforcement layer
//   - OPA evaluates but never blocks
//   - All decisions are recorded for comparison
// ==========================================================================

export interface PolicyEngineConfig {
  /** Enable OPA shadow mode evaluation */
  opaShadowMode: boolean;
  /** When true, OPA decisions are authoritative */
  opaEnforcement: boolean;
  /** When OPA errors, proceed (true) or deny (false) */
  opaFailOpen: boolean;
  /** Default policy version string */
  defaultPolicyVersion: string;
  /** Policy directory (for Rego file discovery) */
  policyDir: string;
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: PolicyEngineConfig = {
  opaShadowMode: false,
  opaEnforcement: false,
  opaFailOpen: true,
  defaultPolicyVersion: '0.1.0',
  policyDir: './policies',
};

// --------------------------------------------------------------------------
// Load config from environment
// --------------------------------------------------------------------------

export function loadConfig(overrides?: Partial<PolicyEngineConfig>): PolicyEngineConfig {
  const envConfig: Partial<PolicyEngineConfig> = {
    opaShadowMode: parseEnvBool(process.env.OPA_SHADOW_MODE, DEFAULT_CONFIG.opaShadowMode),
    opaEnforcement: parseEnvBool(process.env.OPA_ENFORCEMENT, DEFAULT_CONFIG.opaEnforcement),
    opaFailOpen: parseEnvBool(process.env.OPA_FAIL_OPEN, DEFAULT_CONFIG.opaFailOpen),
    defaultPolicyVersion: process.env.OPA_POLICY_VERSION ?? DEFAULT_CONFIG.defaultPolicyVersion,
    policyDir: process.env.OPA_POLICY_DIR ?? DEFAULT_CONFIG.policyDir,
  };

  return { ...DEFAULT_CONFIG, ...envConfig, ...overrides };
}

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (value === 'true' || value === '1' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'no') return false;
  return defaultValue;
}
