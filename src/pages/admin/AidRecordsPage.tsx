import { AdminHeader } from '../../components/admin/AdminHeader'
import { SubmittedAidRecords } from '../../components/aid/SubmittedAidRecords'

export default function AdminAidRecordsPage() {
  return (
    <>
      <AdminHeader title="Submitted Aid Records" searchPlaceholder="Search aid records..." />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <SubmittedAidRecords />
      </main>
    </>
  )
}
