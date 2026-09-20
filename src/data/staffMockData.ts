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
}

export const staffStats = {
  totalBeneficiaries: 248,
  assessedBeneficiaries: 195,
  highVulnerability: 42,
  pendingVerification: 18,
  approvedAssistance: 156,
}

export const recentBeneficiaries = [
  { name: 'Juan dela Cruz', association: 'Farmers Association', dateAdded: 'Oct 24, 2023' },
  { name: 'Maria Clara', association: "Sitoy Farmer's Group", dateAdded: 'Oct 23, 2023' },
  { name: 'Pedro Penduko', association: "Sitoy Farmer's Group", dateAdded: 'Oct 22, 2023' },
  { name: 'Emilio Aguinaldo', association: 'PWD Group', dateAdded: 'Oct 21, 2023' },
  { name: 'Ana Garcia', association: 'Youth Organization', dateAdded: 'Oct 20, 2023' },
]

export const pendingVerification = [
  { name: 'Emilio Aguinaldo', association: 'PWD Group' },
  { name: 'Rosa Mendoza', association: 'Senior Citizens Club' },
  { name: 'Carlos Rivera', association: 'Buru-un Fishermen Assoc.' },
  { name: 'Elena Torres', association: "Purok 3 Women's Guild" },
]

export const priorityCases = [
  { name: 'Pedro Penduko', association: "Sitoy Farmer's Group", risk: 'HIGH' as VulnerabilityLevel },
  { name: 'Maria Santos', association: "Sitoy Farmer's Group", risk: 'HIGH' as VulnerabilityLevel },
  { name: 'Pedro Reyes', association: 'Fishermen Association', risk: 'HIGH' as VulnerabilityLevel },
]

export const recentActivities = [
  { text: 'Manual update Income Level for Juan dela Cruz', time: '10 mins ago' },
  { text: 'Vulnerability assessed successfully for Pedro Penduko', time: '1 hour ago' },
  { text: 'Approved Rice Subsidy Program for Maria Clara', time: '3 hours ago' },
  { text: 'Verified beneficiary record for Ana Garcia', time: '5 hours ago' },
  { text: 'Generated Beneficiary Summary Report', time: 'Yesterday' },
]

export const staffBeneficiaries: StaffBeneficiary[] = [
  { id: '1', name: 'Juan dela Cruz', association: 'Farmers Association', familySize: 5, monthlyIncome: 8500, vulnerability: 'LOW' as VulnerabilityLevel, verification: 'VERIFIED' as VerificationStatus },
  { id: '2', name: 'Maria Clara', association: "Sitoy Farmer's Group", familySize: 4, monthlyIncome: 5200, vulnerability: 'MEDIUM' as VulnerabilityLevel, verification: 'VERIFIED' as VerificationStatus },
  { id: '3', name: 'Pedro Penduko', association: "Sitoy Farmer's Group", familySize: 7, monthlyIncome: 4200, vulnerability: 'HIGH' as VulnerabilityLevel, verification: 'VERIFIED' as VerificationStatus },
  { id: '4', name: 'Emilio Aguinaldo', association: 'PWD Group', familySize: 3, monthlyIncome: 3800, vulnerability: 'HIGH' as VulnerabilityLevel, verification: 'PENDING' as VerificationStatus },
  { id: '5', name: 'Ana Garcia', association: 'Youth Organization', familySize: 4, monthlyIncome: 7200, vulnerability: 'LOW' as VulnerabilityLevel, verification: 'VERIFIED' as VerificationStatus },
  { id: '6', name: 'Rosa Mendoza', association: 'Senior Citizens Club', familySize: 2, monthlyIncome: 3500, vulnerability: 'HIGH' as VulnerabilityLevel, verification: 'UNVERIFIED' as VerificationStatus },
  { id: '7', name: 'Carlos Rivera', association: 'Buru-un Fishermen Assoc.', familySize: 5, monthlyIncome: 4800, vulnerability: 'MEDIUM' as VulnerabilityLevel, verification: 'PENDING' as VerificationStatus },
  { id: '8', name: 'Elena Torres', association: "Purok 3 Women's Guild", familySize: 3, monthlyIncome: 4100, vulnerability: 'HIGH' as VulnerabilityLevel, verification: 'UNVERIFIED' as VerificationStatus },
]

