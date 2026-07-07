# Canonical Platform Vocabulary - Sprint PD-3

**Task:** Build the Canonical Vocabulary of Kadarn  
**Mode:** Discovery and consolidation only. No implementation, refactoring, redesign, or feature proposal.  
**Evidence priority:** repository code and database schema first; PD-1, PD-2, and documentation as supporting evidence.  

## Executive Summary

Kadarn's implemented language is centered on one durable anchor: **Organization / Institution**. Around that anchor, the platform stores operational records, discovery outputs, evidence-core claims, evidence nodes, provenance graphs, policies, audit events, portfolios, and continuity profiles. Product-facing objects such as Passports, Published Views, Evidence Packs, Discovery Reports, Institution Profiles, KPEs, and Sponsor Views are projections over those source records.

The canonical rule emerging from the repository is:

> Source records preserve institutional, operational, evidence, provenance, and policy facts. Projections package those facts for a specific audience without becoming the source of truth.

---

## Part 1 - Vocabulary Inventory

Major business terms found across packages, database migrations, routes, types, UI, and docs:

| Term | Primary Contexts | Evidence |
|---|---|---|
| Institution / Organization | Identity, tenant, site, sponsor, provider, actor | `organizations`, `Organization`, org routes, sponsor passport |
| User Profile | Human user identity | `user_profiles`, `UserProfile`, `/me` |
| Membership | User-to-organization access | `organization_memberships`, `OrganizationMembership`, auth guards |
| Capability | Organization ability, discovered ability, passport grouping | `organization_capabilities`, discovery capability package, passport capabilities |
| Program | Operational research/program container | `programs`, program APIs/UI |
| Portfolio | Sponsor-owned institution scope | `sponsor_portfolios`, `sponsor_portfolio_memberships` |
| Claim | Evidence-backed statement | `claims`, `phase8_claim_instances`, `continuity_experience_claims` |
| Claim Candidate | Proposed claim before promotion/publication | `phase8_claim_candidates`, discovery claim candidate types |
| Claim Version | Immutable versioned claim payload | `phase8_claim_versions` |
| Evidence | Support or contradiction for claims | evidence-core package, `evidence_nodes` |
| Evidence Node | Atomic claim-linked evidence record | `EvidenceNode`, `evidence_nodes` |
| Evidence Artifact | Stored source artifact in lineage | `evidence_artifacts` |
| Discovery Artifact | Layer 0 source artifact for discovery | `discovery_artifacts`, `Layer0Artifact` |
| Source | External/original evidence source | `evidence_sources` |
| Source Version | Immutable version of a source | `evidence_source_versions` |
| Extraction Run | Parser/model extraction execution | `evidence_extraction_runs` |
| Extracted Fact | Atomic extracted fact | `evidence_extracted_facts` |
| Observation / Fact | Extracted or discovered atomic evidence content | extracted facts, discovery outputs |
| Provenance | Origin/reconstruction path | evidence-core provenance metadata, provenance graph, lineage provenance |
| Evidence Graph | Claim/evidence relationship graph | evidence-core graph types, `evidence_relationships` |
| Provenance Graph | Node/edge graph of derivation | `provenance_nodes`, `provenance_edges` |
| Confidence | Derived strength of evidence support | evidence-core evaluation, `confidence_state_snapshots` |
| Confidence State | Snapshot/cache of derived confidence | `ConfidenceState`, `confidence_state_snapshots` |
| Trust | Older engine/schema vocabulary; not the current product term for evidence support | trust-engine, `organization_trust` |
| Passport | Audience-facing institutional projection | Sponsor Passport, Continuity Passport, Site Passport |
| Published View | Audience-filtered claim projection | `phase8_published_views`, `@kadarn/published-view` |
| Evidence Pack | Explainability package for a published view | evidence-lineage and published-view packages |
| Profile | Persisted or generated institution profile | `site_continuity_profiles`, discovery profile |
| Continuity | Site continuity model and legacy profile path | continuity tables and routes |
| Knowledge | Vocabulary/ontology and graph-query composition | knowledge-engine, graph-query |
| Knowledge Graph | Partial vocabulary/query graph concept | ontology tables, graph-query package |
| Publication | Audience-specific publishing of claim views | published-view package |
| Projection | Read model derived from sources | passports, reports, KPE, evidence packs |
| Permission / Policy | Access, visibility, RLS, policy evaluation | policy-engine, auth guards, RLS, OPA shadow |
| Program Participant | Organization role in a program | `program_participants` |
| Collection | Operational collection twin/container | `collection_twins` |
| Specimen | Operational specimen twin | `specimen_twins` |
| Sample / Aliquot | Processing material lifecycle | `processing_samples`, `processing_aliquots` |
| Twin | Event-backed operational representation | operational-twins package, `twin_events` |
| Workflow | Definitions, instances, tasks | workflow-engine, workflow tables |
| Discovery | Pipeline from artifacts to candidates/reports | evidence-discovery package |
| Recognition | Product language for discovery reports | discovery report / recognition report |
| Research Asset | Product-language object for evidence-relevant specimens, collections, capabilities, and services | product scope docs, workspace/marketplace/twins |
| Opportunity | Contextual sponsor or study-to-institution match projection | sponsor/KUX docs, continuity opportunity routes |
| Risk / Alert | Evidence-decay, contradiction, or operational monitoring projection | KUX risk/attention docs, operations/KOC routes |
| Study | Sponsor research intent or requirement profile | program, feasibility, sponsor docs |
| KPE | Kadarn Proof of Execution projection | KPE generator/routes/report UI |
| Audit Event | Compliance/history record | `audit_events` |
| Domain Event | Platform event/outbox record | `domain_event_store`, `domain_event_outbox` |
| Marketplace Request | Marketplace demand/request object | `exchange_requests`, marketplace APIs |
| Exchange Deal | Transaction/deal object | `exchange_deals`, exchange APIs |
| Settlement | Derived financial calculation/result | financial-engine, escrow routes |

---

## Part 2 - Canonical Definitions

Each definition is limited to the implemented meaning currently evidenced in the repository.

