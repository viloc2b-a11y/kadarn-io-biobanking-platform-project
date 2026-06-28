# Kadarn Information Security Program
## ISO 27001 / SOC 2 Alignment — Draft

### 1. Scope
Information security controls for the Kadarn platform covering all 9 KRM-RAO engines, 5 Operational Twins, and API layer.

### 2. Access Control
- Authentication: Supabase Auth (JWT)
- Authorization: RLS policies on all tables
- Role model: 12 organization capabilities + platform_admin
- Multi-tenant isolation: organization_id scoping on all queries

### 3. Audit & Monitoring
- All data changes logged via audit_events trigger
- Policy evaluations recorded in policy_evaluations
- Trust events append-only in trust_events
- Twin events immutable in twin_events

### 4. Data Protection
- Encryption at rest (PostgreSQL TDE / Supabase)
- Encryption in transit (TLS 1.3)
- No PHI in discovery catalog (de-identified only)
- Consent-linked data access via Policy Engine
