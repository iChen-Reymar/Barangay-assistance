import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { departmentOptions } from '../../services/authStorage'
import type { ProfileUpdateInput, StoredUser } from '../../types/auth'

interface EditProfileModalProps {
  open: boolean
  onClose: () => void
  profile: StoredUser
  onSave: (input: ProfileUpdateInput) => { success: boolean; error?: string }
}

export function EditProfileModal({ open, onClose, profile, onSave }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email, setEmail] = useState(profile.email)
  const [contactNumber, setContactNumber] = useState(profile.contactNumber)
  const [position, setPosition] = useState(profile.position)
  const [department, setDepartment] = useState(profile.department)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setEmail(profile.email)
    setContactNumber(profile.contactNumber)
    setPosition(profile.position)
    setDepartment(profile.department)
    setError('')
    setSuccess(false)
  }, [open, profile])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const result = onSave({
      firstName,
      lastName,
      email,
      contactNumber,
      position,
      department,
    })
    if (!result.success) {
      setError(result.error ?? 'Unable to update profile.')
      return
    }
    setSuccess(true)
    setTimeout(() => {
      onClose()
    }, 800)
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">First Name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Last Name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Email Address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Contact Number</label>
          <input
            required
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Position / Designation</label>
          <input
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Department</label>
          <select
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  )
}