| Official Name | Canonical Definition | Business Purpose | Technical Representation | Primary Package | Persistence | Consumers | Lifecycle | What It Is Not |
|---|---|---|---|---|---|---|---|---|
| Organization | Durable business actor and tenant anchor; also used as institution/site/sponsor/provider depending on capability. | Anchor identity, tenancy, access, evidence ownership, programs, portfolios. | `Organization`, org routes, FKs to `organization_id`. | `@kadarn/types`, auth/API modules | `organizations` | workspace, marketplace, sponsor, discovery, evidence, policy | created/updated; capability and membership evolve | Not a projection or report. |
| Institution | Product-language view of an organization when it is being assessed, discovered, profiled, or shown to sponsors/public users. | Make organization knowledge legible in institution-facing workflows. | Same org ID plus institution routes/projections. | API institution routes, sponsor passport | `organizations`, related profiles | sponsor, discovery, public profile, continuity | inherits organization lifecycle plus projections | Not a separate canonical table. |
| User Profile | Kadarn user record linked to auth identity. | Identify people using the platform. | `UserProfile`, `/me`, session provider. | `@kadarn/auth`, API auth | `user_profiles` | auth guards, shells, access context | created and associated with memberships | Not an organization. |
| Organization Membership | User-to-organization access relationship. | Determine active org, role, and available applications. | `OrganizationMembership`, auth guards. | `@kadarn/auth`, API guards | `organization_memberships`, `membership_roles` | workspace, sponsor, KOC, APIs | active/inactive role state | Not evidence permission by itself. |
| Organization Capability | Persisted ability assigned to an organization. | Drive workspace apps, marketplace matching, profile/passport interpretation. | `Capability`, org capability APIs. | `@kadarn/types`, org APIs | `organization_capabilities`, `organization_capability_types` | marketplace, workspace, sponsor, continuity | assigned/updated | Not a claim unless represented as evidence-core claim. |
| Program | Operational container for research/work execution. | Organize participants, milestones, samples, exchange, KPE. | `Program`, program routes. | API program modules, `@kadarn/types` | `programs` | workspace, KOC, exchange, KPE | draft/feasibility/active/on_hold/complete/cancelled | Not a portfolio. |
| Portfolio | Sponsor-owned access scope over institutions. | Define which institutions a sponsor can inspect. | sponsor portfolio repository/read model. | Sponsor Passport API libs | `sponsor_portfolios` | sponsor passport | active/inactive portfolio | Not evidence, claim, or ranking. |
| Portfolio Membership | Institution inclusion in a sponsor portfolio. | Gate sponsor passport list/detail reads. | membership read model. | Sponsor Passport API libs | `sponsor_portfolio_memberships` | sponsor passport store | active/inactive membership | Not institution ownership. |
| Claim | Evidence-backed statement about an organization or subject. | State something that can be supported, contested, evaluated, and projected. | `Claim`, evidence-core routes, Phase 8 claim models. | `@kadarn/evidence-core`, phase8 types | `claims`, `phase8_claim_instances`, `phase8_claim_versions` | evidence, passport, publication, confidence | active/archived/deprecated; versioned in Phase 8 | Not raw evidence or confidence. |
| Claim Candidate | Proposed claim before promotion into claim lifecycle. | Hold candidate knowledge from discovery/lineage. | discovery `ClaimCandidate`, phase8 candidates. | `@kadarn/evidence-discovery`, phase8 types | `phase8_claim_candidates`, discovery candidate tables | discovery, promotion, reports | proposed/review/approved/rejected/expired or discovery states | Not canonical claim truth. |
| Claim Instance | Versioned claim identity across versions. | Preserve stable identity for evolving claim payloads. | phase8 claim instance types. | `@kadarn/types/phase8` | `phase8_claim_instances` | publication, lineage, reconstruction | candidate/active/disputed/expired/superseded | Not a single immutable payload. |
| Claim Version | Immutable payload version of a claim. | Preserve auditable claim history and supersession. | phase8 claim version types. | `@kadarn/types/phase8` | `phase8_claim_versions` | published view, evidence pack, provenance | immutable; supersedes prior version | Not the business identity of the claim. |
| Evidence | Information used to support, contradict, or contextualize a claim. | Ground claims in explainable source material. | evidence nodes, artifacts, relationships. | `@kadarn/evidence-core`, lineage packages | `evidence_nodes`, `evidence_artifacts` | claims, confidence, passport, publication | active/superseded/disputed/resolved | Not a claim or conclusion. |
| Evidence Node | Atomic evidence record linked to a claim. | Store support/counter-evidence with class, weight, provenance, visibility. | `EvidenceNode`. | `@kadarn/evidence-core` | `evidence_nodes` | evidence graph, confidence, passport | active/superseded/disputed/resolved | Not a source artifact. |
| Counter Evidence | Evidence node that contradicts and carries negative weight. | Make challenge/contradiction visible and explainable. | `CounterEvidence extends EvidenceNode`. | `@kadarn/evidence-core` | `evidence_nodes` | confidence, right of response, stability | disputed/resolved via response | Not deletion or hidden correction. |
| Right of Response | Response to counter-evidence. | Let institutions answer challenges with supporting evidence. | `RightOfResponse`, response route. | `@kadarn/evidence-core` | `right_of_response` | evidence graph, review lifecycle | submitted/accepted/rejected/confirmed | Not a claim replacement. |
| Evidence Relationship | Edge connecting evidence nodes. | Express supports, contradicts, responds_to, corroborates, supersedes. | `EvidenceRelationship`. | `@kadarn/evidence-core` | `evidence_relationships` | evidence graph, confidence | created with provenance | Not provenance graph edge. |
| Source | Origin system/document/entity for evidence. | Identify where evidence came from. | phase8 lineage source. | `@kadarn/evidence-lineage`, phase8 types | `evidence_sources` | extraction, provenance, publication | created/ingested | Not the extracted fact itself. |
| Source Version | Immutable version of a source. | Preserve source content/version identity. | source version type/hash. | phase8 lineage | `evidence_source_versions` | artifacts, provenance | immutable version lifecycle | Not a mutable source record. |
| Evidence Artifact | Stored artifact under a source version. | Persist source material for extraction/provenance. | lineage artifact. | `@kadarn/evidence-lineage` | `evidence_artifacts` | extraction runs, evidence packs | created then extracted | Not an evidence node. |
| Discovery Artifact | Layer 0 artifact used by discovery. | Feed discovery pipeline from files/API/registry. | `Layer0Artifact`. | `@kadarn/evidence-discovery` | `discovery_artifacts` | discovery runs, layer1, candidates | received/extracted | Not lineage evidence artifact. |
| Extraction Run | Execution of extraction over an artifact. | Record parser/model run and reproducibility. | extraction run types/tables. | `@kadarn/evidence-lineage` | `evidence_extraction_runs` | extracted facts | pending/running/completed/failed | Not the extracted content. |
| Extracted Fact | Atomic fact output from extraction. | Feed claim candidates and provenance. | extracted fact records. | `@kadarn/evidence-lineage` | `evidence_extracted_facts` | claim candidates, provenance | created immutable fact record | Not validated claim. |
| Observation | Generic observed fact-like record in discovery/intelligence language. | Describe detected facts before canonical claim promotion. | appears as extracted/discovered outputs. | discovery/intelligence packages | varied; often agent outputs/facts | discovery, reports | observed/reviewed/projected | Not canonical unless promoted. |
| Provenance | Explanation of origin and transformation path. | Make claims/evidence/audience views reconstructable. | metadata, graph, phase8 provenance. | evidence-core, evidence-lineage, provenance-graph | provenance graph tables plus provenance metadata | passport, evidence pack, KOC, audit | append/reconstruct/supersede by context | Not confidence or trust score. |
| Evidence Graph | Graph of claims, evidence nodes, and evidence relationships. | Evaluate support/contradiction and confidence. | evidence-core graph types. | `@kadarn/evidence-core` | `evidence_relationships`, `evidence_nodes` | confidence, passport, publication | evolves as evidence changes | Not whole platform knowledge graph. |
| Provenance Graph | Graph of derivation nodes, edges, and supporting evidence. | Trace lineage across operations/artifacts/claims. | provenance graph package/API. | `@kadarn/provenance-graph` | `provenance_nodes`, `provenance_edges`, `provenance_evidence` | KOC provenance, graph query | append-only intent | Not evidence graph. |
| Confidence | Derived assessment of evidence support for a claim. | Communicate strength/quality of support without becoming truth. | confidence evaluator/report. | `@kadarn/evidence-core`, `@kadarn/evidence-lineage` | snapshots/cache only | passport, published view, evidence pack | computed/recomputed | Not manually authored source data. |
| Confidence State | Materialized/snapshotted result of confidence evaluation. | Cache or expose derived confidence. | `ConfidenceState`. | evidence-core/phase8 | `confidence_state_snapshots` | confidence reports, projections | derived at read/evaluation time | Not primary evidence. |
| Trust | Older trust-engine/schema term for organization trust state. | Preserve legacy/engine meaning while avoiding product confusion with Confidence. | trust engine objects and trust tables. | `@kadarn/trust-engine` | `organization_trust`, `trust_events`, `trust_challenges` | older trust tests/graph query | event/challenge lifecycle | Not canonical product confidence or a Trust Score. |
| Published View | Audience-specific projection of claim information. | Show claim data safely by audience/policy. | `PublishedView`. | `@kadarn/published-view` | `phase8_published_views` | public/sponsor/institution views, evidence pack | generated/published/versioned | Not source of truth. |
| Evidence Pack | Explainability package for a published view. | Provide confidence, provenance, review, verification context. | `EvidencePack`. | published-view/evidence-lineage | no dedicated table found | API consumers, exports | generated projection | Not canonical claim data. |
| Passport | Institutional read model for a target audience. | Summarize institution identity, capabilities, evidence, history, stability. | Sponsor/Continuity/Site passport routes. | Sponsor Passport libs, continuity routes | no direct passport table | sponsor UI, site profile, continuity | generated/read projection | Not a persisted institution. |
| Sponsor Passport | Sponsor-facing institutional passport projection. | Let sponsors inspect portfolio institutions. | `InstitutionalPassport`. | `apps/api/src/lib/sponsor-passport` | generated from org/portfolio/evidence/audit | sponsor routes/UI | read-time projection | Not continuity passport or public profile. |
| Continuity Passport | Continuity-profile-backed institution projection. | Show site continuity timeline, claims, capabilities, recommendations. | continuity passport routes. | continuity API libs | `site_continuity_profiles` plus continuity tables | workspace continuity/public | profile lifecycle plus projection | Not Sponsor Passport. |
| Institution Profile | Profile projection or continuity/discovery profile depending context. | Present institutional summary/public profile. | public profile/discovery profile. | discovery/profile modules, institution routes | `site_continuity_profiles` for continuity; generated otherwise | public, discovery, sponsor | generated or persisted by context | Not canonical organization record. |
| Discovery Session | Organization-scoped discovery workspace. | Group discovery runs and artifacts. | discovery repository/routes. | `@kadarn/evidence-discovery` | `discovery_sessions` | discovery dashboard/report | active/completed by run flow | Not a claim. |
| Discovery Run | Execution of discovery pipeline. | Transform artifacts into candidates and outputs. | discovery run types/tables. | `@kadarn/evidence-discovery` | `discovery_runs` | dashboard, report, pipeline status | pending/running/completed/failed | Not the source artifact. |
| Discovery Candidate | Candidate evidence object in discovery state machine. | Track discovered knowledge before promotion. | `EvidenceCandidate`, `DiscoveryState`. | `@kadarn/evidence-discovery` | `discovery_candidates` | curation, reports, promotion | RAW_SOURCE -> ... -> PROMOTED/REJECTED/ARCHIVED | Not canonical evidence node. |
| Discovery Report | Projection of discovery outputs. | Communicate recognition/readiness/capability findings. | discovery report generator/API. | `@kadarn/evidence-discovery`, published-view adapter | generated; no dedicated report table found | discovery UI, sponsor readiness | generated projection | Not evidence source of truth. |
| Recognition | Product-facing language for discovery report/intelligence. | Name institution recognition output from discovery. | discovery report/public profile copy. | discovery UI/docs | projection only | sponsor/discovery consumers | generated | Not a separate persisted domain entity. |
| Research Asset | Evidence-relevant institutional asset or resource surfaced through claims, capabilities, twins, or marketplace records. | Connect institutional evidence to assets sponsors can reason about. | specimens, collections, services, capabilities. | types, operational twins, marketplace/workspace modules | `specimen_twins`, `collection_twins`, `supply_items`, capability tables | workspace, marketplace, sponsor/discovery projections | operational or projected by context | Not a generic marketing asset. |
| Opportunity | Contextual match or actionable fit projection between sponsor/study intent and institution evidence. | Help sponsors reason about fit and gaps. | opportunity routes/read models. | continuity/sponsor surfaces | generated projection; no canonical opportunity table found in audit | sponsor/continuity consumers | recomputed as requirements/evidence change | Not an institution property. |
| Risk / Alert | Attention object derived from evidence decay, contradiction, operational exceptions, or monitoring state. | Surface conditions needing action with evidence/provenance. | KUX risk language, operations exceptions/health. | operations/KOC modules | `trust_events`, operations exception surfaces, audit/metrics by context | KOC, sponsor monitoring | generated/recorded by context | Not a hidden score. |
| Study | Sponsor research requirement or program intent context. | Frame feasibility/opportunity evaluation. | program/feasibility/sponsor language. | program and feasibility APIs | `programs`, feasibility assessments | sponsor, marketplace, programs | draft/active or request-specific | Not the same as institution. |
| Knowledge | Normalized vocabulary/ontology plus graph-query composition. | Standardize terms and enable semantic lookup. | ontology terms/synonyms/mappings. | `@kadarn/knowledge-engine` | `ontology_terms`, `ontology_synonyms`, `ontology_mappings` | discovery, graph query | vocabulary lifecycle | Not the entire database graph. |
| Knowledge Graph | Partial graph concept for vocabulary/query composition. | Connect normalized terms, provenance, trust, capabilities. | graph-query interfaces/service. | `@kadarn/graph-query`, knowledge-engine | no single universal graph table | graph query consumers | adapter/query dependent | Not equivalent to evidence graph. |
| Policy | Rule/decision layer governing access or operations. | Decide and audit permission/compliance outcomes. | policy-engine, OPA shadow. | `@kadarn/policy-engine` | `policies`, `policy_evaluations` | auth, KOC policy, compliance | draft/active/inactive/deprecated | Not RLS alone. |
| Permission | Effective allowed action after auth, membership, RLS, policy, visibility. | Protect tenant/evidence/user boundaries. | auth guards, RLS, policies, visibility. | auth/policy/API modules | distributed across auth/policy tables | all APIs/projections | evaluated per request/context | Not one table. |
| Program Participant | Organization's participation in a program. | Model sponsor/site/lab/logistics participation. | participant routes/schema. | program APIs | `program_participants` | workspace, KOC | role/status changes | Not user membership. |
| Collection | Operational container/twin for specimen collections. | Group collection activity/assets. | collection APIs/twins. | operational-twins/API | `collection_twins` | workspace, marketplace | planned/active/paused/completed/closed | Not sponsor portfolio. |
| Specimen Twin | Event-backed operational specimen representation. | Track specimen state and lifecycle. | operational twin types. | `@kadarn/operational-twins` | `specimen_twins`, `twin_events` | processing, marketplace, graph | event-sourced state | Not evidence node. |
| Workflow | Configured process with instances and tasks. | Coordinate operational work. | workflow definitions/instances/tasks. | `@kadarn/workflow-engine` | `workflow_definitions`, `workflow_instances`, `workflow_tasks` | KOC/workflow/exchange | definition -> instance -> tasks | Not domain event store. |
| KPE | Kadarn Proof of Execution projection. | Summarize execution readiness/completion. | `KPEStatus`, KPE generator/routes. | `@kadarn/kpe-generator` | no dedicated table found | report UI, program/KOC routes | generated projection | Not source event/audit record. |
| Audit Event | Append-style compliance/history event. | Provide audit trail and passport history inputs. | audit route/lib. | API/evidence/delivery audit modules | `audit_events` | compliance, passport history | recorded over time | Not domain event outbox. |
| Domain Event | Platform event and outbox entry. | Support event-driven integration/feeds. | domain-events package. | `@kadarn/domain-events` | `domain_event_store`, `domain_event_outbox` | KOC events, feed, integration tests | stored/outboxed/processed | Not audit event by default. |
| Marketplace Request | Demand/request object in marketplace/exchange. | Start commercial/operational exchange workflow. | request APIs. | marketplace/exchange routes | `exchange_requests` | marketplace, workspace, exchange | submitted/updated | Not evidence request. |
| Exchange Deal | Deal/transaction from exchange request. | Model agreement/messages/escrow. | deal APIs. | exchange routes | `exchange_deals`, `exchange_messages`, `exchange_escrow` | financial, logistics, workspace | created/status-updated | Not settlement itself. |
| Settlement | Derived financial result or payment status. | Compute/track financial completion. | financial-engine/routes. | `@kadarn/financial-engine` | `exchange_escrow`; no first-class settlement table found | payments, KPE | calculated/updated | Not a claim or evidence object. |

