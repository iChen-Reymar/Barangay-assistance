import { useState, type FormEvent } from 'react'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { BarangayLogo } from '../components/BarangayLogo'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/useAuth'

export default function TemporaryPasswordChangePage() {
  const { completeTemporaryPasswordChange, logout, user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Use at least 8 characters for the new password.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }
    setSaving(true)
    const result = await completeTemporaryPasswordChange(password)
    setSaving(false)
    if (!result.success) setError(result.error ?? 'Could not replace the temporary password.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-gray-100 bg-green-50/60 px-6 py-5">
          <div className="flex items-center gap-3">
            <BarangayLogo className="h-12 w-12" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Secure account setup</p>
              <h1 className="text-lg font-bold text-gray-950">Create your new password</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Hello {user?.fullName}. You signed in with a temporary password. Choose a private password before continuing.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">New password</span>
            <input
              required
              minLength={8}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm new password</span>
            <input
              required
              minLength={8}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Show passwords
          </label>

          <p className="text-xs leading-5 text-gray-500">
            Use at least 8 characters. Do not share your permanent password with anyone, including barangay staff.
          </p>

          <Button type="submit" disabled={saving} className="w-full">
            <KeyRound className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save password and continue'}
          </Button>
          <Button type="button" variant="ghost" disabled={saving} className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </section>
    </main>
  )
}
