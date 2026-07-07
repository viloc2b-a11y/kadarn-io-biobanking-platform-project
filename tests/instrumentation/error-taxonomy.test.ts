import { describe, expect, it } from 'vitest'
import { KadarnError, KADARN_ERROR_HTTP_STATUS, httpStatusToErrorCode } from '@kadarn/types/errors'

describe('KadarnErrorCode taxonomy', () => {
  it('maps HTTP status to error codes', () => {
    expect(httpStatusToErrorCode(401)).toBe('AUTH_UNAUTHORIZED')
    expect(httpStatusToErrorCode(429)).toBe('API_RATE_LIMITED')
    expect(httpStatusToErrorCode(500)).toBe('API_INTERNAL_ERROR')
  })

  it('KadarnError exposes httpStatus', () => {
    const err = new KadarnError('API_NOT_FOUND', 'Not found')
    expect(err.httpStatus).toBe(KADARN_ERROR_HTTP_STATUS.API_NOT_FOUND)
  })
})