---

## Part 3 - Synonym and Overload Detection

| Vocabulary Cluster | Same Concept? | Classification | Canonical Explanation |
|---|---:|---|---|
| Claim / Evidence Core Claim / Continuity Claim / Claim Candidate / Claim Instance / Claim Version | No | Same business family, different bounded contexts/lifecycle stages | Use **Claim** generically only in prose. Use **Evidence Core Claim**, **Continuity Claim**, **Claim Candidate**, **Claim Instance**, or **Claim Version** when referring to implementation. |
| Evidence / Evidence Node / Evidence Artifact / Discovery Artifact / Source Version | No | Different lifecycle objects | Evidence Node supports a claim. Evidence Artifact is lineage material. Discovery Artifact is Layer 0 discovery input. Source Version is immutable source content. |
| Provenance / Claim Provenance / Provenance Graph / Provenance Metadata | No | Same principle, different representations | Provenance means origin/reconstruction generally. Specify metadata, graph, or claim provenance when technical precision matters. |
| Passport / Sponsor Passport / Continuity Passport / Site Passport | No | Different projections using shared product metaphor | Passport means institutional read model. The source pipeline and audience must be named. |
| Profile / Institution Profile / Site Continuity Profile / Discovery Profile | No | Different source/projection contexts | Profile may be persisted continuity profile or generated discovery/public projection. Qualify it. |
| Capability / Organization Capability / Discovery Capability / Passport Capability / Continuity Capability | No | Different bounded contexts | Canonical root is Organization Capability. Other capability objects are extracted, projected, or profile-scoped. |
| Confidence / Confidence State / Continuity Score / Trust | No | Related but not identical | Confidence is derived evidence support. Trust and continuity score are broader/product-specific views. |
| Graph / Evidence Graph / Provenance Graph / Knowledge Graph / Graph Query | No | Different graph purposes | Always qualify graph type. Evidence graph evaluates claims; provenance graph traces origin; knowledge graph normalizes/query-composes. |
| Event / Audit Event / Domain Event / Transition Event / Twin Event | No | Different event models | Use the bounded event name. Audit events are compliance/history; domain events drive platform events/outbox; transition/twin events belong to their state machines. |
| Artifact / Evidence Artifact / Discovery Artifact / Delivery Artifact | No | Different lifecycle objects | Artifact must be qualified by pipeline: discovery input, lineage evidence material, or delivery output. |
| Trust / Trust Score / Confidence | No | Retired product term vs current evidence-support term | Trust remains in older engine/schema vocabulary, but product-facing evidence support should use Confidence, not Trust Score. |
| Visibility Scope | No | Same phrase, different enum families | Organization/platform visibility and Evidence Core visibility are separate contexts and should not be treated as interchangeable. |
| Publication / Published View / Projection | Partial | Publication is a projection type | Published View is an audience-filtered claim projection. Projection is broader and includes passport/report/KPE. |
| Institution / Organization | Partial | Same persistence anchor, different language | Organization is technical tenant/source record. Institution is product/domain language when assessed or represented. |

