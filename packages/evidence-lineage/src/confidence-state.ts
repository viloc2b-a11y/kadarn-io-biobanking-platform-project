// Sprint 28F — Confidence State Evolution
// Confidence is computed from Evidence Graph, never stored as permanent truth.
export interface EvidenceGraphNode { nodeId: string; type: 'claim' | 'evidence' | 'entity'; weight: number }
export interface EvidenceGraphEdge { edgeId: string; fromId: string; toId: string; relationship: 'supports' | 'contradicts' | 'references'; weight: number }
export interface ConfidenceState { claimId: string; value: number; level: 'high' | 'moderate' | 'low' | 'insufficient'; computedAt: string; inputs: Array<{ nodeId: string; contribution: number }> }
export class ConfidenceStateEngine {
  private nodes: EvidenceGraphNode[] = []; private edges: EvidenceGraphEdge[] = []; private states = new Map<string, ConfidenceState>()
  addNode(node: EvidenceGraphNode): void { this.nodes.push(node) }
  addEdge(edge: EvidenceGraphEdge): void { this.edges.push(edge) }
  compute(claimId: string): ConfidenceState {
    const claimNode = this.nodes.find(n => n.nodeId === claimId)
    if (!claimNode) return { claimId, value: 0, level: 'insufficient', computedAt: new Date().toISOString(), inputs: [] }
    const supporting = this.edges.filter(e => e.toId === claimId && e.relationship === 'supports')
    const contradicting = this.edges.filter(e => e.toId === claimId && e.relationship === 'contradicts')
    const supportWeight = supporting.reduce((s, e) => s + e.weight, 0)
    const contradictWeight = contradicting.reduce((s, e) => s + e.weight, 0)
    const value = Math.max(0, Math.min(100, ((supportWeight / (supportWeight + contradictWeight + 1)) * 100)))
    const level = value >= 80 ? 'high' : value >= 50 ? 'moderate' : value >= 20 ? 'low' : 'insufficient'
    const state: ConfidenceState = { claimId, value, level, computedAt: new Date().toISOString(), inputs: supporting.map(e => ({ nodeId: e.fromId, contribution: e.weight })) }
    this.states.set(claimId, state); return state
  }
  getState(claimId: string): ConfidenceState | undefined { return this.states.get(claimId) }
}