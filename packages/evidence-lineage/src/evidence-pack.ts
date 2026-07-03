// Sprint 28H — Evidence Pack Engine
// Auto-generated explainability packs for every Claim.
export interface EvidencePack { packId: string; claimId: string; claimStatement: string; supportingFacts: Array<{ id: string; content: unknown }>; evidenceGraph: { nodes: number; edges: number }; confidence: { value: number; level: string }; timeline: string[]; reviewHistory: string[]; sources: string[]; generatedAt: string }
export class EvidencePackEngine {
  private packs: EvidencePack[] = []; private counter = 0
  generate(claimId: string, statement: string, facts: Array<{ id: string; content: unknown }>, confidence: { value: number; level: string }, timeline: string[], reviewHistory: string[], sources: string[]): EvidencePack {
    const pack: EvidencePack = { packId: `pack:${++this.counter}`, claimId, claimStatement: statement, supportingFacts: facts, evidenceGraph: { nodes: facts.length + 1, edges: facts.length }, confidence, timeline, reviewHistory, sources, generatedAt: new Date().toISOString() }
    this.packs.push(pack); return pack
  }
  getPack(claimId: string): EvidencePack | undefined { return this.packs.find(p => p.claimId === claimId) }
}