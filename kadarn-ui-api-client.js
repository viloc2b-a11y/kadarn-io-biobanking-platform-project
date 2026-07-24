// ==========================================================================
// KADARN UI — API-integrated prototype
// ==========================================================================
// Connected views: Institution Overview | Claims | Claim Detail | Evidence | Passport Preview
// Mock views: Documents, People, Locations, Readiness, Packages, Sponsor/Operator (prototype-only)
// Fallback: if API is unreachable, uses embedded mock data
// ==========================================================================

// API Client with mock fallback
const API = {
  base: 'http://localhost:3001',
  mode: 'mock', // 'live' | 'mock' — toggle to 'live' when backend is running

  async get(path) {
    if (this.mode === 'mock') return null;
    try {
      const r = await fetch(this.base + '/api/v1' + path, { credentials: 'include' });
      if (!r.ok) return null;
      return (await r.json()).data;
    } catch { return null; }
  },

  async post(path, body) {
    if (this.mode === 'mock') return null;
    try {
      const r = await fetch(this.base + '/api/v1' + path, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) return null;
      return (await r.json()).data;
    } catch { return null; }
  },

  getClaims()        { return this.get('/evidence-core/claims'); },
  getClaim(id)       { return this.get('/evidence-core/claims?claimId=' + id); },
  getEvidence(cid)   { return this.get('/evidence-core/evidence?claimId=' + cid); },
  getPassport()      { return this.get('/passport'); },
  publishPassport(d) { return this.post('/passport', d); },

  // Load real data into K (falls back to mock if API unavailable)
  async hydrate(k) {
    const [claims, passport] = await Promise.all([this.getClaims(), this.getPassport()]);
    if (claims && claims.length) {
      k.claims = claims.map(c => ({
        id: c.id, claim: c.name, domain: c.domain,
        ctx: c.organizationId + ' · ' + c.domain,
        lifecycle: c.workflow_state || 'published',
        confidence: 'high', evidence_state: 'sufficient', evidence_count: 0,
        freshness: 'current', last_updated: c.temporal?.updatedAt?.split('T')[0] || '—', loc: '',
      }));
      k._liveData = true;
    }
    if (passport) k.passportData = passport;
    return k;
  },
};
