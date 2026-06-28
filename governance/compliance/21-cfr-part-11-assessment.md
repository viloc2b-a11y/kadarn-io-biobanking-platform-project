# Kadarn 21 CFR Part 11 Assessment
## Draft — Electronic Records in Clinical Trials

### Requirements Mapping
| Requirement | Kadarn Control |
|-------------|---------------|
| Electronic signatures | JWT-based authentication with audit trail |
| Audit trail | Immutable audit_events + twin_events |
| Record retention | Append-only logs, never deleted |
| Authority checks | RLS + Policy Engine governance checks |
| Device checks | Integration Engine health monitoring |
