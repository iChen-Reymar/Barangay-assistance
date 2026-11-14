import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Search, Users } from 'lucide-react'
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
import { getAidRecords, submitAidRecords, subscribeAidRecords, type AidRecord } from '../../services/aidRecordStorage'
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
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [program, setProgram] = useState('')
  const [dateReceived, setDateReceived] = useState('')
  const [quantity, setQuantity] = useState('')
  const [comments, setComments] = useState('')
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

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

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => left.name.localeCompare(right.name)),
    [members],
  )
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()
    if (!query) return sortedMembers
    return sortedMembers.filter((member) => member.name.toLowerCase().includes(query))
  }, [memberSearch, sortedMembers])
  const selectedMembers = sortedMembers.filter((member) => memberIds.includes(member.id))
  const duplicateMemberIds = program && dateReceived
    ? new Set(memberIds.filter((id) => records.some((record) =>
        record.memberId === id
        && record.program.trim().toLowerCase() === program.trim().toLowerCase()
        && record.dateReceived === dateReceived,
      )))
    : new Set<string>()
  const newRecordCount = memberIds.length - duplicateMemberIds.size
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

  function toggleMember(id: string) {
    setMemberIds((current) => current.includes(id)
      ? current.filter((memberId) => memberId !== id)
      : [...current, id])
    setFormError('')
  }

  function toggleVisibleMembers() {
    const visibleIds = filteredMembers.map((member) => member.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => memberIds.includes(id))
    setMemberIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])])
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!associationName) {
      setFormError('This account is not linked to an association.')
      return
    }
    if (selectedMembers.length === 0) {
      setFormError('Select at least one member from your association.')
      return
    }
    if (!program) {
      setFormError('Select an assistance program.')
      return
    }
    const result = submitAidRecords(selectedMembers.map((member) => ({
      associationName,
      memberId: member.id,
      memberName: member.name,
      program,
      dateReceived,
      quantity: quantity.trim(),
      comments: comments.trim(),
      submittedBy: displayUser.name,
    })))
    if (result.records.length === 0) {
      setFormError('Aid was already recorded for every selected member under this program and date.')
      return
    }
    const submittedNames = result.records.map((record) => record.memberName)
    logAuditEvent({
      user: displayUser.name,
      userEmail: profile?.email ?? user?.email,
      action: 'Aid Record',
      actionColor: 'green',
      description: `${associationName} recorded ${program} for ${result.records.length} ${result.records.length === 1 ? 'member' : 'members'}.`,
      entityType: 'aid_record',
      entityId: result.records[0].id,
      changes: buildChanges([
        { key: 'members', label: 'Recipients', oldValue: '—', newValue: submittedNames.join(', ') },
        { key: 'count', label: 'Recipient Count', oldValue: '—', newValue: result.records.length },
        { key: 'program', label: 'Program', oldValue: '—', newValue: program },
        { key: 'quantity', label: 'Quantity / Amount', oldValue: '—', newValue: quantity.trim() },
        { key: 'comments', label: 'Comments', oldValue: '—', newValue: comments.trim() || '—' },
        { key: 'status', label: 'Status', oldValue: '—', newValue: 'RECEIVED' },
      ]),
    })
    const skippedNote = result.skipped.length > 0 ? ` ${result.skipped.length} duplicate ${result.skipped.length === 1 ? 'record was' : 'records were'} skipped.` : ''
    setMessage(`Aid recorded for ${result.records.length} ${result.records.length === 1 ? 'member' : 'members'}.${skippedNote}`)
    setMemberIds([])
    setMemberSearch('')
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
        {message ? (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check className="h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex justify-end border-b border-gray-200 px-5 py-4">
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Record aid distribution
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

      <Modal open={showModal} onClose={closeModal} title="Record aid distribution" size="lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="aid-member-search">Recipients</label>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-primary">
                {memberIds.length} selected
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search members</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="aid-member-search"
                    type="search"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search association members"
                    className={`${fieldClass} bg-white pl-9`}
                  />
                </label>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={filteredMembers.length === 0} onClick={toggleVisibleMembers}>
                    {filteredMembers.length > 0 && filteredMembers.every((member) => memberIds.includes(member.id)) ? 'Clear visible' : 'Select visible'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={memberIds.length === 0} onClick={() => setMemberIds([])}>
                    Clear all
                  </Button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto" role="group" aria-label="Aid recipients">
                {filteredMembers.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">
                    {sortedMembers.length === 0 ? 'No members in this association.' : 'No members match your search.'}
                  </p>
                ) : filteredMembers.map((member) => {
                  const selected = memberIds.includes(member.id)
                  return (
                    <label key={member.id} className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 ${selected ? 'bg-green-50/70' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMember(member.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Users className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{member.name}</span>
                      {selected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </label>
                  )
                })}
              </div>
            </div>
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
          {duplicateMemberIds.size > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {duplicateMemberIds.size} selected {duplicateMemberIds.size === 1 ? 'member already has' : 'members already have'} this program recorded on this date and will be skipped.
            </div>
          ) : null}
          {memberIds.length > 0 && program && dateReceived ? (
            <div className="rounded-lg border border-green-100 bg-green-50/60 px-4 py-3 text-sm text-green-900">
              This will create {newRecordCount} individual aid {newRecordCount === 1 ? 'record' : 'records'} for {associationName}.
            </div>
          ) : null}
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <Button type="submit" className="w-full" disabled={sortedMembers.length === 0 || programs.length === 0 || memberIds.length === 0 || newRecordCount === 0}>
            {memberIds.length === 0 ? 'Select recipients' : `Submit ${newRecordCount} aid ${newRecordCount === 1 ? 'record' : 'records'}`}
          </Button>
        </form>
      </Modal>
    </>
  )
}