---

## Part 4 - Projection Vocabulary

| Projection | Primary Source | Transformation | Audience | Persistence | Versioning |
|---|---|---|---|---|---|
| Sponsor Passport | organization, sponsor portfolio membership, evidence-core claims/evidence, audit events | maps identity/capabilities/claims/history/recommendations/stability | sponsor users | generated read model; no passport table | not directly versioned |
| Passport Portfolio Index | sponsor portfolio/memberships plus institution evidence summary | filters portfolio institutions and summarizes evidence-backed state | sponsors | generated from portfolio repository | not directly versioned |
| Continuity Passport | site continuity profile, continuity claims, capabilities, evidence, timeline | composes continuity profile read model | continuity/workspace/public consumers | source profile persisted; passport generated | profile/version not explicit in current audit |
| Site Passport / Public Profile | organization/public slug, continuity/published/discovery data | public institution-facing read model | public/external users | projection; sources persisted elsewhere | depends on source/published view |
| Published View | claim instance/version, canonical claim view, confidence, policy | audience filtering and publication | public, sponsor, institution, integration | `phase8_published_views` | published view version/policy version |
| Evidence Pack | published view, provenance, review, verification, confidence | explainability bundle | API/export consumers | generated; no dedicated table found | generated from versioned inputs |
| Discovery Report / Recognition Report | discovery runs, artifacts, agent outputs, candidates, capability/gap engines | report sections and readiness/recognition narrative | discovery/KOC/sponsor consumers | generated; no dedicated report table found | tied to discovery run/outputs |
| Institution Profile | discovery outputs or continuity profile | narrative/profile projection | public/discovery/sponsor | continuity profile persisted; discovery profile generated | depends on source context |
| KPE | program, evidence/governance/provenance/settlement completion | proof-of-execution status/report | program/KOC/report consumers | no dedicated KPE table found | generated from current status |
| Confidence State Snapshot | evidence graph and evaluation policy | confidence level/value/report | passport/published/evidence consumers | `confidence_state_snapshots` | snapshot time |
| Graph Query Result | provenance, knowledge, trust, capability adapters | query-specific result composition | internal/API consumers | generated | not versioned unless source is |
| Delivery Artifact Render | delivery artifact/template/data | render to output format | delivery/export consumers | delivery-domain objects; UI mock exists | artifact/version context by delivery domain |

