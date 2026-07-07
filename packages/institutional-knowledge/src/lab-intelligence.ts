// ==========================================================================
// Sprint A2 — Laboratory & Biospecimen Intelligence
// ==========================================================================
// Extiende los dominios Laboratory + Biospecimen existentes.
// Cruza ambos en una capa de inteligencia operacional.
// El corazón operativo de Kadarn.
// ==========================================================================

import {
  SPECIMEN_TYPES, STORAGE_CONDITIONS, EQUIPMENT_CATEGORIES,
  LABORATORY_TECHNIQUES, CAPABILITY_TYPES,
  type SpecimenTypeKey, type StorageConditionKey,
  type EquipmentCategoryKey, type LaboratoryTechniqueKey, type CapabilityTypeKey,
} from '../taxonomy'

// ==========================================================================
// COLD CHAIN — Storage Intelligence
// ==========================================================================

export interface StorageUnit {
  unitId: string
  labId: string
  equipmentType: EquipmentCategoryKey
  label: string
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  installedAt: string
  lastQualifiedAt: string | null
  nextQualificationDue: string | null
  temperatureRange: { min: number; max: number; unit: 'C' }
  capacity: { total: number; used: number; unit: 'positions' | 'liters' | 'cubic_feet' }
  redundancy: 'none' | 'n_plus_1' | '2n' | 'geo_redundant'
  monitoring: TemperatureMonitoring
  specimens: StoredSpecimen[]
  status: 'operational' | 'maintenance' | 'out_of_service' | 'decommissioned'
}

export interface TemperatureMonitoring {
  monitored: boolean
  continuousLogging: boolean
  alarmSystem: boolean
  backupPower: boolean
  lastValidatedAt: string | null
  excursionsLast90Days: number
  meanTimeBetweenExcursionsHours: number | null
  excursionResponseTimeMinutes: number | null
  recentExcursions: TemperatureExcursion[]
}

export interface TemperatureExcursion {
  occurredAt: string
  durationMinutes: number
  minTemp: number
  maxTemp: number
  resolved: boolean
  resolvedAt: string | null
  impactedSpecimens: string[]
  rootCause: string | null
}

export interface StoredSpecimen {
  specimenId: string
  specimenType: SpecimenTypeKey
  studyId: string | null
  collectionDate: string
  storageStartDate: string
  position: string | null
  aliquots: number
  status: 'stored' | 'reserved' | 'shipped' | 'discarded' | 'thawed'
}

// ==========================================================================
// PROCESSING — Workflow Intelligence
// ==========================================================================

export interface ProcessingWorkflow {
  workflowId: string
  labId: string
  name: string
  specimenTypes: SpecimenTypeKey[]
  steps: ProcessingStep[]
  automationLevel: 'manual' | 'semi_automated' | 'automated'
  throughput: { perDay: number; perWeek: number; unit: 'samples' | 'aliquots' }
  currentUtilization: number  // 0-100 percent
  bottleneckStep: string | null
  requiredEquipment: EquipmentCategoryKey[]
  requiredPersonnel: { role: string; count: number }[]
}

export interface ProcessingStep {
  order: number
  technique: LaboratoryTechniqueKey
  description: string
  estimatedMinutes: number
  equipmentNeeded: EquipmentCategoryKey[]
  qualityCheck: boolean
  criticalControlPoint: boolean
}

// ==========================================================================
// SPECIMEN INTELLIGENCE — Extended model per specimen type
// ==========================================================================

export interface SpecimenIntelligence {
  specimenType: SpecimenTypeKey
  label: string
  collectionRequirements: {
    tubeType: string | null
    anticoagulant: string | null
    minimumVolume: string | null
    fastingRequired: boolean
    specialHandling: string | null
  }
  processingMethods: {
    technique: LaboratoryTechniqueKey
    timeWindowHours: number | null  // must process within X hours
    temperatureRequirement: StorageConditionKey
  }[]
  storageRequirements: {
    shortTerm: StorageConditionKey | null     // < 72 hours
    longTerm: StorageConditionKey | null       // > 72 hours
    maxStorageDurationMonths: number | null
    freezeThawStability: 'stable' | 'limited' | 'single_use' | 'unknown'
  }
  shippingRequirements: {
    temperature: StorageConditionKey
    maxTransitHours: number
    requiresDryIce: boolean
    requiresLN2: boolean
    iataClassification: string | null
  }
  qualityMetrics: {
    minimumViability: number | null    // e.g. 85% for PBMC
    requiredRIN: number | null         // e.g. 7.0 for RNA
    requiredPurity: string | null       // e.g. OD260/280 1.8-2.0 for DNA
  }
}

