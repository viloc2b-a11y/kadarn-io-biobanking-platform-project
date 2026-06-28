# Kadarn Compliance Manual
## Version 1.0 — Draft

### 1. Purpose
This manual defines the compliance framework for Kadarn platform operations.

### 2. Scope
Covers all organizations, users, specimens, and data processed through the Kadarn network.

### 3. Regulatory Mapping
| Regulation | Scope | Kadarn Controls |
|------------|-------|-----------------|
| HIPAA | PHI in biospecimen programs | RLS isolation, audit logging, consent verification |
| GDPR | EU donor data | Data Processing Agreement, right to erasure workflow |
| SOC 2 | Platform security | Access controls, encryption, monitoring |
| ISO 27001 | ISMS | Information Security Program |
| 21 CFR Part 11 | Electronic records in trials | Audit trail, digital signatures, record retention |

### 4. Compliance Controls
- RBAC via RLS (row-level security on all tables)
- Immutable audit trail (audit_events table)
- Consent verification via Policy Engine
- Data isolation per organization
- Encryption at rest and in transit
