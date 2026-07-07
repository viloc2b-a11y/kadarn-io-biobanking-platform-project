export const DOCUMENT_IMPORTANCE = {
  CRITICAL: 'Critical',
  RECOMMENDED: 'Recommended',
  OPTIONAL: 'Optional',
} as const

export type DocumentImportance = (typeof DOCUMENT_IMPORTANCE)[keyof typeof DOCUMENT_IMPORTANCE]

export interface CanonicalDocument {
  readonly title: string
  readonly importance: DocumentImportance
  readonly linkedEntity: string
  readonly linkedCapability: string
  readonly readinessImpact: string
  readonly passportImpact: string
  readonly expiration: string
  readonly version: string
}

export interface CanonicalDocumentDomain {
  readonly id: string
  readonly label: string
  readonly documents: readonly CanonicalDocument[]
}

function doc(
  title: string,
  importance: DocumentImportance,
  linkedEntity: string,
  linkedCapability: string,
  readinessImpact: string,
  passportImpact: string,
  expiration = 'Tracked when applicable',
  version = 'Latest uploaded version',
): CanonicalDocument {
  return { title, importance, linkedEntity, linkedCapability, readinessImpact, passportImpact, expiration, version }
}

const LEGAL = 'Legal existence'
const REGULATORY = 'Regulatory compliance'
const PERSONNEL = 'Personnel qualification'
const QUALITY = 'Quality system maturity'
const FACILITY = 'Facility readiness'
const LAB = 'Laboratory operations'
const EQUIPMENT = 'Equipment readiness'
const BIOSPECIMEN = 'Biospecimen operations'
const PHARMACY = 'Pharmacy operations'
const CLINICAL = 'Clinical operations'
const TECHNOLOGY = 'Technology readiness'
const FINANCIAL = 'Contracting readiness'
const EXPERIENCE = 'Research track record'
const COMMUNITY = 'Community engagement'
const SUPPORTING = 'Supporting evidence'