---

## Part 5 - Canonical Knowledge Language

The repository does not support a single linear hierarchy. The canonical language is a multi-root graph anchored by Organization / Institution:

```text
Organization / Institution
  -> Membership / Permission / Policy
  -> Organization Capability
  -> Program
       -> Participants / Milestones / Requirements
       -> Samples / Specimens / Aliquots / QC
       -> Shipments / Exchange / Settlement
       -> KPE Projection
  -> Discovery
       -> Discovery Session
       -> Discovery Run
       -> Discovery Artifact
       -> Layer 1 Extraction
       -> Agent Output
       -> Discovery Candidate
       -> Claim Candidate
       -> Discovery Report Projection
  -> Evidence Core
       -> Claim
       -> Evidence Node
       -> Evidence Relationship
       -> Right of Response
       -> Evidence Graph
       -> Confidence State
  -> Lineage / Publication
       -> Source
       -> Source Version
       -> Evidence Artifact
       -> Extraction Run
       -> Extracted Fact
       -> Claim Instance
       -> Claim Version
       -> Claim Provenance
       -> Published View
       -> Evidence Pack
  -> Sponsor
       -> Sponsor Portfolio
       -> Portfolio Membership
       -> Sponsor Passport Projection
  -> Continuity
       -> Site Continuity Profile
       -> Continuity Claim
       -> Continuity Evidence / Timeline
       -> Continuity Passport Projection
  -> Operations
       -> Operational Twins
       -> Workflow
       -> Audit Events
       -> Domain Events
```

Compressed KEMS-aligned knowledge chain:

```text
Institution
  -> Source / Artifact
  -> Extracted Fact / Discovery Candidate
  -> Claim Candidate
  -> Claim / Claim Version
  -> Evidence Node
  -> Provenance
  -> Evidence Graph
  -> Confidence State
  -> Published View
  -> Passport / Evidence Pack / Report
```

Product-facing sponsor gravity chain found in KUX/PDF language:

```text
Claim
  -> Evidence
  -> Capability
  -> Research Asset
  -> Passport
  -> Portfolio
  -> Opportunity
  -> Decision
```

---

## Part 6 - Bounded Context Vocabulary

