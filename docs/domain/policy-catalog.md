# Kadarn Policy Catalog
**Version:** 1.0

## Purpose
Catalog of all declarative policies in the system. Policies are defined in the `policies` table (migration 013) and evaluated by the Policy Engine.

## Policy Index
| Name | Domain | Status | Description |
|------|--------|--------|-------------|
| Oncology Use Only | governance | active | Specimens under oncology IRB restricted to oncology research |
| High-Value Shipment Authorization | financial | active | Shipments >$10,000 require dual authorization |
| Minimum Trust Score | operational | active | Only route to orgs with trust >= 0.7 |
