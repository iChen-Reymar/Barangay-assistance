import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { approvedAssistance } from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

export default function ApprovedRequestsPage() {
  return (
    <>
      <DashboardNavbar
        title="Approved Assistance"
        searchPlaceholder="Search approved requests..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approvedAssistance.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-green-800">{item.program}</h2>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Approved Date</dt>
                  <dd className="font-medium text-gray-900">{item.approvedDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Beneficiaries</dt>
                  <dd className="font-medium text-gray-900">{item.beneficiaries}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Distribution Date</dt>
                  <dd className="font-medium text-gray-900">{item.distributionDate}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <Badge variant="success">{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
