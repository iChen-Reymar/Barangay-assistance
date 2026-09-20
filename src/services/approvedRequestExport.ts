import { downloadCsv } from '../utils/csvExport'
import type { StaffApprovedRequest } from '../components/staff/ApprovedRequestDetailModal'

const headers = [
  'Request ID',
  'Beneficiary',
  'Association',
  'Program',
  'Approved Date',
  'Approved By',
  'Beneficiaries',
  'Status',
  'Distribution Date',
]

function rowValues(request: StaffApprovedRequest): (string | number)[] {
  return [
    request.id,
    request.beneficiary,
    request.association,
    request.program,
    request.approvedDate,
    request.approvedBy,
    request.beneficiaries,
    request.status,
    request.distributionDate,
  ]
}

export function downloadApprovedRequest(request: StaffApprovedRequest): void {
  downloadCsv(`${request.id}_approved_record.csv`, headers, [rowValues(request)])
}

export function downloadAllApprovedRequests(requests: StaffApprovedRequest[]): void {
  downloadCsv('approved_requests_export.csv', headers, requests.map(rowValues))
}
