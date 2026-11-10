import type {
  QualificationCheck,
  RequestDetails,
  SupportingDocument,
} from '../types/approval'

function pendingQualifications(): QualificationCheck[] {
  return [
    {
      id: 'q-residency',
      criterion: 'Barangay Residency',
      description: 'Applicant residency must be validated from submitted records.',
      status: 'pending',
    },
    {
      id: 'q-income',
      criterion: 'Income Threshold',
      description: 'Measured household income must be checked against program limits.',
      status: 'pending',
    },
    {
      id: 'q-docs',
      criterion: 'Document Completeness',
      description: 'Required supporting documents must be submitted and validated.',
      status: 'pending',
    },
    {
      id: 'q-vulnerability',
      criterion: 'Vulnerability Assessment',
      description: 'A complete Staff-verified household assessment is required.',
      status: 'pending',
    },
    {
      id: 'q-prior-aid',
      criterion: 'Prior Assistance Check',
      description: 'Prior assistance must be checked against the cooling-off period.',
      status: 'pending',
    },
    {
      id: 'q-association',
      criterion: 'Association Membership',
      description: 'Active association membership must be validated.',
      status: 'pending',
    },
  ]
}

type RequestExtras = {
  details: RequestDetails
  documents: SupportingDocument[]
  qualifications: QualificationCheck[]
}

/**
 * Operational requests are never enriched with prototype evidence. Missing
 * evidence remains empty and every qualification starts pending until Staff
 * records a real validation.
 */
export function getRequestExtras(association?: string): RequestExtras {
  return {
    details: {
      submittedBy: association ? `${association} Representative` : 'Association Representative',
      contactNumber: '—',
      address: '—',
      memberCount: 0,
      purpose: '—',
      requestedItems: '—',
      supportingInfo: '—',
      submittedAt: '',
    },
    documents: [],
    qualifications: pendingQualifications(),
  }
}

export function enrichReviewableItem<
  T extends {
    id: string
    association: string
    score?: number
    details?: RequestDetails
    documents?: SupportingDocument[]
    qualifications?: QualificationCheck[]
  },
>(item: T): T & RequestExtras {
  const extras = getRequestExtras(item.association)
  return {
    ...item,
    details: {
      ...extras.details,
      ...item.details,
      vulnerabilityScore: item.score ?? item.details?.vulnerabilityScore,
    },
    documents: item.documents ?? [],
    qualifications: item.qualifications ?? extras.qualifications,
  }
}
