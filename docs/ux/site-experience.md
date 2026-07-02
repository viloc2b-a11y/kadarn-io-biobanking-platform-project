# Kadarn Site Experience
## Product Definition Document — v1.0

---

## Who is this user?

**Primary persona: Site Director / Clinical Research Director**

The person who runs or oversees research operations at a clinical site — hospital, academic medical center, or specialized research unit. They are accountable for the institution's research reputation. They did not build Kadarn. They do not understand confidence graphs. They understand their institution's history.

**Secondary persona: Site Coordinator / Research Administrator**

Executes tasks on behalf of the Director. Reviews data, uploads documents, responds to Counter Evidence. Works inside the platform daily.

**What they are NOT:** a data analyst, a developer, or a compliance officer. They are institutional professionals who need clarity, not tools.

---

## What are they trying to accomplish?

Three jobs, in priority order:

1. **Understand their representation** — What does Kadarn say about us? Is it accurate?
2. **Strengthen their profile** — What evidence are we missing? What can we do?
3. **Respond to challenges** — A sponsor flagged something. What is it? How do we respond?

Everything in this experience must serve one of those three jobs. If a feature does not serve one of them, it does not belong in this interface.

---

## Moment of Truth

> The Site Director opens the Evidence Passport of their institution for the first time, reads it, and thinks: *"This is what we are — and I know exactly what to do to improve it."*

If that moment does not happen within the first session, the product has failed for this actor.

---

## Primary Object: Evidence Passport

The Evidence Passport is the central object of the Site experience. Everything else in the interface exists to:
- Help the user understand it
- Help the user improve it
- Help the user defend it

The Passport is NOT a dashboard. It is a structured representation of the institution's research identity, built from external evidence and enriched over time.

---

## Entry Point

**URL:** `/workspace`

On first login, after org selection, the Site Director lands on the **Institution Overview** — not a generic dashboard.

The first screen answers one question: *"What does Kadarn currently know about your institution?"*

---

## Primary Flows

### Flow 1 — Understand the Passport

**Trigger:** First login, or any time the user wants to review their standing.

**Steps:**
1. Land on Institution Overview
2. See Confidence Score with breakdown (Evidence, Identity, Consistency)
3. Open the Evidence Passport
4. Browse Claims — grouped by domain (Therapeutic Area, Operational History, Quality Record, Regulatory Compliance)
5. For each Claim: see supporting EvidenceNodes, confidence contribution, and gaps
6. For Claims with Counter Evidence: see the challenge and current resolution status

**What the user must understand at the end of this flow:**
- What we are known for
- What we are not yet known for
- What is being questioned

**What they must NOT need to do:** interpret algorithm outputs, understand graph structures, or navigate technical metadata.

---

### Flow 2 — Strengthen the Profile

**Trigger:** User sees a Claim with low confidence or a gap.

**Steps:**
1. From a Claim detail, tap "Improve this Claim"
2. See what evidence exists vs. what could exist
3. Upload a document (protocol, publication, IRB letter, inspection report)
4. Evidence enters **Staging Queue** — status shows "Under Review"
5. Once processed: Claim confidence updates, user receives notification

**What the user must understand at the end of this flow:**
- What action they took
- What will happen next
- When they can expect the result

**What they must NOT need to do:** classify the evidence themselves, assign it to a Claim manually, or understand processing pipelines.

---

### Flow 3 — Respond to a Challenge

**Trigger:** Notification — "A Counter Evidence item requires your response."

**Steps:**
1. Notification leads to Counter Evidence detail
2. See: what was challenged, by whom (role only — not identity), what evidence is cited
3. Choose response type: Acknowledge / Provide Context / Submit Evidence / Dispute
4. Write response — plain text, max 500 characters per field
5. Optionally attach supporting documents
6. Submit Right of Response
7. Status updates to "Response Submitted — Under Review"

**What the user must understand at the end of this flow:**
- What was questioned
- What they submitted in response
- What happens next and who reviews it

**What they must NOT need to do:** interact with the challenger directly, understand scoring mechanics, or escalate through multiple systems.

---

### Flow 4 — Track Changes

**Trigger:** Returning user checking what changed since last visit.

**Steps:**
1. Activity Feed on Institution Overview shows timeline of changes
2. Filterable by: Claim updates, new Evidence, Counter Evidence, Passport version changes
3. Each item links directly to the affected Claim or EvidenceNode

**What the user must understand at the end of this flow:**
- What changed and when
- Whether the change is positive, neutral, or requires attention
- What action, if any, is required from them

---

## Screen Inventory

| Screen | Purpose |
|--------|---------|
| Institution Overview | Entry point — confidence score, Passport summary, activity feed, pending actions |
| Evidence Passport | Full Claim-by-Claim view of the institution's representation |
| Claim Detail | Single Claim — evidence list, confidence breakdown, gaps, Counter Evidence |
| EvidenceNode Detail | Single piece of evidence — source, type, date, Claim associations |
| Evidence Upload | Upload document → enters staging queue |
| Counter Evidence Detail | What is being challenged, current status, response interface |
| Right of Response | Structured response form |
| Activity Feed | Timeline of all changes to the institution's Passport |
| Settings | Institution profile, team members, notification preferences |

---

## Navigation Structure

```
/ (Institution Overview)
├── /passport                    Evidence Passport
│   └── /passport/claims/:id     Claim Detail
│       └── /passport/evidence/:id  EvidenceNode Detail
├── /improve                     Strengthen Profile — upload, gap analysis
├── /challenges                  Counter Evidence queue
│   └── /challenges/:id          Counter Evidence Detail + Right of Response
├── /activity                    Change timeline
└── /settings                    Team, notifications
```

---

## What this user must be able to answer in under 30 seconds

1. What is our current confidence score?
2. What are our top 3 Claims by evidence strength?
3. Do we have any open Counter Evidence items?
4. Did anything change in our Passport this week?
5. What is the one thing we should do to improve our standing?

If these five questions cannot be answered in under 30 seconds from the entry point, the UX has failed.

---

## What this user must NEVER see

- Internal Kadarn confidence algorithm parameters
- Other institutions' data
- Identity graph raw nodes or edges
- Connector pipeline status
- Staging queue processing logs
- Sponsor names or queries that referenced their institution
- Any score without explanation

---

## Permissions

| Action | Site Director | Site Coordinator |
|--------|--------------|-----------------|
| View Evidence Passport | ✓ | ✓ |
| Upload evidence | ✓ | ✓ |
| Submit Right of Response | ✓ | ✓ (requires Director review flag) |
| Invite team members | ✓ | — |
| View raw EvidenceNode metadata | ✓ | ✓ |
| Dispute a Claim | ✓ | — |
| Edit institution profile | ✓ | — |

---

## Notification triggers

| Event | Channel | Urgency |
|-------|---------|---------|
| New Counter Evidence filed | Email + In-app | High |
| Passport confidence changed (±5 points) | In-app | Medium |
| Evidence upload processed | In-app | Low |
| Right of Response reviewed | Email + In-app | High |
| New Claim added to Passport | In-app | Low |
| Evidence from connector updated | In-app | Low |

---

## Open questions before implementation

1. Can a Site add evidence proactively, before a gap is surfaced? (Recommended: yes)
2. Should confidence score be visible as a number, or only as a qualitative band (Emerging / Established / Recognized)?
3. Can a Site see which connector sourced a given EvidenceNode? (Recommended: yes — transparency builds trust)
4. Can a Site request a full re-evaluation of their Passport?
5. What happens to the Passport when a Site's institutional name changes?