// ==========================================================================
// INVENTORY — Cross-storage view
// ==========================================================================

export interface LabInventory {
  labId: string
  totalStorageUnits: number
  operationalUnits: number
  bySpecimenType: Record<string, {
    totalUnits: number
    availableUnits: number
    reservedUnits: number
    oldestUnitDate: string | null
    averageAgeDays: number
  }>
  byStorageUnit: Record<string, {
    fillPercentage: number
    specimensCount: number
    aliquotCount: number
  }>
  totalSpecimens: number
  totalAliquots: number
  capacityUtilization: number // 0-100
}

// ==========================================================================
// CHAIN OF CUSTODY
// ==========================================================================

export interface CustodyEvent {
  eventId: string
  specimenId: string
  eventType: 'collected' | 'received' | 'processed' | 'aliquoted' | 'stored' | 'retrieved' | 'shipped' | 'received_by_destination' | 'discarded' | 'thawed'
  occurredAt: string
  performedBy: string | null
  location: string | null   // free-text: "Freezer A, Shelf 3, Rack 12"
  temperatureAtEvent: number | null
  notes: string | null
}

export interface ChainOfCustody {
  specimenId: string
  events: CustodyEvent[]
  isComplete: boolean         // collected → final disposition
  hasBreaches: boolean        // any custody gap or unauthorized access
  breaches: CustodyBreach[]
  digitalTrackingEnabled: boolean
}

export interface CustodyBreach {
  breachId: string
  detectedAt: string
  description: string
  severity: 'critical' | 'major' | 'minor'
  resolved: boolean
  resolvedAt: string | null
}

// ==========================================================================
// SHIPPING INTELLIGENCE
// ==========================================================================

export interface ShippingCapability {
  labId: string
  domesticCapability: boolean
  internationalCapability: boolean
  iataCertifiedStaff: number
  preferredCarriers: string[]
  averageProcessingTimeHours: number
  dryIceCapacity: boolean
  liquidNitrogenCapacity: boolean
  ambientShipping: boolean
  refrigeratedShipping: boolean
  frozenShipping: boolean
  temperatureMonitoredShipments: boolean
  recentShipments: ShipmentRecord[]
}

export interface ShipmentRecord {
  shipmentId: string
  destination: string
  shippedAt: string
  receivedAt: string | null
  specimenCount: number
  temperatureRegime: StorageConditionKey
  temperatureExcursion: boolean
  onTime: boolean
}

// ==========================================================================
// LAB PROFILE — Unified view of a lab
// ==========================================================================

export interface LabProfile {
  labId: string
  institutionId: string
  name: string
  labType: string
  facilityId: string | null
  areas: LabArea[]
  storageUnits: StorageUnit[]
  workflows: ProcessingWorkflow[]
  inventory: LabInventory
  chainOfCustody: { totalSpecimens: number; digitallyTracked: number; breachesLast90Days: number }
  shipping: ShippingCapability
  equipment: LabEquipment[]
  status: 'operational' | 'maintenance' | 'expansion' | 'closure'
  capacityDashboard: LabCapacityDashboard
  risks: LabRisk[]
}

export interface LabArea {
  areaId: string
  type: 'collection' | 'processing' | 'storage' | 'analysis' | 'office' | 'shipping' | 'other'
  name: string
  squareFeet: number | null
  biosafetyLevel: 'BSL-1' | 'BSL-2' | 'BSL-2+' | 'BSL-3' | null
}

export interface LabEquipment {
  equipmentId: string
  category: EquipmentCategoryKey
  name: string
  status: 'operational' | 'maintenance' | 'out_of_service'
  lastQualifiedAt: string | null
  nextQualificationDue: string | null
  calibrationDue: string | null
  preventiveMaintenanceDue: string | null
}

export interface LabCapacityDashboard {
  storageUtilization: number     // 0-100
  processingUtilization: number  // 0-100
  staffingAdequacy: number       // 0-100
  equipmentAvailability: number  // 0-100
  overallCapacityScore: number   // 0-100
}

