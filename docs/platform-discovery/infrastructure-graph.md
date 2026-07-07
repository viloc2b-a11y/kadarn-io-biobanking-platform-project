# Kadarn MVP Infrastructure Graph

Sprint 8 reorganizes Infrastructure from a mixed location form into an evidence-backed infrastructure graph. Infrastructure should not be one object with many fields. It should be a set of operational objects attached to a location, each with its own evidence.

Target model:

```text
Facility
  -> Laboratory
  -> Equipment
  -> Storage
  -> Utilities
  -> Logistics
  -> Operational Services
  -> Evidence
```

This lets Kadarn answer:

> What physical and operational assets support this capability claim, and what evidence proves them?

## Current Problem

The current `LocationInfrastructure` model is location-specific, which is correct, but it still combines multiple object types:

- facility type
- research space
- rooms
- infusion / early phase capacity
- laboratory presence
- pharmacy / imaging presence
- biospecimen processing
- storage equipment
- temperature monitoring
- shipping capability
- biospecimen operations
- backup power

That creates a form-shaped record. Kadarn needs graph-shaped infrastructure. A freezer, lab, utility, courier workflow, procedure room, and pharmacy service are not the same kind of object and should not share one flat evidence model.

## Canonical Objects

| Object | Purpose | Example evidence |
|---|---|---|
| `Facility` | Physical operating site or facility area attached to a `Location`. | Facility license, floor plan, lease, inspection report, photos. |
| `Laboratory` | Lab entity or lab area with testing/processing authority and scope. | CLIA/CAP/COLA, lab license, quality manual, lab SOPs. |
| `Equipment` | Named asset used to perform or support a capability. | IQ/OQ/PQ, calibration record, maintenance log, validation report. |
| `Storage` | Storage unit or storage capability. | Temperature logs, freezer qualification, alarm validation, inventory SOP. |
| `Utilities` | Resilience utilities that support operations. | Generator maintenance, UPS validation, alarm testing, disaster recovery SOP. |
| `Logistics` | Shipping, courier, chain-of-custody, receiving, and sample movement workflows. | Shipping SOP, courier agreement, IATA certificate, chain-of-custody log. |
| `OperationalService` | Facility-level service available at the location. | Pharmacy license, imaging agreement, infusion SOP, procedure room inventory. |
| `InfrastructureEvidence` | Evidence attached to any infrastructure object. | Source document, extracted fact, provenance link, expiration metadata. |

## Graph Shape

```typescript
interface Facility {
  id: string
  locationId: string
  facilityType: string
  researchSpaceType: string
  rooms: FacilityRoom[]
  evidenceIds: string[]
}

interface Laboratory {
  id: string
  facilityId: string
  laboratoryType: 'local' | 'central' | 'partner' | 'biobank' | 'other'
  certifications: InfrastructureEvidenceRef[]
  processingCapabilities: string[]
  evidenceIds: string[]
}

interface Equipment {
  id: string
  facilityId: string
  laboratoryId?: string
  storageId?: string
  equipmentType: string
  name?: string
  qualificationStatus: 'qualified' | 'partial' | 'unknown' | 'not-qualified'
  evidenceIds: string[]
}

interface Storage {
  id: string
  facilityId: string
  storageType: string
  temperatureRange: string
  monitoringModel: string
  backupUtilityIds: string[]
  evidenceIds: string[]
}

interface Utilities {
  id: string
  facilityId: string
  utilityType: 'generator' | 'ups' | 'temperature-monitoring' | 'alarm' | 'network' | 'other'
  reliabilityModel: string
  evidenceIds: string[]
}

interface Logistics {
  id: string
  facilityId: string
  logisticsType: 'domestic-shipping' | 'international-shipping' | 'local-courier' | 'receiving' | 'chain-of-custody'
  scope: string
  evidenceIds: string[]
}

interface OperationalService {
  id: string
  facilityId: string
  serviceType: 'pharmacy' | 'imaging' | 'infusion' | 'procedure-room' | 'overnight-early-phase' | 'mobile-research' | 'other'
  capacitySummary: string
  evidenceIds: string[]
}
```

