// ==========================================================================
// Kadarn unified error taxonomy — AF-4.0 Sprint 1
// ==========================================================================

/** Platform-wide error codes. Prefixes: AUTH_, API_, EVIDENCE_, DISCOVERY_, DELIVERY_ */
export type KadarnErrorCode =
  // Auth
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_ORG_REQUIRED'
  | 'AUTH_CONSENT_REQUIRED'
  // API / HTTP
  | 'API_BAD_REQUEST'
  | 'API_NOT_FOUND'
  | 'API_CONFLICT'
  | 'API_RATE_LIMITED'
  | 'API_INTERNAL_ERROR'
  | 'API_NOT_IMPLEMENTED'
  | 'API_SERVICE_UNAVAILABLE'
  // Evidence / Phase 8 reconstruction (aligned with ERR_* subset)
  | 'EVIDENCE_NOT_FOUND'
  | 'EVIDENCE_INVALID_STATE'
  | 'EVIDENCE_PROVENANCE_FAILED'
  // Discovery
  | 'DISCOVERY_SESSION_NOT_FOUND'
  | 'DISCOVERY_INVALID_INPUT'
  // Delivery (reserved for KEMS-007 — Gentle AI)
  | 'DELIVERY_PACK_FAILED'
  | 'DELIVERY_CHANNEL_UNAVAILABLE'

export const KADARN_ERROR_HTTP_STATUS: Record<KadarnErrorCode, number> = {
  AUTH_UNAUTHORIZED: 401,
  AUTH_FORBIDDEN: 403,
  AUTH_INVALID_TOKEN: 401,
  AUTH_ORG_REQUIRED: 403,
  AUTH_CONSENT_REQUIRED: 403,
  API_BAD_REQUEST: 400,
  API_NOT_FOUND: 404,
  API_CONFLICT: 409,
  API_RATE_LIMITED: 429,
  API_INTERNAL_ERROR: 500,
  API_NOT_IMPLEMENTED: 501,
  API_SERVICE_UNAVAILABLE: 503,
  EVIDENCE_NOT_FOUND: 404,
  EVIDENCE_INVALID_STATE: 422,
  EVIDENCE_PROVENANCE_FAILED: 500,
  DISCOVERY_SESSION_NOT_FOUND: 404,
  DISCOVERY_INVALID_INPUT: 400,
  DELIVERY_PACK_FAILED: 500,
  DELIVERY_CHANNEL_UNAVAILABLE: 503,
}

/** Map legacy numeric HTTP codes to KadarnErrorCode */
export function httpStatusToErrorCode(status: number): KadarnErrorCode {
  switch (status) {
    case 400: return 'API_BAD_REQUEST'
    case 401: return 'AUTH_UNAUTHORIZED'
    case 403: return 'AUTH_FORBIDDEN'
    case 404: return 'API_NOT_FOUND'
    case 409: return 'API_CONFLICT'
    case 429: return 'API_RATE_LIMITED'
    case 501: return 'API_NOT_IMPLEMENTED'
    case 503: return 'API_SERVICE_UNAVAILABLE'
    default: return status >= 500 ? 'API_INTERNAL_ERROR' : 'API_BAD_REQUEST'
  }
}

export class KadarnError extends Error {
  constructor(
    public readonly code: KadarnErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'KadarnError'
  }

  get httpStatus(): number {
    return KADARN_ERROR_HTTP_STATUS[this.code]
  }
}
