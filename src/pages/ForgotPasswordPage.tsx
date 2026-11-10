import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BarangayLogo } from '../components/BarangayLogo'
import { sendUserPasswordReset } from '../services/authStorage'
import { recoveryEmailError } from '../services/passwordRecovery'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const validationError = recoveryEmailError(email)
    if (validationError) {
      setError(validationError)
      return
    }
    setSending(true)
    const result = await sendUserPasswordReset(email)
    setSending(false)
    if (!result.success) {
      setError(result.error ?? 'Could not send the recovery email.')
      return
    }
    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <BarangayLogo className="h-12 w-12" alt="Barangay Buru-un" />
          <div>
            <h1 className="text-xl font-bold text-gray-950">Recover your account</h1>
            <p className="mt-1 text-sm text-gray-500">Receive a secure password reset link</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
            If an account exists for that email, Supabase has sent a recovery link. Check your inbox and spam folder.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <label className="block text-sm font-medium text-gray-700">
              Account email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
            >
              {sending ? 'Sending recovery link...' : 'Send recovery link'}
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
