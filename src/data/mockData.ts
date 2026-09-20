export type VulnerabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'UNDER REVIEW' | 'REJECTED'
export type MatchStatus = 'HIGH MATCH' | 'MEDIUM MATCH' | 'MODERATE MATCH'

export const dashboardStats = {
  totalAssociations: 24,
  totalBeneficiaries: 156,
  pendingRequests: 12,
  approvedAssistance: 89,
  highVulnerability: 18,
}

export const vulnerabilityDistribution = {
  total: 156,
  high: { count: 18, percent: 11.5 },
  medium: { count: 54, percent: 34.6 },
  low: { count: 84, percent: 53.8 },
}

export const recentAssistanceRequests = [
  { association: 'Buru-un Fishermen Assoc.', requestType: 'Livelihood Gear', vulnerability: 'HIGH' as VulnerabilityLevel, date: 'Oct 24, 2023', status: 'PENDING' as RequestStatus },
  { association: "Sitoy Farmer's Group", requestType: 'Fertilizer Subsidy', vulnerability: 'HIGH' as VulnerabilityLevel, date: 'Oct 23, 2023', status: 'APPROVED' as RequestStatus },
  { association: 'PWD Group', requestType: 'Medical Assistance', vulnerability: 'MEDIUM' as VulnerabilityLevel, date: 'Oct 22, 2023', status: 'PENDING' as RequestStatus },
  { association: "Purok 3 Women's Guild", requestType: 'Livelihood Training', vulnerability: 'MEDIUM' as VulnerabilityLevel, date: 'Oct 21, 2023', status: 'APPROVED' as RequestStatus },
  { association: 'Senior Citizens Club', requestType: 'Food Subsidy', vulnerability: 'LOW' as VulnerabilityLevel, date: 'Oct 20, 2023', status: 'APPROVED' as RequestStatus },
]

export const aiRecommendations = [
  { association: "Sitoy Farmer's Group", score: 89, program: 'DA Fertilizer Distribution', matchStatus: 'HIGH MATCH' as MatchStatus },
  { association: 'Buru-un Fishermen Assoc.', score: 82, program: 'BFAR Fishery Gear Subsidy', matchStatus: 'HIGH MATCH' as MatchStatus },
  { association: "Purok 3 Women's Guild", score: 74, program: 'DSWD Livelihood Training', matchStatus: 'MEDIUM MATCH' as MatchStatus },
  { association: 'Senior Citizens Club', score: 68, program: 'Free Maintenance Medicine', matchStatus: 'MODERATE MATCH' as MatchStatus },
]

export const recentActivity = [
  { text: 'AI Vulnerability assessment computed for Sitoy Farmers', time: '10 minutes ago' },
  { text: 'Barangay Captain approved Food Subsidy for Purok 3', time: '1 hour ago' },
  { text: 'Staff manually updated Income Level for Juan dela Cruz', time: '4 hours ago' },
  { text: 'New association registration submitted by Youth Org', time: '6 hours ago' },
  { text: 'Priority list exported by Administrator', time: 'Yesterday' },
]

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
}

export const associationTypes: AssociationType[] = [
  'Agricultural',
  'Livelihood',
  'Special Sector',
  'Youth',
]

export const associations: Association[] = [
  { id: '1', name: 'Farmers Association', type: 'Agricultural', members: 45, contactPerson: 'Juan dela Cruz', contactNumber: '+63 917 123 4567', dateRegistered: 'Jan 12, 2020', status: 'ACTIVE' },
  { id: '2', name: 'Fishermen Association', type: 'Livelihood', members: 32, contactPerson: 'Pedro Santos', contactNumber: '+63 918 234 5678', dateRegistered: 'Mar 5, 2019', status: 'ACTIVE' },
  { id: '3', name: 'PWD Group', type: 'Special Sector', members: 28, contactPerson: 'Maria Garcia', contactNumber: '+63 919 345 6789', dateRegistered: 'Jun 18, 2021', status: 'ACTIVE' },
  { id: '4', name: 'Youth Organization', type: 'Youth', members: 52, contactPerson: 'Ana Reyes', contactNumber: '+63 920 456 7890', dateRegistered: 'Aug 22, 2022', status: 'ACTIVE' },
  { id: '5', name: "Sitoy Farmer's Group", type: 'Agricultural', members: 38, contactPerson: 'Ricardo Lopez', contactNumber: '+63 921 567 8901', dateRegistered: 'Feb 14, 2020', status: 'ACTIVE' },
  { id: '6', name: "Purok 3 Women's Guild", type: 'Livelihood', members: 41, contactPerson: 'Elena Torres', contactNumber: '+63 922 678 9012', dateRegistered: 'Nov 3, 2021', status: 'ACTIVE' },
  { id: '7', name: 'Senior Citizens Club', type: 'Special Sector', members: 35, contactPerson: 'Luis Mendoza', contactNumber: '+63 923 789 0123', dateRegistered: 'Apr 7, 2018', status: 'ACTIVE' },
  { id: '8', name: 'Buru-un Fishermen Assoc.', type: 'Livelihood', members: 29, contactPerson: 'Carlos Rivera', contactNumber: '+63 924 890 1234', dateRegistered: 'Sep 15, 2019', status: 'ACTIVE' },
]

