// ==========================================================================
// Search Service — Full-text search across entities
// ==========================================================================

export interface SearchableEntity {
  id: string;
  type: string;
  title: string;
  description?: string;
  tags?: string[];
  organizationId?: string;
  programId?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  text: string;
  filters?: Record<string, string | string[]>;
  types?: string[];
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  excerpt?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchService {
  /** Index an entity for search */
  index(entity: SearchableEntity): Promise<void>;

  /** Remove an entity from the search index */
  remove(id: string, type: string): Promise<void>;

  /** Search across indexed entities */
  search(query: SearchQuery): Promise<SearchResults>;

  /** Rebuild the entire search index */
  reindex(entities: SearchableEntity[]): Promise<void>;
}
