import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthBrandingPanel } from '../components/auth/AuthBrandingPanel'
import { FormField, LockIcon, MailIcon } from '../components/auth/FormField'
import { PublicOnlyRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_ADMIN } from '../types/auth'

function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const result = login(email, password, rememberMe)
    if (result.success && result.redirectTo) {
      navigate(result.redirectTo)
      return
    }
    setError(result.error ?? 'Unable to sign in.')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandingPanel />

      <div className="relative flex flex-col justify-center bg-white px-5 py-10 sm:px-8 sm:py-16 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Welcome Back</h2>
          <p className="mb-8 text-sm text-gray-500">
            Sign in to access the Barangay Assistance Matching System
          </p>

          <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-primary">Default Admin Account</p>
            <p className="mt-1">Email: {DEFAULT_ADMIN.email}</p>
            <p>Password: {DEFAULT_ADMIN.password}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <FormField
              label="Email Address"
              id="email"
              type="email"
              icon={MailIcon}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
            />

            <FormField
              label="Password"
              id="password"
              type="password"
              icon={LockIcon}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-primary hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1a472a] py-3 text-sm font-bold text-white transition hover:bg-[#143520]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
            <p>
              Barangay staff?{' '}
              <Link to="/request-access" className="font-semibold text-primary hover:underline">
                Request Staff Access
              </Link>
            </p>
            <p>
              Association head?{' '}
              <Link
                to="/register/association-head"
                className="font-semibold text-primary hover:underline"
              >
                Register Your Association
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 sm:absolute sm:bottom-6 sm:right-8 sm:mt-0">
          &copy; 2026 Barangay Buru-un, Iligan City. All rights reserved.
        </p>

        <Link
          to="/"
          className="mb-4 inline-block text-sm text-gray-400 transition hover:text-primary sm:absolute sm:left-8 sm:top-6 sm:mb-0 lg:hidden"
        >
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <LoginForm />
    </PublicOnlyRoute>
  )
}
