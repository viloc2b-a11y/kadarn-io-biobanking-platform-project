# Product Decision Records — Kadarn v2.0

> **Type:** Product Governance
> **Status:** Active
> **Authority:** Subordinate to Kadarn Product Book v2.0

---

## PDR-001: Marketplace Becomes Downstream of Program Readiness

**Date:** 2026-07-06
**Status:** Accepted

### Context

Kadarn v1 was architected as a marketplace-first platform. The entry point was Marketplace Discovery — sponsors searching for biospecimens. Institutions existed to supply the marketplace.

### Decision

Marketplace is moved from the entry point of the platform to the last layer. It consumes Program Readiness; it does not produce it.

### Rationale

1. **Trust must precede transactions.** A marketplace without trust infrastructure has the same problem as every other biospecimen platform: sponsors cannot verify listings.
2. **Readiness creates marketplace quality.** When Marketplace launches, every institution surfaced has already demonstrated capabilities with verifiable evidence.
3. **The moat is evidence infrastructure, not transaction volume.** Competitors can build marketplaces. They cannot replicate the evidence infrastructure quickly.
4. **Institutions are not suppliers.** They are capability demonstrators. Treating them as marketplace listings was the wrong mental model.

### Consequences

- Marketplace development is deferred to Phase 4 of ecosystem roadmap
- Sponsor-facing features focus on discovery and portfolio management, not transactions
- Institution experience focuses on building readiness, not creating listings
- Revenue model shifts from transaction fees to subscriptions

---

## PDR-002: Institution-First Strategy

**Date:** 2026-07-06
**Status:** Accepted

### Context

Kadarn v1 was sponsor-first: the platform was designed for sponsors to search and discover. Institutions were secondary — they existed to be found.

### Decision

Kadarn is institution-first. The institution owns its capability data, controls visibility, and decides what to publish. Sponsors discover; they do not control.

### Rationale

1. **The institution is the custodian of its own evidence.** No one else can submit, update, or validate evidence on behalf of an institution.
2. **Institutions will only invest in evidence if they control it.** If sponsors could modify or override readiness, institutions would not trust the platform.
3. **Network effects start with institutions.** Without institutions building readiness profiles, there's nothing for sponsors to discover.
4. **This is the harder path — and the defensible one.** Building institution trust takes longer than building a marketplace. But once built, it's not easily replicated.

### Consequences

- Institution onboarding is the first user experience priority
- Institution data is never modified by sponsors or platform admins without consent
- Visibility is controlled by the institution (organization vs. network scope)
- Publishing readiness is an explicit institution action, not automatic

---

## PDR-003: Program Readiness as the MVP

**Date:** 2026-07-06
**Status:** Accepted

### Context

Kadarn could have launched with any surface: Marketplace, Sponsor Discovery, Institution Profiles, Capability Search. The decision of which surface defines the MVP is the most consequential product decision.

### Decision

Program Readiness is the MVP entry point. The first thing an institution does in Kadarn is assess readiness for a program type. The first thing a sponsor does is discover institutions by program readiness.

### Rationale

1. **Program Readiness is the atomic unit of value.** Everything else — capability intelligence, sponsor discovery, marketplace — derives from it.
2. **It creates immediate value for both sides.** Institutions get a structured assessment of their capabilities. Sponsors get a standardized way to evaluate institutions.
3. **It forces evidence quality.** There is no "light" version of readiness. An institution either has evidence or doesn't.
4. **It's the right wedge.** Starting with readiness creates pull for everything else. Starting with marketplace creates noise.

### Consequences

- First three readiness program types define the initial product surface
- All other features (Capability Workspace, Sponsor Portfolio, Marketplace) are downstream
- The readiness pipeline (Evidence → Claim → Confidence → Capability → Readiness) is the critical path
- No feature ships before readiness is functional end-to-end

---

## PDR-004: Capability Instead of Reputation

**Date:** 2026-07-06
**Status:** Accepted

### Context

The biospecimen and clinical research industry selects institutions based on reputation: who you know, where you've published, what conferences you attend. This favors large, established institutions and excludes capable but less connected ones.

### Decision

Kadarn assesses institutions on demonstrated capability (evidenced, verifiable, confidence-weighted), not on reputation (subjective, relationship-based, non-transferable).

### Rationale

1. **Reputation is a moat for incumbents.** It protects established institutions from competition. Evidence levels the playing field.
2. **Reputation is not verifiable.** A sponsor cannot inspect the basis of a reputation. They can inspect the basis of a capability assessment.
3. **Capability is transferable.** One evidence profile serves all sponsors. Reputation must be rebuilt with each new relationship.
4. **Capability rewards investment in quality.** Institutions that invest in SOPs, training, and quality systems have stronger capability profiles. Institutions that rely on name recognition do not.

### Consequences

- Kadarn never displays institutional ratings, scores, or rankings
- The Capability Matrix shows evidence-backed capability status, not subjective assessments
- Sponsors see "what can this institution prove?" not "how highly is this institution regarded?"
- Kadarn's value proposition is "replace reputation with evidence" — this must be reflected in every product surface

---

*These four PDRs document the fundamental product decisions that shaped Kadarn v2.0. They are subordinate to the Product Book and are referenced by it.*
