export type ProgramCategory =
  | 'Food'
  | 'Agricultural'
  | 'Livelihood'
  | 'Medical'
  | 'Emergency'
  | 'Fisheries'

export type ProgramStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED'

export interface AssistanceProgram {
  id: string
  name: string
  category: ProgramCategory
  sponsoringAgency: string
  description: string
  eligibilityCriteria: string
  maxBeneficiaries?: number
  budgetAllocation?: number
  startDate: string
  endDate?: string
  status: ProgramStatus
  dateCreated: string
}

export const programCategories: ProgramCategory[] = [
  'Food',
  'Agricultural',
  'Livelihood',
  'Medical',
  'Emergency',
  'Fisheries',
]

export const programAgencies = ['DSWD', 'DA', 'BFAR', 'Barangay', 'DOH', 'NFA']

export const eligibilityCriteriaOptions = [
  'Verified low-income households',
  'Households with senior citizens',
  'Households with persons with disabilities',
  'Large households with six or more members',
  'Disaster-affected households',
  'Verified farmers and agricultural workers',
  'Verified fisherfolk households',
  'Unemployed or underemployed residents',
  'Verified vulnerable households based on the barangay assessment',
] as const

export const seedPrograms: AssistanceProgram[] = []
