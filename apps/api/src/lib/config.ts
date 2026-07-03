// ==========================================================================
// Kadarn API — Runtime Config Validation
// ==========================================================================
// RC-0.4 — Validates required environment variables at startup.
// Missing production secrets fail fast. Optional providers degrade gracefully.
// ==========================================================================

// ---------------------------------------------------------------------------
// Config definition
// ---------------------------------------------------------------------------

type EnvClass = 'required' | 'optional' | 'development-only' | 'production-only'

interface EnvVar {
  key: string
  class: EnvClass
  description: string
}

const ENV_VARS: EnvVar[] = [
  // ── Core (required everywhere) ──
  { key: 'SUPABASE_URL', class: 'required', description: 'Supabase project URL' },
  { key: 'SUPABASE_ANON_KEY', class: 'required', description: 'Supabase anonymous key' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', class: 'required', description: 'Supabase service role key (server-side only)' },
  { key: 'NEXT_PUBLIC_API_URL', class: 'required', description: 'Public API base URL' },

  // ── Auth ──
  { key: 'SUPABASE_JWT_SECRET', class: 'production-only', description: 'JWT signing secret' },

  // ── Connector providers (optional — degrade gracefully) ──
  { key: 'PUBMED_API_KEY', class: 'optional', description: 'NCBI E-utilities API key' },
  { key: 'CLINICALTRIALS_API_KEY', class: 'optional', description: 'ClinicalTrials.gov API key' },
  { key: 'CROSSREF_API_KEY', class: 'optional', description: 'Crossref API key' },
  { key: 'OPENALEX_API_KEY', class: 'optional', description: 'OpenAlex API key (rate limit increase)' },
  { key: 'ORCID_API_KEY', class: 'optional', description: 'ORCID API key' },
  { key: 'ROR_API_KEY', class: 'optional', description: 'ROR API key' },

  // ── AI/LLM (optional) ──
  { key: 'OPENAI_API_KEY', class: 'optional', description: 'OpenAI API key for discovery agents' },
  { key: 'OPENROUTER_API_KEY', class: 'optional', description: 'OpenRouter API key' },
  { key: 'ANTHROPIC_API_KEY', class: 'optional', description: 'Anthropic API key' },

  // ── Email/Notifications (optional) ──
  { key: 'SMTP_HOST', class: 'optional', description: 'SMTP server host' },
  { key: 'SMTP_PORT', class: 'optional', description: 'SMTP server port' },
  { key: 'SMTP_USER', class: 'optional', description: 'SMTP username' },
  { key: 'SMTP_PASS', class: 'optional', description: 'SMTP password (redacted in logs)' },

  // ── Development ──
  { key: 'NODE_ENV', class: 'required', description: 'Runtime environment' },
  { key: 'NEXT_PUBLIC_APP_URL', class: 'development-only', description: 'Frontend URL for local dev' },
  { key: 'DATABASE_URL', class: 'development-only', description: 'Direct database URL (dev only)' },
]

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ConfigValidationResult {
  valid: boolean
  missing: string[]
  warnings: string[]
  environment: string
}

/**
 * Validate required environment variables at startup.
 * Returns result with missing keys and warnings.
 */
export function validateConfig(): ConfigValidationResult {
  const env = process.env.NODE_ENV ?? 'development'
  const isProd = env === 'production'
  const missing: string[] = []
  const warnings: string[] = []

  for (const v of ENV_VARS) {
    const value = process.env[v.key]

    if (v.class === 'required') {
      if (!value) {
        missing.push(v.key)
      }
    } else if (v.class === 'production-only') {
      if (isProd && !value) {
        missing.push(v.key)
      }
    } else if (v.class === 'optional') {
      if (!value) {
        warnings.push(`${v.key}: not set — ${v.description} (provider may be unavailable)`)
      }
    } else if (v.class === 'development-only') {
      if (!isProd && !value) {
        warnings.push(`${v.key}: not set — ${v.description} (local dev may be affected)`)
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    environment: env,
  }
}

/**
 * Fail-fast check — call at app startup.
 * Throws if required production config is missing.
 */
export function assertConfig(): void {
  const result = validateConfig()

  if (!result.valid) {
    const msg = `FATAL: Missing required environment variables: ${result.missing.join(', ')}`
    console.error(msg)
    throw new Error(msg)
  }

  if (result.warnings.length > 0) {
    console.warn(`Config warnings (${result.warnings.length}):`)
    for (const w of result.warnings) {
      console.warn(`  - ${w}`)
    }
  }

  console.log(`Config validated: ${result.environment} mode, ${ENV_VARS.length} vars checked`)
}
