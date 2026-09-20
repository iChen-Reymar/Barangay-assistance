import { useEffect, useMemo, useState } from 'react'
import { Package, CheckCircle, Wallet, CalendarClock, Plus, Pencil, Settings } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { StatCard } from '../../components/admin/StatCard'
import { ProgramStatusBadge } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import { ProgramFormModal, type ProgramFormInput } from '../../components/admin/ProgramFormModal'
import { ProgramSettingsModal } from '../../components/admin/ProgramSettingsModal'
import { ResponsiveToolbar } from '../../components/layout/ResponsiveToolbar'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  getPrograms,
  subscribeProgramStorage,
  updateProgramStatus,
  upsertProgram,
} from '../../services/programStorage'
import type {
  AssistanceProgram,
  ProgramCategory,
  ProgramStatus,
} from '../../data/programsMockData'
import { programCategories } from '../../data/programsMockData'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { TableActionsCell } from '../../components/ui/TableActionsCell'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount?: number) {
  if (amount === undefined) return '—'
  return `₱ ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function isClosingSoon(program: AssistanceProgram) {
  if (!program.endDate || program.status !== 'ACTIVE') return false
  const end = new Date(program.endDate)
  if (Number.isNaN(end.getTime())) return false
  const daysLeft = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft >= 0 && daysLeft <= 60
}

export default function ProgramsPage() {
  const { user, profile } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? 'Administrator'
  const actorEmail = profile?.email ?? user?.email

  const [items, setItems] = useState<AssistanceProgram[]>(() => getPrograms())
  const [categoryFilter, setCategoryFilter] = useState<'All' | ProgramCategory>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | ProgramStatus>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<AssistanceProgram | null>(null)
  const [settingsProgram, setSettingsProgram] = useState<AssistanceProgram | null>(null)

  useEffect(() => {
    setItems(getPrograms())
    return subscribeProgramStorage(() => setItems(getPrograms()))
  }, [])

  const filtered = useMemo(() => {
    return items.filter((row) => {
      const categoryMatch = categoryFilter === 'All' || row.category === categoryFilter
      const statusMatch = statusFilter === 'All' || row.status === statusFilter
      return categoryMatch && statusMatch
    })
  }, [items, categoryFilter, statusFilter])

  const pagination = usePagination(
    filtered,
    PAGE_SIZE_DEFAULT,
    `${categoryFilter}-${statusFilter}`,
  )

  const stats = useMemo(() => {
    const active = items.filter((row) => row.status === 'ACTIVE').length
    const totalBudget = items
      .filter((row) => row.status === 'ACTIVE')
      .reduce((sum, row) => sum + (row.budgetAllocation ?? 0), 0)
    const closingSoon = items.filter(isClosingSoon).length

    return {
      total: items.length,
      active,
      totalBudget,
      closingSoon,
    }
  }, [items])

  function handleAdd() {
    setEditingProgram(null)
    setFormOpen(true)
  }

  function handleEdit(program: AssistanceProgram) {
    setEditingProgram(program)
    setFormOpen(true)
  }

  function handleOpenSettings(program: AssistanceProgram) {
    setSettingsProgram(program)
    setSettingsOpen(true)
  }

  function handleSaveForm(input: ProgramFormInput) {
    if (editingProgram) {
      const updated: AssistanceProgram = { ...editingProgram, ...input }
      upsertProgram(updated)
      logAuditEvent({
        user: actorName,
        userEmail: actorEmail,
        action: 'Program Update',
        actionColor: 'teal',
        description: `Updated assistance program ${editingProgram.name}.`,
        entityType: 'assistance_program',
        entityId: editingProgram.id,
        changes: buildChanges([
          { key: 'name', label: 'Program Name', oldValue: editingProgram.name, newValue: input.name },
          { key: 'category', label: 'Category', oldValue: editingProgram.category, newValue: input.category },
          {
            key: 'agency',
            label: 'Sponsoring Agency',
            oldValue: editingProgram.sponsoringAgency,
            newValue: input.sponsoringAgency,
          },
          {
            key: 'budget',
            label: 'Budget',
            oldValue: formatCurrency(editingProgram.budgetAllocation),
            newValue: formatCurrency(input.budgetAllocation),
          },
        ]),
      })
      return
    }

    const newProgram: AssistanceProgram = {
      id: crypto.randomUUID(),
      ...input,
      status: 'ACTIVE',
      dateCreated: formatDate(new Date()),
    }
    upsertProgram(newProgram)
    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'Program Update',
      actionColor: 'teal',
      description: `Created assistance program ${input.name}.`,
      entityType: 'assistance_program',
      entityId: newProgram.id,
      changes: buildChanges([
        { key: 'name', label: 'Program Name', oldValue: '—', newValue: input.name },
        { key: 'category', label: 'Category', oldValue: '—', newValue: input.category },
        { key: 'status', label: 'Status', oldValue: '—', newValue: 'ACTIVE' },
      ]),
    })
  }

  function handleSaveSettings(id: string, status: ProgramStatus) {
    const current = items.find((row) => row.id === id)
    updateProgramStatus(id, status)
    if (current && current.status !== status) {
      logAuditEvent({
        user: actorName,
        userEmail: actorEmail,
        action: 'Program Update',
        actionColor: 'teal',
        description: `Updated settings for ${current.name}.`,
        entityType: 'assistance_program',
        entityId: id,
        changes: buildChanges([
          { key: 'status', label: 'Status', oldValue: current.status, newValue: status },
        ]),
      })
    }
  }

  return (
    <>
      <AdminHeader title="Assistance Program Management" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Programs" value={stats.total} icon={Package} />
          <StatCard label="Active Programs" value={stats.active} icon={CheckCircle} />
          <StatCard
            label="Active Budget"
            value={formatCurrency(stats.totalBudget)}
            icon={Wallet}
          />
          <StatCard label="Closing Soon" value={stats.closingSoon} icon={CalendarClock} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <ResponsiveToolbar>
            <div className="flex flex-wrap gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'All' | ProgramCategory)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">Category: All</option>
                {programCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | ProgramStatus)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 sm:w-auto"
              >
                <option value="All">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Program
            </button>
          </ResponsiveToolbar>

          <ResponsiveTable
            stableRowCount={PAGE_SIZE_DEFAULT}
            data={pagination.paginatedItems}
            keyExtractor={(row) => row.id}
            emptyMessage="No assistance programs match your filters."
            columns={[
              {
                key: 'name',
                header: 'Program Name',
                primary: true,
                render: (row) => (
                  <div>
                    <span className="font-medium text-gray-900">{row.name}</span>
                    {isClosingSoon(row) && (
                      <span className="ml-2 text-[10px] font-semibold uppercase text-amber-600">
                        Closing Soon
                      </span>
                    )}
                  </div>
                ),
              },
              { key: 'category', header: 'Category', mobileLabel: 'Category' },
              {
                key: 'sponsoringAgency',
                header: 'Agency',
                mobileLabel: 'Agency',
              },
              {
                key: 'budgetAllocation',
                header: 'Budget',
                render: (row) => formatCurrency(row.budgetAllocation),
              },
              {
                key: 'maxBeneficiaries',
                header: 'Max Beneficiaries',
                mobileLabel: 'Capacity',
                render: (row) => row.maxBeneficiaries ?? '—',
              },
              {
                key: 'period',
                header: 'Period',
                mobileLabel: 'Period',
                render: (row) => (
                  <span className="text-gray-600">
                    {row.startDate}
                    {row.endDate ? ` – ${row.endDate}` : ''}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <ProgramStatusBadge status={row.status} />,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <TableActionsCell>
                    <button
                      type="button"
                      onClick={() => handleEdit(row)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                      aria-label={`Edit ${row.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSettings(row)}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                      aria-label={`Settings for ${row.name}`}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </TableActionsCell>
                ),
              },
            ]}
          />

          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>

      <ProgramFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProgram ? 'Edit Program' : 'Add Program'}
        initialValues={editingProgram ?? undefined}
        onSave={handleSaveForm}
      />

      <ProgramSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        program={settingsProgram}
        onSave={handleSaveSettings}
      />
    </>
  )
}
