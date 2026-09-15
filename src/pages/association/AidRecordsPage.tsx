import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { Modal } from '../../components/ui/Modal'
import { aidRecords } from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

type AidRecord = (typeof aidRecords)[number]

export default function AidRecordsPage() {
  const [showModal, setShowModal] = useState(false)

  const columns: Column<AidRecord>[] = [
    { key: 'member', header: 'Member', render: (r) => <span className="font-medium text-gray-900">{r.member}</span> },
    { key: 'program', header: 'Program' },
    { key: 'dateReceived', header: 'Date Received' },
    { key: 'quantity', header: 'Quantity / Amount' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'RECEIVED' ? 'success' : 'warning'}>{r.status}</Badge>
      ),
    },
  ]

  return (
    <>
      <DashboardNavbar
        title="Aid Distribution Records"
        searchPlaceholder="Search aid records..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
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

          <DataTable columns={columns} data={aidRecords} keyExtractor={(r) => r.id} />
          <Pagination showing="Showing 1 to 4 of 12 records" />
        </div>
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Submit Aid Record">
        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Member</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option>Maria Santos</option>
              <option>Juan dela Cruz</option>
              <option>Ana Garcia</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Program</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Program name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Date Received</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Quantity / Amount</label>
            <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. 1 pack, ₱ 2,500" />
          </div>
          <Button type="submit" className="w-full">Submit Record</Button>
        </form>
      </Modal>
    </>
  )
}