The MVP can continue storing `infra_location_infrastructure`, but the target graph should treat that object as a temporary projection into these canonical objects.

## Current-to-Graph Mapping

| Current field | Infrastructure Graph target | Keep as input? | Notes |
|---|---|---:|---|
| `locationId` | Parent `Location` link | Yes | Infrastructure belongs to a known operational location. |
| `facilityType` | `Facility.facilityType` | Yes | Creates/updates a facility object. |
| `dedicatedResearchSpace` | `Facility.researchSpaceType` | Yes | Should be backed by floor plan, SOP, photos, or inspection. |
| `examRooms` | `FacilityRoom[]` | Yes | Room count should become room/capacity object. |
| `procedureRooms` | `FacilityRoom[]` or `OperationalService` | Yes | Supports procedure capability. |
| `infusionCapability` | `OperationalService: infusion` | Derive/confirm | Should be supported by staff, SOP, equipment, emergency readiness. |
| `overnightEarlyPhaseCapacity` | `OperationalService: overnight-early-phase` | Derive/confirm | Requires staffing, monitoring, emergency procedures, beds/rooms. |
| `laboratoryPresent` | `Laboratory` existence | Derive/confirm | Prefer extraction from CLIA/CAP/lab license. |
| `biospecimenProcessingPresent` | `Laboratory.processingCapabilities[]` | Derive/confirm | Should come from SOPs, training, processing logs. |
| `pharmacyPresent` | `OperationalService: pharmacy` | Derive/confirm | Requires license/SOP/service agreement. |
| `imagingPresent` | `OperationalService: imaging` | Derive/confirm | Requires equipment records or imaging agreement. |
| `storageEquipment[]` | `Storage[]` and/or `Equipment[]` | Derive/confirm | A freezer is an asset, not a checkbox. |
| `temperatureMonitoring` | `Utilities` linked to `Storage` | Derive/confirm | Monitoring is a control with logs/alarms. |
| `backupPower` | `Utilities` linked to facility/storage/equipment | Derive/confirm | Generator/UPS should have maintenance/validation evidence. |
| `shippingCapability` | `Logistics[]` | Derive/confirm | Domestic/international shipping depends on SOP, staff, courier, IATA. |
| `biospecimenOperations[]` | `CapabilityClaim[]` from Lab/Storage/Logistics/People | Derive | Collection, processing, storage, shipping, and chain-of-custody are claims. |

## Object Boundaries

### Facility

Facility answers: "Where does the infrastructure physically operate?"

Creates:

- facility type
- rooms and spaces
- physical capacity
- facility services
- location-specific site readiness

Evidence:

- facility license
- floor plan
- lease or ownership proof
- inspection report
- research space SOP
- photos or site qualification report

### Laboratory

Laboratory answers: "What lab authority and lab operations exist here?"

Creates:

- lab entity or lab area
- certifications
- testing/processing scope
- lab quality model
- lab capability claims

Evidence:

- CLIA certificate
- CAP/COLA accreditation
- lab license
- quality manual
- lab director credential
- processing SOP
- validation report

### Equipment

Equipment answers: "Which assets perform or support a capability?"

Creates:

- named or typed equipment asset
- equipment location
- qualification/calibration state
- maintenance and validation relationship

Evidence:

- IQ/OQ/PQ
- calibration certificate
- maintenance log
- validation report
- equipment inventory
- service contract

### Storage

Storage answers: "Where are samples, IP, records, or materials stored and controlled?"

Creates:

- storage asset or storage area
- temperature range
- monitoring controls
- backup utility relationship
- storage capability claims

Evidence:

- temperature logs
- freezer qualification
- alarm validation
- storage SOP
- inventory reconciliation
- excursion log

### Utilities

Utilities answer: "What keeps operations resilient?"

Creates:

- backup power model
- monitoring/alarm controls
- network/connectivity resilience
- facility continuity controls

Evidence:

