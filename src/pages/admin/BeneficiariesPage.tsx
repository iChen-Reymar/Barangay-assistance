import { useMemo, useState } from 'react'
import { Plus, Pencil, Eye } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { VulnerabilityBadge, ActiveBadge } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import {
  BeneficiaryFormModal,
  type BeneficiaryFormInput,
} from '../../components/admin/BeneficiaryFormModal'
import { BeneficiaryViewModal } from '../../components/admin/BeneficiaryViewModal'
import { ResponsiveToolbar } from '../../components/layout/ResponsiveToolbar'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  associations,
  beneficiaries as initialBeneficiaries,
  computeVulnerability,
  formatElderlyPwd,
  type Beneficiary,
  type VulnerabilityLevel,
} from '../../data/mockData'

function formatCurrency(amount: number) {
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function formToBeneficiary(input: BeneficiaryFormInput, existing?: Beneficiary): Beneficiary {
  const vulnerability = computeVulnerability({
    monthlyIncome: input.monthlyIncome,
    elderlyCount: input.elderlyCount,
    pwdCount: input.pwdCount,
    housing: input.housing,
    familySize: input.familySize,
  })

  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    association: input.association,
    familySize: input.familySize,
    monthlyIncome: input.monthlyIncome,
    elderly: formatElderlyPwd(input.elderlyCount),
    pwd: formatElderlyPwd(input.pwdCount),
    housing: input.housing,
    vulnerability,
    status: existing?.status ?? 'ACTIVE',
  }
}

export default function BeneficiariesPage() {
  const { user, profile } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? 'Administrator'
  const actorEmail = profile?.email ?? user?.email

  const [items, setItems] = useState<Beneficiary[]>(initialBeneficiaries)
  const [associationFilter, setAssociationFilter] = useState('All')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'All' | VulnerabilityLevel>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [viewingBeneficiary, setViewingBeneficiary] = useState<Beneficiary | null>(null)

  const filtered = useMemo(() => {
    return items.filter((row) => {
      const associationMatch =
        associationFilter === 'All' || row.association === associationFilter
      const vulnerabilityMatch =
        vulnerabilityFilter === 'All' || row.vulnerability === vulnerabilityFilter
      return associationMatch && vulnerabilityMatch
    })
  }, [items, associationFilter, vulnerabilityFilter])

  function handleAdd() {
    setEditingBeneficiary(null)
    setFormOpen(true)
  }

  function handleEdit(beneficiary: Beneficiary) {
    setEditingBeneficiary(beneficiary)
    setFormOpen(true)
  }

  function handleView(beneficiary: Beneficiary) {
    setViewingBeneficiary(beneficiary)
    setViewOpen(true)
  }

  function handleSaveForm(input: BeneficiaryFormInput) {
    if (editingBeneficiary) {
      const updated = formToBeneficiary(input, editingBeneficiary)
      setItems((prev) =>
        prev.map((row) =>
          row.id === editingBeneficiary.id ? updated : row,
        ),
      )
      logAuditEvent({
        user: actorName,
        userEmail: actorEmail,
        action: 'Beneficiary Update',
        actionColor: 'orange',
        description: `Updated information for ${editingBeneficiary.name}.`,
        entityType: 'beneficiary',
        entityId: editingBeneficiary.id,
        changes: buildChanges([
          { key: 'name', label: 'Name', oldValue: editingBeneficiary.name, newValue: updated.name },
          { key: 'association', label: 'Association', oldValue: editingBeneficiary.association, newValue: updated.association },
          { key: 'familySize', label: 'Family Size', oldValue: editingBeneficiary.familySize, newValue: updated.familySize },
          { key: 'monthlyIncome', label: 'Monthly Income', oldValue: formatCurrency(editingBeneficiary.monthlyIncome), newValue: formatCurrency(updated.monthlyIncome) },
          { key: 'elderly', label: 'Elderly', oldValue: editingBeneficiary.elderly, newValue: updated.elderly },
          { key: 'pwd', label: 'PWD', oldValue: editingBeneficiary.pwd, newValue: updated.pwd },
          { key: 'housing', label: 'Housing', oldValue: editingBeneficiary.housing, newValue: updated.housing },
          { key: 'vulnerability', label: 'Vulnerability', oldValue: editingBeneficiary.vulnerability, newValue: updated.vulnerability },
        ]),
      })
      return
    }

    const created = formToBeneficiary(input)
    setItems((prev) => [created, ...prev])
    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'Beneficiary Update',
      actionColor: 'orange',
      description: `Registered new beneficiary ${created.name}.`,
      entityType: 'beneficiary',
      entityId: created.id,
      changes: buildChanges([
        { key: 'name', label: 'Name', oldValue: '—', newValue: created.name },
        { key: 'association', label: 'Association', oldValue: '—', newValue: created.association },
        { key: 'status', label: 'Status', oldValue: '—', newValue: created.status },
        { key: 'vulnerability', label: 'Vulnerability', oldValue: '—', newValue: created.vulnerability },
      ]),
    })
  }

  return (
    <>
      <AdminHeader title="Manage Beneficiaries Database" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ResponsiveToolbar>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <select
                value={associationFilter}
                onChange={(e) => setAssociationFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">All Associations</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.name}>
                    {assoc.name}
                  </option>
                ))}
              </select>
              <select
                value={vulnerabilityFilter}
                onChange={(e) =>
                  setVulnerabilityFilter(e.target.value as 'All' | VulnerabilityLevel)
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">Vulnerability Level: All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Beneficiary
            </button>
          </ResponsiveToolbar>

          <ResponsiveTable
            data={filtered}
            keyExtractor={(row) => row.id}
            emptyMessage="No beneficiaries match your filters."
            columns={[
              {
                key: 'name',
                header: 'Name',
                primary: true,
                render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
              },
              { key: 'association', header: 'Association' },
              { key: 'familySize', header: 'Family Size', mobileLabel: 'Family' },
              {
                key: 'monthlyIncome',
                header: 'Monthly Income',
                mobileLabel: 'Income',
                render: (row) => formatCurrency(row.monthlyIncome),
              },
              { key: 'elderly', header: 'Elderly', hideOnMobile: true },
              { key: 'pwd', header: 'PWD', hideOnMobile: true },
              { key: 'housing', header: 'Housing', hideOnMobile: true },
              {
                key: 'vulnerability',
                header: 'Vulnerability',
                render: (row) => <VulnerabilityBadge level={row.vulnerability} />,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <ActiveBadge status={row.status} />,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(row)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                      aria-label={`Edit ${row.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleView(row)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                      aria-label={`View ${row.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
          />

          <Pagination
            showing={
              filtered.length === 0
                ? 'Showing 0 entries'
                : `Showing 1 to ${filtered.length} of ${filtered.length} entries`
            }
            totalPages={Math.max(1, Math.ceil(filtered.length / 6))}
          />
        </div>
      </main>

      <BeneficiaryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}
        initialValues={editingBeneficiary ?? undefined}
        onSave={handleSaveForm}
      />

      <BeneficiaryViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        beneficiary={viewingBeneficiary}
        onEdit={handleEdit}
      />
    </>
  )
}
