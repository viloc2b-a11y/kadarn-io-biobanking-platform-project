export interface MatchRequest {
  specimenType?: string;
  diagnosis?: string;
  purpose?: string;
  minTrustScore?: number;
  maxResults?: number;
}
export interface MatchResult {
  specimenId: string;
  collectionId: string;
  organizationId: string;
  score: number;
  matchReasons: string[];
}
export interface MatchingAdapter {
  searchSpecimens(query: MatchRequest): Promise<MatchResult[]>;
}