- generator maintenance record
- UPS validation
- alarm testing
- disaster recovery SOP
- continuity plan
- monitoring logs

### Logistics

Logistics answers: "Can this site move samples, materials, and records reliably?"

Creates:

- courier workflows
- domestic shipping
- international shipping
- receiving workflows
- chain-of-custody controls

Evidence:

- shipping SOP
- courier agreement
- IATA certificate
- chain-of-custody log
- packaging validation
- shipping temperature record

### Operational Services

Operational Services answer: "Which specialized services are available at this facility?"

Creates:

- pharmacy service
- imaging service
- infusion service
- procedure room service
- early phase overnight service
- mobile research service

Evidence:

- pharmacy license
- imaging equipment record or agreement
- infusion SOP
- emergency readiness SOP
- procedure room inventory
- staffing plan

## Capability Claim Mapping

| Capability claim | Primary infrastructure objects | Required supporting evidence |
|---|---|---|
| Sample Processing | `Laboratory`, `Equipment`, `OperationalService` | CLIA/CAP/COLA, processing SOP, staff training, equipment qualification. |
| PBMC Processing | `Laboratory`, `Equipment`, `Storage` | PBMC SOP, centrifuge records, biosafety controls, processing training. |
| Flow Cytometry | `Laboratory`, `Equipment` | Instrument record, validation, maintenance, trained staff. |
| Molecular Testing | `Laboratory`, `Equipment` | CLIA/CAP, molecular validation, PCR/sequencing equipment records. |
| Biospecimen Collection | `Facility`, `OperationalService`, `Logistics`, `People` | Collection SOP, rooms, supplies, trained staff, chain-of-custody. |
| Biospecimen Storage | `Storage`, `Utilities`, `Equipment` | Freezer qualification, temperature logs, alarms, backup power. |
| Domestic Shipping | `Logistics`, `People` | Shipping SOP, courier agreement, training. |
| International Shipping | `Logistics`, `People` | IATA certificate, international courier agreement, shipping SOP. |
| Infusion Capability | `OperationalService`, `Facility`, `Equipment`, `People` | Infusion SOP, emergency readiness, staff credentials, equipment list. |
| Early Phase Readiness | `Facility`, `OperationalService`, `Utilities`, `People` | Overnight capacity, monitoring, emergency SOP, medical oversight. |
| IVD Readiness | `Laboratory`, `Equipment`, `Utilities`, `Quality Evidence` | Lab certification, validation records, quality manual, audit records. |
| Multi-Site Operations | `Facility[]`, `Logistics`, `Utilities`, `People` | Site roster, coordination SOP, location evidence, staffing coverage. |

## Evidence-First Behavior

| Evidence uploaded | Auto-created or suggested |
|---|---|
| CLIA Certificate | `Laboratory`, lab certification, expiration, lab scope. |
| CAP/COLA Accreditation | `Laboratory`, quality maturity support, expiration. |
| Equipment IQ/OQ/PQ | `Equipment`, qualification status, supported capability. |
| Equipment Inventory | `Equipment[]`, location assignment, maintenance needs. |
| Calibration Record | `Equipment`, calibration status, expiration/renewal. |
| Temperature Log | `Storage`, `Utilities`, monitoring evidence, excursion risk. |
| Freezer Qualification | `Storage`, equipment qualification, storage capability support. |
| Generator/UPS Maintenance | `Utilities`, backup power reliability evidence. |
| Shipping SOP | `Logistics`, domestic/international shipping claim candidate. |
| Courier Agreement | `Logistics`, logistics scope, service coverage. |
| IATA Certificate | `Logistics` + `PersonEvidence`, international shipping support. |
| Pharmacy License | `OperationalService: pharmacy`, expiration, service readiness. |
| Imaging Agreement | `OperationalService: imaging`, partner service support. |

## Infrastructure Page v2 Sections

```text
Infrastructure v2
  1. Facility
  2. Laboratory
  3. Equipment
  4. Storage
  5. Utilities
  6. Logistics
  7. Operational Services
  8. Derived Infrastructure Coverage
```

### 1. Facility

