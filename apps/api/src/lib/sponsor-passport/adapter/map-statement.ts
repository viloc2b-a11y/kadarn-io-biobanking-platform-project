/**
 * RC-11.3 — Candidate register statement language (RC-10.2 product law).
 */

export function toCandidateStatement(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return 'Evidence suggests capability at this institution'

  if (/^evidence suggests/i.test(trimmed)) {
    return trimmed
  }

  const normalized = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed
  const lowerFirst =
    normalized.charAt(0).toLowerCase() + normalized.slice(1)

  return `Evidence suggests ${lowerFirst}`
}
