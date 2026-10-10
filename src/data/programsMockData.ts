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

export const seedPrograms: AssistanceProgram[] = []
