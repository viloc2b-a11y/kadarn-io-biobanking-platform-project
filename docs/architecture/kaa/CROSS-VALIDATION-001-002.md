# KAA Cross-Validation — KAA-001 (OPA) vs KAA-002 (Temporal)

**Purpose:** Verify consistency between the first two KAA documents before the
template is considered validated for the remaining assessments.

---

## Responsibility Stack — identical?

Both documents use the same 8-layer table with the same layer names, the same
owners, and the same "question it answers" phrasing. The only difference is which
row is highlighted as the subject of each document.

**Result: consistent.**

---

## Language — uniform?

Both documents use the same vocabulary for cross-references:
- "OPA evaluates authorization before Temporal starts" (KAA-002, sections 4, 8, 17)
- "Temporal orchestrates. Kadarn's engines execute. OPA evaluates." (KAA-002, section 4)
- "OPA evaluates. The owning Engine remains responsible." (KAA-001, section 9)

The phrase "transversal [engine]" is used in section 17 of both documents:
- KAA-001: "OPA is adopted as Kadarn's transversal business policy engine"
- KAA-002: "Temporal is adopted as Kadarn's transversal workflow orchestration engine"

**Result: consistent.**

---

## Boundaries between OPA and Temporal — overlapping responsibilities?

KAA-001 states OPA decides: access, approval, visibility, compliance, eligibility.
KAA-002 states Temporal decides: step order, retry, timeouts, signal handling,
compensation.

No overlap. The documents are explicit about where one stops and the other begins:

> KAA-002, Section 4: "Decides whether an actor is authorized to start a workflow
> (that is OPA)"

> KAA-001, Section 8: "Temporal (Workflow Engine): OPA evaluates authorization
> before Temporal starts any workflow."

Both documents describe the same handoff from the same two sides.

**Result: no overlap, boundaries consistent.**

---

## Future Integrations — same story?

KAA-001 Future Integrations lists Temporal as the first downstream consumer.
KAA-002 Future Integrations lists OPA as the first upstream dependency.

The descriptions are symmetric:

KAA-001: "OPA evaluates whether a workflow step can execute before Temporal
schedules it."

KAA-002: "OPA evaluates authorization before Temporal starts and within high-impact
Activities during execution."

Both documents mention W3C PROV, Event Bus, OpenTelemetry, and FHIR (future) in
their integration diagrams with consistent descriptions.

**Result: consistent.**

---

## Scope of Authority — mutual exclusion?

KAA-001 OPA never: "Triggers workflows"
KAA-002 Temporal never: "Decides whether an actor is authorized to start a workflow
(that is OPA)"

These are clean mutual exclusions. No document claims authority the other document
assigns elsewhere.

**Result: mutually exclusive, consistent.**

---

## Exit Strategy — same principle?

Both documents apply the same principle: Kadarn's business logic, policies, and
data survive the replacement of any technology component.

KAA-001: "Rego syntax is the primary coupling. The `withPolicy()` wrapper is the
only call site that knows about OPA."

KAA-002: "Activities are plain TypeScript functions with no Temporal dependency
beyond the registration call."

Both documents name the abstraction layer that contains the coupling, and both
describe a migration path that preserves Kadarn's intellectual property.

**Result: consistent principle, consistently applied.**

---

## Template Coverage

| Section | KAA-001 | KAA-002 |
|---|---|---|
| 1. Why This Capability Exists | ✓ | ✓ |
| 2. Responsibility Stack | ✓ | ✓ |
| 3. Why Not Build It Ourselves | ✓ | ✓ |
| 4. Scope of Authority | ✓ | ✓ |
| 5. Technology Selected | ✓ | ✓ |
| 6. Core Concepts | ✓ | ✓ |
| 7. Interaction with Kadarn Data | ✓ | ✓ |
| 8. Interaction with Other Engines | ✓ | ✓ |
| 9. Ownership Boundaries | ✓ | ✓ |
| 10. Granularity | ✓ | ✓ |
| 11. Taxonomy | ✓ | ✓ |
| 12. Compensation and Failure Handling | ✓ | ✓ |
| 13. Risks and Mitigations | ✓ | ✓ |
| 14. Exit Strategy | ✓ | ✓ |
| 15. Future Capabilities | ✓ | ✓ |
| 16. Future Integrations | ✓ | ✓ |
| 17. Architectural Decision | ✓ | ✓ |

All 17 sections present in both documents.

---

## Conclusion

The template is validated. KAA-001 and KAA-002 are consistent in language,
boundaries, integration story, authority model, and exit strategy principle.

KAA-003 through KAA-005 can proceed from the same template without risk of
divergence on the foundational sections.
