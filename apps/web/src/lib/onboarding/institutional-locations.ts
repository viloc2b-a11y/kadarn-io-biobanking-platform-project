export const LOCATION_TYPE_OPTIONS = [
  'Headquarters',
  'Primary Research Site',
  'Satellite Research Site',
  'Community Clinic',
  'Hospital',
  'Academic Medical Center',
  'Early Phase Unit',
  'Laboratory',
  'Central Laboratory',
  'Biobank',
  'Pharmacy',
  'Imaging Center',
  'Mobile Research Unit',
  'Administrative Office',
  'Partner Practice',
  'Other',
] as const

export type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]

export interface InstitutionalLocation {
  id: string
  name: string
  type: LocationType | ''
  street: string
  city: string
  state: string
  country: string
  zip: string
  timeZone: string
  isPrimary: boolean
}

export function createInstitutionalLocation(index: number): InstitutionalLocation {
  return {
    id: index === 0 ? 'location-primary' : `location-${Date.now()}-${index}`,
    name: index === 0 ? 'Main Research Site' : '',
    type: index === 0 ? 'Primary Research Site' : '',
    street: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    timeZone: '',
    isPrimary: index === 0,
  }
}

export function getPrimaryLocation(locations: InstitutionalLocation[]): InstitutionalLocation | null {
  return locations.find((location) => location.isPrimary) ?? locations[0] ?? null
}

export function normalizeLocations(locations: InstitutionalLocation[]): InstitutionalLocation[] {
  if (locations.length === 0) return [createInstitutionalLocation(0)]

  const primaryIndex = locations.findIndex((location) => location.isPrimary)
  const effectivePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0

  return locations.map((location, index) => ({
    ...location,
    isPrimary: index === effectivePrimaryIndex,
  }))
}
