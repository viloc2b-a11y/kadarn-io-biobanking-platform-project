import type { KadarnErrorCode } from '@kadarn/types/errors'
import { KadarnError, httpStatusToErrorCode } from '@kadarn/types/errors'

export { KadarnError, httpStatusToErrorCode }
export type { KadarnErrorCode }

/** Legacy ApiError compatibility — maps to KadarnErrorCode */
export function fromLegacyApiError(statusCode: number, message: string, details?: unknown): KadarnError {
  return new KadarnError(httpStatusToErrorCode(statusCode), message, details)
}