// ==========================================================================
// RISK DETECTION
// ==========================================================================

export interface LabRisk {
  riskType: 'capacity_risk' | 'temperature_risk' | 'storage_gap' | 'equipment_dependency' | 'workflow_bottleneck' | 'qualification_overdue' | 'calibration_overdue' | 'cold_chain_breach' | 'staffing_shortage' | 'specimen_stability' | 'shipping_gap'
  labId: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  affectedUnitId: string | null
  affectedWorkflowId: string | null
  recommendedAction: string
  detectedAt: string
}

export function detectLabRisks(profile: LabProfile): LabRisk[] {
  const risks: LabRisk[] = []
  const now = new Date().toISOString()

  // Capacity risks
  for (const unit of profile.storageUnits) {
    if (unit.capacity.total > 0) {
      const fillPct = (unit.capacity.used / unit.capacity.total) * 100
      if (fillPct > 90) {
        risks.push({
          riskType: 'capacity_risk', labId: profile.labId,
          severity: fillPct > 95 ? 'critical' : 'high',
          description: `${unit.label} is at ${Math.round(fillPct)}% capacity (${unit.capacity.used}/${unit.capacity.total} ${unit.capacity.unit}).`,
          affectedUnitId: unit.unitId, affectedWorkflowId: null,
          recommendedAction: `Expand storage capacity or archive specimens from ${unit.label}.`,
          detectedAt: now,
        })
      }
    }
  }

  // Temperature risks
  for (const unit of profile.storageUnits) {
    if (unit.monitoring.excursionsLast90Days > 2) {
      risks.push({
        riskType: 'temperature_risk', labId: profile.labId,
        severity: unit.monitoring.excursionsLast90Days > 5 ? 'critical' : 'high',
        description: `${unit.label} had ${unit.monitoring.excursionsLast90Days} temperature excursions in the last 90 days.`,
        affectedUnitId: unit.unitId, affectedWorkflowId: null,
        recommendedAction: `Investigate root cause and service ${unit.label}. Verify specimen integrity.`,
        detectedAt: now,
      })
    }
    if (!unit.monitoring.backupPower) {
      risks.push({
        riskType: 'temperature_risk', labId: profile.labId,
        severity: 'high',
        description: `${unit.label} has no backup power — specimens at risk during outages.`,
        affectedUnitId: unit.unitId, affectedWorkflowId: null,
        recommendedAction: `Install backup power or UPS for ${unit.label}.`,
        detectedAt: now,
      })
    }
  }

  // Storage redundancy gap
  const criticalStorage = profile.storageUnits.filter((u) => u.status === 'operational')
  const hasRedundancy = criticalStorage.some((u) => u.redundancy !== 'none')
  if (!hasRedundancy && criticalStorage.length > 0) {
    risks.push({
      riskType: 'storage_gap', labId: profile.labId,
      severity: 'high',
      description: 'No storage units have redundancy (n+1, 2n, or geo-redundant). Single point of failure.',
      affectedUnitId: null, affectedWorkflowId: null,
      recommendedAction: 'Add redundant storage capacity or implement geo-redundant backup.',
      detectedAt: now,
    })
  }

  // Equipment dependencies
  for (const wf of profile.workflows) {
    const requiredEquipment = wf.requiredEquipment
    const availableEquipment = new Set(profile.equipment.map((e) => e.category))
    for (const eq of requiredEquipment) {
      if (!availableEquipment.has(eq)) {
        risks.push({
          riskType: 'equipment_dependency', labId: profile.labId,
          severity: 'high',
          description: `Workflow "${wf.name}" requires ${eq} but no operational equipment found.`,
          affectedUnitId: null, affectedWorkflowId: wf.workflowId,
          recommendedAction: `Acquire or qualify ${eq} equipment for workflow ${wf.name}.`,
          detectedAt: now,
        })
      }
    }
  }

  // Workflow bottlenecks
  for (const wf of profile.workflows) {
    if (wf.bottleneckStep) {
      risks.push({
        riskType: 'workflow_bottleneck', labId: profile.labId,
        severity: 'medium',
        description: `Workflow "${wf.name}" has bottleneck at step "${wf.bottleneckStep}".`,
        affectedUnitId: null, affectedWorkflowId: wf.workflowId,
        recommendedAction: `Optimize or parallelize step "${wf.bottleneckStep}" in workflow ${wf.name}.`,
        detectedAt: now,
      })
    }
  }

  // Qualification overdue
  for (const unit of profile.storageUnits) {
    if (unit.nextQualificationDue && new Date(unit.nextQualificationDue) < new Date()) {
      risks.push({
        riskType: 'qualification_overdue', labId: profile.labId,
        severity: 'high',
        description: `${unit.label} qualification is overdue (due: ${unit.nextQualificationDue}).`,
        affectedUnitId: unit.unitId, affectedWorkflowId: null,
        recommendedAction: `Schedule qualification for ${unit.label}.`,
        detectedAt: now,
      })
    }
  }

  // Calibration overdue on equipment
  for (const eq of profile.equipment) {
    if (eq.calibrationDue && new Date(eq.calibrationDue) < new Date()) {
      risks.push({
        riskType: 'calibration_overdue', labId: profile.labId,
        severity: 'medium',
        description: `${eq.name} calibration overdue (due: ${eq.calibrationDue}).`,
        affectedUnitId: null, affectedWorkflowId: null,
        recommendedAction: `Calibrate ${eq.name}.`,
        detectedAt: now,
      })
    }
  }

  // Cold chain breach
  const custodyBreaches = profile.chainOfCustody.breachesLast90Days
  if (custodyBreaches > 0) {
    risks.push({
      riskType: 'cold_chain_breach', labId: profile.labId,
      severity: 'high',
      description: `${custodyBreaches} chain of custody breaches in the last 90 days.`,
      affectedUnitId: null, affectedWorkflowId: null,
      recommendedAction: 'Review custody procedures and access controls.',
      detectedAt: now,
    })
  }

  // Staffing shortage
  if (profile.capacityDashboard.staffingAdequacy < 60) {
    risks.push({
      riskType: 'staffing_shortage', labId: profile.labId,
      severity: 'high',
      description: `Staffing adequacy at ${profile.capacityDashboard.staffingAdequacy}% — below operational threshold.`,
      affectedUnitId: null, affectedWorkflowId: null,
      recommendedAction: 'Hire or reassign staff to maintain operational capacity.',
      detectedAt: now,
    })
  }

  // Shipping gap: no international capability but has international studies
  if (!profile.shipping.internationalCapability) {
    // Only flag if there's a hint of international studies
    const hasInternational = profile.shipping.recentShipments.some((s) =>
      s.destination.includes('International') || s.temperatureRegime === 'ln2_vapor'
    )
    if (false) { // Placeholder — would need study data to trigger
      risks.push({
        riskType: 'shipping_gap', labId: profile.labId,
        severity: 'medium',
        description: 'No international shipping capability documented.',
        affectedUnitId: null, affectedWorkflowId: null,
        recommendedAction: 'Establish IATA-certified international shipping capability.',
        detectedAt: now,
      })
    }
  }

  return risks
}

