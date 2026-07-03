/** Strip volatile timestamps for equivalence assertions */
export function stripVolatileTimestamps<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, val) => {
      if (
        key === 'last_updated'
        || key === 'generated_at'
        || key === 'generation_timestamp'
      ) return '[timestamp]'
      if (key === 'provenance' && typeof val === 'string') return '[provenance]'
      return val
    }),
  ) as T
}
