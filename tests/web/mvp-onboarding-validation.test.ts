import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveInstitutionRoadmap } from '../../apps/web/src/lib/onboarding/institution-roadmap'
import { assemblePassport } from '../../apps/web/src/lib/passport/passport-assembler'

const ROOT = join(__dirname, '..', '..')
const WEB_APP = join(ROOT, 'apps', 'web', 'src', 'app')
const WEB_SRC = join(ROOT, 'apps', 'web', 'src')

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function routeExists(route: string): boolean {
  if (route === '/onboarding') {
    return existsSync(join(WEB_APP, '(onboarding)', 'onboarding', 'page.tsx'))
  }

  const segment = route.replace('/onboarding/', '')
  return existsSync(join(WEB_APP, '(onboarding)', 'onboarding', segment, 'page.tsx'))
}

describe('MVP onboarding validation flow', () => {
  it('sends root entry to onboarding', () => {
    const rootPage = read(join(WEB_APP, 'page.tsx'))

    expect(rootPage).toContain("redirect('/onboarding')")
  })

  it('has all MVP onboarding routes referenced by the validation journey', () => {
    const expectedRoutes = [
      '/onboarding',
      '/onboarding/organization',
      '/onboarding/people',
      '/onboarding/infrastructure',
      '/onboarding/documents',
      '/onboarding/memory',
      '/onboarding/capabilities',
      '/onboarding/readiness',
      '/onboarding/passport',
      '/onboarding/roadmap',
    ]

    expect(expectedRoutes.filter((route) => !routeExists(route))).toEqual([])
  })

  it('does not point static onboarding links to missing MVP routes', () => {
    const files = [
      join(WEB_APP, '(onboarding)', 'onboarding', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'organization', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'people', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'infrastructure', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'documents', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'capabilities', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'readiness', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'passport', 'page.tsx'),
      join(WEB_APP, '(onboarding)', 'onboarding', 'roadmap', 'page.tsx'),
    ]

    const links = files.flatMap((file) =>
      [...read(file).matchAll(/href="(\/onboarding[^"]*)"/g)].map((match) => match[1])
    )

    expect(links.filter((link) => !routeExists(link))).toEqual([])
  })

  it('assembles the Passport from real onboarding answers and uploaded documents', () => {
    const passport = assemblePassport({
      institutionId: 'mvp-vilo',
      institutionName: '',
      answers: {
        org_name: 'Vilo Research Institute',
        org_type: 'Independent Research Institute',
        org_therapeutic_areas: ['Oncology'],
        org_research_focus: ['Clinical Research Site'],
        org_locations: [
          {
            id: 'location-1',
            name: 'Main Research Site',
            type: 'Primary Research Site',
            street: '100 Main St',
            city: 'Houston',
            state: 'TX',
            country: 'United States',
            zip: '77002',
            timeZone: 'America/Chicago',
            isPrimary: true,
          },
          {
            id: 'location-2',
            name: 'Satellite Clinic',
            type: 'Satellite Research Site',
            street: '200 Clinic Rd',
            city: 'Katy',
            state: 'TX',
            country: 'United States',
            zip: '77494',
            timeZone: 'America/Chicago',
            isPrimary: false,
          },
        ],
        people_team_members: [
          {
            id: 'team-member-1',
            firstName: 'Sarah',
            lastName: 'Chen',
            credentials: 'MD',
            primaryRole: 'Principal Investigator',
            email: 'sarah@example.test',
            phone: '',
            primaryLocationId: 'location-1',
            languages: ['English', 'Spanish'],
            employmentStatus: 'Full-time',
            researchRoles: ['Principal Investigator', 'Research Physician'],
            isPrincipalInvestigator: true,
            therapeuticExpertise: ['Oncology', 'Endocrinology'],
            yearsExperience: '15',
            completedStudies: '42',
            currentStudies: '6',
            phaseExperience: ['Phase II', 'IVD experience', 'Biospecimen experience'],
            certifications: [
              {
                id: 'cert-1',
                type: 'GCP (Good Clinical Practice)',
                certificationNumber: 'GCP-001',
                issuingOrganization: 'ACME Training',
                issueDate: '2026-01-01',
                expirationDate: '2029-01-01',
                currentStatus: 'Active',
              },
            ],
          },
          {
            id: 'team-member-2',
            firstName: 'Ana',
            lastName: 'Rivera',
            credentials: 'RN',
            primaryRole: 'Clinical Research Coordinator',
            email: 'ana@example.test',
            phone: '',
            primaryLocationId: 'location-2',
            languages: ['Spanish'],
            employmentStatus: 'Full-time',
            researchRoles: ['Clinical Research Coordinator', 'Recruitment Specialist'],
            isPrincipalInvestigator: false,
            therapeuticExpertise: ['Infectious Disease'],
            yearsExperience: '7',
            completedStudies: '18',
            currentStudies: '3',
            phaseExperience: ['Observational', 'Registries'],
            certifications: [
              {
                id: 'cert-2',
                type: 'IATA Dangerous Goods',
                certificationNumber: '',
                issuingOrganization: '',
                issueDate: '2026-01-01',
                expirationDate: '2027-01-01',
                currentStatus: 'Active',
              },
            ],
          },
        ],
        people_pi_first_name: 'Sarah',
        people_pi_last_name: 'Chen',
        people_pi_experience: '15',
        people_roles: ['Research Coordinator', 'Lab Technician'],
        infra_location_infrastructure: [
          {
            locationId: 'location-1',
            facilityType: 'Primary Research Site',
            dedicatedResearchSpace: 'Dedicated research space',
            examRooms: '6',
            infusionCapability: true,
            procedureRooms: '2',
            overnightEarlyPhaseCapacity: false,
            backupPower: 'Generator + UPS',
            laboratoryPresent: true,
            pharmacyPresent: false,
            imagingPresent: true,
            biospecimenProcessingPresent: true,
            storageEquipment: ['-80C Freezer', 'Refrigerator (2-8C)'],
            temperatureMonitoring: 'Continuous logging with alarms',
            shippingCapability: 'Domestic and international',
            biospecimenOperations: ['Collection', 'Processing', 'Storage', 'Shipping'],
          },
          {
            locationId: 'location-2',
            facilityType: 'Satellite Research Site',
            dedicatedResearchSpace: 'Shared clinical and research space',
            examRooms: '3',
            infusionCapability: false,
            procedureRooms: '1',
            overnightEarlyPhaseCapacity: true,
            backupPower: 'Generator only',
            laboratoryPresent: false,
            pharmacyPresent: true,
            imagingPresent: false,
            biospecimenProcessingPresent: false,
            storageEquipment: ['Refrigerator (2-8C)'],
            temperatureMonitoring: 'Manual checks',
            shippingCapability: 'Domestic only',
            biospecimenOperations: ['Collection'],
          },
        ],
      },
      uploadedDocs: [
        {
          label: 'bootstrap-01-environment-audit',
          type: 'uploaded',
          uploaded: true,
        },
      ],
    })

    expect(passport.institution.name).toBe('Vilo Research Institute')
    expect(passport.institution.primaryLocation).toBe('Houston, TX, United States')
    expect(passport.institution.team.piName).toBe('Sarah Chen')
    expect(passport.institution.team.totalTeam).toBe(2)
    expect(passport.institution.team.languages).toContain('Spanish')
    expect(passport.institution.team.roles).toContain('Clinical Research Coordinator')
    expect(passport.institution.team.certifications).toContain('GCP (Good Clinical Practice)')
    expect(passport.institution.team.certifications).toContain('IATA Dangerous Goods')
    expect(passport.evidence.uploadedDocuments).toBeGreaterThan(0)
    expect(passport.evidence.documents.map((document) => document.label)).toContain('bootstrap-01-environment-audit')
    expect(passport.capabilities.map((capability) => capability.name)).toContain('Sample Processing')
    expect(passport.readiness.dimensions.length).toBeGreaterThan(0)
  })

  it('supports broad research experience taxonomy beyond therapeutic areas', () => {
    const organizationPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'organization', 'page.tsx'))
    const taxonomy = read(join(WEB_SRC, 'lib', 'onboarding', 'research-experience-taxonomy.ts'))

    expect(organizationPage).toContain('org_therapeutic_areas')
    expect(organizationPage).toContain('org_research_modalities')
    expect(organizationPage).toContain('Search therapeutic areas')
    expect(organizationPage).toContain('Search research modalities')
    expect(taxonomy).toContain('Biospecimen Collection')
    expect(taxonomy).toContain('Diagnostics / IVD')
    expect(taxonomy).toContain('Observational Studies')
    expect(taxonomy).toContain('Community-Based Research')
    expect(taxonomy).toContain('Investigator-Initiated Studies')
  })

  it('supports broad operational research focus taxonomy', () => {
    const organizationPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'organization', 'page.tsx'))
    const taxonomy = read(join(WEB_SRC, 'lib', 'onboarding', 'research-focus-taxonomy.ts'))

    expect(organizationPage).toContain('Which research programs and operational capabilities does your institution actively perform?')
    expect(organizationPage).toContain('Search research programs and capabilities')
    expect(organizationPage).toContain('org_research_focus')
    expect(taxonomy).toContain('Clinical Research Site')
    expect(taxonomy).toContain('Prospective Biospecimen Collection')
    expect(taxonomy).toContain('IVD Clinical Performance Studies')
    expect(taxonomy).toContain('Diagnostic Validation Studies')
    expect(taxonomy).toContain('Observational Studies')
    expect(taxonomy).toContain('Real World Evidence (RWE)')
    expect(taxonomy).toContain('Population Screening')
    expect(taxonomy).toContain('AI / Clinical Decision Support Validation')
  })

  it('models institutional locations instead of a single address', () => {
    const organizationPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'organization', 'page.tsx'))
    const locationModel = read(join(WEB_SRC, 'lib', 'onboarding', 'institutional-locations.ts'))

    expect(organizationPage).toContain('org_locations')
    expect(organizationPage).toContain('Institutional Locations')
    expect(organizationPage).toContain('Add network member')
    expect(organizationPage).toContain('Set as Primary')
    expect(organizationPage).toContain('Duplicate')
    expect(organizationPage).toContain('Collapse')
    expect(locationModel).toContain('Primary Research Site')
    expect(locationModel).toContain('Satellite Research Site')
    expect(locationModel).toContain('Central Laboratory')
    expect(locationModel).toContain('Biobank')
    expect(locationModel).toContain('Mobile Research Unit')
    expect(locationModel).toContain('Partner Practice')
  })

  it('models infrastructure per operational location without duplicate footprint questions', () => {
    const infrastructurePage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'infrastructure', 'page.tsx'))
    const infrastructureModel = read(join(WEB_SRC, 'lib', 'onboarding', 'location-infrastructure.ts'))

    expect(infrastructurePage).toContain('org_locations')
    expect(infrastructurePage).toContain('infra_location_infrastructure')
    expect(infrastructurePage).toContain('Now tell us what exists at each operational location')
    expect(infrastructurePage).toContain('Configure Infrastructure')
    expect(infrastructurePage).toContain('What type of facility is this location?')
    expect(infrastructurePage).toContain('Does this location operate a laboratory?')
    expect(infrastructurePage).toContain('At this location, do you collect, process, store, or ship biospecimens?')
    expect(infrastructurePage).not.toContain('How many physical locations does your institution operate from?')
    expect(infrastructurePage).not.toContain('What type of facility is your primary research site?')
    expect(infrastructureModel).toContain('LocationInfrastructure')
    expect(infrastructureModel).toContain('-80C Freezer')
    expect(infrastructureModel).toContain('BIOSPECIMEN_OPERATION_OPTIONS')
  })

  it('models operational footprint instead of a single geographic reach label', () => {
    const organizationPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'organization', 'page.tsx'))
    const context = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-context.tsx'))
    const taxonomy = read(join(WEB_SRC, 'lib', 'onboarding', 'operational-footprint-taxonomy.ts'))

    expect(organizationPage).toContain('Operational Footprint')
    expect(organizationPage).toContain('org_operational_coverage')
    expect(organizationPage).not.toContain('org_geographic_reach:')
    expect(context).toContain('org_geographic_reach')
    expect(organizationPage).toContain('org_active_regions')
    expect(organizationPage).toContain('org_countries')
    expect(organizationPage).toContain('org_recruitment_reach')
    expect(organizationPage).toContain('org_sample_logistics')
    expect(organizationPage).toContain('org_operational_assets')
    expect(organizationPage).toContain('org_time_zones')
    expect(taxonomy).toContain('Multi-State')
    expect(taxonomy).toContain('Digital recruitment')
    expect(taxonomy).toContain('Mobile collection')
    expect(taxonomy).toContain('International collection network')
    expect(taxonomy).toContain('Central laboratory')
    expect(taxonomy).toContain('America/Chicago')
  })

  it('models people as an institutional research team', () => {
    const peoplePage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'people', 'page.tsx'))
    const teamModel = read(join(WEB_SRC, 'lib', 'onboarding', 'research-team.ts'))
    const context = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-context.tsx'))

    expect(peoplePage).toContain('Primary Research Leadership')
    expect(peoplePage).toContain('+ Add Team Member')
    expect(peoplePage).toContain('people_team_members')
    expect(peoplePage).toContain('Principal Investigator')
    expect(peoplePage).toContain('Therapeutic Expertise')
    expect(peoplePage).toContain('Research Experience')
    expect(peoplePage).toContain('Certifications & Training')
    expect(peoplePage).toContain('+ Add Certification')
    expect(peoplePage).toContain('Certification Type')
    expect(peoplePage).toContain('Research Certifications')
    expect(peoplePage).not.toContain('Which certifications does your team hold?')
    expect(peoplePage).not.toContain('Are there any expired certifications?')
    expect(peoplePage).toContain('Duplicate')
    expect(peoplePage).toContain('Remove')
    expect(teamModel).toContain('Medical Director')
    expect(teamModel).toContain('Clinical Research Coordinator')
    expect(teamModel).toContain('Laboratory Director')
    expect(teamModel).toContain('IVD experience')
    expect(teamModel).toContain('Biospecimen experience')
    expect(teamModel).toContain('StaffCertification')
    expect(teamModel).toContain('GCP (Good Clinical Practice)')
    expect(teamModel).toContain('IATA Dangerous Goods')
    expect(teamModel).toContain('State Medical License')
    expect(context).toContain('people_team_members')
    expect(context).toContain('teamCertifications')
  })

  it('wires onboarding context to localStorage and derived progress keys', () => {
    const context = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-context.tsx'))

    expect(context).toContain("localStorage.getItem('kadarn-onboarding')")
    expect(context).toContain("localStorage.setItem('kadarn-onboarding'")
    expect(context).toContain('createPersistedOnboardingState(state)')
    expect(context).toContain('people_pi_name')
    expect(context).toContain('docs_uploaded_count')
  })

  it('adds uploaded documents to onboarding state with visible metadata', () => {
    const documentsPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'documents', 'page.tsx'))

    expect(documentsPage).toContain('addDocument(doc)')
    expect(documentsPage).toContain("status: 'uploaded'")
    expect(documentsPage).toContain('uploadedAt')
    expect(documentsPage).toContain('Uploaded and attached to onboarding state')
  })

  it('uses a broad institutional evidence document taxonomy', () => {
    const documentsPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'documents', 'page.tsx'))
    const taxonomy = read(join(WEB_SRC, 'lib', 'onboarding', 'document-taxonomy.ts'))

    expect(documentsPage).toContain('Canonical Institutional Evidence Taxonomy')
    expect(documentsPage).toContain('DOCUMENT_TAXONOMY')
    expect(documentsPage).toContain('Linked Entity')
    expect(documentsPage).toContain('Linked Capability')
    expect(documentsPage).toContain('Readiness Impact')
    expect(documentsPage).toContain('Passport Impact')
    expect(taxonomy).toContain('Corporate & Legal')
    expect(taxonomy).toContain('Regulatory')
    expect(taxonomy).toContain('Personnel')
    expect(taxonomy).toContain('Quality System')
    expect(taxonomy).toContain('Biospecimen Operations')
    expect(taxonomy).toContain('Technology')
    expect(taxonomy).toContain('Community & Outreach')
    expect(taxonomy).toContain('Business Registration')
    expect(taxonomy).toContain('GCP Certificates')
    expect(taxonomy).toContain('Temperature Excursion Logs')
    expect(taxonomy).toContain('Disaster Recovery Plan')
  })

  it('adds an Institutional Memory module for cumulative history', () => {
    const memoryPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'memory', 'page.tsx'))
    const memoryModel = read(join(WEB_SRC, 'lib', 'onboarding', 'institutional-memory.ts'))
    const journey = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-journey.ts'))
    const documentsPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'documents', 'page.tsx'))

    expect(journey).toContain("'memory'")
    expect(journey).toContain('Institutional experience accumulates')
    expect(documentsPage).toContain('/onboarding/memory')
    expect(memoryPage).toContain('Institutional Memory')
    expect(memoryPage).toContain('How did this institution become what it is today?')
    expect(memoryPage).toContain('Add Historical Event')
    expect(memoryPage).toContain('Institutional Timeline')
    expect(memoryPage).toContain('Research History')
    expect(memoryPage).toContain('Capability Evolution')
    expect(memoryPage).toContain('Document History')
    expect(memoryPage).toContain('People History')
    expect(memoryPage).toContain('Location / Infrastructure History')
    expect(memoryPage).toContain('Link event to evidence/documents when available')
    expect(memoryModel).toContain('InstitutionalMemoryEvent')
    expect(memoryModel).toContain('MEMORY_DOMAIN_OPTIONS')
  })

  it('positions capabilities as a derived results screen', () => {
    const capabilitiesPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'capabilities', 'page.tsx'))

    expect(capabilitiesPage).toContain('First Derived Result / Capabilities')
    expect(capabilitiesPage).toContain('We analyzed the information you')
    expect(capabilitiesPage).toContain('This page is informational')
    expect(capabilitiesPage).toContain('Why it was derived')
    expect(capabilitiesPage).toContain('Evidence currently supporting it')
    expect(capabilitiesPage).toContain('Missing evidence that would strengthen it')
    expect(capabilitiesPage).toContain('Improve this capability')
    expect(capabilitiesPage).toContain('getCapabilityImproveHref')
    expect(capabilitiesPage).not.toContain('QuestionRenderer')
    expect(capabilitiesPage).not.toContain('onChange=')
  })

  it('presents readiness as an institutional maturity profile', () => {
    const readinessPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'readiness', 'page.tsx'))

    expect(readinessPage).toContain('Institution Readiness Profile')
    expect(readinessPage).toContain('Current Maturity')
    expect(readinessPage).toContain('Foundational')
    expect(readinessPage).toContain('Programs You Are Currently Ready To Support')
    expect(readinessPage).toContain('Quick Wins')
    expect(readinessPage).toContain('Readiness Domains')
    expect(readinessPage).toContain('Evidence supporting this assessment')
    expect(readinessPage).toContain('What is preventing higher readiness')
    expect(readinessPage).toContain('Recommended actions')
    expect(readinessPage).toContain('Estimated readiness gain')
    expect(readinessPage).toContain('Linked capabilities')
    expect(readinessPage).toContain('Linked documents')
    expect(readinessPage).toContain('Linked locations')
    expect(readinessPage).toContain('Linked people')
    expect(readinessPage).not.toContain('Overall Readiness')
  })

  it('keeps Passport sharing on the current MVP route instead of a dead public route', () => {
    const passportPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'passport', 'page.tsx'))

    expect(passportPage).toContain('window.location.href')
    expect(passportPage).not.toContain('/site-passport/${passport.institutionId}')
  })

  it('positions Passport as a current institutional snapshot, not historical memory', () => {
    const passportPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'passport', 'page.tsx'))
    const journey = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-journey.ts'))

    expect(journey).toContain('current snapshot')
    expect(passportPage).toContain('Current Institution Passport')
    expect(passportPage).toContain('Who is this institution today, and what can it currently demonstrate?')
    expect(passportPage).toContain('present-time snapshot')
    expect(passportPage).toContain('Historical milestones stay in Institutional Memory')
    expect(passportPage).toContain('Who We Are')
    expect(passportPage).toContain('What We Can Prove')
    expect(passportPage).toContain('What We Can Do')
    expect(passportPage).toContain('How Ready We Are')
    expect(passportPage).toContain('What We Should Do Next')
    expect(passportPage).toContain('Current Active Evidence')
    expect(passportPage).toContain('Critical Documents')
    expect(passportPage).toContain('Valid Certifications')
    expect(passportPage).toContain('Active Licenses')
    expect(passportPage).toContain('Missing Evidence')
    expect(passportPage).toContain('Programs Currently Supportable')
    expect(passportPage).toContain('Missing Documents')
    expect(passportPage).toContain('Expiring Documents')
    expect(passportPage).toContain('Capability Gaps')
    expect(passportPage).toContain('Readiness Improvements')
    expect(passportPage).toContain('Share Passport')
    expect(passportPage).toContain('Export as PDF')
    expect(passportPage).toContain('/onboarding/memory')
    expect(passportPage).not.toContain('living identity')
  })

  it('creates an Institution Roadmap module for prioritized future actions', () => {
    const roadmapPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'roadmap', 'page.tsx'))
    const roadmapModel = read(join(WEB_SRC, 'lib', 'onboarding', 'institution-roadmap.ts'))
    const journey = read(join(WEB_SRC, 'lib', 'onboarding', 'onboarding-journey.ts'))
    const passportPage = read(join(WEB_APP, '(onboarding)', 'onboarding', 'passport', 'page.tsx'))

    expect(journey).toContain("'roadmap'")
    expect(journey).toContain('What to build next')
    expect(passportPage).toContain('/onboarding/roadmap')
    expect(roadmapPage).toContain('Institution Roadmap')
    expect(roadmapPage).toContain('What should this institution build next?')
    expect(roadmapModel).toContain('Immediate Actions')
    expect(roadmapModel).toContain('Capability Expansion')
    expect(roadmapModel).toContain('Readiness Improvement')
    expect(roadmapModel).toContain('Compliance / Renewal Calendar')
    expect(roadmapModel).toContain('Strategic Growth')
    expect(roadmapPage).toContain('Why it matters')
    expect(roadmapPage).toContain('What it improves')
    expect(roadmapPage).toContain('Required evidence')
    expect(roadmapPage).toContain('Estimated impact')
    expect(roadmapPage).toContain('Linked section to fix it')
    expect(roadmapModel).toContain('deriveInstitutionRoadmap')
    expect(roadmapModel).toContain('ROADMAP_SECTION')
  })

  it('derives roadmap actions from Passport gaps and institutional gaps', () => {
    const answers = {
      org_name: 'Roadmap Research Institute',
      org_type: 'Independent Research Institute',
      org_research_focus: ['Clinical Research Site'],
      org_locations: [
        {
          id: 'location-1',
          name: '',
          type: '',
          street: '',
          city: '',
          state: 'TX',
          country: '',
          zip: '',
          timeZone: '',
          isPrimary: true,
        },
      ],
      people_team_members: [
        {
          id: 'team-1',
          firstName: 'Sarah',
          lastName: 'Chen',
          credentials: 'MD',
          primaryRole: 'Principal Investigator',
          email: 'sarah@example.test',
          phone: '',
          primaryLocationId: 'location-1',
          languages: ['English'],
          employmentStatus: 'Full-time',
          researchRoles: ['Principal Investigator'],
          isPrincipalInvestigator: true,
          therapeuticExpertise: ['Oncology'],
          yearsExperience: '10',
          completedStudies: '5',
          currentStudies: '1',
          phaseExperience: ['Phase II'],
          certifications: [
            {
              id: 'cert-1',
              type: 'GCP (Good Clinical Practice)',
              certificationNumber: '',
              issuingOrganization: 'CITI',
              issueDate: '2023-01-01',
              expirationDate: '2024-01-01',
              currentStatus: 'Expired',
            },
          ],
        },
      ],
      infra_location_infrastructure: [
        {
          locationId: 'location-1',
          facilityType: '',
          dedicatedResearchSpace: '',
          examRooms: '',
          infusionCapability: false,
          procedureRooms: '',
          overnightEarlyPhaseCapacity: false,
          backupPower: 'No backup power',
          laboratoryPresent: false,
          pharmacyPresent: false,
          imagingPresent: false,
          biospecimenProcessingPresent: false,
          storageEquipment: [],
          temperatureMonitoring: '',
          shippingCapability: '',
          biospecimenOperations: [],
        },
      ],
    }
    const passport = assemblePassport({
      institutionId: 'roadmap-test',
      institutionName: '',
      answers,
      uploadedDocs: [],
    })
    const roadmap = deriveInstitutionRoadmap({ passport, answers })

    expect(roadmap.currentReadinessLevel).toBeTruthy()
    expect(roadmap.targetReadinessLevel).toBeTruthy()
    expect(roadmap.actions.map((action) => action.section)).toContain('Immediate Actions')
    expect(roadmap.actions.map((action) => action.section)).toContain('Readiness Improvement')
    expect(roadmap.actions.map((action) => action.section)).toContain('Strategic Growth')
    expect(roadmap.actions.some((action) => action.title.includes('Upload'))).toBe(true)
    expect(roadmap.actions.some((action) => action.title.includes('location'))).toBe(true)
    expect(roadmap.actions.some((action) => action.title.includes('certification'))).toBe(true)
    expect(roadmap.actions.every((action) => action.whyItMatters.length > 0)).toBe(true)
    expect(roadmap.actions.every((action) => action.improves.length > 0)).toBe(true)
    expect(roadmap.actions.every((action) => action.requiredEvidence.length > 0)).toBe(true)
    expect(roadmap.actions.every((action) => action.estimatedImpact.length > 0)).toBe(true)
    expect(roadmap.actions.every((action) => action.href.startsWith('/onboarding/'))).toBe(true)
  })
})