// ==========================================================================
// DASHBOARD
// ==========================================================================

export interface LabDashboardState {
  institutionId: string
  totalLabs: number
  operationalLabs: number
  storageSummary: {
    totalUnits: number
    operationalUnits: number
    totalCapacity: number
    usedCapacity: number
    overallUtilization: number
  }
  processingSummary: {
    totalWorkflows: number
    automatedWorkflows: number
    averageUtilization: number
  }
  specimenSummary: {
    totalSpecimens: number
    totalAliquots: number
    topTypes: { type: SpecimenTypeKey; count: number }[]
  }
  risks: LabRisk[]
  criticalRisks: LabRisk[]
  capacityAlerts: LabRisk[]
}

export function buildLabDashboard(profiles: LabProfile[]): LabDashboardState {
  const now = new Date().toISOString()
  const operational = profiles.filter((p) => p.status === 'operational')
  const allRisks: LabRisk[] = []

  let totalUnits = 0, operationalUnits = 0, totalCap = 0, usedCap = 0
  let totalWorkflows = 0, automatedWorkflows = 0, totalUtilization = 0
  let totalSpecimens = 0, totalAliquots = 0
  const typeCounts: Record<string, number> = {}

  for (const p of profiles) {
    allRisks.push(...detectLabRisks(p))
    totalUnits += p.storageUnits.length
    operationalUnits += p.storageUnits.filter((u) => u.status === 'operational').length
    for (const u of p.storageUnits) {
      totalCap += u.capacity.total
      usedCap += u.capacity.used
    }
    totalWorkflows += p.workflows.length
    automatedWorkflows += p.workflows.filter((w) => w.automationLevel === 'automated').length
    for (const w of p.workflows) totalUtilization += w.currentUtilization
    totalSpecimens += p.inventory.totalSpecimens
    totalAliquots += p.inventory.totalAliquots
    for (const [type, data] of Object.entries(p.inventory.bySpecimenType)) {
      typeCounts[type] = (typeCounts[type] ?? 0) + data.totalUnits
    }
  }

  const n = profiles.length || 1
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type: type as SpecimenTypeKey, count }))

  return {
    institutionId: profiles[0]?.institutionId ?? '',
    totalLabs: profiles.length,
    operationalLabs: operational.length,
    storageSummary: {
      totalUnits, operationalUnits, totalCapacity: totalCap, usedCapacity: usedCap,
      overallUtilization: totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0,
    },
    processingSummary: {
      totalWorkflows, automatedWorkflows,
      averageUtilization: totalWorkflows > 0 ? Math.round(totalUtilization / totalWorkflows) : 0,
    },
    specimenSummary: { totalSpecimens, totalAliquots, topTypes },
    risks: allRisks.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 }
      return sev[a.severity] - sev[b.severity]
    }),
    criticalRisks: allRisks.filter((r) => r.severity === 'critical'),
    capacityAlerts: allRisks.filter((r) => r.riskType === 'capacity_risk'),
  }
}