| Bounded Context | Core Objects | Language | Responsibilities |
|---|---|---|---|
| Identity | user profile, organization, membership, role, active org | user, org, role, experience, membership | authenticate users and resolve active tenant context |
| Institution | organization, capability, profile, public profile | institution, organization, capability, profile | represent business actors and institutional identity |
| Research Programs | program, participant, milestone, requirement, activity | program, participant, milestone, KPE | manage operational research work |
| Evidence Core | claim, evidence node, counter evidence, relationship, right of response | claim, evidence, evidence graph, confidence | own claim/evidence primitives and evaluation |
| Discovery | session, run, artifact, layer1, agent output, candidate, report | discovery, recognition, candidate, artifact | turn raw materials into candidate knowledge and reports |
| Publication | claim version, published view, evidence pack | publish, view, audience, evidence pack | create audience-specific claim projections |
| Provenance | provenance metadata, node, edge, evidence, audit | provenance, lineage, trace, reconstruction | explain origin and transformation paths |
| Continuity | site continuity profile, continuity claim, timeline, capability | continuity, passport, timeline | model continuity-specific institutional knowledge |
| Sponsor | sponsor portfolio, membership, sponsor passport | portfolio, passport, stability, recommendation | expose institution knowledge to authorized sponsors |
| Marketplace / Vendor | request, deal, supply item, specimen, service | marketplace, request, deal, supplier/vendor | match demand/supply and commercial exchange |
| Operations | twin, sample, specimen, shipment, workflow, QC | twin, workflow, logistics, processing | track operational state and execution |
| Policy / Permission | policy, evaluation, guard, RLS, visibility | permission, policy, access, visibility | enforce and observe access decisions |
| Knowledge | ontology term, synonym, mapping, graph query | ontology, synonym, mapping, knowledge graph | normalize vocabulary and compose semantic queries |
| Infrastructure | instrumentation, metrics, health, events, rate limits | health, metrics, event, trace, envelope | platform support, observability, API envelopes |

---

## Part 7 - Ambiguity Report

| Ambiguous Concept | Why Confusion Exists | Current Implementations | Canonical Term | Terms To Avoid / Deprecate In New Docs |
|---|---|---|---|---|
| Claim | Multiple claim generations coexist. | evidence-core `claims`, continuity claims, phase8 claim instances/versions, discovery candidates. | use specific subtype when technical. | unqualified "claim" in implementation docs. |
| Evidence | Same word used for node, artifact, source, extracted fact. | evidence nodes, evidence artifacts, discovery artifacts, evidence sources. | Evidence Node for claim support; Evidence Artifact for lineage material. | "evidence" as table-level term without qualifier. |
| Artifact | Different pipelines use artifact differently. | discovery artifact, evidence artifact, delivery artifact. | qualify by pipeline. | bare "artifact" in cross-domain docs. |
| Passport | Several projections share metaphor. | sponsor, continuity, site/public. | Sponsor Passport / Continuity Passport / Site Passport. | "passport" without audience/source. |
| Profile | Persisted and generated variants. | site continuity profile, discovery institutional profile, public profile. | Site Continuity Profile or Institution Profile Projection. | "profile" as source of truth without qualifier. |
| Capability | Persisted, discovered, projected variants. | org capability, discovery capability, passport capability, continuity capability. | Organization Capability for persisted source; others qualified. | "capability" as if single implementation. |
| Confidence | Derived confidence appears in several read models. | evidence-core confidence, phase8 cache, continuity score, trust. | Confidence State for derived claim support. | "score" when meaning evidence confidence. |
| Knowledge Graph | Partial implementation only. | ontology tables, graph-query, evidence graph, provenance graph. | Knowledge Vocabulary / Graph Query unless universal graph exists. | implying one persisted global graph. |
| Provenance | Metadata, graph, and claim reconstruction layers overlap. | evidence-core provenance metadata, provenance graph, claim provenance. | Provenance with qualifier. | treating provenance graph as all provenance. |
| Policy / Permission | Enforcement spans several layers. | auth guards, RLS, policy-engine, OPA shadow, visibility policies. | Permission Layer for combined effect; Policy for rule object. | saying "policy" when meaning auth guard/RLS. |
| Event | Many event timelines exist. | audit events, domain events, transition events, twin events. | qualified event type. | generic "event store" for audit/twin transitions. |
| Institution / Organization | Same persistent anchor, different product language. | `organizations`, institution routes/profiles/passports. | Organization in schema/API internals; Institution in product projections. | separate "institution" table unless actually present. |
| Trust / Trust Score | Older engine/schema language overlaps with current Confidence doctrine. | trust-engine/schema and product docs that retire trust-score language for evidence support. | Confidence for evidence support; Trust only when naming legacy/engine objects. | Trust Score, Verified Institution badge, unqualified trust claims. |
| Visibility Scope | Same phrase appears in org/platform and evidence-core visibility contexts. | org/program/network/public; site/sponsor_authorized/system. | Visibility Scope qualified by owning context. | treating all visibility scope enums as equivalent. |

---

## Part 8 - Canonical Dictionary

# Institution

Definition: Product-language representation of an organization when Kadarn is assessing, discovering, profiling, or presenting it.  
Relationships: backed by Organization; appears in portfolios, passports, profiles, discovery, continuity, evidence.  
Examples: sponsor portfolio institution, public site profile, institutional passport.  
References: `organizations`, `/v1/institution/*`, sponsor passport routes, PD-2.

# Organization

Definition: Durable tenant/business actor persisted by the platform.  
Relationships: owns memberships, capabilities, programs, evidence, discovery sessions, portfolios, policies, audit events.  
Examples: sponsor, site, lab, hospital, biobank, logistics provider.  
References: `packages/types/src/index.ts`, `organizations`, organization routes.

# Portfolio

Definition: Sponsor-owned set of institutions authorized for Sponsor Passport reads.  
Relationships: belongs to sponsor organization; contains portfolio memberships; gates passport projections.  
Examples: sponsor portfolio list page.  
References: `sponsor_portfolios`, `sponsor_portfolio_memberships`, sponsor passport repository.

# Capability

Definition: Ability or capacity associated with an organization, discovery output, profile, or passport projection.  
Relationships: canonical persisted source is Organization Capability; discovery/passport/continuity capabilities are derived or scoped variants.  
Examples: processing, QC, logistics, regulatory.  
References: `Capability`, `organization_capabilities`, discovery capability package.

# Claim

Definition: Evidence-backed statement about an organization or subject.  
Relationships: supported/contradicted by evidence nodes; can be versioned, projected, published, and evaluated.  
Examples: biospecimen capability claim.  
References: `claims`, evidence-core `Claim`, phase8 claim instance/version.

