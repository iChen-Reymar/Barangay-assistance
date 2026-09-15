import { Badge } from '../ui/Badge'
import { formatDate, formatDepartment } from '../../services/authStorage'
import type { StoredUser } from '../../types/auth'
import { usernameFromEmail } from '../../utils/userDisplay'

interface UserProfileDetailsProps {
  profile: StoredUser
  showUsername?: boolean
}

export function UserProfileDetails({ profile, showUsername = true }: UserProfileDetailsProps) {
  const fields: [string, string][] = [
    ['Full Name', profile.fullName],
    ...(showUsername ? [['Username', usernameFromEmail(profile.email)] as [string, string]] : []),
    ['Email', profile.email],
    ['Contact Number', profile.contactNumber],
    ['Position', profile.position],
    ['Department', formatDepartment(profile.department)],
    ...(profile.associationName
      ? [
          ['Association', profile.associationName] as [string, string],
          ...(profile.associationType
            ? [['Association Type', profile.associationType] as [string, string]]
            : []),
          ...(profile.registrationNumber
            ? [['Registration No.', profile.registrationNumber] as [string, string]]
            : []),
          ...(profile.associationAddress
            ? [['Association Address', profile.associationAddress] as [string, string]]
            : []),
        ]
      : []),
    ['Role', profile.roleLabel],
    ['Barangay', 'Buru-un, Iligan City'],
    ['Date Requested', formatDate(profile.createdAt)],
    ...(profile.approvedAt ? [['Date Approved', formatDate(profile.approvedAt)] as [string, string]] : []),
  ]

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] font-semibold uppercase text-gray-400">{label}</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {label === 'Role' ? (
              <Badge variant="success">{value}</Badge>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
