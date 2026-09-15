import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Eye } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { MemberFormModal, type MemberFormInput } from '../../components/association/MemberFormModal'
import { MemberViewModal } from '../../components/association/MemberViewModal'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import type { AssociationMember, VulnerabilityLevel } from '../../data/associationMockData'
import {
  getAssociationMembers,
  upsertAssociationMember,
  subscribeMemberStorage,
} from '../../services/memberStorage'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/userDisplay'

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

export default function MembersPage() {
  const { user, profile } = useAuth()
  const displayName = profile?.fullName ?? user?.fullName ?? 'Association Head'
  const initials = getInitials(displayName)

  const [items, setItems] = useState<AssociationMember[]>(() => getAssociationMembers())
  const [membershipFilter, setMembershipFilter] = useState<'All' | 'ACTIVE' | 'INACTIVE'>('All')
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState<'All' | VulnerabilityLevel>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<AssociationMember | null>(null)
  const [viewingMember, setViewingMember] = useState<AssociationMember | null>(null)

  useEffect(() => {
    setItems(getAssociationMembers())
    return subscribeMemberStorage(() => setItems(getAssociationMembers()))
  }, [])

  const filtered = useMemo(() => {
    return items.filter((row) => {
      const membershipMatch =
        membershipFilter === 'All' || row.membershipStatus === membershipFilter
      const vulnerabilityMatch =
        vulnerabilityFilter === 'All' || row.vulnerability === vulnerabilityFilter
      return membershipMatch && vulnerabilityMatch
    })
  }, [items, membershipFilter, vulnerabilityFilter])

  function handleAdd() {
    setEditingMember(null)
    setFormOpen(true)
  }

  function handleEdit(member: AssociationMember) {
    setEditingMember(member)
    setFormOpen(true)
  }

  function handleView(member: AssociationMember) {
    setViewingMember(member)
    setViewOpen(true)
  }

  function handleSaveForm(input: MemberFormInput) {
    if (editingMember) {
      upsertAssociationMember({ ...editingMember, ...input })
      return
    }

    upsertAssociationMember({
      id: crypto.randomUUID(),
      ...input,
      assistanceStatus: 'NONE',
    })
  }

  const columns: Column<AssociationMember>[] = [
    {
      key: 'name',
      header: 'Name',
      primary: true,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'age', header: 'Age' },
    {
      key: 'membershipStatus',
      header: 'Membership Status',
      render: (r) => (
        <Badge variant={r.membershipStatus === 'ACTIVE' ? 'success' : 'neutral'}>
          {r.membershipStatus}
        </Badge>
      ),
    },
    {
      key: 'vulnerability',
      header: 'Vulnerability Status',
      render: (r) => <Badge variant={vulnerabilityVariant(r.vulnerability)}>{r.vulnerability}</Badge>,
    },
    {
      key: 'assistanceStatus',
      header: 'Assistance Status',
      render: (r) => (
        <Badge
          variant={
            r.assistanceStatus === 'RECEIVED'
              ? 'success'
              : r.assistanceStatus === 'PENDING'
                ? 'warning'
                : 'neutral'
          }
        >
          {r.assistanceStatus}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleEdit(r)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            aria-label={`Edit ${r.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleView(r)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
            aria-label={`View ${r.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Association Members"
        searchPlaceholder="Search members..."
        userName={displayName}
        userInitials={initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={membershipFilter}
                onChange={(e) =>
                  setMembershipFilter(e.target.value as 'All' | 'ACTIVE' | 'INACTIVE')
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="All">Membership: All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select
                value={vulnerabilityFilter}
                onChange={(e) =>
                  setVulnerabilityFilter(e.target.value as 'All' | VulnerabilityLevel)
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="All">Vulnerability: All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </div>

          <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
          <Pagination
            showing={`Showing 1 to ${filtered.length} of ${items.length} members`}
          />
        </div>
      </main>

      <MemberFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add Member'}
        initialValues={editingMember ?? undefined}
        onSave={handleSaveForm}
      />

      <MemberViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        member={viewingMember}
        onEdit={handleEdit}
      />
    </>
  )
}