# Claim Candidate

Definition: Proposed claim before canonical promotion or publication.  
Relationships: derived from discovery candidates or extracted facts; may become claim instance/version.  
Examples: proposed claim detected from document.  
References: discovery `ClaimCandidate`, `phase8_claim_candidates`.

# Claim Version

Definition: Immutable payload version of a versioned claim.  
Relationships: belongs to claim instance; feeds claim provenance, published views, evidence packs.  
Examples: version N of a capability claim.  
References: `phase8_claim_versions`, phase8 contracts.

# Evidence

Definition: Information that supports, contradicts, or contextualizes claims.  
Relationships: represented as nodes, artifacts, extracted facts, or source versions depending lifecycle stage.  
Examples: SOP excerpt, registry fact, PubMed record.  
References: `EvidenceNode`, `evidence_nodes`, evidence-lineage artifacts.

# Evidence Node

Definition: Claim-linked evidence record with class, content, source, weight, provenance, visibility, and temporal metadata.  
Relationships: belongs to claim; participates in evidence relationships; drives confidence.  
Examples: supporting evidence class B node.  
References: `packages/evidence-core/src/types.ts`, `evidence_nodes`.

# Evidence Artifact

Definition: Stored artifact in the lineage/publication pipeline.  
Relationships: belongs to source version; feeds extraction run and extracted facts.  
Examples: versioned document artifact.  
References: `evidence_artifacts`, evidence-lineage package.

# Discovery Artifact

Definition: Layer 0 original artifact received by discovery.  
Relationships: feeds Layer 1 extraction, agent outputs, discovery candidates.  
Examples: uploaded PDF, public registry payload.  
References: `Layer0Artifact`, `discovery_artifacts`.

# Source

Definition: External or original origin for evidence.  
Relationships: has source versions; source versions have artifacts.  
Examples: FDA, PubMed, ClinicalTrials.gov, uploaded document source.  
References: `evidence_sources`, connector packages.

# Source Version

Definition: Immutable version of a source with content/version identity.  
Relationships: contains evidence artifacts and provenance hashes.  
Examples: source content hash version.  
References: `evidence_source_versions`.

# Extracted Fact

Definition: Atomic fact extracted from an artifact by an extraction run.  
Relationships: may support claim candidates and provenance reconstruction.  
Examples: detected certification date.  
References: `evidence_extracted_facts`.

# Observation

Definition: Generic discovered or extracted fact-like item before canonical claim status.  
Relationships: overlaps with extracted facts and agent outputs.  
Examples: observed timeline event or detected capability clue.  
References: discovery outputs, extracted facts.

# Provenance

Definition: Record of origin, actor, transformation, and reconstruction path.  
Relationships: exists as metadata, graph, and claim-level reconstruction.  
Examples: source artifact -> extraction -> fact -> claim version.  
References: evidence-core provenance metadata, provenance graph, phase8 provenance.

# Evidence Graph

Definition: Graph of claims, evidence nodes, and evidence relationships.  
Relationships: drives confidence and explainability.  
Examples: claim with supporting and contradicting evidence nodes.  
References: evidence-core graph/evaluation modules.

# Provenance Graph

Definition: Graph of provenance nodes, edges, and evidence for tracing derivation.  
Relationships: complements but does not replace evidence graph.  
Examples: specimen -> processing event -> dataset lineage.  
References: `provenance_nodes`, `provenance_edges`.

# Confidence

Definition: Derived assessment of evidence support for a claim.  
Relationships: computed from evidence graph; may be snapshotted/cached; appears in projections.  
Examples: high/moderate/low/insufficient support.  
References: evidence-core evaluation, phase8 confidence, `confidence_state_snapshots`.

# Confidence State

Definition: Structured output or snapshot of derived confidence.  
Relationships: belongs to claim/evidence evaluation context.  
Examples: contribution breakdown and confidence level.  
References: `ConfidenceState`, `confidence_state_snapshots`.

# Trust

Definition: Older/engine vocabulary for organization trust state; not the canonical product term for evidence support.  
Relationships: adjacent to confidence and risk language, but not equivalent.  
Examples: organization trust records, trust events, trust challenges.  
References: `organization_trust`, `trust_events`, trust-engine.

# Passport

Definition: Institution-facing projection for a specific audience/context.  
Relationships: generated from organizations, claims, evidence, portfolios, audit, continuity, or published views.  
Examples: Sponsor Passport, Continuity Passport, Site Passport.  
References: sponsor passport routes, continuity passport routes.

# Published View

Definition: Audience-filtered projection of claim information.  
Relationships: generated from claim/canonical view/confidence/policy; feeds evidence packs.  
Examples: public claim view, sponsor claim view.  
References: `@kadarn/published-view`, `phase8_published_views`.

# Evidence Pack

Definition: Explainability bundle for a published view.  
Relationships: includes claim statement, evidence graph summary, confidence, timeline, review history, sources.  
Examples: evidence pack endpoint response.  
References: evidence-lineage `EvidencePack`, published-view evidence pack generator.

# Research Asset

Definition: Product-language object representing evidence-relevant institutional assets such as specimens, collections, capabilities, and services.  
Relationships: grounded by organization capabilities, collection/specimen twins, marketplace supply, and evidence claims.  
Examples: biospecimen collection, service capability, operational specimen.  
References: product scope docs, workspace inventory/collections, marketplace, operational twins.

# Profile

Definition: Institution summary object; may be persisted continuity profile or generated discovery/public projection.  
Relationships: linked to organization and may feed passports/public pages.  
Examples: site continuity profile, discovery institutional profile.  
References: `site_continuity_profiles`, discovery profile builder.

# Continuity

Definition: Domain for site continuity profiles, continuity claims, capabilities, timeline, evidence, and recommendations.  
Relationships: parallel/legacy model to evidence-core and publication paths.  
Examples: continuity passport, continuity claim workflow.  
References: continuity migrations/routes.

# Knowledge

Definition: Normalized vocabulary and semantic query support, not the entire database.  
Relationships: ontology terms, synonyms, mappings, graph query.  
Examples: normalized capability vocabulary.  
References: knowledge-engine, graph-query.

# Knowledge Graph

Definition: Partially implemented semantic/query composition concept.  
Relationships: distinct from evidence graph and provenance graph.  
Examples: graph-query result combining provenance, knowledge, trust, capability.  
References: graph-query package, ontology tables.

