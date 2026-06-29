# Kadarn Integration Reference
**Version:** 1.0

## Integration Pattern
Kadarn uses event ingestion — not API calls — to integrate with external systems.

## Integrated Systems
| System | Integration Type | Events Produced | Events Consumed |
|--------|-----------------|----------------|-----------------|
| LIMS | Webhook | SpecimenCollected, QCPassed | FulfillmentStarted |
| Courier API | Webhook | ShipmentPickedUp, TemperatureBreach | ShipmentScheduled |
| EHR | De-identified query | DataLinked | — |
