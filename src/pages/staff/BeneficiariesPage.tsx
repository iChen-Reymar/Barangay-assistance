import { useEffect, useState } from 'react'
import { Plus, Eye, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import {
  StaffBeneficiaryFormModal,
  type StaffBeneficiaryFormInput,
} from '../../components/staff/StaffBeneficiaryFormModal'
import { StaffBeneficiaryViewModal } from '../../components/staff/StaffBeneficiaryViewModal'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Filter } from '../../components/ui/Filter'
import { Pagination } from '../../components/ui/Pagination'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { TableActionsCell } from '../../components/ui/TableActionsCell'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import type { StaffBeneficiary, VulnerabilityLevel, VerificationStatus } from '../../data/staffMockData'
import {
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
  updateStaffBeneficiary,
} from '../../services/staffBeneficiaryStorage'

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

function formToBeneficiary(input: StaffBeneficiaryFormInput, existing: StaffBeneficiary): StaffBeneficiary {
  return {
    id: existing.id,
    name: input.name.trim(),
    association: input.association,
    familySize: input.familySize,
    monthlyIncome: input.monthlyIncome,
    vulnerability: input.vulnerability,
    verification: input.verification,
  }
}

export default function StaffBeneficiariesPage() {
  const displayUser = useStaffDisplayUser()
  const { user, profile } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? displayUser.name
  const actorEmail = profile?.email ?? user?.email

  const [items, setItems] = useState<StaffBeneficiary[]>(() => getStaffBeneficiaries())
  const [viewOpen, setViewOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [viewingBeneficiary, setViewingBeneficiary] = useState<StaffBeneficiary | null>(null)
  const [editingBeneficiary, setEditingBeneficiary] = useState<StaffBeneficiary | null>(null)

  const pagination = usePagination(items, PAGE_SIZE_DEFAULT, 'staff-beneficiaries')

  useEffect(() => {
    return subscribeStaffBeneficiaryStorage(() => {
      setItems(getStaffBeneficiaries())
    })
  }, [])

  function handleView(beneficiary: StaffBeneficiary) {
    setViewingBeneficiary(beneficiary)
    setViewOpen(true)
  }

  function handleEdit(beneficiary: StaffBeneficiary) {
    setEditingBeneficiary(beneficiary)
    setFormOpen(true)
  }

  function handleSaveForm(input: StaffBeneficiaryFormInput) {
    if (!editingBeneficiary) return

    const updated = formToBeneficiary(input, editingBeneficiary)
    updateStaffBeneficiary(updated)

    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'Beneficiary Update',
      actionColor: 'orange',
      description: `Updated beneficiary record for ${editingBeneficiary.name}.`,
      entityType: 'beneficiary',
      entityId: editingBeneficiary.id,
      changes: buildChanges([
        { key: 'name', label: 'Name', oldValue: editingBeneficiary.name, newValue: updated.name },
        {
          key: 'association',
          label: 'Association',
          oldValue: editingBeneficiary.association,
          newValue: updated.association,
        },
        {
          key: 'familySize',
          label: 'Family Size',
          oldValue: editingBeneficiary.familySize,
          newValue: updated.familySize,
        },
        {
          key: 'monthlyIncome',
          label: 'Monthly Income',
          oldValue: formatCurrency(editingBeneficiary.monthlyIncome),
          newValue: formatCurrency(updated.monthlyIncome),
        },
        {
          key: 'vulnerability',
          label: 'Vulnerability',
          oldValue: editingBeneficiary.vulnerability,
          newValue: updated.vulnerability,
        },
        {
          key: 'verification',
          label: 'Verification',
          oldValue: editingBeneficiary.verification,
          newValue: updated.verification,
        },
      ]),
    })

    setEditingBeneficiary(null)
  }

  const columns: Column<StaffBeneficiary>[] = [
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
      render: (r) => (
        <TableActionsCell>
          <button
            type="button"
            onClick={() => handleView(r)}
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            aria-label={`View ${r.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleEdit(r)}
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            aria-label={`Edit ${r.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </TableActionsCell>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Beneficiary Management"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
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

          <DataTable
            columns={columns}
            data={pagination.paginatedItems}
            keyExtractor={(r) => r.id}
            stableRowCount={PAGE_SIZE_DEFAULT}
          />
          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>

      <StaffBeneficiaryViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        beneficiary={viewingBeneficiary}
        onEdit={(beneficiary) => {
          setViewOpen(false)
          handleEdit(beneficiary)
        }}
      />

      <StaffBeneficiaryFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingBeneficiary(null)
        }}
        title="Edit Beneficiary"
        initialValues={editingBeneficiary ?? undefined}
        onSave={handleSaveForm}
      />
    </>
  )
}