export const DOCUMENT_TAXONOMY = [
  {
    id: 'corporate-legal',
    label: 'Corporate & Legal',
    documents: [
      doc('Business Registration', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Corporate readiness', 'Legal entity evidence'),
      doc('Operating License', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Corporate readiness', 'Operating authority evidence'),
      doc('Certificate of Incorporation', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Corporate readiness', 'Legal entity evidence'),
      doc('Tax Registration', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Corporate readiness', 'Institution identity evidence'),
      doc('Certificate of Good Standing', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Corporate readiness', 'Current legal standing'),
      doc('Business Insurance', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Risk readiness', 'Insurance evidence', 'Expiration required'),
      doc('Professional Liability Insurance', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Risk readiness', 'Liability coverage evidence', 'Expiration required'),
      doc('General Liability Insurance', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Risk readiness', 'Liability coverage evidence', 'Expiration required'),
      doc('Workers Compensation', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', LEGAL, 'Operational readiness', 'Employment coverage evidence', 'Expiration required'),
      doc('Organizational Chart', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', 'Governance', 'Governance readiness', 'Organization structure evidence'),
      doc('Ownership Structure', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', 'Governance', 'Governance readiness', 'Ownership evidence'),
      doc('Leases', DOCUMENT_IMPORTANCE.OPTIONAL, 'Locations', FACILITY, 'Facility readiness', 'Location control evidence', 'Expiration required'),
    ],
  },
  {
    id: 'regulatory',
    label: 'Regulatory',
    documents: [
      doc('IRB Registration', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Regulatory readiness', 'Ethics oversight evidence'),
      doc('IRB Approval Letters', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Regulatory readiness', 'Protocol oversight evidence'),
      doc('FWA Registration', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Regulatory readiness', 'Federal assurance evidence'),
      doc('State Research Licenses', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Jurisdiction readiness', 'Research authorization evidence', 'Expiration required'),
      doc('DEA Registration', DOCUMENT_IMPORTANCE.CRITICAL, 'People', REGULATORY, 'Controlled substance readiness', 'DEA evidence', 'Expiration required'),
      doc('Controlled Substance License', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', REGULATORY, 'Controlled substance readiness', 'Controlled substance evidence', 'Expiration required'),
      doc('Radiation License', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', REGULATORY, 'Imaging readiness', 'Radiation safety evidence', 'Expiration required'),
      doc('IBC Approval', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', REGULATORY, 'Biosafety readiness', 'IBC evidence'),
      doc('CAP Accreditation', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Laboratory readiness', 'CAP evidence', 'Expiration required'),
      doc('CLIA Certificate', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Laboratory readiness', 'CLIA evidence', 'Expiration required'),
      doc('Clinical Laboratory License', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Laboratory readiness', 'Lab licensure evidence', 'Expiration required'),
      doc('Medical Waste Disposal Agreement', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', REGULATORY, 'Facility readiness', 'Waste handling evidence', 'Expiration required'),
      doc('HIPAA Policies', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Privacy readiness', 'Privacy control evidence'),
      doc('Privacy Policies', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', REGULATORY, 'Privacy readiness', 'Privacy control evidence'),
    ],
  },
  {
    id: 'personnel',
    label: 'Personnel',
    documents: [
      doc('Medical Licenses', DOCUMENT_IMPORTANCE.CRITICAL, 'People', PERSONNEL, 'Personnel readiness', 'Provider qualification evidence', 'Expiration required'),
      doc('CVs', DOCUMENT_IMPORTANCE.CRITICAL, 'People', PERSONNEL, 'Personnel readiness', 'Staff qualification evidence'),
      doc('GCP Certificates', DOCUMENT_IMPORTANCE.CRITICAL, 'People', PERSONNEL, 'Operational readiness', 'GCP training evidence', 'Expiration required'),
      doc('HSP Certificates', DOCUMENT_IMPORTANCE.CRITICAL, 'People', PERSONNEL, 'Human subject readiness', 'HSP training evidence', 'Expiration required'),
      doc('IATA Certificates', DOCUMENT_IMPORTANCE.CRITICAL, 'People', BIOSPECIMEN, 'Logistics readiness', 'Shipping training evidence', 'Expiration required'),
      doc('SOCRA', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Personnel readiness', 'Professional certification evidence', 'Expiration required'),
      doc('ACRP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Personnel readiness', 'Professional certification evidence', 'Expiration required'),
      doc('Medical Board Certifications', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Personnel readiness', 'Specialty qualification evidence', 'Expiration required'),
      doc('Nursing Licenses', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Personnel readiness', 'Nursing qualification evidence', 'Expiration required'),
      doc('DEA Registrations', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', REGULATORY, 'Controlled substance readiness', 'DEA evidence', 'Expiration required'),
      doc('Training Records', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Training readiness', 'Training coverage evidence'),
      doc('Competency Assessments', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Training readiness', 'Competency evidence'),
      doc('Vaccination Requirements', DOCUMENT_IMPORTANCE.OPTIONAL, 'People', PERSONNEL, 'Workforce readiness', 'Staff health evidence'),
    ],
  },
  {
    id: 'quality-system',
    label: 'Quality System',
    documents: [
      doc('Quality Manual', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', QUALITY, 'Quality readiness', 'Quality system evidence'),
      doc('SOP Master Index', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', QUALITY, 'Quality readiness', 'SOP coverage evidence'),
      doc('SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', QUALITY, 'Quality readiness', 'Procedure evidence'),
      doc('CAPA', DOCUMENT_IMPORTANCE.CRITICAL, 'Institution', QUALITY, 'Quality readiness', 'CAPA system evidence'),
      doc('Deviation Logs', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Quality readiness', 'Deviation management evidence'),
      doc('Audit Reports', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Quality readiness', 'Audit evidence'),
      doc('Inspection Reports', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Inspection readiness', 'Inspection history evidence'),
      doc('Corrective Actions', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Quality readiness', 'Corrective action evidence'),
      doc('Preventive Actions', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Quality readiness', 'Preventive action evidence'),
      doc('Risk Assessments', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Risk readiness', 'Risk control evidence'),
      doc('Training Matrix', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', PERSONNEL, 'Training readiness', 'Training coverage evidence'),
      doc('Document Control Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Document readiness', 'Document control evidence'),
      doc('Version Control Records', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', QUALITY, 'Document readiness', 'Version evidence'),
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities',
    documents: [
      doc('Floor Plans', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Facility layout evidence'),
      doc('Facility Photos', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Facility visual evidence'),
      doc('Emergency Plans', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Operational readiness', 'Emergency preparedness evidence'),
      doc('Fire Inspection', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Safety readiness', 'Fire safety evidence', 'Expiration required'),
      doc('Occupancy Certificate', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Occupancy evidence', 'Expiration required'),
      doc('Backup Generator Documentation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Continuity readiness', 'Backup power evidence'),
      doc('Environmental Monitoring', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Environment monitoring evidence'),
      doc('Cleaning Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Cleaning control evidence'),
      doc('Maintenance Logs', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Facility readiness', 'Maintenance evidence'),
      doc('Security Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Security readiness', 'Security control evidence'),
      doc('Access Control', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', FACILITY, 'Security readiness', 'Access control evidence'),
    ],
  },
  {
    id: 'laboratory',
    label: 'Laboratory',
    documents: [
      doc('CLIA', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Laboratory readiness', 'CLIA evidence', 'Expiration required'),
      doc('Laboratory SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Laboratory readiness', 'Lab procedure evidence'),
      doc('Equipment Calibration', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Calibration evidence', 'Expiration required'),
      doc('Equipment Maintenance', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Maintenance evidence'),
      doc('Temperature Logs', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', BIOSPECIMEN, 'Cold chain readiness', 'Temperature evidence'),
      doc('Freezer Qualification', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', BIOSPECIMEN, 'Cold chain readiness', 'Freezer qualification evidence'),
      doc('Refrigerator Qualification', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', BIOSPECIMEN, 'Cold chain readiness', 'Refrigerator qualification evidence'),
      doc('Validation Reports', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Validation readiness', 'Validation evidence'),
      doc('QC Records', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', LAB, 'Quality readiness', 'QC evidence'),
      doc('Reference Range Validation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Laboratories', LAB, 'Validation readiness', 'Reference range evidence'),
      doc('Chain of Custody SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Laboratories', BIOSPECIMEN, 'Traceability readiness', 'Chain of custody evidence'),
      doc('Specimen Processing SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Laboratories', BIOSPECIMEN, 'Processing readiness', 'Processing SOP evidence'),
      doc('Shipping SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Laboratories', BIOSPECIMEN, 'Shipping readiness', 'Shipping SOP evidence'),
      doc('Laboratory Certifications', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Laboratories', LAB, 'Laboratory readiness', 'Lab certification evidence', 'Expiration required'),
    ],
  },
  {
    id: 'equipment',
    label: 'Equipment',
    documents: [
      doc('Equipment Inventory', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Inventory evidence'),
      doc('IQ', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Qualification readiness', 'Installation qualification evidence'),
      doc('OQ', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Qualification readiness', 'Operational qualification evidence'),
      doc('PQ', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Qualification readiness', 'Performance qualification evidence'),
      doc('Calibration Records', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Calibration evidence', 'Expiration required'),
      doc('Maintenance Records', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Maintenance evidence'),
      doc('Service Contracts', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Continuity readiness', 'Service evidence', 'Expiration required'),
      doc('Preventive Maintenance', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Preventive maintenance evidence'),
      doc('Equipment Manuals', DOCUMENT_IMPORTANCE.OPTIONAL, 'Equipment', EQUIPMENT, 'Equipment readiness', 'Manual evidence'),
      doc('Qualification Certificates', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', EQUIPMENT, 'Qualification readiness', 'Qualification evidence', 'Expiration required'),
    ],
  },
  {
    id: 'biospecimen-operations',
    label: 'Biospecimen Operations',
    documents: [
      doc('Collection SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', BIOSPECIMEN, 'Collection readiness', 'Collection procedure evidence'),
      doc('Processing SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Laboratories', BIOSPECIMEN, 'Processing readiness', 'Processing procedure evidence'),
      doc('Storage SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', BIOSPECIMEN, 'Storage readiness', 'Storage procedure evidence'),
      doc('Shipping SOPs', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', BIOSPECIMEN, 'Shipping readiness', 'Shipping procedure evidence'),
      doc('Chain of Custody', DOCUMENT_IMPORTANCE.CRITICAL, 'Locations', BIOSPECIMEN, 'Traceability readiness', 'Chain of custody evidence'),
      doc('Temperature Excursion Logs', DOCUMENT_IMPORTANCE.CRITICAL, 'Equipment', BIOSPECIMEN, 'Cold chain readiness', 'Excursion evidence'),
      doc('Specimen Tracking Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', BIOSPECIMEN, 'Traceability readiness', 'Tracking evidence'),
      doc('Freezer Maps', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', BIOSPECIMEN, 'Storage readiness', 'Freezer map evidence'),
      doc('Shipping Validation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', BIOSPECIMEN, 'Shipping readiness', 'Shipping validation evidence'),
      doc('Packaging Validation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', BIOSPECIMEN, 'Shipping readiness', 'Packaging validation evidence'),
      doc('Dry Ice Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', BIOSPECIMEN, 'Cold chain readiness', 'Dry ice procedure evidence'),
      doc('Biobank Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', BIOSPECIMEN, 'Biobank readiness', 'Biobank procedure evidence'),
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    documents: [
      doc('Drug Accountability SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', PHARMACY, 'Pharmacy readiness', 'Drug accountability evidence'),
      doc('Temperature Logs', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Equipment', PHARMACY, 'Pharmacy readiness', 'Temperature evidence'),
      doc('Controlled Drug Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', PHARMACY, 'Controlled drug readiness', 'Controlled drug evidence'),
      doc('IP Storage Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', PHARMACY, 'IP readiness', 'IP storage evidence'),
      doc('Dispensing SOPs', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', PHARMACY, 'Dispensing readiness', 'Dispensing evidence'),
      doc('Drug Destruction Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Locations', PHARMACY, 'Destruction readiness', 'Drug destruction evidence'),
    ],
  },
  {
    id: 'clinical-operations',
    label: 'Clinical Operations',
    documents: [
      doc('Recruitment SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Recruitment readiness', 'Recruitment procedure evidence'),
      doc('Source Documentation SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Documentation readiness', 'Source documentation evidence'),
      doc('AE Reporting SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Safety readiness', 'AE reporting evidence'),
      doc('SAE Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Safety readiness', 'SAE procedure evidence'),
      doc('Informed Consent SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Consent readiness', 'Consent procedure evidence'),
      doc('Protocol Deviation SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Quality readiness', 'Deviation procedure evidence'),
      doc('Visit Management SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Operational readiness', 'Visit management evidence'),
      doc('Monitoring Visit SOP', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', CLINICAL, 'Monitoring readiness', 'Monitoring procedure evidence'),
      doc('Delegation Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', CLINICAL, 'Delegation readiness', 'Delegation evidence'),
      doc('Enrollment Metrics', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Performance readiness', 'Enrollment evidence'),
    ],
  },
  {
    id: 'technology',
    label: 'Technology',
    documents: [
      doc('EMR Documentation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Technology readiness', 'EMR evidence'),
      doc('CTMS Documentation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Technology readiness', 'CTMS evidence'),
      doc('eSource Documentation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Technology readiness', 'eSource evidence'),
      doc('EDC Platforms', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Technology readiness', 'EDC evidence'),
      doc('System Validation', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Validation readiness', 'System validation evidence'),
      doc('Cybersecurity Policies', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Security readiness', 'Cybersecurity evidence'),
      doc('Backup Procedures', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Continuity readiness', 'Backup evidence'),
      doc('Disaster Recovery Plan', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', TECHNOLOGY, 'Continuity readiness', 'Disaster recovery evidence'),
    ],
  },
  {
    id: 'financial-contracts',
    label: 'Financial & Contracts',
    documents: [
      doc('Sample Agreements', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', FINANCIAL, 'Contracting readiness', 'Agreement evidence'),
      doc('Master Service Agreements', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', FINANCIAL, 'Contracting readiness', 'MSA evidence'),
      doc('Vendor Agreements', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', FINANCIAL, 'Vendor readiness', 'Vendor agreement evidence'),
      doc('Insurance Certificates', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', LEGAL, 'Risk readiness', 'Insurance evidence', 'Expiration required'),
      doc('Financial Policies', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', FINANCIAL, 'Financial readiness', 'Financial policy evidence'),
    ],
  },
  {
    id: 'research-experience',
    label: 'Research Experience',
    documents: [
      doc('Site Profile', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Sponsor readiness', 'Site profile evidence'),
      doc('Study History', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Experience readiness', 'Study history evidence'),
      doc('Inspection History', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Inspection readiness', 'Inspection history evidence'),
      doc('Publication List', DOCUMENT_IMPORTANCE.RECOMMENDED, 'People', EXPERIENCE, 'Academic readiness', 'Publication evidence'),
      doc('Sponsor References', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Sponsor readiness', 'Reference evidence'),
      doc('Performance Metrics', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', EXPERIENCE, 'Performance readiness', 'Metric evidence'),
    ],
  },
  {
    id: 'community-outreach',
    label: 'Community & Outreach',
    documents: [
      doc('Community Partnerships', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', COMMUNITY, 'Community readiness', 'Partnership evidence'),
      doc('Referral Agreements', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', COMMUNITY, 'Recruitment readiness', 'Referral evidence'),
      doc('Recruitment Networks', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', COMMUNITY, 'Recruitment readiness', 'Network evidence'),
      doc('Patient Advocacy Programs', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', COMMUNITY, 'Community readiness', 'Advocacy evidence'),
      doc('Community Events', DOCUMENT_IMPORTANCE.RECOMMENDED, 'Institution', COMMUNITY, 'Community readiness', 'Event evidence'),
    ],
  },
  {
    id: 'optional-supporting-evidence',
    label: 'Optional Supporting Evidence',
    documents: [
      doc('Photos', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Visual evidence'),
      doc('Videos', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Video evidence'),
      doc('Brochures', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Marketing evidence'),
      doc('Institution Presentation', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Presentation evidence'),
      doc('Awards', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Recognition evidence'),
      doc('Press Releases', DOCUMENT_IMPORTANCE.OPTIONAL, 'Institution', SUPPORTING, 'Supporting context', 'Public evidence'),
      doc('Publications', DOCUMENT_IMPORTANCE.OPTIONAL, 'People', EXPERIENCE, 'Academic readiness', 'Publication evidence'),
    ],
  },
] as const satisfies readonly CanonicalDocumentDomain[]
