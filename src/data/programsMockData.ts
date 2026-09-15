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

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const seedPrograms: AssistanceProgram[] = [
  {
    id: 'prog-1',
    name: 'Food Assistance',
    category: 'Food',
    sponsoringAgency: 'DSWD',
    description: 'Monthly food packs for vulnerable households and registered associations.',
    eligibilityCriteria: 'Registered barangay residents with income below poverty threshold.',
    maxBeneficiaries: 200,
    budgetAllocation: 500000,
    startDate: 'Jan 1, 2026',
    endDate: 'Dec 31, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-01-01')),
  },
  {
    id: 'prog-2',
    name: 'Fertilizer Subsidy',
    category: 'Agricultural',
    sponsoringAgency: 'DA',
    description: 'Subsidized fertilizer distribution for registered farmer associations.',
    eligibilityCriteria: 'Active agricultural association with at least 10 farming members.',
    maxBeneficiaries: 150,
    budgetAllocation: 350000,
    startDate: 'Feb 1, 2026',
    endDate: 'Nov 30, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-01-15')),
  },
  {
    id: 'prog-3',
    name: 'Livelihood Training',
    category: 'Livelihood',
    sponsoringAgency: 'DSWD',
    description: 'Skills training and starter kits for livelihood program participants.',
    eligibilityCriteria: 'Association members aged 18–60 with no duplicate training within 12 months.',
    maxBeneficiaries: 80,
    budgetAllocation: 280000,
    startDate: 'Mar 1, 2026',
    endDate: 'Oct 31, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-02-01')),
  },
  {
    id: 'prog-4',
    name: 'Medical Assistance',
    category: 'Medical',
    sponsoringAgency: 'Barangay',
    description: 'Financial aid for medicines, check-ups, and hospital bills for indigent residents.',
    eligibilityCriteria: 'Senior citizens, PWD, or households with medical certificate of need.',
    maxBeneficiaries: 100,
    budgetAllocation: 200000,
    startDate: 'Jan 1, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-01-01')),
  },
  {
    id: 'prog-5',
    name: 'Emergency Cash Grant',
    category: 'Emergency',
    sponsoringAgency: 'DSWD',
    description: 'Immediate cash assistance for families affected by disasters or sudden hardship.',
    eligibilityCriteria: 'Verified disaster impact or barangay indigency certification.',
    maxBeneficiaries: 50,
    budgetAllocation: 150000,
    startDate: 'Jan 1, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-01-01')),
  },
  {
    id: 'prog-6',
    name: 'Fishery Gear Subsidy',
    category: 'Fisheries',
    sponsoringAgency: 'BFAR',
    description: 'Subsidized fishing gear and equipment for registered fisherfolk associations.',
    eligibilityCriteria: 'Registered fisherfolk association with valid municipal fishing permit.',
    maxBeneficiaries: 60,
    budgetAllocation: 320000,
    startDate: 'Apr 1, 2026',
    endDate: 'Sep 30, 2026',
    status: 'ACTIVE',
    dateCreated: formatDate(new Date('2026-03-01')),
  },
  {
    id: 'prog-7',
    name: 'Rice Subsidy',
    category: 'Food',
    sponsoringAgency: 'NFA',
    description: 'Discounted rice allocation for low-income families and associations.',
    eligibilityCriteria: 'Household income below ₱15,000/month or association with food security need.',
    maxBeneficiaries: 120,
    budgetAllocation: 180000,
    startDate: 'Jun 1, 2025',
    endDate: 'Dec 31, 2025',
    status: 'CLOSED',
    dateCreated: formatDate(new Date('2025-05-15')),
  },
  {
    id: 'prog-8',
    name: 'Free Maintenance Medicine',
    category: 'Medical',
    sponsoringAgency: 'DOH',
    description: 'Free maintenance medicines for senior citizens and persons with chronic conditions.',
    eligibilityCriteria: 'Senior citizen or PWD with valid prescription for maintenance medication.',
    maxBeneficiaries: 75,
    budgetAllocation: 95000,
    startDate: 'Jul 1, 2026',
    endDate: 'Dec 31, 2026',
    status: 'INACTIVE',
    dateCreated: formatDate(new Date('2026-06-01')),
  },
]