export const assessmentBeneficiaries = [
  {
    id: '1',
    label: "Pedro Penduko (Sitoy Farmer's Group)",
    name: 'Pedro Penduko',
    association: "Sitoy Farmer's Group",
    familySize: 7,
    monthlyIncome: 4200,
  },
  {
    id: '2',
    label: 'Maria Santos (Sitoy Farmer\'s Group)',
    name: 'Maria Santos',
    association: "Sitoy Farmer's Group",
    familySize: 6,
    monthlyIncome: 4500,
  },
  {
    id: '3',
    label: 'Emilio Aguinaldo (PWD Group)',
    name: 'Emilio Aguinaldo',
    association: 'PWD Group',
    familySize: 3,
    monthlyIncome: 3800,
  },
]

export const assessmentFactors = [
  { text: 'Low household income (₱4,200/mo)', type: 'danger' as const },
  { text: 'Large family size (7 members)', type: 'danger' as const },
  { text: 'Poor housing condition (makeshift materials)', type: 'danger' as const },
  { text: 'PWD member present (elderly with disability)', type: 'warning' as const },
  { text: 'No recent assistance received (none in 6 months)', type: 'success' as const },
]

export const staffAssistanceRequests = [
  { id: 'REQ-0129', association: 'Maria Clara', program: 'Rice Subsidy', date: 'Oct 24, 2023', priority: 94, status: 'PENDING' as RequestStatus },
  { id: 'REQ-0128', association: 'Pedro Penduko', program: 'Emergency Cash Assistance', date: 'Oct 23, 2023', priority: 91, status: 'PENDING' as RequestStatus },
  { id: 'REQ-0127', association: 'Juan dela Cruz', program: 'Food Assistance', date: 'Oct 22, 2023', priority: 62, status: 'APPROVED' as RequestStatus },
  { id: 'REQ-0126', association: 'Emilio Aguinaldo', program: 'Medical Assistance', date: 'Oct 21, 2023', priority: 87, status: 'UNDER REVIEW' as RequestStatus },
  { id: 'REQ-0125', association: 'Ana Garcia', program: 'Livelihood Training', date: 'Oct 20, 2023', priority: 73, status: 'APPROVED' as RequestStatus },
  { id: 'REQ-0124', association: 'Rosa Mendoza', program: 'Food Assistance', date: 'Oct 19, 2023', priority: 85, status: 'REJECTED' as RequestStatus },
]

export const staffPriorityList = [
  { rank: 1, name: 'Pedro Penduko', association: "Sitoy Farmer's Group", score: 91, classification: 'HIGH' as VulnerabilityLevel, program: 'Food Assistance', verification: 'VERIFIED' as VerificationStatus },
  { rank: 2, name: 'Maria Santos', association: "Sitoy Farmer's Group", score: 88, classification: 'HIGH' as VulnerabilityLevel, program: 'Rice Subsidy', verification: 'VERIFIED' as VerificationStatus },
  { rank: 3, name: 'Emilio Aguinaldo', association: 'PWD Group', score: 85, classification: 'HIGH' as VulnerabilityLevel, program: 'Medical Assistance', verification: 'PENDING' as VerificationStatus },
  { rank: 4, name: 'Maria Clara', association: "Sitoy Farmer's Group", score: 72, classification: 'MEDIUM' as VulnerabilityLevel, program: 'Livelihood Training', verification: 'VERIFIED' as VerificationStatus },
  { rank: 5, name: 'Rosa Mendoza', association: 'Senior Citizens Club', score: 68, classification: 'MEDIUM' as VulnerabilityLevel, program: 'Food Assistance', verification: 'UNVERIFIED' as VerificationStatus },
  { rank: 6, name: 'Juan dela Cruz', association: 'Farmers Association', score: 35, classification: 'LOW' as VulnerabilityLevel, program: 'Skills Training', verification: 'VERIFIED' as VerificationStatus },
]

