'use client'

// ==========================================================================
// EquipmentSystemsStep — Site Profile onboarding: freezers, centrifuges,
// imaging, monitoring, EHR, CTMS, Part 11 compliance.
// Fetches / posts to /api/v1/site-profiles.
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'
import type { SiteProfile } from '@kadarn/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EquipmentEntry {
  id: string
  location_id: string
  location_name: string
  name: string
  category: string
  manufacturer: string
  model: string
  serial_number: string
  quantity: string
  calibration_date: string
  calibration_frequency: string
  last_maintenance_date: string
  status: string
  notes: string
}

export interface FreezerEntry {
  id: string
  location_id: string
  location_name: string
  name: string
  type: string
  temperature_range: string
  capacity: string
  has_temperature_monitoring: boolean
  has_alarm: boolean
  backup_power_connected: boolean
  last_validation_date: string
  status: string
}

export interface CentrifugeEntry {
  id: string
  location_id: string
  location_name: string
  name: string
  type: string
  is_refrigerated: boolean
  max_speed: string
  rotor_types: string[]
  status: string
}

export interface ImagingEntry {
  id: string
  location_id: string
  location_name: string
  name: string
  modality: string
  manufacturer: string
  model: string
  dicom_compatible: boolean
  last_qc_date: string
  status: string
}

export interface MonitoringEntry {
  id: string
  location_id: string
  location_name: string
  name: string
  type: string
  monitored_area: string
  parameters: string[]
  alert_method: string
  data_logging: boolean
  last_validation_date: string
}

export interface SystemEntry {
  id: string
  name: string
  category: 'EHR' | 'CTMS' | 'eSource' | 'EDC' | 'eConsent' | 'IRT/IVRS' | 'ePRO' | 'CTMS/Financial' | 'Document Management' | 'Quality Management' | 'Other'
  vendor: string
  version: string
  part11_compliant: boolean
  validated: boolean
  last_validation_date: string
  has_audit_trail: boolean
  has_electronic_signature: boolean
  integration_capabilities: string[]
  data_backup_frequency: string
  disaster_recovery_plan: boolean
  status: string
}

export interface EquipmentSystemsStepData {
  equipment: EquipmentEntry[]
  freezers: FreezerEntry[]
  centrifuges: CentrifugeEntry[]
  imaging: ImagingEntry[]
  monitoring: MonitoringEntry[]
  systems: SystemEntry[]
}