# Publication

Definition: Process/context for turning source claim data into audience-specific views.  
Relationships: published views and evidence packs are publication projections.  
Examples: published claim view.  
References: published-view package, phase8 published views.

# Projection

Definition: Read model derived from source records for an audience or workflow.  
Relationships: passports, reports, evidence packs, KPE, published views.  
Examples: Sponsor Passport, Discovery Report.  
References: PD-2 projection analysis.

# Permission

Definition: Effective access decision across auth, membership, RLS, policy, and visibility.  
Relationships: implemented by multiple layers.  
Examples: sponsor can read portfolio institution passport only when membership allows.  
References: auth guards, policy-engine, RLS migrations.

# Policy

Definition: Rule object or evaluation governing access/operations.  
Relationships: policy evaluations record outcomes; OPA shadow observes decisions.  
Examples: organization membership policy.  
References: `policies`, `policy_evaluations`, policy-engine tests.

# Program

Definition: Operational research/work container.  
Relationships: participants, milestones, samples, shipments, exchange, KPE.  
Examples: sponsor-led program.  
References: `programs`, program routes/UI.

# Collection

Definition: Operational collection container/twin.  
Relationships: contains specimens/samples by operational context.  
Examples: collection workspace.  
References: `collection_twins`, collection APIs.

# Specimen

Definition: Operational biological/material item represented by a twin.  
Relationships: belongs to collection/program/organization context; can move through processing/logistics.  
Examples: specimen twin in marketplace.  
References: `specimen_twins`, operational-twins package.

# Twin

Definition: Event-backed operational representation of an object.  
Relationships: has twin events and current state.  
Examples: specimen twin, shipment twin, transaction twin.  
References: operational-twins package, `twin_events`.

# Workflow

Definition: Defined and running operational process with tasks.  
Relationships: workflow definition -> instance -> task.  
Examples: KOC workflow route.  
References: workflow-engine, workflow tables.

# Discovery

Definition: Pipeline turning artifacts into candidates, outputs, and reports.  
Relationships: session -> run -> artifacts -> agent outputs -> candidates -> reports.  
Examples: discovery dashboard/report.  
References: evidence-discovery package, discovery routes/UI.

# Recognition

Definition: Product language for discovery-generated institution report/readiness.  
Relationships: projection over discovery outputs.  
Examples: Institution Recognition Report.  
References: discovery report/public profile modules.

# Opportunity

Definition: Contextual sponsor/study-to-institution match or actionable fit projection.  
Relationships: derived from institution evidence, sponsor/study requirements, gaps, and readiness.  
Examples: continuity opportunity, sponsor opportunity page.  
References: continuity opportunity routes, sponsor/KUX docs.

# Risk / Alert

Definition: Projection of evidence decay, contradiction, operational issue, or monitoring condition requiring attention.  
Relationships: must carry evidence/provenance where it affects decisions.  
Examples: decision-basis erosion, capability evidence refresh risk, operational exception.  
References: KUX risk/attention docs, operations exceptions, KOC health/alerts surfaces.

# Study

Definition: Sponsor research intent or clinical/program requirement context used to evaluate feasibility or opportunity.  
Relationships: associated with programs, feasibility, sponsor opportunities, and institutional capabilities.  
Examples: sponsor clinical program requirements profile.  
References: program routes, feasibility routes, sponsor/KUX docs.

# KPE

Definition: Kadarn Proof of Execution, a projection over program execution dimensions.  
Relationships: derived from evidence, governance, provenance, settlement, audit state.  
Examples: KPE report page.  
References: KPE generator, `KPEStatus`, KPE routes.

# Audit Event

Definition: Compliance/history event record.  
Relationships: informs audit, compliance, passport history.  
Examples: evidence submitted action.  
References: `audit_events`, audit tests.

# Domain Event

Definition: Platform event/outbox item used for event-driven behavior.  
Relationships: stored in event store/outbox; separate from audit.  
Examples: organization-created event.  
References: domain-events package, domain event tables.

---

## Part 9 - Platform Language Principles

1. A business concept has one canonical definition, but implementations may have context-qualified variants.
2. Repository code and schema have priority over documentation when meaning conflicts.
3. Organization is the durable technical anchor; Institution is the product/domain reading of that anchor.
4. A projection is never a source of truth.
5. Passport is a projection, not a table or primary institution record.
6. Published View is an audience-specific projection, not canonical claim truth.
7. Confidence is always derived from evidence and may be cached, but the cache is not the truth.
8. Trust Score and Verified Institution language are not canonical product vocabulary for evidence support; use Confidence and explainable evidence language instead.
9. Evidence Nodes are claim-linked evidence; Evidence Artifacts and Discovery Artifacts must be qualified separately.
10. Claims must be explainable through evidence and provenance.
11. Evidence is immutable or superseded/resolved by lifecycle, not silently edited away.
12. Institutions own or scope evidence through organization identity and visibility.
13. Provenance must be qualified by representation: metadata, graph, or claim reconstruction.
14. Graph vocabulary must be qualified: Evidence Graph, Provenance Graph, Knowledge Graph, or Graph Query.
15. Permission is layered: auth, membership, RLS, policy, visibility, and projection filtering all matter.
16. Discovery output is candidate knowledge until promoted, published, or projected.
17. KEMS semantics are not operational hardening concerns; operations must not redefine knowledge meaning.
18. Vocabulary must remain stable across APIs, UI, documentation, tests, and product language.
19. Ambiguous terms should be qualified at first use in new docs and contracts.

---

## Evidence References

- `docs/platform-discovery/platform-capability-audit.md`
- `docs/platform-discovery/knowledge-model.md`
- `packages/types/src/index.ts`
- `packages/types/src/phase8/*`
- `packages/evidence-core/src/types.ts`
- `packages/evidence-discovery/src/types.ts`
- `packages/published-view/src/*`
- `packages/evidence-lineage/src/*`
- `packages/provenance-graph/src/*`
- `packages/knowledge-engine/src/*`
- `packages/graph-query/src/*`
- `apps/api/src/lib/sponsor-passport/*`
- `apps/api/src/app/api/v1/*`
- `apps/web/src/app/*`
- `supabase/migrations/*.sql`
- `database/migrations/*.sql`
