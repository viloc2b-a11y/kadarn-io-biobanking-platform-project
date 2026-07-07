# Kadarn MVP Organization v2

Sprint 6 reorganizes the Organization onboarding module so it no longer feels like one large mixed form. The screen should acquire institutional knowledge in clean layers: Identity, Operational Footprint, Research Portfolio, Coverage, Network, and Digital Presence.

## Design Goal

Organization v2 should answer:

> What is this institution, where does it operate, what research portfolio does it support, what populations/regions does it cover, how is it networked, and where can sponsors verify its public presence?

It should not mix identity, operations, geography, programs, modalities, languages, network structure, and website into one broad section.

## Target Structure

```text
Organization v2
  1. Identity
  2. Operational Footprint
  3. Research Portfolio
  4. Coverage
  5. Network
  6. Digital Presence
```

Each section must create or update a canonical object, capability claim seed, or evidence requirement.

## Section Definitions

| Section | Purpose | Canonical target | Derived outputs |
|---|---|---|---|
| Identity | Establish the legal/institutional anchor. | `Institution` | Passport identity, legal evidence requirements, Memory founding event. |
| Operational Footprint | Define where work physically/operationally happens. | `Location[]`, institution operating model | Infrastructure scope, multi-site readiness, Roadmap gaps. |
| Research Portfolio | Capture research programs, therapeutic areas, and modalities. | `InstitutionResearchExperience`, capability claim seeds | Capabilities, sponsor matching, Readiness, Passport. |
| Coverage | Capture populations, geography, languages, time zones, logistics reach. | `InstitutionOperationalFootprint` | Recruitment/logistics readiness, sponsor matching, Roadmap. |
| Network | Describe whether the institution is standalone, multi-site, hub-and-spoke, partner network, SMO, CRO, lab network, etc. | `InstitutionNetworkModel`, `Location[]`, partner/location relationships | Multi-site operations claim, sponsor qualification, Memory, Roadmap. |
| Digital Presence | Capture public verification surfaces. | `InstitutionDigitalPresence` | Passport link, evidence discovery seeds, sponsor verification. |

## Current-to-v2 Mapping

