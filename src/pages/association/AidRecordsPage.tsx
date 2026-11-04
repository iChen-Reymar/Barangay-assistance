import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { PAGE_SIZE_DEFAULT, usePagination } from '../../hooks/usePagination'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'
import { useAuth } from '../../context/useAuth'
import { getAssociations } from '../../services/associationStorage'
import { getAssociationMembers, subscribeMemberStorage } from '../../services/memberStorage'
import { getActivePrograms, subscribeProgramStorage } from '../../services/programStorage'
import { getAidRecords, submitAidRecord, subscribeAidRecords, type AidRecord } from '../../services/aidRecordStorage'
import { buildChanges, logAuditEvent } from '../../services/auditStorage'
import type { AssociationMember } from '../../data/associationMockData'
import type { AssistanceProgram } from '../../data/programsMockData'

function associationNameFor(profileName: string | undefined, userId: string | undefined) {
  const named = profileName?.trim()
  if (named) return named
  if (userId) {
    const assigned = getAssociations().find((row) => row.headUserId === userId)
    if (assigned?.name.trim()) return assigned.name.trim()
  }
  return ''
}

function formatReceivedDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const fieldClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

export default function AidRecordsPage() {
  const { user, profile } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const associationName = associationNameFor(profile?.associationName, user?.id)
  const [showModal, setShowModal] = useState(false)
  const [records, setRecords] = useState<AidRecord[]>(() => getAidRecords(associationName))
  const [members, setMembers] = useState<AssociationMember[]>(() => getAssociationMembers(associationName))
  const [programs, setPrograms] = useState<AssistanceProgram[]>(() => getActivePrograms())
  const [memberId, setMemberId] = useState('')
  const [program, setProgram] = useState('')
  const [dateReceived, setDateReceived] = useState('')
  const [quantity, setQuantity] = useState('')
  const [comments, setComments] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const refresh = () => {
      setRecords(getAidRecords(associationName))
      setMembers(getAssociationMembers(associationName))
    }
    refresh()
    const stopRecords = subscribeAidRecords(refresh)
    const stopMembers = subscribeMemberStorage(refresh)
    const stopPrograms = subscribeProgramStorage(() => setPrograms(getActivePrograms()))
    return () => {
      stopRecords()
      stopMembers()
      stopPrograms()
    }
  }, [associationName])

  const sortedMembers = [...members].sort((left, right) => left.name.localeCompare(right.name))
  const pagination = usePagination(records, PAGE_SIZE_DEFAULT, associationName, 'records')

  const columns: Column<AidRecord>[] = [
    { key: 'member', header: 'Member', render: (row) => <span className="font-medium text-gray-900">{row.memberName}</span> },
    { key: 'program', header: 'Program', render: (row) => row.program },
    { key: 'dateReceived', header: 'Date Received', render: (row) => formatReceivedDate(row.dateReceived) },
    { key: 'quantity', header: 'Quantity / Amount', render: (row) => row.quantity },
    {
      key: 'comments',
      header: 'Comments',
      render: (row) => (
        <span className="block max-w-xs whitespace-normal text-gray-700">{row.comments?.trim() || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'RECEIVED' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
  ]

  function closeModal() {
    setShowModal(false)
    setFormError('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const member = sortedMembers.find((row) => row.id === memberId)
    if (!associationName) {
      setFormError('This account is not linked to an association.')
      return
    }
    if (!member) {
      setFormError('Select a member from your association.')
      return
    }
    if (!program) {
      setFormError('Select an assistance program.')
      return
    }
    const record = submitAidRecord({
      associationName,
      memberId: member.id,
      memberName: member.name,
      program,
      dateReceived,
      quantity: quantity.trim(),
      comments: comments.trim(),
      submittedBy: displayUser.name,
    })
    logAuditEvent({
      user: displayUser.name,
      userEmail: profile?.email ?? user?.email,
      action: 'Aid Record',
      actionColor: 'green',
      description: `${associationName} recorded ${program} for ${member.name}.`,
      entityType: 'aid_record',
      entityId: record.id,
      changes: buildChanges([
        { key: 'member', label: 'Member', oldValue: '—', newValue: member.name },
        { key: 'program', label: 'Program', oldValue: '—', newValue: program },
        { key: 'quantity', label: 'Quantity / Amount', oldValue: '—', newValue: quantity.trim() },
        { key: 'comments', label: 'Comments', oldValue: '—', newValue: comments.trim() || '—' },
        { key: 'status', label: 'Status', oldValue: '—', newValue: 'RECEIVED' },
      ]),
    })
    setMemberId('')
    setProgram('')
    setDateReceived('')
    setQuantity('')
    setComments('')
    setFormError('')
    setShowModal(false)
  }

  return (
    <>
      <DashboardNavbar
        title="Submit Aid Records"
        searchPlaceholder="Search aid records..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex justify-end border-b border-gray-200 px-5 py-4">
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Submit Aid Record
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={pagination.paginatedItems}
            keyExtractor={(row) => row.id}
            stableRowCount={PAGE_SIZE_DEFAULT}
            emptyMessage="No aid records yet for this association."
          />
          <Pagination
            showing={pagination.showing}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
          />
        </div>
      </main>

      <Modal open={showModal} onClose={closeModal} title="Submit Aid Record" size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-semibold uppercase text-gray-500" htmlFor="aid-member">Member</label>
            <select
              id="aid-member"
              required
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
              className={fieldClass}
              disabled={sortedMembers.length === 0}
            >
              <option value="">{sortedMembers.length === 0 ? 'No members in this association' : 'Select a member'}</option>
              {sortedMembers.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold uppercase text-gray-500" htmlFor="aid-program">Program</label>
            <select
              id="aid-program"
              required
              value={program}
              onChange={(event) => setProgram(event.target.value)}
              className={fieldClass}
              disabled={programs.length === 0}
            >
              <option value="">{programs.length === 0 ? 'No active programs' : 'Select a program'}</option>
              {programs.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold uppercase text-gray-500" htmlFor="aid-date">Date Received</label>
            <input
              id="aid-date"
              type="date"
              required
              value={dateReceived}
              onChange={(event) => setDateReceived(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold uppercase text-gray-500" htmlFor="aid-quantity">Quantity / Amount</label>
            <input
              id="aid-quantity"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={fieldClass}
              placeholder="e.g. 1 pack, ₱ 2,500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold uppercase text-gray-500" htmlFor="aid-comments">Comments</label>
            <textarea
              id="aid-comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              rows={3}
              className={fieldClass}
              placeholder="Write a message about this aid record"
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <Button type="submit" className="w-full" disabled={sortedMembers.length === 0 || programs.length === 0}>
            Submit Record
          </Button>
        </form>
      </Modal>
    </>
  )
}
