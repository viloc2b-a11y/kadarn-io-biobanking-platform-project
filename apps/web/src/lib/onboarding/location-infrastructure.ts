export const FACILITY_TYPE_OPTIONS = [
  'Primary Research Site',
  'Satellite Research Site',
  'Community Clinic',
  'Hospital',
  'Academic Medical Center',
  'Early Phase Unit',
  'Laboratory',
  'Central Laboratory',
  'Biobank',
  'Imaging Center',
  'Mobile Research Unit',
  'Partner Practice',
  'Other',
] as const

export const DEDICATED_RESEARCH_SPACE_OPTIONS = [
  'Dedicated research space',
  'Shared clinical and research space',
  'Minimal research space',
  'Not applicable',
] as const

export const BACKUP_POWER_OPTIONS = [
  'Generator + UPS',
  'Generator only',
  'UPS only',
  'No backup power',
  'Unknown',
] as const

export const STORAGE_EQUIPMENT_OPTIONS = [
  '-80C Freezer',
  '-20C Freezer',
  'Refrigerator (2-8C)',
  'Liquid Nitrogen Tank',
  'Ambient Storage',
  'Cold Room / Walk-in',
  'Other',
] as const

export const TEMPERATURE_MONITORING_OPTIONS = [
  'Continuous logging with alarms',
  'Continuous logging only',
  'Manual checks',
  'No temperature monitoring',
] as const

export const SHIPPING_CAPABILITY_OPTIONS = [
  'Domestic and international',
  'Domestic only',
  'Local courier only',
  'No shipping',
] as const

export const BIOSPECIMEN_OPERATION_OPTIONS = [
  'Collection',
  'Processing',
  'Storage',
  'Shipping',
  'Chain of custody',
  'None',
] as const

export interface LocationInfrastructure {
  locationId: string
  facilityType: string
  dedicatedResearchSpace: string
  examRooms: string
  infusionCapability: boolean
  procedureRooms: string
  overnightEarlyPhaseCapacity: boolean
  backupPower: string
  laboratoryPresent: boolean
  pharmacyPresent: boolean
  imagingPresent: boolean
  biospecimenProcessingPresent: boolean
  storageEquipment: string[]
  temperatureMonitoring: string
  shippingCapability: string
  biospecimenOperations: string[]
}

export function createLocationInfrastructure(locationId: string): LocationInfrastructure {
  return {
    locationId,
    facilityType: '',
    dedicatedResearchSpace: '',
    examRooms: '',
    infusionCapability: false,
    procedureRooms: '',
    overnightEarlyPhaseCapacity: false,
    backupPower: '',
    laboratoryPresent: false,
    pharmacyPresent: false,
    imagingPresent: false,
    biospecimenProcessingPresent: false,
    storageEquipment: [],
    temperatureMonitoring: '',
    shippingCapability: '',
    biospecimenOperations: [],
  }
}

export function normalizeLocationInfrastructure(
  locations: { id: string }[],
  infrastructure: LocationInfrastructure[],
): LocationInfrastructure[] {
  return locations.map((location) => {
    return infrastructure.find((item) => item.locationId === location.id) ?? createLocationInfrastructure(location.id)
  })
}
