export type VulnerabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'UNVERIFIED'
export type RequestStatus = 'PENDING' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED'

export interface StaffBeneficiary {
  id: string
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  vulnerability: VulnerabilityLevel
  verification: VerificationStatus
  age?: number
  sex?: string
  contactNumber?: string
  address?: string
  employmentStatus?: string
  housingCondition?: string
  vulnerabilityIndicators?: string[]
  membershipType?: string
}

export const staffStats = {
  totalBeneficiaries: 0,
  assessedBeneficiaries: 0,
  highVulnerability: 0,
  pendingVerification: 0,
  approvedAssistance: 0,
}

export const recentBeneficiaries: { name: string; association: string; dateAdded: string }[] = []

export const pendingVerification: { name: string; association: string }[] = []

export const priorityCases: { name: string; association: string; risk: VulnerabilityLevel }[] = []

export const recentActivities: { text: string; time: string }[] = []

export const staffBeneficiaries: StaffBeneficiary[] = []

export interface AssessmentBeneficiary {
  id: string
  label: string
  name: string
  association: string
  familySize: number
  monthlyIncome: number
  score: number
  classification: VulnerabilityLevel
  /**
   * Which engine produced the score above. `ml` means the decision tree and
   * logistic regression scored the household; `rules` means the ML service was
   * unreachable and the local rule scorer stood in. The two are never allowed
   * to look alike on screen.
   */
  engine: 'ml' | 'rules'
  decisionTreePrediction?: VulnerabilityLevel
  logisticRegressionPrediction?: VulnerabilityLevel
  /** False when the two models chose different classes. */
  agreement?: boolean
  /** Short human-readable list of the household's salient features. */
  factors?: string[]
}

export const assessmentBeneficiaries: AssessmentBeneficiary[] = []

export function rankedAssessmentBeneficiaries() {
  return [...assessmentBeneficiaries].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

export const assessmentFactors: { text: string; type: 'danger' | 'warning' | 'success' }[] = []

export const staffAssistanceRequests: {
  id: string
  association: string
  program: string
  date: string
  priority: number
  status: RequestStatus
}[] = []

export const staffPriorityList: {
  rank: number
  name: string
  association: string
  score: number
  classification: VulnerabilityLevel
  program: string
  verification: VerificationStatus
}[] = []

export const staffRecommendations: {
  id: string
  name: string
  date: string
  score: number
  level: VulnerabilityLevel
  program: string
  description: string
  previousAssistance: string
}[] = []

export const staffApprovedRequests: {
  id: string
  beneficiary: string
  association: string
  program: string
  approvedDate: string
  approvedBy: string
  beneficiaries: number
  status: string
  distributionDate: string
}[] = []

export const staffReports = [
  { title: 'Beneficiary Report', description: 'Summary of registered beneficiaries, household sizes, and verification status.' },
  { title: 'Vulnerability Report', description: 'Risk allocations and at-risk priority classifications.' },
  { title: 'Assistance Report', description: 'Tracking of assistance programs and distribution channels.' },
  { title: 'Program Status Report', description: 'Overview of active programs, approvals, and disbursement status.' },
]

export const staffProfile = {
  fullName: '',
  employeeId: '',
  position: '',
  role: '',
  email: '',
  phone: '',
  department: '',
  dateJoined: '',
  lastLogin: '',
}

export const associations: string[] = []
