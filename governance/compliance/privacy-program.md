# Kadarn Privacy Program
## HIPAA / GDPR / ISO 27701 Alignment — Draft

### 1. Data Classification
| Category | Examples | Controls |
|----------|----------|----------|
| PHI | Donor identifiers, clinical data | RLS, consent verification, BAAs |
| De-identified | Specimen type, diagnosis code | Safe harbor per HIPAA |
| Operational | Trust scores, fulfillment metrics | Internal only |

### 2. Consent Management
- Consent status tracked per specimen (consent_status field)
- Policy Engine evaluates consent scope at access request time
- Consent withdrawal triggers Specimen Twin update

### 3. Data Processing Agreements
- DPA template for EU data processors
- BAA template for HIPAA covered entities
- MTA/DUA templates for specimen/data transfer
