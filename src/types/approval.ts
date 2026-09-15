import type { RequestStatus } from '../data/mockData'

export type DecisionType = 'approve' | 'reject' | 'override'

export type DocumentStatus = 'uploaded' | 'verified' | 'rejected'
export type QualificationStatus = 'passed' | 'pending' | 'failed' | 'not_applicable'

export interface DecisionRecord {
  id: string
  decision: DecisionType
  notes: string
  decidedBy: string
  decidedByEmail?: string
  decidedAt: string
  previousStatus: string
  newStatus: string
}

export interface ReviewInput {
  notes: string
  reviewedBy: string
  reviewedByEmail?: string
}

export interface DecisionInput extends ReviewInput {
  decision: DecisionType
  overrideStatus?: RequestStatus
}

export interface SupportingDocument {
  id: string
  name: string
  type: string
  uploadedAt: string
  fileSize: string
  status: DocumentStatus
  verifiedBy?: string
  verifiedAt?: string
}

export interface QualificationCheck {
  id: string
  criterion: string
  description: string
  status: QualificationStatus
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
}

export interface RequestDetails {
  submittedBy: string
  contactNumber: string
  email?: string
  address: string
  memberCount: number
  purpose: string
  requestedItems: string
  supportingInfo: string
  submittedAt: string
  associationType?: string
  monthlyIncome?: string
  vulnerabilityScore?: number
}

export interface ReviewableAssistanceItem {
  id: string
  source: 'assistance' | 'recommendation'
  association: string
  requestType: string
  vulnerability: string
  date: string
  status: RequestStatus
  score?: number
  program?: string
  description?: string
  previousAssistance?: string
  decisions: DecisionRecord[]
  details?: RequestDetails
  documents?: SupportingDocument[]
  qualifications?: QualificationCheck[]
}