| Current group / field | Organization v2 section | Keep? | Notes |
|---|---|---:|---|
| `org_name` | Identity | Yes | Legal name. |
| `org_dba` | Identity | Yes | Alias / DBA. |
| `org_type` | Identity | Yes | Institution type. |
| `org_mission` | Identity | Yes | Profile statement; optional and should be de-emphasized if evidence is thin. |
| `org_founded_year` | Identity | Yes | Supports continuity and Memory. |
| `org_locations` | Operational Footprint | Yes | Primary object for location structure. |
| `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, `org_time_zone` | Operational Footprint | No as input | Derived from primary location only. |
| `org_research_focus` | Research Portfolio | Yes | Capability claim seed, not final capability. |
| `org_therapeutic_areas` | Research Portfolio | Yes | Experience taxonomy. |
| `org_research_modalities` | Research Portfolio | Yes | Research modality taxonomy. |
| `org_operational_coverage` | Coverage | Yes | Primary coverage model. |
| `org_active_regions` | Coverage | Yes | Regional coverage. |
| `org_countries` | Coverage | Yes | Country coverage. |
| `org_recruitment_reach` | Coverage | Yes | Recruitment capability seed. |
| `org_sample_logistics` | Coverage | Yes | Logistics capability seed. |
| `org_languages` | Coverage | Yes | Institution operating languages. |
| `org_time_zones` | Coverage | Yes | Coordination coverage. |
| `org_operational_assets` | Network or Coverage | Yes, but split | Some assets are network model, some are operational reach. |
| `org_geographic_reach` | Coverage | No as input | Derived legacy projection from richer coverage model. |
| `org_website` | Digital Presence | Yes | Public verification URL. |

## Organization v2 Questions

### 1. Identity

Purpose: create the `Institution` anchor.

| Question | Field | Canonical object | Why it exists |
|---|---|---|---|
| What is the legal name of your institution? | `org_name` | `Institution.name` | Creates the institution anchor. |
| Does your institution operate under other names? | `org_dba` | `Institution.aliases[]` | Supports evidence matching and sponsor recognition. |
| What type of institution are you? | `org_type` | `Institution.type` | Determines operating context and downstream eligibility. |
| What is your institutional mission? | `org_mission` | `Institution.profile.mission` | Provides optional Passport narrative. |
| When was your institution or research program founded? | `org_founded_year` | `Institution.foundedDate` | Supports continuity and institutional memory. |

### 2. Operational Footprint

Purpose: create `Location[]` and define physical operating structure.

| Question | Field | Canonical object | Why it exists |
|---|---|---|---|
| What locations make up your institution? | `org_locations` | `Location[]` | Creates operational locations. |
| Which location is primary? | `org_locations[].isPrimary` | `Location.primary` | Supports primary location projection. |
| What type is each location? | `org_locations[].type` | `Location.type` | Distinguishes HQ, site, lab, biobank, clinic, partner practice. |
| Where is each location? | `org_locations[].street/city/state/country/zip/timeZone` | `Location.address` | Supports evidence matching, site readiness, and logistics. |

Do not ask for location count. Derive it from `Location[]`.

### 3. Research Portfolio

Purpose: capture what the institution has done or can credibly support as research programs and modalities. This is not final capability scoring.

| Question | Field | Canonical object / claim seed | Why it exists |
|---|---|---|---|
| Which research programs and operational capabilities does your institution actively perform? | `org_research_focus` | `Capability Claim` seed on `Institution` | Seeds capability derivation. |
| Which therapeutic areas does your institution have experience in? | `org_therapeutic_areas` | `InstitutionResearchExperience.therapeuticAreas` | Supports sponsor matching and Passport context. |
| Which research modalities can your institution execute? | `org_research_modalities` | `InstitutionResearchExperience.modalities` | Supports modality claims and readiness. |

Label this section as "research portfolio" rather than "research focus" because it includes programs, modalities, and experience domains.

### 4. Coverage

Purpose: capture geographic, population, language, time-zone, recruitment, and sample-logistics coverage.

| Question | Field | Canonical object / claim seed | Why it exists |
|---|---|---|---|
| What is your primary operational coverage? | `org_operational_coverage` | `InstitutionOperationalFootprint.coverage` | Defines local/regional/national/international reach. |
| Which states/provinces are active? | `org_active_regions` | `InstitutionOperationalFootprint.regions[]` | Supports regional readiness and matching. |
| Which countries are active? | `org_countries` | `InstitutionOperationalFootprint.countries[]` | Supports international sponsor matching. |
| What populations or channels can you recruit from? | `org_recruitment_reach` | `Capability Claim` seed | Supports recruitment capability. |
| What sample logistics can you support? | `org_sample_logistics` | `Capability Claim` seed | Supports logistics and biospecimen readiness. |
| Which languages can the institution operate in? | `org_languages` | `Institution.languageCoverage[]` | Supports participant access and sponsor matching. |
| Which time zones can you coordinate across? | `org_time_zones` | `InstitutionOperationalFootprint.timeZones[]` | Supports operational coordination. |

Do not ask "geographic reach" as a single flat label. Derive legacy `org_geographic_reach` from coverage.

### 5. Network

Purpose: capture institution structure beyond one legal entity and one physical site.

| Question | Proposed field | Canonical object / claim seed | Why it exists |
|---|---|---|---|
| Is this institution standalone, multi-site, networked, or a service partner? | `org_network_model` | `InstitutionNetworkModel` | Clarifies how locations and partners relate. |
| Does your institution coordinate partner practices, satellite sites, or affiliated labs? | `org_network_relationships` | `LocationRelationship[]` / network claim seed | Supports multi-site and network readiness. |
| Which operational assets belong to the network? | `org_operational_assets` split by asset type | `InstitutionNetworkModel` or `Capability Claim` seed | Avoids mixing assets with coverage. |

This section should only appear after `org_type` or location structure indicates it matters, for example Research Network, SMO, CRO, central lab, multi-site institution, or more than one location.

### 6. Digital Presence

Purpose: capture public verification and discovery surfaces.

| Question | Field | Canonical object | Why it exists |
|---|---|---|---|
| What is your institutional website? | `org_website` | `InstitutionDigitalPresence.website` | Sponsor verification and public evidence discovery. |
| Are there public profiles sponsors should know about? | `org_public_profiles` | `InstitutionDigitalPresence.profiles[]` | Future evidence discovery seed. |
| Are there registries/directories where the institution appears? | `org_registry_profiles` | `InstitutionDigitalPresence.registryLinks[]` | Future verification/evidence source. |

Only `org_website` exists today. `org_public_profiles` and `org_registry_profiles` are future-safe additions, not required for MVP.

## Recommended UI Order

```text
1. Identity
   Legal name
   Other names
   Institution type
   Mission
   Founded year

2. Operational Footprint
   Locations
   Primary location
   Location types

3. Research Portfolio
   Research programs / operational capabilities
   Therapeutic areas
   Research modalities

