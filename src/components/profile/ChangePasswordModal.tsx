import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { PasswordChangeInput } from '../../types/auth'

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
  onSave: (input: PasswordChangeInput) => { success: boolean; error?: string }
}

export function ChangePasswordModal({ open, onClose, onSave }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function resetForm() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    const result = onSave({ currentPassword, newPassword })
    if (!result.success) {
      setError(result.error ?? 'Unable to change password.')
      return
    }

    setSuccess(true)
    setTimeout(handleClose, 800)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Password changed successfully.
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Current Password</label>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">New Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Confirm New Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Update Password</Button>
        </div>
      </form>
    </Modal>
  )
}
