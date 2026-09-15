import { FileDown } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { SearchBar } from '../../components/ui/SearchBar'
import { Pagination } from '../../components/ui/Pagination'
import { staffPriorityList, type VulnerabilityLevel, type VerificationStatus } from '../../data/staffMockData'
import { staffUser } from '../../components/staff/navConfig'

type PriorityItem = (typeof staffPriorityList)[number]

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

function verificationVariant(status: VerificationStatus) {
  if (status === 'VERIFIED') return 'success'
  if (status === 'PENDING') return 'neutral'
  return 'danger'
}

export default function StaffPriorityListPage() {
  const columns: Column<PriorityItem>[] = [
    { key: 'rank', header: 'Rank', render: (r) => <span className="font-bold text-gray-900">{r.rank}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'association', header: 'Association' },
    {
      key: 'score',
      header: 'Vulnerability Score',
      render: (r) => (
        <span className={r.score >= 80 ? 'font-semibold text-red-500' : r.score >= 50 ? 'text-orange-500' : 'text-green-600'}>
          {r.score} / 100
        </span>
      ),
    },
    {
      key: 'classification',
      header: 'Classification',
      render: (r) => <Badge variant={vulnerabilityVariant(r.classification)}>{r.classification}</Badge>,
    },
    { key: 'program', header: 'Recommended Program' },
    {
      key: 'verification',
      header: 'Verification Status',
      render: (r) => <Badge variant={verificationVariant(r.verification)}>{r.verification}</Badge>,
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Priority List"
        searchPlaceholder="Search records, requests, files..."
        userName={staffUser.name}
        userInitials={staffUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchBar placeholder="Search beneficiaries..." className="w-48" />
              <Filter label="Classification" options={['All Classifications', 'High', 'Medium', 'Low']} />
              <Filter label="Sort" options={['Sort: Highest Score', 'Sort: Lowest Score']} />
            </div>
            <Button>
              <FileDown className="h-4 w-4" />
              Export
            </Button>
          </div>

          <DataTable columns={columns} data={staffPriorityList} keyExtractor={(r) => String(r.rank)} />
          <Pagination showing="Showing 1 to 6 of 42 records" />
        </div>
      </main>
    </>
  )
}