4. Coverage
   Primary coverage
   Regions / countries
   Recruitment reach
   Sample logistics
   Languages
   Time zones

5. Network
   Network model
   Partner/satellite relationships
   Network assets

6. Digital Presence
   Website
   Public profiles
   Registries/directories
```

## Progressive Disclosure

| Trigger | Show |
|---|---|
| `org_type` is Research Network / SMO / CRO / central lab / multi-site | Network section. |
| More than one location exists | Network section and multi-site prompts. |
| Coverage is regional/national/international | Regions/countries/time-zone controls. |
| Sample logistics selected | Sample logistics evidence requirements and infrastructure links. |
| Research modality includes IVD/biospecimen/community/registry | Relevant evidence requirements and Roadmap seeds. |

## Claims and Evidence Impact

| Section | Claim seeds | Evidence requirements generated |
|---|---|---|
| Identity | Institution exists; institution type claim. | Business registration, operating license, good standing, insurance. |
| Operational Footprint | Location exists; location type; multi-site operation. | Leases, facility photos, floor plans, operating licenses. |
| Research Portfolio | Research operations, therapeutic experience, modality coverage. | Study history, site profile, 1572, sponsor references, publications. |
| Coverage | Recruitment reach, language coverage, sample logistics reach. | Recruitment SOP, referral agreements, language coverage records, shipping SOP. |
| Network | Multi-site operations, partner coordination, network logistics. | Partner agreements, delegation/coordination SOPs, network site records. |
| Digital Presence | Public verification source exists. | Website, registry profiles, public directories, publications. |

## What Moves Out of Organization

| Current concept | Move to | Reason |
|---|---|---|
| Lab presence | Infrastructure | A lab is a location-scoped object. |
| Biospecimen operations | Infrastructure | Belongs to location/lab/equipment. |
| Team roles | People | Belongs to persons. |
| Certifications | People/Documents | Belongs to person/evidence. |
| Readiness summary | Readiness | Derived output. |
| Capability strength | Capabilities | Derived output. |
| Passport identity text | Passport | Derived projection. |
| Document gaps | Documents/Roadmap | Evidence pipeline and future actions. |

## Copy Model

Organization v2 should use knowledge-acquisition language:

| Avoid | Prefer |
|---|---|
| "Tell us about your organization." | "Create the institutional anchor Kadarn will use to connect claims and evidence." |
| "This is the #1 filter sponsors use." | "These selections seed capability claims; evidence will determine strength." |
| "Describe your geographic reach." | "Define where the institution can operate, recruit, coordinate, and move samples." |
| "Institutional Locations" | "Operational locations where institutional work happens." |
| "Contact & Online Presence" | "Digital Presence for public verification and evidence discovery." |

## Data Contract

Organization v2 should write only canonical organization-scope facts:

```typescript
interface OrganizationV2Input {
  identity: InstitutionIdentity
  locations: InstitutionalLocation[]
  researchPortfolio: InstitutionResearchPortfolio
  coverage: InstitutionOperationalCoverage
  network: InstitutionNetworkModel
  digitalPresence: InstitutionDigitalPresence
}
```

Legacy projections should be read-only adapter outputs:

```typescript
interface OrganizationLegacyProjection {
  org_city: string
  org_state: string
  org_country: string
  org_geographic_reach: string
}
```

## Implementation Notes

1. Rename the current "Research Focus" section to `Research Portfolio`.
2. Split the current `OperationalFootprintEditor` into:
   - Coverage controls.
   - Network controls.
   - Language/time-zone controls.
3. Keep `InstitutionalLocationsEditor`, but move it under `Operational Footprint`.
4. Move `org_website` into `Digital Presence`.
5. Stop writing `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, and `org_time_zone` during location edits.
6. Derive `org_geographic_reach` from `org_operational_coverage` only in a projection adapter.
7. Keep evidence requirements visible as hints, not extra questions.

## Acceptance Check

Organization v2 is complete when:

- The screen is visibly organized into Identity, Operational Footprint, Research Portfolio, Coverage, Network, and Digital Presence.
- Each section maps to a canonical object or claim seed.
- Locations are captured once and all location summaries are derived.
- Research programs, therapeutic areas, and modalities are grouped under Research Portfolio.
- Geographic coverage, recruitment reach, languages, time zones, and logistics are grouped under Coverage.
- Network-specific prompts appear only when relevant.
- Website/public verification belongs to Digital Presence.
- No derived capability, readiness, Passport, or Roadmap fields are edited from Organization.
