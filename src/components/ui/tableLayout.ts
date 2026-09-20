const COLUMN_WIDTHS: Record<string, string> = {
  rank: '5%',
  id: '10%',
  name: '16%',
  association: '18%',
  beneficiary: '14%',
  requestType: '14%',
  program: '14%',
  recommended: '16%',
  vulnerability: '11%',
  classification: '11%',
  score: '11%',
  date: '11%',
  approvedDate: '11%',
  dateReceived: '11%',
  distributionDate: '11%',
  previousAid: '9%',
  status: '10%',
  verification: '11%',
  membershipStatus: '11%',
  actions: '20%',
  familySize: '9%',
  monthlyIncome: '11%',
  category: '10%',
  sponsoringAgency: '14%',
  type: '10%',
  members: '9%',
  contactPerson: '14%',
  contactNumber: '12%',
  dateRegistered: '11%',
  age: '7%',
  quantity: '12%',
  member: '16%',
}

export function resolveColumnWidth(key: string, override?: string): string {
  if (override) return override
  return COLUMN_WIDTHS[key] ?? '12%'
}

export const TABLE_DESKTOP_CLASS = 'w-full min-w-[960px] table-fixed text-sm'

/** Fixed row height for paginated tables (fits one row of compact action buttons). */
export const TABLE_ROW_CLASS = 'h-20 max-h-20 min-h-20'

export const TABLE_HEADER_HEIGHT_PX = 44
export const TABLE_ROW_HEIGHT_PX = 80

export function tableBodyMinHeight(stableRowCount: number): number {
  return TABLE_HEADER_HEIGHT_PX + stableRowCount * TABLE_ROW_HEIGHT_PX
}

export function cellTruncateClass(key: string): string {
  if (key === 'actions' || key === 'status' || key === 'rank') return ''
  return 'max-w-0 truncate'
}