export const staffRecommendations = [
  {
    id: '1',
    name: "Sitoy Farmer's Group",
    date: 'Submitted Oct 24, 2023',
    score: 89,
    level: 'HIGH' as VulnerabilityLevel,
    program: 'Department of Agriculture Fertilizer Subsidy',
    description: 'Matched due to crop damage profile reported during high-precipitation months and low relative household income.',
    previousAssistance: 'None in last 12 months',
  },
  {
    id: '2',
    name: 'Buru-un Fishermen Assoc.',
    date: 'Submitted Oct 23, 2023',
    score: 82,
    level: 'HIGH' as VulnerabilityLevel,
    program: 'BFAR Direct Fishery Gear Subsidy Program',
    description: 'Lack of motorized fishing crafts and high vulnerability rating among member households.',
    previousAssistance: 'Food pack — March 2023',
  },
  {
    id: '3',
    name: "Purok 3 Women's Guild",
    date: 'Submitted Oct 22, 2023',
    score: 74,
    level: 'MEDIUM' as VulnerabilityLevel,
    program: 'DSWD Livelihood Skills Training & Grant Combo',
    description: 'High concentrations of single-parent households with limited income-generating activities.',
    previousAssistance: 'None in last 12 months',
  },
]

export const staffApprovedRequests = [
  { id: 'REQ-0127', beneficiary: 'Juan dela Cruz', association: 'Farmers Association', program: 'Food Assistance', approvedDate: 'Oct 22, 2023', approvedBy: 'Hon. Ricardo L. Dela Cruz', beneficiaries: 5, status: 'RELEASED', distributionDate: 'Oct 25, 2023' },
  { id: 'REQ-0125', beneficiary: 'Ana Garcia', association: 'Youth Organization', program: 'Livelihood Training', approvedDate: 'Oct 20, 2023', approvedBy: 'Hon. Ricardo L. Dela Cruz', beneficiaries: 4, status: 'SCHEDULED', distributionDate: 'Nov 2, 2023' },
  { id: 'REQ-0118', beneficiary: 'Maria Clara', association: "Sitoy Farmer's Group", program: 'Rice Subsidy', approvedDate: 'Oct 15, 2023', approvedBy: 'Hon. Ricardo L. Dela Cruz', beneficiaries: 4, status: 'RELEASED', distributionDate: 'Oct 18, 2023' },
  { id: 'REQ-0110', beneficiary: 'Pedro Penduko', association: "Sitoy Farmer's Group", program: 'Food Assistance & Rice Subsidy', approvedDate: 'Oct 10, 2023', approvedBy: 'Hon. Ricardo L. Dela Cruz', beneficiaries: 7, status: 'PENDING COLLECTION', distributionDate: 'Oct 28, 2023' },
  { id: 'REQ-0098', beneficiary: 'Elena Torres', association: "Purok 3 Women's Guild", program: 'DSWD Livelihood Grant', approvedDate: 'Sep 28, 2023', approvedBy: 'Hon. Ricardo L. Dela Cruz', beneficiaries: 3, status: 'RELEASED', distributionDate: 'Oct 5, 2023' },
]

export const staffReports = [
  { title: 'Beneficiary Report', description: 'Summary of registered beneficiaries, household sizes, and verification status.' },
  { title: 'Vulnerability Report', description: 'Risk allocations and at-risk priority classifications.' },
  { title: 'Assistance Report', description: 'Tracking of assistance programs and distribution channels.' },
  { title: 'Program Status Report', description: 'Overview of active programs, approvals, and disbursement status.' },
]

export const staffProfile = {
  fullName: 'Maria Santos',
  employeeId: 'BRU-2024-0018',
  position: 'Barangay Staff',
  role: 'Staff',
  email: 'maria.santos@barangayburuun.gov.ph',
  phone: '+63 917 234 5678',
  department: 'Social Services',
  dateJoined: 'February 10, 2024',
  lastLogin: 'August 11, 2026 — 10:30 AM',
}

export const associations = [
  'Farmers Association',
  "Sitoy Farmer's Group",
  'Fishermen Association',
  'PWD Group',
  'Youth Organization',
  'Senior Citizens Club',
  "Purok 3 Women's Guild",
]