// ==========================================================================
// LAB HEALTH
// ==========================================================================

export interface LabHealthReport {
  institutionId: string
  calculatedAt: string
  scores: {
    storageHealth: number
    processingHealth: number
    equipmentHealth: number
    coldChainHealth: number
    custodyHealth: number
    staffingHealth: number
    overall: number
  }
  criticalGaps: LabRisk[]
  recommendations: string[]
}

export function calculateLabHealth(profiles: LabProfile[]): LabHealthReport {
  if (profiles.length === 0) {
    return {
      institutionId: '', calculatedAt: new Date().toISOString(),
      scores: { storageHealth: 0, processingHealth: 0, equipmentHealth: 0, coldChainHealth: 0, custodyHealth: 0, staffingHealth: 0, overall: 0 },
      criticalGaps: [], recommendations: ['No lab profiles found.'],
    }
  }

  const dashboard = buildLabDashboard(profiles)
  const recommendations: string[] = []

  const storageHealth = dashboard.storageSummary.overallUtilization > 90 ? 40
    : dashboard.storageSummary.overallUtilization > 75 ? 70
    : 100

  const allRisks = dashboard.risks
  const tempRisks = allRisks.filter((r) => r.riskType === 'temperature_risk' || r.riskType === 'cold_chain_breach').length
  const coldChainHealth = tempRisks === 0 ? 100 : Math.max(0, 100 - tempRisks * 20)

  const equipRisks = allRisks.filter((r) => r.riskType === 'equipment_dependency' || r.riskType === 'qualification_overdue' || r.riskType === 'calibration_overdue').length
  const equipmentHealth = Math.max(0, 100 - equipRisks * 15)

  const processingHealth = dashboard.processingSummary.averageUtilization > 90 ? 50
    : dashboard.processingSummary.averageUtilization > 75 ? 75
    : 95

  const custodyHealth = dashboard.risks.some((r) => r.riskType === 'cold_chain_breach') ? 60 : 100

  const staffingHealth = profiles.reduce((sum, p) => sum + p.capacityDashboard.staffingAdequacy, 0) / (profiles.length || 1)

  if (dashboard.capacityAlerts.length > 0) {
    recommendations.push(`${dashboard.capacityAlerts.length} storage capacity alerts. Plan expansion.`)
  }
  if (tempRisks > 0) {
    recommendations.push(`${tempRisks} temperature/cold chain risks detected. Review monitoring.`)
  }

  const overall = Math.round(
    (storageHealth + processingHealth + equipmentHealth + coldChainHealth + custodyHealth + staffingHealth) / 6
  )

  return {
    institutionId: profiles[0]?.institutionId ?? '',
    calculatedAt: new Date().toISOString(),
    scores: { storageHealth, processingHealth, equipmentHealth, coldChainHealth, custodyHealth, staffingHealth, overall },
    criticalGaps: allRisks.filter((r) => r.severity === 'critical'),
    recommendations,
  }
}

