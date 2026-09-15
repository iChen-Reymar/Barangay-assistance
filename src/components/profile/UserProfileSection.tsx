import { useState } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { UserProfileDetails } from './UserProfileDetails'
import { EditProfileModal } from './EditProfileModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { useAuth } from '../../context/AuthContext'
import type { StoredUser } from '../../types/auth'
import { getInitials, usernameFromEmail } from '../../utils/userDisplay'

interface UserProfileSectionProps {
  profile: StoredUser
  layout?: 'default' | 'centered'
  showRoleBadge?: boolean
}

export function UserProfileSection({
  profile,
  layout = 'default',
  showRoleBadge = false,
}: UserProfileSectionProps) {
  const { updateProfile, changePassword } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const initials = getInitials(profile.fullName)

  const header =
    layout === 'centered' ? (
      <div className="mb-6 flex flex-col items-center text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          {initials}
        </div>
        <div className="mt-4 sm:ml-6 sm:mt-0">
          <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
          <p className="text-sm text-gray-500">@{usernameFromEmail(profile.email)}</p>
          {showRoleBadge && <Badge variant="success">{profile.roleLabel}</Badge>}
        </div>
      </div>
    ) : (
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
          <p className="text-sm text-gray-500">@{usernameFromEmail(profile.email)}</p>
        </div>
      </div>
    )

  return (
    <>
      {header}
      <UserProfileDetails profile={profile} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Edit Profile
        </Button>
        <Button variant="outline" onClick={() => setPasswordOpen(true)}>
          Change Password
        </Button>
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={updateProfile}
      />
      <ChangePasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSave={changePassword}
      />
    </>
  )
}
