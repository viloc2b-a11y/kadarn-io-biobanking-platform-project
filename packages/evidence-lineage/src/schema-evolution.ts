// Sprint 28I — Schema Evolution Framework
// Versioned schemas, migration rules, read adapters. Never break historical Claims.
export interface ClaimTypeDefinition { definitionId: string; claimType: string; schemaVersion: number; schema: Record<string, unknown>; validFrom: string; validTo?: string; migration?: MigrationRule; deprecatedFields: string[]; addedFields: string[] }
export interface MigrationRule { fromVersion: number; toVersion: number; transform: (oldClaim: Record<string, unknown>) => Record<string, unknown>; reversible: boolean; automated: boolean }
export interface ReadAdapter { supportedVersions: number[]; read: (claim: Record<string, unknown>, schemaVersion: number) => Record<string, unknown> }
export class SchemaEvolutionEngine {
  private definitions: ClaimTypeDefinition[] = []; private adapters = new Map<number, ReadAdapter>()
  registerDefinition(def: ClaimTypeDefinition): void { this.definitions.push(def) }
  registerAdapter(version: number, adapter: ReadAdapter): void { this.adapters.set(version, adapter) }
  getDefinition(definitionId: string): ClaimTypeDefinition | undefined { return this.definitions.find(d => d.definitionId === definitionId) }
  readClaim(claim: Record<string, unknown>, schemaVersion: number): Record<string, unknown> { const adapter = this.adapters.get(schemaVersion); return adapter ? adapter.read(claim, schemaVersion) : claim }
  migrate(oldClaim: Record<string, unknown>, fromVersion: number, toVersion: number): Record<string, unknown> { const def = this.definitions.find(d => d.schemaVersion === fromVersion); return def?.migration ? def.migration.transform(oldClaim) : oldClaim }
}