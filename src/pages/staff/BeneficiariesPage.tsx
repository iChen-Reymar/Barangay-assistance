import { Plus, Eye, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { Pagination } from '../../components/ui/Pagination'
import { staffBeneficiaries, type VulnerabilityLevel, type VerificationStatus } from '../../data/staffMockData'
import { staffUser } from '../../components/staff/navConfig'

type Beneficiary = (typeof staffBeneficiaries)[number]

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

function formatCurrency(amount: number) {
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function StaffBeneficiariesPage() {
  const columns: Column<Beneficiary>[] = [
    { key: 'name', header: 'Name', primary: true, render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'association', header: 'Association' },
    { key: 'familySize', header: 'Family Size' },
    { key: 'monthlyIncome', header: 'Monthly Income', render: (r) => formatCurrency(r.monthlyIncome) },
    {
      key: 'vulnerability',
      header: 'Vulnerability',
      render: (r) => <Badge variant={vulnerabilityVariant(r.vulnerability)}>{r.vulnerability}</Badge>,
    },
    {
      key: 'verification',
      header: 'Verification Status',
      render: (r) => <Badge variant={verificationVariant(r.verification)}>{r.verification}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex gap-2">
          <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label="View">
            <Eye className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Beneficiary Management"
        searchPlaceholder="Search records, requests, files..."
        userName={staffUser.name}
        userInitials={staffUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-5">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Filter label="Association" options={['Association: All', 'Farmers Association', "Sitoy Farmer's Group", 'PWD Group']} />
              <Filter label="Vulnerability" options={['Vulnerability: All', 'High', 'Medium', 'Low']} />
              <Filter label="Verification" options={['Verification: All', 'Verified', 'Pending', 'Unverified']} />
            </div>
            <Link to="/staff/beneficiaries/add" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Beneficiary
              </Button>
            </Link>
          </div>

          <DataTable columns={columns} data={staffBeneficiaries} keyExtractor={(r) => r.id} />
          <Pagination showing="Showing 1 to 6 of 248 entries" totalPages={5} />
        </div>
      </main>
    </>
  )
}
