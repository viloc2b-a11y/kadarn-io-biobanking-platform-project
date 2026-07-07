export interface OperationalFootprintOption {
  readonly value: string
  readonly label: string
}

export interface OperationalFootprintGroup {
  readonly id: string
  readonly label: string
  readonly options: readonly string[]
}

export const PRIMARY_COVERAGE_OPTIONS = [
  'Single City',
  'Metropolitan Area',
  'Multi-City',
  'Statewide',
  'Multi-State',
  'National',
  'International',
] as const

export const LEGACY_GEOGRAPHIC_REACH_BY_COVERAGE: Record<string, string> = {
  'Single City': 'local',
  'Metropolitan Area': 'regional',
  'Multi-City': 'regional',
  Statewide: 'statewide',
  'Multi-State': 'multi_state',
  National: 'national',
  International: 'international',
}

export const US_STATE_OPTIONS = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'Other Province / Region',
] as const

export const COUNTRY_OPTIONS = [
  'United States',
  'Canada',
  'Mexico',
  'Brazil',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Portugal',
  'Italy',
  'Netherlands',
  'China',
  'Japan',
  'South Korea',
  'India',
  'Australia',
  'Other',
] as const

export const RECRUITMENT_REACH_OPTIONS = [
  'Local community',
  'Regional referrals',
  'Statewide referrals',
  'National referrals',
  'International referrals',
  'Digital recruitment',
  'Physician referral network',
  'Community partnerships',
] as const

export const SAMPLE_LOGISTICS_OPTIONS = [
  'On-site only',
  'Satellite clinics',
  'Mobile collection',
  'Home collection',
  'National collection network',
  'International collection network',
] as const

export const OPERATIONAL_ASSET_OPTIONS = [
  'Multiple research sites',
  'Satellite clinics',
  'Partner practices',
  'Mobile units',
  'Central laboratory',
  'Local laboratory',
  'Processing center',
  'Biobank',
  'Imaging center',
] as const

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'Mandarin',
  'Arabic',
  'German',
  'Japanese',
  'Korean',
  'Russian',
  'Italian',
  'Other',
] as const

export const TIME_ZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Other',
] as const