// ==========================================================================
// SPECIMEN INTELLIGENCE — Default profiles for every type
// ==========================================================================

export function buildSpecimenIntelligence(specimenType: SpecimenTypeKey): SpecimenIntelligence {
  const profiles: Partial<Record<SpecimenTypeKey, Partial<SpecimenIntelligence>>> = {
    whole_blood: {
      collectionRequirements: { tubeType: 'EDTA/Heparin/Citrate', anticoagulant: 'Yes', minimumVolume: '5 mL', fastingRequired: false, specialHandling: 'Invert tube 8-10 times' },
      processingMethods: [{ technique: 'centrifugation', timeWindowHours: 2, temperatureRequirement: 'ambient' }],
      storageRequirements: { shortTerm: 'refrigerated', longTerm: 'frozen_minus80', maxStorageDurationMonths: 120, freezeThawStability: 'limited' },
      shippingRequirements: { temperature: 'frozen_minus80', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    pbmc: {
      collectionRequirements: { tubeType: 'CPT or ACD/EDTA', anticoagulant: 'Yes', minimumVolume: '8 mL', fastingRequired: false, specialHandling: 'Process within 4-8 hours' },
      processingMethods: [{ technique: 'pbmc_isolation', timeWindowHours: 8, temperatureRequirement: 'ambient' }],
      storageRequirements: { shortTerm: 'ln2_vapor', longTerm: 'ln2_liquid', maxStorageDurationMonths: null, freezeThawStability: 'single_use' },
      shippingRequirements: { temperature: 'ln2_vapor', maxTransitHours: 72, requiresDryIce: false, requiresLN2: true, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: 85, requiredRIN: null, requiredPurity: null },
    },
    ffpe: {
      collectionRequirements: { tubeType: 'N/A', anticoagulant: null, minimumVolume: null, fastingRequired: false, specialHandling: 'Fix within 30 min of collection, 10% NBF 24-48h' },
      processingMethods: [{ technique: 'embedding', timeWindowHours: 48, temperatureRequirement: 'ambient' }],
      storageRequirements: { shortTerm: 'ambient', longTerm: 'ambient', maxStorageDurationMonths: null, freezeThawStability: 'stable' },
      shippingRequirements: { temperature: 'ambient', maxTransitHours: 168, requiresDryIce: false, requiresLN2: false, iataClassification: 'Exempt' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    dna: {
      collectionRequirements: { tubeType: 'EDTA', anticoagulant: 'Yes', minimumVolume: '2 mL', fastingRequired: false, specialHandling: null },
      processingMethods: [{ technique: 'dna_extraction', timeWindowHours: 24, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'refrigerated', longTerm: 'frozen_minus20', maxStorageDurationMonths: null, freezeThawStability: 'limited' },
      shippingRequirements: { temperature: 'ambient', maxTransitHours: 72, requiresDryIce: false, requiresLN2: false, iataClassification: 'Exempt' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: 'OD260/280 1.8-2.0' },
    },
    rna: {
      collectionRequirements: { tubeType: 'PAXgene or RNAlater', anticoagulant: 'Yes', minimumVolume: '2.5 mL', fastingRequired: false, specialHandling: 'Immediate stabilization required' },
      processingMethods: [{ technique: 'rna_extraction', timeWindowHours: 4, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'frozen_minus20', longTerm: 'frozen_minus80', maxStorageDurationMonths: 60, freezeThawStability: 'single_use' },
      shippingRequirements: { temperature: 'dry_ice', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: 7.0, requiredPurity: 'OD260/280 1.9-2.1' },
    },
    plasma: {
      collectionRequirements: { tubeType: 'EDTA', anticoagulant: 'Yes', minimumVolume: '2 mL', fastingRequired: false, specialHandling: 'Process within 30 min' },
      processingMethods: [{ technique: 'centrifugation', timeWindowHours: 1, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'frozen_minus20', longTerm: 'frozen_minus80', maxStorageDurationMonths: 120, freezeThawStability: 'limited' },
      shippingRequirements: { temperature: 'dry_ice', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    serum: {
      collectionRequirements: { tubeType: 'SST or Red Top', anticoagulant: null, minimumVolume: '3 mL', fastingRequired: false, specialHandling: 'Allow 30 min clot, centrifuge within 1h' },
      processingMethods: [{ technique: 'centrifugation', timeWindowHours: 1, temperatureRequirement: 'ambient' }],
      storageRequirements: { shortTerm: 'frozen_minus20', longTerm: 'frozen_minus80', maxStorageDurationMonths: 120, freezeThawStability: 'limited' },
      shippingRequirements: { temperature: 'dry_ice', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    fresh_tissue: {
      collectionRequirements: { tubeType: 'Sterile container', anticoagulant: null, minimumVolume: null, fastingRequired: false, specialHandling: 'Place in sterile saline or RPMI, process immediately' },
      processingMethods: [{ technique: 'cryopreservation', timeWindowHours: 1, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'refrigerated', longTerm: 'ln2_vapor', maxStorageDurationMonths: null, freezeThawStability: 'single_use' },
      shippingRequirements: { temperature: 'refrigerated', maxTransitHours: 24, requiresDryIce: false, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    saliva: {
      collectionRequirements: { tubeType: 'DNA Saliva Kit', anticoagulant: null, minimumVolume: '2 mL', fastingRequired: true, specialHandling: 'No eating/drinking 30 min prior' },
      processingMethods: [],
      storageRequirements: { shortTerm: 'ambient', longTerm: 'frozen_minus20', maxStorageDurationMonths: 60, freezeThawStability: 'stable' },
      shippingRequirements: { temperature: 'ambient', maxTransitHours: 72, requiresDryIce: false, requiresLN2: false, iataClassification: 'Exempt' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    urine: {
      collectionRequirements: { tubeType: 'Sterile cup', anticoagulant: null, minimumVolume: '10 mL', fastingRequired: false, specialHandling: 'Process within 2h or preserve' },
      processingMethods: [{ technique: 'centrifugation', timeWindowHours: 2, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'refrigerated', longTerm: 'frozen_minus80', maxStorageDurationMonths: 60, freezeThawStability: 'limited' },
      shippingRequirements: { temperature: 'dry_ice', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
    csf: {
      collectionRequirements: { tubeType: 'Sterile polypropylene', anticoagulant: null, minimumVolume: '1 mL', fastingRequired: false, specialHandling: 'Process within 1h, keep on ice' },
      processingMethods: [{ technique: 'centrifugation', timeWindowHours: 1, temperatureRequirement: 'refrigerated' }],
      storageRequirements: { shortTerm: 'frozen_minus80', longTerm: 'frozen_minus80', maxStorageDurationMonths: 120, freezeThawStability: 'single_use' },
      shippingRequirements: { temperature: 'dry_ice', maxTransitHours: 48, requiresDryIce: true, requiresLN2: false, iataClassification: 'UN3373' },
      qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null },
    },
  }

  const def = profiles[specimenType] ?? {}
  return {
    specimenType,
    label: specimenType.replace(/_/g, ' '),
    collectionRequirements: { tubeType: null, anticoagulant: null, minimumVolume: null, fastingRequired: false, specialHandling: null, ...(def.collectionRequirements ?? {}) },
    processingMethods: def.processingMethods ?? [],
    storageRequirements: { shortTerm: null, longTerm: null, maxStorageDurationMonths: null, freezeThawStability: 'unknown', ...(def.storageRequirements ?? {}) },
    shippingRequirements: { temperature: 'ambient', maxTransitHours: 24, requiresDryIce: false, requiresLN2: false, iataClassification: null, ...(def.shippingRequirements ?? {}) },
    qualityMetrics: { minimumViability: null, requiredRIN: null, requiredPurity: null, ...(def.qualityMetrics ?? {}) },
  }
}

// ==========================================================================
// LAB EXPLORER STATE
// ==========================================================================

export type LabExplorerView = 'labs' | 'storage' | 'workflows' | 'specimens' | 'chain_of_custody' | 'shipping' | 'capacity'

export interface LabExplorerState {
  institutionId: string
  currentView: LabExplorerView
  totalLabs: number
  selectedLabId: string | null
  filters: {
    labTypes: string[]
    specimenTypes: SpecimenTypeKey[]
    capacityRange: { min: number; max: number } | null
    searchText: string | null
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const LAB_INTELLIGENCE = {
  detectLabRisks,
  buildLabDashboard,
  calculateLabHealth,
  buildSpecimenIntelligence,
}
