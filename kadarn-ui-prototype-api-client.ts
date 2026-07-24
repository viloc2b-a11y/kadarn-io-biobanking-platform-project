// ==========================================================================
// Kadarn UI — API Client (connects prototype to real backend)
// ==========================================================================
// Views connected: Institution Overview, Claims, Claim Detail, Evidence, Passport Preview
// All other views remain prototype-only.
// ==========================================================================

const API = {
  base: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  useMock: true, // set to false when API is running

  async get(endpoint: string) {
    if (this.useMock) return null;
    const res = await fetch(`${this.base}/api/v1${endpoint}`, { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()).data;
  },

  async post(endpoint: string, body: unknown) {
    if (this.useMock) return null;
    const res = await fetch(`${this.base}/api/v1${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()).data;
  },

  // ── Connected endpoints ──

  /** GET /evidence-core/claims — list claims for current org */
  async getClaims() { return this.get('/evidence-core/claims'); },

  /** GET /evidence-core/claims?claimId=X — single claim */
  async getClaim(id: string) { return this.get(`/evidence-core/claims?claimId=${id}`); },

  /** POST /evidence-core/claims — create claim */
  async createClaim(data: any) { return this.post('/evidence-core/claims', data); },

  /** GET /evidence-core/evidence?claimId=X — evidence for claim */
  async getEvidence(claimId: string) { return this.get(`/evidence-core/evidence?claimId=${claimId}`); },

  /** POST /evidence-core/evidence — submit evidence */
  async submitEvidence(data: any) { return this.post('/evidence-core/evidence', data); },

  /** GET /passport — passport for current org */
  async getPassport() { return this.get('/passport'); },

  /** POST /passport — publish claims */
  async publishPassport(data: any) { return this.post('/passport', data); },
};

// Override the K object to use real API data when available
K._loadRealData = async function() {
  // Try to fetch real claims
  const claims = await API.getClaims();
  if (claims && claims.length > 0) {
    K.claims = claims.map((c: any) => ({
      id: c.id,
      claim: c.name,
      domain: c.domain,
      ctx: `${c.organizationId} · ${c.domain}`,
      lifecycle: c.workflow_state || 'published',
      confidence: c.confidence?.level || 'high',
      evidence_state: c.evidenceState || 'sufficient',
      evidence_count: c.evidenceCount || 0,
      freshness: 'current',
      last_updated: c.temporal?.updatedAt?.split('T')[0] || '—',
      loc: '',
    }));
    K.view = 'claims'; // Show real data
    render();
  }
};