export interface EquipmentSystemsStepProps {
  profileId?: string
  organizationId?: string
  locationOptions?: { id: string; name: string }[]
  initialData?: Partial<EquipmentSystemsStepData>
  onComplete?: (data: EquipmentSystemsStepData) => void
  onBack?: () => void
  onSave?: (data: EquipmentSystemsStepData) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EQUIPMENT_CATEGORIES = [
  'Freezer', 'Refrigerator', 'Centrifuge', 'Incubator', 'Biosafety Cabinet',
  'PCR Machine', 'Flow Cytometer', 'Sequencer', 'Mass Spectrometer',
  'HPLC', 'ELISA Reader', 'Microscope', 'Autoclave', 'Balance',
  'Pipette', 'pH Meter', 'Spectrophotometer', 'Other',
] as const

const EQUIPMENT_STATUSES = [
  'Operational', 'In Maintenance', 'Out of Service', 'Retired', 'Pending Validation',
] as const

const FREEZER_TYPES = [
  '-20°C Freezer', '-40°C Freezer', '-80°C Ultra-Low Freezer',
  '-150°C Deep Freezer', 'LN2 Dewar', 'LN2 Freezer (-196°C)',
  'Refrigerated Incubator', 'Walk-in Cold Room', 'Other',
] as const

const CENTRIFUGE_TYPES = [
  'Benchtop', 'Floor-standing', 'Microcentrifuge', 'Ultracentrifuge',
  'High-Speed', 'Refrigerated Benchtop', 'Refrigerated Floor-standing',
  'Other',
] as const

const ROTOR_TYPES = [
  'Swinging Bucket', 'Fixed Angle', 'Vertical', 'Continuous Flow',
  'Drum', 'Hematocrit',
] as const

const IMAGING_MODALITIES = [
  'CT', 'MRI (1.5T)', 'MRI (3T)', 'X-Ray', 'Ultrasound',
  'Mammography', 'DEXA', 'PET/CT', 'SPECT', 'Fluoroscopy',
  'Echocardiography', 'Other',
] as const

const MONITORING_TYPES = [
  'Temperature Logger', 'Humidity Logger', 'CO2 Monitor',
  'Differential Pressure', 'Particle Counter', 'Access Control',
  'CCTV / Video Surveillance', 'Environmental Monitoring System',
  'Other',
] as const

const MONITORING_PARAMETERS = [
  'Temperature', 'Humidity', 'CO2', 'Pressure', 'Light',
  'Vibration', 'Air Changes', 'Particulates', 'Access',
] as const

const ALERT_METHODS = [
  'Email', 'SMS', 'Phone Call', 'Audible Alarm', 'Visual Alarm',
  'Building Management System', 'Mobile App Push', 'None',
] as const

const INTEGRATION_CAPABILITIES = [
  'HL7 v2', 'FHIR', 'CDISC', 'CDASH', 'SDTM', 'API / REST',
  'File-based (CSV/XML)', 'Database Replication', 'Webhooks',
  'Middleware / ESB', 'Other',
] as const

const DATA_BACKUP_FREQUENCIES = [
  'Real-time', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Manual only',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

let _counter = 0
function nextId(prefix: string): string {
  _counter += 1
  return `${prefix}-${Date.now()}-${_counter}`
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

function createEquipment(locationOptions: { id: string; name: string }[]): EquipmentEntry {
  const first = locationOptions[0]
  return {
    id: nextId('eq'), location_id: first?.id ?? '', location_name: first?.name ?? '',
    name: '', category: '', manufacturer: '', model: '', serial_number: '',
    quantity: '1', calibration_date: '', calibration_frequency: 'Annual',
    last_maintenance_date: '', status: 'Operational', notes: '',
  }
}

function createFreezer(locationOptions: { id: string; name: string }[]): FreezerEntry {
  const first = locationOptions[0]
  return {
    id: nextId('fz'), location_id: first?.id ?? '', location_name: first?.name ?? '',
    name: '', type: '', temperature_range: '', capacity: '',
    has_temperature_monitoring: false, has_alarm: false,
    backup_power_connected: false, last_validation_date: '', status: 'Operational',
  }
}

function createCentrifuge(locationOptions: { id: string; name: string }[]): CentrifugeEntry {
  const first = locationOptions[0]
  return {
    id: nextId('cf'), location_id: first?.id ?? '', location_name: first?.name ?? '',
    name: '', type: '', is_refrigerated: false,
    max_speed: '', rotor_types: [], status: 'Operational',
  }
}

function createImaging(locationOptions: { id: string; name: string }[]): ImagingEntry {
  const first = locationOptions[0]
  return {
    id: nextId('img'), location_id: first?.id ?? '', location_name: first?.name ?? '',
    name: '', modality: '', manufacturer: '', model: '',
    dicom_compatible: false, last_qc_date: '', status: 'Operational',
  }
}

function createMonitoring(locationOptions: { id: string; name: string }[]): MonitoringEntry {
  const first = locationOptions[0]
  return {
    id: nextId('mon'), location_id: first?.id ?? '', location_name: first?.name ?? '',
    name: '', type: '', monitored_area: '',
    parameters: [], alert_method: '', data_logging: false, last_validation_date: '',
  }
}

function createSystem(): SystemEntry {
  return {
    id: nextId('sys'), name: '', category: 'CTMS', vendor: '', version: '',
    part11_compliant: false, validated: false, last_validation_date: '',
    has_audit_trail: false, has_electronic_signature: false,
    integration_capabilities: [], data_backup_frequency: 'Daily',
    disaster_recovery_plan: false, status: 'Operational',
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-[#2a2a40] bg-[#0f0f1a] px-3 py-2 text-sm text-[#e0e0f0] placeholder-[#4a4a60] focus:outline-none focus:ring-2 focus:ring-[#8b86e5]/50 focus:border-[#8b86e5]/50 transition-colors'

const labelClass = 'block text-xs font-medium text-[#6b6b80] uppercase tracking-wider mb-1'
const cardClass = 'rounded-xl border border-[#1e1e35] bg-[#0d0d22]/60 overflow-hidden'
const cardHeaderClass = 'px-5 py-3 border-b border-[#1e1e35] flex items-center justify-between gap-3'
const cardBodyClass = 'px-5 py-4 space-y-4'

// ─── Sub-components ─────────────────────────────────────────────────────────

function TagToggle({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
        selected
          ? 'bg-[#8b86e5]/15 border-[#8b86e5]/40 text-[#8b86e5]'
          : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/25 hover:text-[#c0c0d0]'
      }`}
    >
      {label}
    </button>
  )
}

function MultiSelect({ title, options, selected, onToggle }: { title: string; options: readonly string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-medium text-[#4a4a60] uppercase tracking-wider">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => <TagToggle key={opt} label={opt} selected={selected.includes(opt)} onToggle={() => onToggle(opt)} />)}
      </div>
    </div>
  )
}

function YesNoBadge({ value, labelTrue, labelFalse }: { value: boolean; labelTrue: string; labelFalse: string }) {
  return value ? (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{labelTrue}</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">{labelFalse}</span>
  )
}

function LocationSelect({ value, options, onChange }: { value: string; options: { id: string; name: string }[]; onChange: (v: string) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select location...</option>
      {options.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
    </select>
  )
}

// ─── FreezerCard ────────────────────────────────────────────────────────────

function FreezerCard({ freezer, locationOptions, onChange, onDelete }: { freezer: FreezerEntry; locationOptions: { id: string; name: string }[]; onChange: (p: Partial<FreezerEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{freezer.name || 'New Freezer'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name / Identifier</label>
          <input type="text" className={inputClass} placeholder="e.g., Freezer A-1" value={freezer.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <LocationSelect value={freezer.location_id} options={locationOptions} onChange={(v) => onChange({ location_id: v, location_name: locationOptions.find((l) => l.id === v)?.name ?? '' })} />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select className={inputClass} value={freezer.type} onChange={(e) => onChange({ type: e.target.value })}>
            <option value="">Select type...</option>
            {FREEZER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Temperature Range</label>
          <input type="text" className={inputClass} placeholder="e.g., -80°C to -70°C" value={freezer.temperature_range} onChange={(e) => onChange({ temperature_range: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Capacity</label>
          <input type="text" className={inputClass} placeholder="e.g., 600 L / 25 cu ft" value={freezer.capacity} onChange={(e) => onChange({ capacity: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Last Validation Date</label>
          <input type="date" className={inputClass} value={freezer.last_validation_date} onChange={(e) => onChange({ last_validation_date: e.target.value })} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={freezer.has_temperature_monitoring} onChange={(e) => onChange({ has_temperature_monitoring: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          Temp Monitoring
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={freezer.has_alarm} onChange={(e) => onChange({ has_alarm: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          Alarm
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={freezer.backup_power_connected} onChange={(e) => onChange({ backup_power_connected: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          Backup Power
        </label>
      </div>
    </div>
  )
}

// ─── CentrifugeCard ─────────────────────────────────────────────────────────

function CentrifugeCard({ centrifuge, locationOptions, onChange, onDelete }: { centrifuge: CentrifugeEntry; locationOptions: { id: string; name: string }[]; onChange: (p: Partial<CentrifugeEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{centrifuge.name || 'New Centrifuge'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name / Identifier</label>
          <input type="text" className={inputClass} placeholder="e.g., Centrifuge-01" value={centrifuge.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <LocationSelect value={centrifuge.location_id} options={locationOptions} onChange={(v) => onChange({ location_id: v, location_name: locationOptions.find((l) => l.id === v)?.name ?? '' })} />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select className={inputClass} value={centrifuge.type} onChange={(e) => onChange({ type: e.target.value })}>
            <option value="">Select type...</option>
            {CENTRIFUGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Max Speed (RPM)</label>
          <input type="text" className={inputClass} placeholder="e.g., 15000" value={centrifuge.max_speed} onChange={(e) => onChange({ max_speed: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
        <input type="checkbox" checked={centrifuge.is_refrigerated} onChange={(e) => onChange({ is_refrigerated: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
        Refrigerated
      </label>
      <MultiSelect title="Rotor Types" options={ROTOR_TYPES} selected={centrifuge.rotor_types} onToggle={(v) => onChange({ rotor_types: toggleArr(centrifuge.rotor_types, v) })} />
    </div>
  )
}

// ─── ImagingCard ────────────────────────────────────────────────────────────

function ImagingCard({ imaging, locationOptions, onChange, onDelete }: { imaging: ImagingEntry; locationOptions: { id: string; name: string }[]; onChange: (p: Partial<ImagingEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{imaging.name || 'New Imaging Device'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name / Identifier</label>
          <input type="text" className={inputClass} placeholder="e.g., CT Scanner 1" value={imaging.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <LocationSelect value={imaging.location_id} options={locationOptions} onChange={(v) => onChange({ location_id: v, location_name: locationOptions.find((l) => l.id === v)?.name ?? '' })} />
        </div>
        <div>
          <label className={labelClass}>Modality</label>
          <select className={inputClass} value={imaging.modality} onChange={(e) => onChange({ modality: e.target.value })}>
            <option value="">Select modality...</option>
            {IMAGING_MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Manufacturer</label>
          <input type="text" className={inputClass} placeholder="e.g., Siemens" value={imaging.manufacturer} onChange={(e) => onChange({ manufacturer: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Model</label>
          <input type="text" className={inputClass} placeholder="Model" value={imaging.model} onChange={(e) => onChange({ model: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Last QC Date</label>
          <input type="date" className={inputClass} value={imaging.last_qc_date} onChange={(e) => onChange({ last_qc_date: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
        <input type="checkbox" checked={imaging.dicom_compatible} onChange={(e) => onChange({ dicom_compatible: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
        DICOM Compatible
      </label>
    </div>
  )
}

// ─── MonitoringCard ─────────────────────────────────────────────────────────

function MonitoringCard({ monitoring, locationOptions, onChange, onDelete }: { monitoring: MonitoringEntry; locationOptions: { id: string; name: string }[]; onChange: (p: Partial<MonitoringEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{monitoring.name || 'New Monitoring Device'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name / Identifier</label>
          <input type="text" className={inputClass} placeholder="e.g., Temp Logger-01" value={monitoring.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <LocationSelect value={monitoring.location_id} options={locationOptions} onChange={(v) => onChange({ location_id: v, location_name: locationOptions.find((l) => l.id === v)?.name ?? '' })} />
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select className={inputClass} value={monitoring.type} onChange={(e) => onChange({ type: e.target.value })}>
            <option value="">Select type...</option>
            {MONITORING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Monitored Area</label>
          <input type="text" className={inputClass} placeholder="e.g., Freezer Room" value={monitoring.monitored_area} onChange={(e) => onChange({ monitored_area: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Alert Method</label>
          <select className={inputClass} value={monitoring.alert_method} onChange={(e) => onChange({ alert_method: e.target.value })}>
            <option value="">Select method...</option>
            {ALERT_METHODS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Last Validation Date</label>
          <input type="date" className={inputClass} value={monitoring.last_validation_date} onChange={(e) => onChange({ last_validation_date: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
        <input type="checkbox" checked={monitoring.data_logging} onChange={(e) => onChange({ data_logging: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
        Data Logging Enabled
      </label>
      <MultiSelect title="Monitored Parameters" options={MONITORING_PARAMETERS} selected={monitoring.parameters} onToggle={(v) => onChange({ parameters: toggleArr(monitoring.parameters, v) })} />
    </div>
  )
}

// ─── EquipmentCard ──────────────────────────────────────────────────────────

function EquipmentCard({ equipment, locationOptions, onChange, onDelete }: { equipment: EquipmentEntry; locationOptions: { id: string; name: string }[]; onChange: (p: Partial<EquipmentEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{equipment.name || 'New Equipment'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" className={inputClass} placeholder="Equipment name" value={equipment.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={equipment.category} onChange={(e) => onChange({ category: e.target.value })}>
            <option value="">Select category...</option>
            {EQUIPMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <LocationSelect value={equipment.location_id} options={locationOptions} onChange={(v) => onChange({ location_id: v, location_name: locationOptions.find((l) => l.id === v)?.name ?? '' })} />
        </div>
        <div>
          <label className={labelClass}>Manufacturer</label>
          <input type="text" className={inputClass} placeholder="Manufacturer" value={equipment.manufacturer} onChange={(e) => onChange({ manufacturer: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Model</label>
          <input type="text" className={inputClass} placeholder="Model" value={equipment.model} onChange={(e) => onChange({ model: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Serial Number</label>
          <input type="text" className={inputClass} placeholder="S/N" value={equipment.serial_number} onChange={(e) => onChange({ serial_number: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Quantity</label>
          <input type="number" className={inputClass} min={1} value={equipment.quantity} onChange={(e) => onChange({ quantity: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Calibration Date</label>
          <input type="date" className={inputClass} value={equipment.calibration_date} onChange={(e) => onChange({ calibration_date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={equipment.status} onChange={(e) => onChange({ status: e.target.value })}>
            {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <input type="text" className={inputClass} placeholder="Additional notes (optional)" value={equipment.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
    </div>
  )
}

// ─── SystemCard ─────────────────────────────────────────────────────────────

function SystemCard({ system, onChange, onDelete }: { system: SystemEntry; onChange: (p: Partial<SystemEntry>) => void; onDelete: () => void }) {
  return (
    <div className="p-4 rounded-lg border border-[#2a2a40] bg-[#0a0a1a]/50 space-y-3">
      <div className="flex items-center justify-between">
        <strong className="text-sm text-[#e0e0f0]">{system.name || 'New System'}</strong>
        <button type="button" onClick={onDelete} className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>System Name</label>
          <input type="text" className={inputClass} placeholder="e.g., Epic EHR" value={system.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={system.category} onChange={(e) => onChange({ category: e.target.value as SystemEntry['category'] })}>
            <option value="EHR">EHR</option>
            <option value="CTMS">CTMS</option>
            <option value="eSource">eSource</option>
            <option value="EDC">EDC</option>
            <option value="eConsent">eConsent</option>
            <option value="IRT/IVRS">IRT/IVRS</option>
            <option value="ePRO">ePRO</option>
            <option value="CTMS/Financial">CTMS/Financial</option>
            <option value="Document Management">Document Management</option>
            <option value="Quality Management">Quality Management</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Vendor</label>
          <input type="text" className={inputClass} placeholder="Vendor name" value={system.vendor} onChange={(e) => onChange({ vendor: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Version</label>
          <input type="text" className={inputClass} placeholder="e.g., 2024.1" value={system.version} onChange={(e) => onChange({ version: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Last Validation Date</label>
          <input type="date" className={inputClass} value={system.last_validation_date} onChange={(e) => onChange({ last_validation_date: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Data Backup Frequency</label>
          <select className={inputClass} value={system.data_backup_frequency} onChange={(e) => onChange({ data_backup_frequency: e.target.value })}>
            {DATA_BACKUP_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={system.part11_compliant} onChange={(e) => onChange({ part11_compliant: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          21 CFR Part 11 Compliant
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={system.validated} onChange={(e) => onChange({ validated: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          Validated
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={system.has_audit_trail} onChange={(e) => onChange({ has_audit_trail: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          Audit Trail
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={system.has_electronic_signature} onChange={(e) => onChange({ has_electronic_signature: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          eSignature
        </label>
        <label className="flex items-center gap-2 text-sm text-[#c0c0d0] cursor-pointer">
          <input type="checkbox" checked={system.disaster_recovery_plan} onChange={(e) => onChange({ disaster_recovery_plan: e.target.checked })} className="rounded border-[#2a2a40] bg-[#0f0f1a] text-[#8b86e5]" />
          DR Plan
        </label>
      </div>
      <MultiSelect title="Integration Capabilities" options={INTEGRATION_CAPABILITIES} selected={system.integration_capabilities} onToggle={(v) => onChange({ integration_capabilities: toggleArr(system.integration_capabilities, v) })} />
    </div>
  )
}

// ─── SectionHeader ──────────────────────────────────────────────────────────

function SectionHeader({ title, count, onAdd, badge }: { title: string; count: number; onAdd: () => void; badge?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-[#e0e0f0]">{title}</h3>
        {badge && <span className="text-[10px] text-[#4a4a60]">{badge}</span>}
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1a1a2e] text-[#6b6b80] border border-[#2a2a40]">{count}</span>
      </div>
      <button type="button" onClick={onAdd} className="text-xs text-[#8b86e5] hover:text-[#a09bf0] transition-colors font-medium">
        + Add
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function EquipmentSystemsStep({
  profileId,
  organizationId,
  locationOptions = [],
  initialData,
  onComplete,
  onBack,
  onSave,
}: EquipmentSystemsStepProps) {
  const [equipment, setEquipment] = useState<EquipmentEntry[]>(initialData?.equipment ?? [])
  const [freezers, setFreezers] = useState<FreezerEntry[]>(initialData?.freezers ?? [])
  const [centrifuges, setCentrifuges] = useState<CentrifugeEntry[]>(initialData?.centrifuges ?? [])
  const [imaging, setImaging] = useState<ImagingEntry[]>(initialData?.imaging ?? [])
  const [monitoring, setMonitoring] = useState<MonitoringEntry[]>(initialData?.monitoring ?? [])
  const [systems, setSystems] = useState<SystemEntry[]>(initialData?.systems ?? [])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedProfileId, setSavedProfileId] = useState<string | undefined>(profileId)
  const [expandedSection, setExpandedSection] = useState<string>('freezers')

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    setLoading(true)
    apiGet<{ data: SiteProfile }>(`/api/v1/site-profiles/${profileId}`)
      .then((res) => {
        if (cancelled || !res?.data) return
        const content = res.data.content as Record<string, unknown> ?? {}
        if (Array.isArray(content.equipment)) setEquipment(content.equipment as EquipmentEntry[])
        if (Array.isArray(content.freezers)) setFreezers(content.freezers as FreezerEntry[])
        if (Array.isArray(content.centrifuges)) setCentrifuges(content.centrifuges as CentrifugeEntry[])
        if (Array.isArray(content.imaging)) setImaging(content.imaging as ImagingEntry[])
        if (Array.isArray(content.monitoring)) setMonitoring(content.monitoring as MonitoringEntry[])
        if (Array.isArray(content.systems)) setSystems(content.systems as SystemEntry[])
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profileId])

  const buildContent = useCallback((): Record<string, unknown> => ({
    equipment, freezers, centrifuges, imaging, monitoring, systems,
  }), [equipment, freezers, centrifuges, imaging, monitoring, systems])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    const content = buildContent()
    try {
      if (savedProfileId) {
        await apiPatch(`/api/v1/site-profiles/${savedProfileId}`, { content })
      } else {
        const profile = await apiPost<{ data: SiteProfile }>('/api/v1/site-profiles', {
          organization_id: organizationId,
          name: 'Untitled Site Profile',
          content,
        }).then((res) => (res as { data: SiteProfile }).data)
        setSavedProfileId(profile.id)
      }
      onSave?.({ equipment, freezers, centrifuges, imaging, monitoring, systems })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [buildContent, savedProfileId, organizationId, onSave, equipment, freezers, centrifuges, imaging, monitoring, systems])

  const handleContinue = useCallback(async () => {
    await handleSave()
    if (!error) onComplete?.({ equipment, freezers, centrifuges, imaging, monitoring, systems })
  }, [handleSave, error, onComplete, equipment, freezers, centrifuges, imaging, monitoring, systems])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-8 h-8 border-2 border-[#8b86e5]/30 border-t-[#8b86e5] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#6b6b80]">Loading equipment & systems data...</p>
      </div>
    )
  }

  const sectionNav = [
    { key: 'freezers', label: 'Freezers', count: freezers.length, badge: `${freezers.filter((f) => f.has_temperature_monitoring).length} monitored` },
    { key: 'centrifuges', label: 'Centrifuges', count: centrifuges.length, badge: `${centrifuges.filter((c) => c.is_refrigerated).length} refrigerated` },
    { key: 'imaging', label: 'Imaging', count: imaging.length, badge: `${imaging.filter((i) => i.dicom_compatible).length} DICOM` },
    { key: 'monitoring', label: 'Monitoring', count: monitoring.length, badge: `${monitoring.filter((m) => m.data_logging).length} logging` },
    { key: 'equipment', label: 'Equipment', count: equipment.length },
    { key: 'systems', label: 'Systems & Software', count: systems.length, badge: `${systems.filter((s) => s.part11_compliant).length} Part 11` },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#e0e0f0] mb-1">Equipment & Systems</h2>
        <p className="text-sm text-[#6b6b80]">
          Catalog your institution&rsquo;s equipment, freezers, centrifuges, imaging devices, environmental monitoring, and software systems including EHR, CTMS, and Part 11 compliance.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      {/* Section navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {sectionNav.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setExpandedSection(s.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                expandedSection === s.key
                  ? 'bg-[#8b86e5]/15 border-[#8b86e5]/50 text-[#8b86e5]'
                  : 'border-[#2a2a40] text-[#6b6b80] hover:border-[#8b86e5]/30'
              }`}
            >
              {s.label}
              <span className="ml-1.5 opacity-60">{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Section */}
      {expandedSection === 'equipment' && (
        <div className="space-y-4 mb-8">
          <SectionHeader title="General Equipment" count={equipment.length} onAdd={() => setEquipment((prev) => [...prev, createEquipment(locationOptions)])} />
          {equipment.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} locationOptions={locationOptions} onChange={(patch) => setEquipment((prev) => prev.map((e) => e.id === eq.id ? { ...e, ...patch } : e))} onDelete={() => setEquipment((prev) => prev.filter((e) => e.id !== eq.id))} />
          ))}
          {equipment.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No general equipment added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      {/* Freezers Section */}
      {expandedSection === 'freezers' && (
        <div className="space-y-4 mb-8">
          <SectionHeader title="Freezers & Cold Storage" count={freezers.length} onAdd={() => setFreezers((prev) => [...prev, createFreezer(locationOptions)])} badge={freezers.filter((f) => f.has_temperature_monitoring).length > 0 ? `${freezers.filter((f) => f.has_temperature_monitoring).length} monitored` : undefined} />
          {freezers.map((fz) => (
            <FreezerCard key={fz.id} freezer={fz} locationOptions={locationOptions} onChange={(patch) => setFreezers((prev) => prev.map((f) => f.id === fz.id ? { ...f, ...patch } : f))} onDelete={() => setFreezers((prev) => prev.filter((f) => f.id !== fz.id))} />
          ))}
          {freezers.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No freezers added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      {/* Centrifuges Section */}
      {expandedSection === 'centrifuges' && (
        <div className="space-y-4 mb-8">
          <SectionHeader title="Centrifuges" count={centrifuges.length} onAdd={() => setCentrifuges((prev) => [...prev, createCentrifuge(locationOptions)])} />
          {centrifuges.map((cf) => (
            <CentrifugeCard key={cf.id} centrifuge={cf} locationOptions={locationOptions} onChange={(patch) => setCentrifuges((prev) => prev.map((c) => c.id === cf.id ? { ...c, ...patch } : c))} onDelete={() => setCentrifuges((prev) => prev.filter((c) => c.id !== cf.id))} />
          ))}
          {centrifuges.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No centrifuges added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      {/* Imaging Section */}
      {expandedSection === 'imaging' && (
        <div className="space-y-4 mb-8">
          <SectionHeader title="Imaging Equipment" count={imaging.length} onAdd={() => setImaging((prev) => [...prev, createImaging(locationOptions)])} />
          {imaging.map((img) => (
            <ImagingCard key={img.id} imaging={img} locationOptions={locationOptions} onChange={(patch) => setImaging((prev) => prev.map((i) => i.id === img.id ? { ...i, ...patch } : i))} onDelete={() => setImaging((prev) => prev.filter((i) => i.id !== img.id))} />
          ))}
          {imaging.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No imaging devices added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      {/* Monitoring Section */}
      {expandedSection === 'monitoring' && (
        <div className="space-y-4 mb-8">
          <SectionHeader title="Environmental Monitoring" count={monitoring.length} onAdd={() => setMonitoring((prev) => [...prev, createMonitoring(locationOptions)])} />
          {monitoring.map((mon) => (
            <MonitoringCard key={mon.id} monitoring={mon} locationOptions={locationOptions} onChange={(patch) => setMonitoring((prev) => prev.map((m) => m.id === mon.id ? { ...m, ...patch } : m))} onDelete={() => setMonitoring((prev) => prev.filter((m) => m.id !== mon.id))} />
          ))}
          {monitoring.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No monitoring devices added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      {/* Systems Section */}
      {expandedSection === 'systems' && (
        <div className="space-y-4 mb-8">
          <SectionHeader
            title="Software Systems"
            count={systems.length}
            onAdd={() => setSystems((prev) => [...prev, createSystem()])}
            badge={systems.filter((s) => s.part11_compliant).length > 0 ? `${systems.filter((s) => s.part11_compliant).length} Part 11 compliant` : undefined}
          />
          {systems.map((sys) => (
            <SystemCard key={sys.id} system={sys} onChange={(patch) => setSystems((prev) => prev.map((s) => s.id === sys.id ? { ...s, ...patch } : s))} onDelete={() => setSystems((prev) => prev.filter((s) => s.id !== sys.id))} />
          ))}
          {systems.length === 0 && <p className="text-sm text-[#4a4a60] italic py-4 text-center">No systems added. Click &ldquo;+ Add&rdquo; to start.</p>}
        </div>
      )}

      <div className="flex justify-between items-center pt-8 border-t border-[#1e1e35]">
        {onBack ? (
          <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 transition-colors">
            ← Back
          </button>
        ) : <div />}
        <div className="flex gap-3">
          <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg border border-[#2a2a40] text-sm text-[#c0c0d0] hover:bg-white/5 disabled:opacity-40 transition-colors">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" onClick={handleContinue} disabled={saving} className="px-5 py-2 rounded-lg bg-[#8b86e5] text-white text-sm font-medium hover:bg-[#7a75d4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EquipmentSystemsStep
