import type {
  QualificationCheck,
  RequestDetails,
  SupportingDocument,
} from '../types/approval'

const defaultQualifications = (overrides: Partial<Record<string, QualificationCheck['status']>> = {}): QualificationCheck[] => [
  {
    id: 'q-residency',
    criterion: 'Barangay Residency',
    description: 'Applicant is a registered resident of Barangay Buru-un for at least 6 months.',
    status: overrides['q-residency'] ?? 'passed',
  },
  {
    id: 'q-income',
    criterion: 'Income Threshold',
    description: 'Household income falls within program eligibility limits.',
    status: overrides['q-income'] ?? 'passed',
  },
  {
    id: 'q-docs',
    criterion: 'Document Completeness',
    description: 'All required supporting documents have been submitted.',
    status: overrides['q-docs'] ?? 'pending',
  },
  {
    id: 'q-vulnerability',
    criterion: 'Vulnerability Assessment',
    description: 'Vulnerability score computed and classified by barangay staff.',
    status: overrides['q-vulnerability'] ?? 'passed',
  },
  {
    id: 'q-prior-aid',
    criterion: 'Prior Assistance Check',
    description: 'No duplicate assistance received within the cooling-off period.',
    status: overrides['q-prior-aid'] ?? 'pending',
  },
  {
    id: 'q-association',
    criterion: 'Association Membership',
    description: 'Requesting party is an active registered association member.',
    status: overrides['q-association'] ?? 'passed',
  },
]

const defaultDocuments: SupportingDocument[] = [
  {
    id: 'doc-1',
    name: 'Barangay Certificate of Residency.pdf',
    type: 'Certificate',
    uploadedAt: '2023-10-20T09:00:00.000Z',
    fileSize: '245 KB',
    status: 'verified',
    verifiedBy: 'Barangay Staff',
    verifiedAt: '2023-10-21T10:30:00.000Z',
  },
  {
    id: 'doc-2',
    name: 'Valid Government ID (Association Head).jpg',
    type: 'Identification',
    uploadedAt: '2023-10-20T09:05:00.000Z',
    fileSize: '1.2 MB',
    status: 'verified',
    verifiedBy: 'Barangay Staff',
    verifiedAt: '2023-10-21T10:32:00.000Z',
  },
  {
    id: 'doc-3',
    name: 'Member Masterlist_2023.xlsx',
    type: 'Member List',
    uploadedAt: '2023-10-20T09:15:00.000Z',
    fileSize: '89 KB',
    status: 'uploaded',
  },
  {
    id: 'doc-4',
    name: 'Situation Report & Photos.zip',
    type: 'Supporting Evidence',
    uploadedAt: '2023-10-20T09:30:00.000Z',
    fileSize: '4.8 MB',
    status: 'uploaded',
  },
]

type RequestExtras = {
  details: RequestDetails
  documents: SupportingDocument[]
  qualifications: QualificationCheck[]
}

function buildExtras(partial: Partial<RequestDetails> & {
  qualOverrides?: Partial<Record<string, QualificationCheck['status']>>
  documents?: SupportingDocument[]
}): RequestExtras {
  return {
    details: {
      submittedBy: partial.submittedBy ?? 'Association Representative',
      contactNumber: partial.contactNumber ?? '+63 917 000 0000',
      email: partial.email,
      address: partial.address ?? 'Purok 3, Barangay Buru-un, Iligan City',
      memberCount: partial.memberCount ?? 25,
      purpose: partial.purpose ?? 'Emergency assistance for affected member households.',
      requestedItems: partial.requestedItems ?? 'Assistance packages as listed in program guidelines',
      supportingInfo: partial.supportingInfo ?? 'Submitted with member list and situation report.',
      submittedAt: partial.submittedAt ?? '2023-10-20T08:45:00.000Z',
      associationType: partial.associationType,
      monthlyIncome: partial.monthlyIncome,
      vulnerabilityScore: partial.vulnerabilityScore,
    },
    documents: partial.documents ?? defaultDocuments,
    qualifications: defaultQualifications(partial.qualOverrides),
  }
}

