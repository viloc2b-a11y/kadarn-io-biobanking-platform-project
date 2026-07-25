import { describe, it, expect } from 'vitest'
import { LineageService } from '@kadarn/platform-services'

describe('Lineage Service (Package E)', () => {
  const service = new LineageService()

  it('should return a lineage result for a valid evidence_id', async () => {
    const lineage = await service.getLineage(crypto.randomUUID(), false)
    expect(lineage).toBeDefined()
    expect(lineage).toHaveProperty('sourceRecord')
    expect(lineage).toHaveProperty('generationRule')
    expect(lineage).toHaveProperty('evidence')
    expect(lineage).toHaveProperty('claims')
    expect(lineage).toHaveProperty('reviews')
    expect(lineage).toHaveProperty('passportEntries')
  })

  it('should return a lineage result for a valid claim_id', async () => {
    const lineage = await service.getLineage(crypto.randomUUID(), true)
    expect(lineage).toBeDefined()
    expect(lineage).toHaveProperty('claims')
  })

  it('should handle missing links gracefully', async () => {
    const lineage = await service.getLineage('nonexistent-id', false)
    expect(lineage).toBeDefined()
    expect(lineage.sourceRecord).toBeNull()
    expect(lineage.claims).toEqual([])
  })

  it('should return empty result for empty id', async () => {
    const lineage = await service.getLineage('', false)
    expect(lineage.sourceRecord).toBeNull()
    expect(lineage.claims).toEqual([])
    expect(lineage.reviews).toEqual([])
    expect(lineage.passportEntries).toEqual([])
  })
})