Creates `Facility`.

Inputs:

- facility type
- research space model
- rooms / capacity
- facility evidence

### 2. Laboratory

Creates `Laboratory`.

Inputs:

- lab presence and type
- lab certifications
- processing/testing scope
- lab evidence

### 3. Equipment

Creates `Equipment`.

Inputs:

- equipment type/name
- location/lab/storage relationship
- qualification and calibration status
- maintenance evidence

### 4. Storage

Creates `Storage`.

Inputs:

- storage asset/type
- temperature range
- monitoring model
- backup utility link
- storage evidence

### 5. Utilities

Creates `Utilities`.

Inputs:

- backup power
- alarms
- monitoring
- continuity support
- utility evidence

### 6. Logistics

Creates `Logistics`.

Inputs:

- domestic/international/local shipping
- receiving workflows
- chain-of-custody
- courier relationships
- logistics evidence

### 7. Operational Services

Creates `OperationalService`.

Inputs:

- pharmacy
- imaging
- infusion
- procedure room support
- overnight/early phase support
- service evidence

### 8. Derived Infrastructure Coverage

Readonly projection:

- lab coverage
- storage readiness
- shipping readiness
- utility resilience
- equipment qualification gaps
- location-by-location operational service coverage
- capability claims supported by infrastructure

No manual edits.

## Questions to Remove or Reframe

| Current pattern | Decision |
|---|---|
| "Does this location operate a laboratory?" | Reframe as create/confirm `Laboratory` from lab evidence. |
| "Storage equipment" checkbox list | Reframe as `Storage` and `Equipment` assets. |
| "Temperature monitoring" dropdown | Reframe as `Utilities`/control attached to storage. |
| "Backup power" dropdown | Reframe as `Utilities` with evidence. |
| "Shipping capability" dropdown | Reframe as `Logistics` workflows with SOP/courier/IATA evidence. |
| "Biospecimen operations" multi-select | Derive capability claims from lab, storage, logistics, people, and SOP evidence. |
| "Pharmacy present?" | Reframe as `OperationalService: pharmacy` with license/agreement evidence. |
| "Imaging present?" | Reframe as `OperationalService: imaging` with equipment/agreement evidence. |

## Derived Outputs

| Output | Infrastructure contribution |
|---|---|
| Capabilities | Shows which facility/lab/equipment/storage/logistics objects support each capability. |
| Readiness | Scores operational readiness, lab readiness, storage reliability, shipping readiness, and resilience. |
| Passport | Shows current infrastructure snapshot and active proof. |
| Memory | Tracks facility changes, equipment additions, lab certification changes, storage incidents, logistics upgrades. |
| Roadmap | Recommends missing equipment evidence, expired calibration, missing SOPs, weak utilities, and service gaps. |

## Implementation Notes

1. Keep `infra_location_infrastructure` for MVP compatibility, but treat it as a projection over graph objects.
2. Introduce separate model files for `Facility`, `Laboratory`, `Equipment`, `Storage`, `Utilities`, `Logistics`, and `OperationalService` before changing UI.
3. Move yes/no fields toward object existence plus evidence status.
4. Derive biospecimen capability claims from object combinations, not from a single multi-select.
5. Link storage assets to utilities so backup power and monitoring strengthen storage confidence.
6. Link logistics to people evidence so IATA-certified staff support international shipping.
7. Update Capabilities to display "Supported by infrastructure" with object/evidence references.
8. Update Roadmap to identify missing infrastructure objects and weak evidence, not just missing documents.

## Acceptance Check

Infrastructure Graph is complete when:

- Infrastructure is represented as facility, lab, equipment, storage, utilities, logistics, and operational service objects.
- Every infrastructure object can hold or link to evidence.
- Biospecimen, lab, storage, shipping, infusion, early phase, and IVD capabilities are derived from graph objects.
- Infrastructure summaries are readonly projections.
- Capabilities can answer which infrastructure objects support a claim.
- Roadmap can identify missing equipment, missing evidence, expired qualifications, weak utilities, and logistics gaps.
