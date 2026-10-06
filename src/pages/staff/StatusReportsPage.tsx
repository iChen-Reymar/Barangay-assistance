import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'

export default function StaffStatusReportsPage() {
  const displayUser = useStaffDisplayUser()

  return (
    <>
      <DashboardNavbar
        title="View Status Reports"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <p className="mb-6 text-sm text-gray-500">
          Beneficiary, distribution, and program status for barangay reporting.
        </p>
        <AnalyticsCharts />
      </main>
    </>
  )
}