export const requestDetailsById: Record<string, RequestExtras> = {
  'asst-1': buildExtras({
    submittedBy: 'Carlos Rivera',
    contactNumber: '+63 924 890 1234',
    email: 'carlos.rivera@fishermen-buruun.ph',
    address: 'Coastal Zone, Barangay Buru-un, Iligan City',
    memberCount: 29,
    purpose: 'Replace damaged fishing gear after recent typhoon damage affecting livelihood.',
    requestedItems: '10 motorized fishing craft subsidies, 15 gear repair kits',
    supportingInfo: 'Typhoon damage assessment report attached. 18 member households affected.',
    submittedAt: '2023-10-24T07:30:00.000Z',
    associationType: 'Livelihood',
    monthlyIncome: '₱ 3,800 avg. per household',
    vulnerabilityScore: 82,
    qualOverrides: { 'q-docs': 'pending', 'q-prior-aid': 'passed' },
  }),
  'asst-2': buildExtras({
    submittedBy: 'Ricardo Lopez',
    contactNumber: '+63 921 567 8901',
    memberCount: 38,
    purpose: 'Fertilizer subsidy for crop recovery after flooding in Sitoy area.',
    requestedItems: '50 bags urea fertilizer, 30 bags complete fertilizer',
    submittedAt: '2023-10-23T09:00:00.000Z',
    associationType: 'Agricultural',
    vulnerabilityScore: 89,
    qualOverrides: { 'q-docs': 'passed', 'q-income': 'passed', 'q-prior-aid': 'passed' },
  }),
  'asst-3': buildExtras({
    submittedBy: 'Maria Garcia',
    contactNumber: '+63 919 345 6789',
    memberCount: 28,
    purpose: 'Medical assistance for PWD members requiring maintenance medication.',
    requestedItems: 'Free maintenance medicine allocation for 12 PWD members',
    submittedAt: '2023-10-22T11:00:00.000Z',
    associationType: 'Special Sector',
    vulnerabilityScore: 74,
    qualOverrides: { 'q-docs': 'pending', 'q-vulnerability': 'passed' },
  }),
  'REQ-0129': buildExtras({
    submittedBy: 'Maria Clara',
    contactNumber: '+63 918 111 2233',
    address: 'Purok 5, Barangay Buru-un, Iligan City',
    memberCount: 1,
    purpose: 'Rice subsidy for household with 6 members and no stable income source.',
    requestedItems: '25 kg rice subsidy (monthly)',
    supportingInfo: 'Solo parent with 4 school-age children. No prior aid in last 12 months.',
    submittedAt: '2023-10-24T06:00:00.000Z',
    monthlyIncome: '₱ 4,500',
    vulnerabilityScore: 94,
    qualOverrides: { 'q-docs': 'pending', 'q-income': 'passed' },
  }),
  'REQ-0128': buildExtras({
    submittedBy: 'Pedro Penduko',
    contactNumber: '+63 917 222 3344',
    memberCount: 1,
    purpose: 'Emergency cash assistance after job loss and medical expenses.',
    requestedItems: '₱ 5,000 emergency cash grant',
    submittedAt: '2023-10-23T14:00:00.000Z',
    monthlyIncome: '₱ 0 (unemployed)',
    vulnerabilityScore: 91,
    qualOverrides: { 'q-docs': 'passed', 'q-prior-aid': 'pending' },
  }),
  'rec-1': buildExtras({
    submittedBy: 'Ricardo Lopez',
    contactNumber: '+63 921 567 8901',
    memberCount: 38,
    purpose: 'AI-recommended agricultural support based on vulnerability scoring.',
    requestedItems: 'DA Fertilizer Distribution Program allocation',
    supportingInfo: 'Crop damage profile and low relative household income across member families.',
    submittedAt: '2023-10-24T08:00:00.000Z',
    associationType: 'Agricultural',
    vulnerabilityScore: 89,
  }),
  'rec-2': buildExtras({
    submittedBy: 'Carlos Rivera',
    contactNumber: '+63 924 890 1234',
    memberCount: 29,
    purpose: 'AI-recommended fishery gear subsidy for high-vulnerability coastal households.',
    requestedItems: 'BFAR Fishery Gear Subsidy Program',
    submittedAt: '2023-10-23T08:00:00.000Z',
    vulnerabilityScore: 82,
  }),
}

export function getRequestExtras(id: string, association?: string): RequestExtras {
  if (requestDetailsById[id]) {
    return requestDetailsById[id]
  }

  return buildExtras({
    submittedBy: association ? `${association} Representative` : 'Association Representative',
    purpose: 'Assistance request pending full documentation review.',
    qualOverrides: { 'q-docs': 'pending', 'q-prior-aid': 'pending' },
  })
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
  const extras = getRequestExtras(item.id, item.association)
  return {
    ...item,
    details: {
      ...extras.details,
      vulnerabilityScore: item.score ?? extras.details.vulnerabilityScore,
    },
    documents: item.documents ?? extras.documents,
    qualifications: item.qualifications ?? extras.qualifications,
  }
}
