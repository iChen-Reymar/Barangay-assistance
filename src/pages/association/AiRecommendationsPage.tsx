import { AlertTriangle } from 'lucide-react'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Badge } from '../../components/ui/Badge'
import { aiRecommendations, type VulnerabilityLevel } from '../../data/associationMockData'
import { associationUser } from '../../components/association/navConfig'

function vulnerabilityVariant(level: VulnerabilityLevel) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

export default function AiRecommendationsPage() {
  return (
    <>
      <DashboardNavbar
        title="Assistance Recommendations"
        searchPlaceholder="Search recommendations..."
        userName={associationUser.name}
        userInitials={associationUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Recommendations are subject to review and approval by authorized barangay officials.
            AI provides decision-support only — not autonomous approval.
          </p>
        </div>

        <div className="space-y-4">
          {aiRecommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <Badge variant={vulnerabilityVariant(rec.vulnerabilityLevel)}>
                  {`Vulnerability: ${rec.vulnerabilityLevel}`}
                </Badge>
                <Badge variant="info">{rec.status}</Badge>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase text-green-700">Recommended Program</p>
                <p className="mt-1 text-lg font-bold text-green-800">{rec.recommendedProgram}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Reason</p>
                <p className="mt-1 text-sm text-gray-600">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
