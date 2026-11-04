import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { SubmittedAidRecords } from '../../components/aid/SubmittedAidRecords'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'

export default function StaffAidRecordsPage() {
  const displayUser = useStaffDisplayUser()

  return (
    <>
      <DashboardNavbar
        title="Submitted Aid Records"
        searchPlaceholder="Search aid records..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <SubmittedAidRecords />
      </main>
    </>
  )
}
