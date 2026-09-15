import { Download, Eye } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { SearchBar } from '../../components/ui/SearchBar'
import { Pagination } from '../../components/ui/Pagination'
import { staffApprovedRequests } from '../../data/staffMockData'
import { staffUser } from '../../components/staff/navConfig'

type ApprovedRequest = (typeof staffApprovedRequests)[number]

function statusVariant(status: string) {
  if (status === 'RELEASED') return 'success'
  if (status === 'SCHEDULED') return 'info'
  if (status === 'PENDING COLLECTION') return 'warning'
  return 'neutral'
}

export default function StaffApprovedRequestsPage() {
  const columns: Column<ApprovedRequest>[] = [
    { key: 'id', header: 'Request ID', render: (r) => <span className="font-medium text-gray-900">{r.id}</span> },
    { key: 'beneficiary', header: 'Beneficiary' },
    { key: 'association', header: 'Association' },
    { key: 'program', header: 'Program' },
    { key: 'approvedDate', header: 'Approved Date' },
    { key: 'approvedBy', header: 'Approved By' },
    { key: 'beneficiaries', header: 'Beneficiaries' },
    { key: 'distributionDate', header: 'Distribution Date' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex gap-2">
          <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label="View">
            <Eye className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label="Download">
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Approved Requests"
        searchPlaceholder="Search approved requests..."
        userName={staffUser.name}
        userInitials={staffUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Approved Assistance Records:</span> {staffApprovedRequests.length} approved
            requests this month. Track disbursement status and distribution schedules below.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {staffApprovedRequests.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="font-bold text-green-800">{item.program}</p>
              <p className="mt-1 text-sm text-gray-600">{item.beneficiary}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Approved: {item.approvedDate}</span>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap gap-3">
              <SearchBar placeholder="Search approved requests..." className="w-56" />
              <Filter label="Status" options={['All Status', 'Released', 'Scheduled', 'Pending Collection']} />
              <Filter label="Program" options={['All Programs', 'Food Assistance', 'Rice Subsidy', 'Livelihood Training']} />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <DataTable columns={columns} data={staffApprovedRequests} keyExtractor={(r) => r.id} />
          <Pagination showing={`Showing 1 to ${staffApprovedRequests.length} of ${staffApprovedRequests.length} approved records`} totalPages={1} />
        </div>
      </main>
    </>
  )
}
