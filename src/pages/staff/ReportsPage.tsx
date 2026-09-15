import { FileText, Download } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { AnalyticsCharts } from '../../components/admin/AnalyticsCharts'
import { Button } from '../../components/ui/Button'
import { staffReports } from '../../data/staffMockData'
import { staffUser } from '../../components/staff/navConfig'

export default function StaffReportsPage() {
  return (
    <>
      <DashboardNavbar
        title="System Reports Panel"
        searchPlaceholder="Search records, requests, files..."
        userName={staffUser.name}
        userInitials={staffUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-900">Assistance Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Program matching, request status, and distribution charts for operational review.
          </p>
          <div className="mt-5">
            <AnalyticsCharts />
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">Available Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Generate and export localized reports for barangay operations.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {staffReports.map((report) => (
            <div key={report.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900">{report.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{report.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3" />
                  Export CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
