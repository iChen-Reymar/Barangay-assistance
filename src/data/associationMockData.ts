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
  fullName: '',
  username: '',
  role: 'Association Head',
  association: '',
  email: '',
  phone: '',
  address: '',
  memberSince: '',
}

export const associationDetailsSeed: AssociationDetails = {
  id: '',
  name: '',
  type: 'Agricultural',
  registrationNumber: '',
  dateRegistered: '',
  address: '',
  contactPerson: '',
  contactNumber: '',
  email: '',
  totalMembers: 0,
  description: '',
  status: 'ACTIVE',
}

export const associationStats = {
  totalMembers: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
}

export const seedAssociationMembers: AssociationMember[] = []

/** @deprecated Use getAssociationMembers() from memberStorage */
export const associationMembers = seedAssociationMembers

export const recentRequests: {
  id: string
  program: string
  date: string
  status: 'PENDING' | 'UNDER REVIEW' | 'APPROVED'
  members: number
}[] = []

export const associationNotifications: {
  id: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success'
}[] = []

export const approvedAssistance: {
  id: string
  program: string
  approvedDate: string
  beneficiaries: number
  status: string
  distributionDate: string
}[] = []

export const requestStatuses: {
  id: string
  program: string
  submittedDate: string
  currentStep: RequestTimelineStep
  steps: RequestTimelineStep[]
  completedSteps: number
  finalStatus: 'Approved' | 'Rejected' | null
}[] = []

export const aiRecommendations: {
  id: string
  vulnerabilityLevel: VulnerabilityLevel
  recommendedProgram: string
  reason: string
  status: string
}[] = []

export const aidRecords: {
  id: string
  member: string
  program: string
  dateReceived: string
  quantity: string
  status: string
}[] = []

/** @deprecated Use getActivePrograms() from programStorage */
export const assistancePrograms: string[] = []
