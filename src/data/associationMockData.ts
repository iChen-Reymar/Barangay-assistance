import type { AssociationType } from './mockData'

export type MemberStatus = 'ACTIVE' | 'INACTIVE'
export type VulnerabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type AssistanceStatus = 'NONE' | 'PENDING' | 'RECEIVED'
export type RequestTimelineStep =
  | 'Submitted'
  | 'Under Review'
  | 'AI Assessment'
  | 'Admin Review'
  | 'Approved'
  | 'Rejected'

export interface AssociationMember {
  id: string
  name: string
  age: number
  contactNumber: string
  address: string
  dateJoined: string
  familySize: number
  isPwd: boolean
  isSenior: boolean
  membershipStatus: MemberStatus
  vulnerability: VulnerabilityLevel
  assistanceStatus: AssistanceStatus
  notes?: string
}

export interface AssociationDetails {
  id: string
  name: string
  type: AssociationType
  registrationNumber: string
  dateRegistered: string
  address: string
  contactPerson: string
  contactNumber: string
  email: string
  totalMembers: number
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

export const associationProfile = {
  fullName: 'Ricardo Lopez',
  username: 'rlopez.sitoy',
  role: 'Association Head',
  association: "Sitoy Farmer's Group",
  email: 'ricardo.lopez@sitoyfarmers.org',
  phone: '+63 921 567 8901',
  address: 'Purok 2, Sitoy, Barangay Buru-un, Iligan City',
  memberSince: 'January 2020',
}

export const associationDetailsSeed: AssociationDetails = {
  id: 'assoc-sitoy',
  name: "Sitoy Farmer's Group",
  type: 'Agricultural',
  registrationNumber: 'BRU-AG-2020-014',
  dateRegistered: 'Feb 14, 2020',
  address: 'Purok 2, Sitoy, Barangay Buru-un, Iligan City',
  contactPerson: 'Ricardo Lopez',
  contactNumber: '+63 921 567 8901',
  email: 'ricardo.lopez@sitoyfarmers.org',
  totalMembers: 38,
  description:
    'Registered farmer association serving Sitoy agricultural households with collective assistance coordination and livelihood support.',
  status: 'ACTIVE',
}

export const associationStats = {
  totalMembers: 38,
  pendingRequests: 2,
  approvedRequests: 5,
  rejectedRequests: 1,
}

export const seedAssociationMembers: AssociationMember[] = [
  {
    id: '1',
    name: 'Maria Santos',
    age: 42,
    contactNumber: '+63 917 111 2233',
    address: 'Purok 2, Sitoy',
    dateJoined: 'Mar 12, 2020',
    familySize: 6,
    isPwd: false,
    isSenior: false,
    membershipStatus: 'ACTIVE',
    vulnerability: 'HIGH',
    assistanceStatus: 'PENDING',
    notes: 'Primary caregiver for elderly parent in household.',
  },
  {
    id: '2',
    name: 'Juan dela Cruz',
    age: 55,
    contactNumber: '+63 918 222 3344',
    address: 'Purok 1, Sitoy',
    dateJoined: 'Jan 20, 2020',
    familySize: 5,
    isPwd: false,
    isSenior: true,
    membershipStatus: 'ACTIVE',
    vulnerability: 'MEDIUM',
    assistanceStatus: 'RECEIVED',
  },
  {
    id: '3',
    name: 'Pedro Reyes',
    age: 38,
    contactNumber: '+63 919 333 4455',
    address: 'Purok 3, Sitoy',
    dateJoined: 'Jun 5, 2021',
    familySize: 7,
    isPwd: false,
    isSenior: false,
    membershipStatus: 'ACTIVE',
    vulnerability: 'HIGH',
    assistanceStatus: 'NONE',
  },
  {
    id: '4',
    name: 'Ana Garcia',
    age: 29,
    contactNumber: '+63 920 444 5566',
    address: 'Purok 2, Sitoy',
    dateJoined: 'Aug 15, 2022',
    familySize: 4,
    isPwd: false,
    isSenior: false,
    membershipStatus: 'ACTIVE',
    vulnerability: 'LOW',
    assistanceStatus: 'RECEIVED',
  },
  {
    id: '5',
    name: 'Elena Torres',
    age: 48,
    contactNumber: '+63 921 555 6677',
    address: 'Purok 4, Sitoy',
    dateJoined: 'Nov 3, 2021',
    familySize: 5,
    isPwd: false,
    isSenior: false,
    membershipStatus: 'INACTIVE',
    vulnerability: 'MEDIUM',
    assistanceStatus: 'NONE',
    notes: 'Temporarily inactive — relocated outside barangay.',
  },
  {
    id: '6',
    name: 'Carlos Mendoza',
    age: 61,
    contactNumber: '+63 922 666 7788',
    address: 'Purok 2, Sitoy',
    dateJoined: 'Feb 14, 2020',
    familySize: 3,
    isPwd: true,
    isSenior: true,
    membershipStatus: 'ACTIVE',
    vulnerability: 'HIGH',
    assistanceStatus: 'PENDING',
  },
]

/** @deprecated Use getAssociationMembers() from memberStorage */
export const associationMembers = seedAssociationMembers

export const recentRequests = [
  { id: '1', program: 'Food Assistance', date: 'Oct 24, 2023', status: 'PENDING' as const, members: 12 },
  { id: '2', program: 'Fertilizer Subsidy', date: 'Oct 18, 2023', status: 'UNDER REVIEW' as const, members: 38 },
  { id: '3', program: 'Livelihood Training', date: 'Oct 10, 2023', status: 'APPROVED' as const, members: 20 },
]

export const associationNotifications = [
  { id: '1', message: 'Your assistance request has been submitted.', time: '10 minutes ago', read: false, type: 'info' as const },
  { id: '2', message: 'Your request is under review.', time: '2 hours ago', read: false, type: 'info' as const },
  { id: '3', message: 'Your assistance request has been approved.', time: '1 day ago', read: true, type: 'success' as const },
  { id: '4', message: 'New recommendation is available.', time: '2 days ago', read: true, type: 'info' as const },
  { id: '5', message: 'Aid distribution scheduled for Oct 30, 2023.', time: '3 days ago', read: true, type: 'success' as const },
]

export const approvedAssistance = [
  { id: '1', program: 'Food Assistance Pack', approvedDate: 'Oct 15, 2023', beneficiaries: 25, status: 'DISTRIBUTED', distributionDate: 'Oct 20, 2023' },
  { id: '2', program: 'DA Fertilizer Subsidy', approvedDate: 'Sep 28, 2023', beneficiaries: 38, status: 'SCHEDULED', distributionDate: 'Nov 5, 2023' },
  { id: '3', program: 'Livelihood Skills Training', approvedDate: 'Sep 10, 2023', beneficiaries: 20, status: 'COMPLETED', distributionDate: 'Sep 25, 2023' },
]

export const requestStatuses = [
  {
    id: '1',
    program: 'Food Assistance',
    submittedDate: 'Oct 24, 2023',
    currentStep: 'Under Review' as RequestTimelineStep,
    steps: ['Submitted', 'Under Review', 'AI Assessment', 'Admin Review', 'Approved'] as RequestTimelineStep[],
    completedSteps: 2,
    finalStatus: null as 'Approved' | 'Rejected' | null,
  },
  {
    id: '2',
    program: 'Fertilizer Subsidy',
    submittedDate: 'Oct 18, 2023',
    currentStep: 'AI Assessment' as RequestTimelineStep,
    steps: ['Submitted', 'Under Review', 'AI Assessment', 'Admin Review', 'Approved'] as RequestTimelineStep[],
    completedSteps: 3,
    finalStatus: null,
  },
  {
    id: '3',
    program: 'Medical Assistance',
    submittedDate: 'Sep 5, 2023',
    currentStep: 'Rejected' as RequestTimelineStep,
    steps: ['Submitted', 'Under Review', 'AI Assessment', 'Admin Review', 'Rejected'] as RequestTimelineStep[],
    completedSteps: 5,
    finalStatus: 'Rejected' as const,
  },
]

export const aiRecommendations = [
  {
    id: '1',
    vulnerabilityLevel: 'HIGH' as VulnerabilityLevel,
    recommendedProgram: 'Food Assistance',
    reason: 'Based on the current vulnerability assessment and program eligibility criteria, member households show high food insecurity indicators.',
    status: 'PENDING REVIEW',
  },
  {
    id: '2',
    vulnerabilityLevel: 'MEDIUM' as VulnerabilityLevel,
    recommendedProgram: 'DA Fertilizer Subsidy',
    reason: 'Agricultural livelihood profile and seasonal crop damage patterns suggest fertilizer support as the best program match.',
    status: 'UNDER REVIEW',
  },
  {
    id: '3',
    vulnerabilityLevel: 'HIGH' as VulnerabilityLevel,
    recommendedProgram: 'Emergency Cash & Food Combo',
    reason: 'Combined high vulnerability score and absence of recent assistance within 12 months prioritizes emergency support.',
    status: 'RECOMMENDED',
  },
]

export const aidRecords = [
  { id: '1', member: 'Maria Santos', program: 'Food Assistance Pack', dateReceived: 'Oct 20, 2023', quantity: '1 pack', status: 'RECEIVED' },
  { id: '2', member: 'Juan dela Cruz', program: 'Fertilizer Subsidy', dateReceived: 'Sep 15, 2023', quantity: '2 bags', status: 'RECEIVED' },
  { id: '3', member: 'Ana Garcia', program: 'Livelihood Training Kit', dateReceived: 'Sep 25, 2023', quantity: '1 kit', status: 'RECEIVED' },
  { id: '4', member: 'Carlos Mendoza', program: 'Medical Assistance', dateReceived: 'Pending', quantity: '₱ 2,500', status: 'PENDING' },
]

/** @deprecated Use getActivePrograms() from programStorage */
export const assistancePrograms = [
  'Food Assistance',
  'Fertilizer Subsidy',
  'Livelihood Training',
  'Medical Assistance',
  'Emergency Cash Grant',
  'Fishery Gear Subsidy',
]
