import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarangayLogo } from '../components/BarangayLogo'
import { supabase } from '../lib/supabase'
import { clearLocalSession } from '../services/authStorage'
import { newPasswordError } from '../services/passwordRecovery'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [ready, setReady] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(Boolean(session))
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const validationError = newPasswordError(password, confirmation)
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    clearLocalSession()
    await supabase.auth.signOut({ scope: 'local' })
    navigate('/login', { replace: true, state: { passwordReset: true } })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <BarangayLogo className="h-12 w-12" alt="Barangay Buru-un" />
          <div>
            <h1 className="text-xl font-bold text-gray-950">Choose a new password</h1>
            <p className="mt-1 text-sm text-gray-500">Barangay Assistance account recovery</p>
          </div>
        </div>

        {ready === null ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Checking your recovery link...
          </div>
        ) : !ready ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            This recovery link is invalid or has expired. Request another reset email from the administrator.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <label className="block text-sm font-medium text-gray-700">
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
          Return to sign in
        </Link>
      </section>
    </main>
  )
}