export const associationStats = {
  total: 24,
  active: 22,
  membersServed: 486,
  pendingRegistration: 2,
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

export const beneficiaries: Beneficiary[] = [
  { id: '1', name: 'Maria Santos', association: "Sitoy Farmer's Group", familySize: 6, monthlyIncome: 4500, elderly: 'Yes (1)', pwd: 'No', housing: 'Light Materials', vulnerability: 'HIGH', status: 'ACTIVE' },
  { id: '2', name: 'Juan dela Cruz', association: 'Farmers Association', familySize: 5, monthlyIncome: 6200, elderly: 'No', pwd: 'No', housing: 'Concrete', vulnerability: 'LOW', status: 'ACTIVE' },
  { id: '3', name: 'Pedro Santos', association: 'Fishermen Association', familySize: 7, monthlyIncome: 3800, elderly: 'Yes (2)', pwd: 'Yes (1)', housing: 'Light Materials', vulnerability: 'HIGH', status: 'ACTIVE' },
  { id: '4', name: 'Ana Reyes', association: 'Youth Organization', familySize: 4, monthlyIncome: 8500, elderly: 'No', pwd: 'No', housing: 'Concrete', vulnerability: 'LOW', status: 'ACTIVE' },
  { id: '5', name: 'Elena Torres', association: "Purok 3 Women's Guild", familySize: 5, monthlyIncome: 5200, elderly: 'Yes (1)', pwd: 'No', housing: 'Temporary/Salvaged', vulnerability: 'MEDIUM', status: 'ACTIVE' },
  { id: '6', name: 'Carlos Rivera', association: 'Buru-un Fishermen Assoc.', familySize: 6, monthlyIncome: 4100, elderly: 'No', pwd: 'Yes (1)', housing: 'Light Materials', vulnerability: 'HIGH', status: 'ACTIVE' },
]

export const pendingRecommendations = [
  {
    name: "Sitoy Farmer's Group",
    date: 'Submitted Oct 24, 2023',
    score: 89,
    level: 'HIGH' as VulnerabilityLevel,
    program: 'Department of Agriculture Fertilizer Subsidy',
    description: 'Crop damage profile and low relative household income across member families indicate urgent agricultural support need.',
    previousAssistance: 'None within last 12 months',
  },
  {
    name: 'Buru-un Fishermen Assoc.',
    date: 'Submitted Oct 23, 2023',
    score: 82,
    level: 'HIGH' as VulnerabilityLevel,
    program: 'BFAR Direct Fishery Gear Subsidy Program',
    description: 'Lack of motorized fishing crafts and high vulnerability rating among 29 member households.',
    previousAssistance: 'Food pack — March 2023',
  },
  {
    name: "Purok 3 Women's Guild",
    date: 'Submitted Oct 22, 2023',
    score: 74,
    level: 'MEDIUM' as VulnerabilityLevel,
    program: 'DSWD Livelihood Skills Training & Grant Combo',
    description: 'High concentrations of single-parent households with limited income-generating activities.',
    previousAssistance: 'None within last 12 months',
  },
  {
    name: 'Buru-un Senior Citizens Club',
    date: 'Submitted Oct 21, 2023',
    score: 68,
    level: 'MEDIUM' as VulnerabilityLevel,
    program: 'Barangay Free Maintenance Medicine allocation',
    description: 'High density of low-income senior couples requiring recurring medical support.',
    previousAssistance: 'Medicine grant — June 2023',
  },
]

export const priorityList: PriorityListEntry[] = [
  { id: 'pl-1', rank: 1, association: 'Farmers Association', score: 92, classification: 'HIGH', recommended: 'Food Assistance', previousAid: 'None', status: 'PENDING' },
  { id: 'pl-2', rank: 2, association: 'PWD Group', score: 88, classification: 'HIGH', recommended: 'Medical Assistance', previousAid: 'Yes', status: 'APPROVED' },
  { id: 'pl-3', rank: 3, association: "Sitoy Farmer's Group", score: 85, classification: 'HIGH', recommended: 'Livelihood Training', previousAid: 'None', status: 'UNDER REVIEW' },
  { id: 'pl-4', rank: 4, association: 'Buru-un Fishermen Assoc.', score: 78, classification: 'MEDIUM', recommended: 'Livelihood Training', previousAid: 'Yes', status: 'PENDING' },
  { id: 'pl-5', rank: 5, association: "Purok 3 Women's Guild", score: 72, classification: 'MEDIUM', recommended: 'Food Assistance', previousAid: 'None', status: 'PENDING' },
  { id: 'pl-6', rank: 6, association: 'Senior Citizens Club', score: 65, classification: 'MEDIUM', recommended: 'Medical Assistance', previousAid: 'Yes', status: 'APPROVED' },
  { id: 'pl-7', rank: 7, association: 'Youth Organization', score: 42, classification: 'LOW', recommended: 'Livelihood Training', previousAid: 'None', status: 'PENDING' },
]

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

export const reportHistory: ReportHistoryEntry[] = [
  {
    id: 'rh-1',
    name: 'Beneficiary_Summary_August2026.pdf',
    generatedBy: 'Barangay Staff',
    date: 'Aug 10, 2026 10:15 AM',
    format: 'PDF',
    reportType: 'beneficiary',
  },
  {
    id: 'rh-2',
    name: 'Vulnerability_Assessment_Q3_2026.xlsx',
    generatedBy: 'Administrator',
    date: 'Aug 8, 2026 2:30 PM',
    format: 'EXCEL',
    reportType: 'vulnerability',
  },
  {
    id: 'rh-3',
    name: 'Assistance_Distribution_July2026.pdf',
    generatedBy: 'Barangay Staff',
    date: 'Aug 5, 2026 9:00 AM',
    format: 'PDF',
    reportType: 'assistance',
  },
  {
    id: 'rh-4',
    name: 'AI_Scoring_Log_August2026.pdf',
    generatedBy: 'Administrator',
    date: 'Aug 3, 2026 4:45 PM',
    format: 'PDF',
    reportType: 'ai_scoring',
  },
]

export const systemUsers = [
  { name: 'Hon. Ricardo L. Dela Cruz', role: 'Administrator', email: 'captain@barangayburuun.gov.ph', status: 'ACTIVE', lastActive: 'Aug 11, 2026' },
  { name: 'Bryan S. Martinez', role: 'Staff', email: 'bryan.martinez@barangayburuun.gov.ph', status: 'ACTIVE', lastActive: 'Aug 11, 2026' },
  { name: 'Ana R. Garcia', role: 'Viewer', email: 'ana.garcia@barangayburuun.gov.ph', status: 'ACTIVE', lastActive: 'Aug 10, 2026' },
  { name: 'Maria L. Santos', role: 'Staff', email: 'maria.santos@barangayburuun.gov.ph', status: 'ACTIVE', lastActive: 'Aug 9, 2026' },
  { name: 'Pedro M. Reyes', role: 'Viewer', email: 'pedro.reyes@barangayburuun.gov.ph', status: 'INACTIVE', lastActive: 'Jul 15, 2026' },
]

export const assistanceRequests = [
  { association: 'Buru-un Fishermen Assoc.', requestType: 'Livelihood Gear', vulnerability: 'HIGH' as VulnerabilityLevel, date: 'Oct 24, 2023', status: 'PENDING' as RequestStatus },
  { association: "Sitoy Farmer's Group", requestType: 'Fertilizer Subsidy', vulnerability: 'HIGH' as VulnerabilityLevel, date: 'Oct 23, 2023', status: 'APPROVED' as RequestStatus },
  { association: 'PWD Group', requestType: 'Medical Assistance', vulnerability: 'MEDIUM' as VulnerabilityLevel, date: 'Oct 22, 2023', status: 'PENDING' as RequestStatus },
  { association: "Purok 3 Women's Guild", requestType: 'Livelihood Training', vulnerability: 'MEDIUM' as VulnerabilityLevel, date: 'Oct 21, 2023', status: 'UNDER REVIEW' as RequestStatus },
  { association: 'Senior Citizens Club', requestType: 'Food Subsidy', vulnerability: 'LOW' as VulnerabilityLevel, date: 'Oct 20, 2023', status: 'APPROVED' as RequestStatus },
  { association: 'Youth Organization', requestType: 'Skills Training', vulnerability: 'LOW' as VulnerabilityLevel, date: 'Oct 19, 2023', status: 'PENDING' as RequestStatus },
]
