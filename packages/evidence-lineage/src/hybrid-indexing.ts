// Sprint 28K — Hybrid Indexing
// PostgreSQL BTREE + GIN + materialized edge tables. No Neo4j. No Graph DB.
export interface IndexConfig { tableName: string; columns: string[]; indexType: 'btree' | 'gin' | 'gist'; where?: string }
export interface MaterializedEdge { edgeId: string; fromType: string; fromId: string; toType: string; toId: string; relationship: string; weight: number; updatedAt: string }
export class HybridIndexingEngine {
  private indexes: IndexConfig[] = []; private edges: MaterializedEdge[] = []; private counter = 0
  registerIndex(config: IndexConfig): void { this.indexes.push(config) }
  addEdge(fromType: string, fromId: string, toType: string, toId: string, relationship: string, weight: number): MaterializedEdge { const e: MaterializedEdge = { edgeId: `edge:${++this.counter}`, fromType, fromId, toType, toId, relationship, weight, updatedAt: new Date().toISOString() }; this.edges.push(e); return e }
  queryEdges(fromId?: string, toId?: string, relationship?: string): MaterializedEdge[] { return this.edges.filter(e => (!fromId || e.fromId === fromId) && (!toId || e.toId === toId) && (!relationship || e.relationship === relationship)) }
  getIndexes(): IndexConfig[] { return [...this.indexes] }
}