import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { AiRecommendationBoards } from '../../components/recommendations/AiRecommendationBoards'
import { useAuth } from '../../context/useAuth'
import { useAssociationDisplayUser } from '../../hooks/useAssociationDisplayUser'
import { getAssociations } from '../../services/associationStorage'

function associationNameFor(profileName: string | undefined, userId: string | undefined) {
  const named = profileName?.trim()
  if (named) return named
  if (userId) {
    const assigned = getAssociations().find((row) => row.headUserId === userId)
    if (assigned?.name.trim()) return assigned.name.trim()
  }
  return ''
}

export default function AiRecommendationsPage() {
  const { user, profile } = useAuth()
  const displayUser = useAssociationDisplayUser()
  const associationName = associationNameFor(profile?.associationName, user?.id)

  return (
    <>
      <DashboardNavbar
        title="View AI Recommendations"
        searchPlaceholder="Search recommendations..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
        notificationsPath="/association/notifications"
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <AiRecommendationBoards
          compact
          associationName={associationName}
          emptyMessage="No AI recommendation yet for your association. It appears here after barangay staff generate the assistance list for your request."
        />
      </main>
    </>
  )
}
