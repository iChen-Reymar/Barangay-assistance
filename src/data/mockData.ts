export type VulnerabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'UNDER REVIEW' | 'REJECTED'
export type MatchStatus = 'HIGH MATCH' | 'MEDIUM MATCH' | 'MODERATE MATCH'

export const dashboardStats = {
  totalAssociations: 0,
  totalBeneficiaries: 0,
  pendingRequests: 0,
  approvedAssistance: 0,
  highVulnerability: 0,
}

export const vulnerabilityDistribution = {
  total: 0,
  high: { count: 0, percent: 0 },
  medium: { count: 0, percent: 0 },
  low: { count: 0, percent: 0 },
}

export const recentAssistanceRequests: {
  association: string
  requestType: string
  vulnerability: VulnerabilityLevel
  date: string
  status: RequestStatus
}[] = []

export const aiRecommendations: {
  association: string
  score: number
  program: string
  matchStatus: MatchStatus
}[] = []

export const recentActivity: { text: string; time: string }[] = []

export type AssociationStatus = 'ACTIVE' | 'INACTIVE'

export type AssociationType = 'Agricultural' | 'Livelihood' | 'Special Sector' | 'Youth'

export interface Association {
  id: string
  name: string
  type: AssociationType
  members: number
  contactPerson: string
  contactNumber: string
  dateRegistered: string
  status: AssociationStatus
  headUserId?: string
  email?: string
  address?: string
  description?: string
  registrationNumber?: string
}

export const associationTypes: AssociationType[] = [
  'Agricultural',
  'Livelihood',
  'Special Sector',
  'Youth',
]

export const associations: Association[] = []

export const associationStats = {
  total: 0,
  active: 0,
  membersServed: 0,
  pendingRegistration: 0,
}

export type BeneficiaryStatus = 'ACTIVE' | 'INACTIVE'

export type HousingType = 'Concrete' | 'Light Materials' | 'Temporary/Salvaged'

export interface Beneficiary {
  id: string
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  elderly: string
  pwd: string
  housing: HousingType
  vulnerability: VulnerabilityLevel
  status: BeneficiaryStatus
}

export const housingTypes: HousingType[] = ['Concrete', 'Light Materials', 'Temporary/Salvaged']

export interface PriorityListEntry {
  id: string
  rank: number
  association: string
  score: number
  classification: VulnerabilityLevel
  recommended: string
  previousAid: 'None' | 'Yes'
  status: RequestStatus
  notes?: string
}

export function classificationFromScore(score: number): VulnerabilityLevel {
  if (score >= 80) return 'HIGH'
  if (score >= 60) return 'MEDIUM'
  return 'LOW'
}

export function computeVulnerability(input: {
  monthlyIncome: number
  elderlyCount: number
  pwdCount: number
  housing: HousingType
  familySize: number
}): VulnerabilityLevel {
  let score = 0
  if (input.monthlyIncome < 4000) score += 3
  else if (input.monthlyIncome < 6000) score += 2
  else if (input.monthlyIncome < 8000) score += 1
  if (input.elderlyCount > 0) score += 2
  if (input.pwdCount > 0) score += 2
  if (input.housing !== 'Concrete') score += 2
  if (input.familySize >= 6) score += 1
  if (score >= 5) return 'HIGH'
  if (score >= 3) return 'MEDIUM'
  return 'LOW'
}

export function formatElderlyPwd(count: number) {
  return count > 0 ? `Yes (${count})` : 'No'
}

export const beneficiaries: Beneficiary[] = []

export const pendingRecommendations: {
  name: string
  date: string
  score: number
  level: VulnerabilityLevel
  program: string
  description: string
  previousAssistance: string
}[] = []

export const priorityList: PriorityListEntry[] = []

export type ReportHistoryType =
  | 'beneficiary'
  | 'vulnerability'
  | 'assistance'
  | 'approved'
  | 'ai_scoring'
  | 'audit'

export interface ReportTemplate {
  title: string
  description: string
  icon: string
  slug: string
  reportType: ReportHistoryType
}

export const reportTemplates: ReportTemplate[] = [
  {
    title: 'Beneficiary Report',
    description: 'Summary of registered beneficiaries, household size, and location metrics.',
    icon: 'users',
    slug: 'beneficiary',
    reportType: 'beneficiary',
  },
  {
    title: 'Vulnerability Report',
    description: 'Results outlining risk allocations and at-risk priorities.',
    icon: 'shield',
    slug: 'vulnerability',
    reportType: 'vulnerability',
  },
  {
    title: 'Assistance Report',
    description: 'Tracking of assistance programs and distribution channels.',
    icon: 'hand',
    slug: 'assistance',
    reportType: 'assistance',
  },
  {
    title: 'AI Assessment Report',
    description: 'AI-driven scoring logs, classification thresholds, and matching histories.',
    icon: 'cpu',
    slug: 'ai_assessment',
    reportType: 'ai_scoring',
  },
  {
    title: 'Approved Assistance Report',
    description: 'Registry of approved grants with payout timelines and status updates.',
    icon: 'check',
    slug: 'approved_assistance',
    reportType: 'approved',
  },
  {
    title: 'Audit Log Report',
    description: 'System logs, user alterations, and database queries.',
    icon: 'file',
    slug: 'audit_log',
    reportType: 'audit',
  },
]

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV'

export interface ReportHistoryEntry {
  id: string
  name: string
  generatedBy: string
  date: string
  format: ReportFormat
  reportType: ReportHistoryType
}

export const reportHistory: ReportHistoryEntry[] = []

export const systemUsers: {
  name: string
  role: string
  email: string
  status: string
  lastActive: string
}[] = []

export const assistanceRequests: {
  association: string
  requestType: string
  vulnerability: VulnerabilityLevel
  date: string
  status: RequestStatus
}[] = []
