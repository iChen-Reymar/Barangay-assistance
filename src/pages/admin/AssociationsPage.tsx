import { useMemo, useState } from 'react'
import { Building2, Users, UserCheck, Clock, Plus, Pencil, Settings, Eye } from 'lucide-react'
import { AdminHeader } from '../../components/admin/AdminHeader'
import { StatCard } from '../../components/admin/StatCard'
import { ActiveBadge } from '../../components/admin/StatusBadge'
import { Pagination } from '../../components/admin/Pagination'
import { AssociationFormModal, type AssociationFormInput } from '../../components/admin/AssociationFormModal'
import { AssociationSettingsModal } from '../../components/admin/AssociationSettingsModal'
import { AssociationViewModal } from '../../components/admin/AssociationViewModal'
import { useAuth } from '../../context/AuthContext'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import {
  associations as initialAssociations,
  associationTypes,
  type Association,
  type AssociationStatus,
  type AssociationType,
} from '../../data/mockData'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AssociationsPage() {
  const { user, profile } = useAuth()
  const actorName = profile?.fullName ?? user?.fullName ?? 'Administrator'
  const actorEmail = profile?.email ?? user?.email

  const [items, setItems] = useState<Association[]>(initialAssociations)
  const [typeFilter, setTypeFilter] = useState<'All' | AssociationType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | AssociationStatus>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingAssociation, setEditingAssociation] = useState<Association | null>(null)
  const [settingsAssociation, setSettingsAssociation] = useState<Association | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingAssociation, setViewingAssociation] = useState<Association | null>(null)

  const filtered = useMemo(() => {
    return items.filter((row) => {
      const typeMatch = typeFilter === 'All' || row.type === typeFilter
      const statusMatch = statusFilter === 'All' || row.status === statusFilter
      return typeMatch && statusMatch
    })
  }, [items, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const active = items.filter((row) => row.status === 'ACTIVE').length
    const membersServed = items.reduce((sum, row) => sum + row.members, 0)
    const pendingRegistration = items.filter((row) => row.status === 'INACTIVE').length

    return {
      total: items.length,
      active,
      membersServed,
      pendingRegistration,
    }
  }, [items])

  function handleAdd() {
    setEditingAssociation(null)
    setFormOpen(true)
  }

  function handleEdit(association: Association) {
    setEditingAssociation(association)
    setFormOpen(true)
  }

  function handleOpenSettings(association: Association) {
    setSettingsAssociation(association)
    setSettingsOpen(true)
  }

  function handleView(association: Association) {
    setViewingAssociation(association)
    setViewOpen(true)
  }

  function handleSaveForm(input: AssociationFormInput) {
    if (editingAssociation) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === editingAssociation.id ? { ...row, ...input } : row,
        ),
      )
      logAuditEvent({
        user: actorName,
        userEmail: actorEmail,
        action: 'Association Update',
        actionColor: 'purple',
        description: `Updated association ${editingAssociation.name}.`,
        entityType: 'association',
        entityId: editingAssociation.id,
        changes: buildChanges([
          { key: 'name', label: 'Association Name', oldValue: editingAssociation.name, newValue: input.name },
          { key: 'type', label: 'Type', oldValue: editingAssociation.type, newValue: input.type },
          { key: 'members', label: 'Total Members', oldValue: editingAssociation.members, newValue: input.members },
          { key: 'contactPerson', label: 'Contact Person', oldValue: editingAssociation.contactPerson, newValue: input.contactPerson },
          { key: 'contactNumber', label: 'Contact Number', oldValue: editingAssociation.contactNumber, newValue: input.contactNumber },
        ]),
      })
      return
    }

    const newAssociation: Association = {
      id: crypto.randomUUID(),
      ...input,
      dateRegistered: formatDate(new Date()),
      status: 'ACTIVE',
    }
    setItems((prev) => [newAssociation, ...prev])
    logAuditEvent({
      user: actorName,
      userEmail: actorEmail,
      action: 'Association Update',
      actionColor: 'purple',
      description: `Registered new association ${input.name}.`,
      entityType: 'association',
      entityId: newAssociation.id,
      changes: buildChanges([
        { key: 'name', label: 'Association Name', oldValue: '—', newValue: input.name },
        { key: 'type', label: 'Type', oldValue: '—', newValue: input.type },
        { key: 'members', label: 'Total Members', oldValue: '—', newValue: input.members },
        { key: 'status', label: 'Status', oldValue: '—', newValue: 'ACTIVE' },
      ]),
    })
  }

  function handleSaveSettings(id: string, status: AssociationStatus) {
    const current = items.find((row) => row.id === id)
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)))
    if (current && current.status !== status) {
      logAuditEvent({
        user: actorName,
        userEmail: actorEmail,
        action: 'Association Update',
        actionColor: 'purple',
        description: `Updated settings for ${current.name}.`,
        entityType: 'association',
        entityId: id,
        changes: buildChanges([
          { key: 'status', label: 'Status', oldValue: current.status, newValue: status },
        ]),
      })
    }
  }

  return (
    <>
      <AdminHeader title="Manage Barangay Associations" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Associations" value={stats.total} icon={Building2} />
          <StatCard label="Active Associations" value={stats.active} icon={UserCheck} />
          <StatCard label="Total Members Served" value={stats.membersServed} icon={Users} />
          <StatCard label="Pending Registration" value={stats.pendingRegistration} icon={Clock} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'All' | AssociationType)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="All">Type: All</option>
                {associationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | AssociationStatus)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="All">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Add Association
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Association Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Total Members</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">Date Registered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No associations match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600">{row.type}</td>
                      <td className="px-4 py-3 text-gray-600">{row.members}</td>
                      <td className="px-4 py-3 text-gray-600">{row.contactPerson}</td>
                      <td className="px-4 py-3 text-gray-600">{row.contactNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{row.dateRegistered}</td>
                      <td className="px-4 py-3">
                        <ActiveBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(row)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                            aria-label={`View ${row.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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
                            onClick={() => handleOpenSettings(row)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                            aria-label={`Settings for ${row.name}`}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            showing={
              filtered.length === 0
                ? 'Showing 0 entries'
                : `Showing 1 to ${filtered.length} of ${filtered.length} entries`
            }
          />
        </div>
      </main>

      <AssociationFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingAssociation ? 'Edit Association' : 'Add Association'}
        initialValues={editingAssociation ?? undefined}
        onSave={handleSaveForm}
      />

      <AssociationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        association={settingsAssociation}
        onSave={handleSaveSettings}
      />

      <AssociationViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        association={viewingAssociation}
        onEdit={handleEdit}
        onSettings={handleOpenSettings}
      />
    </>
  )
}
