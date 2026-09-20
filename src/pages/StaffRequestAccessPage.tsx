import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthBrandingPanel } from '../components/auth/AuthBrandingPanel'
import {
  BriefcaseIcon,
  BuildingIcon,
  FormField,
  FormSelect,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from '../components/auth/FormField'
import { PublicOnlyRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../context/AuthContext'

function StaffRequestAccessForm() {
  const { submitRequest } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [position, setPosition] = useState('')
  const [department, setDepartment] = useState('')
  const role = 'Barangay Staff'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    const result = submitRequest({
      firstName,
      lastName,
      email,
      contactNumber,
      position,
      department,
      roleLabel: role,
      password,
    })

    if (!result.success) {
      setError(result.error ?? 'Unable to submit request.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        <AuthBrandingPanel />
        <div className="relative flex flex-col justify-center bg-white px-8 py-16 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-lg text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Request Submitted</h2>
            <p className="mb-6 text-sm text-gray-600">
              Your access request has been sent to the administrator. You will be able to sign in
              once your account is approved.
            </p>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandingPanel />

      <div className="relative flex flex-col justify-center bg-white px-8 py-16 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            to="/request-access"
            className="mb-6 inline-block text-sm text-gray-500 transition hover:text-primary"
          >
            &larr; Choose account type
          </Link>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">Staff Access Request</h2>
          <p className="mb-8 text-sm text-gray-500">
            Submit your information for barangay staff account approval by the administrator
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="First Name"
                id="firstName"
                icon={UserIcon}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                required
              />
              <FormField
                label="Last Name"
                id="lastName"
                icon={UserIcon}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Email Address"
                id="email"
                type="email"
                icon={MailIcon}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan.delacruz@example.com"
                required
              />
              <FormField
                label="Contact Number"
                id="contactNumber"
                type="tel"
                icon={PhoneIcon}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="0917XXXXXXX"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Position / Designation"
                id="position"
                icon={BriefcaseIcon}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Social Worker II"
                required
              />
              <FormSelect
                label="Department"
                id="department"
                icon={BuildingIcon}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select department
                </option>
                <option value="barangay-hall">Barangay Hall</option>
                <option value="social-services">Social Services</option>
                <option value="health">Health &amp; Sanitation</option>
                <option value="peace-order">Peace &amp; Order</option>
                <option value="youth-sports">Youth &amp; Sports</option>
              </FormSelect>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
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
              <FormField
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                icon={LockIcon}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••"
                required
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary accent-primary"
                required
              />
              <span className="text-sm text-gray-600">
                I confirm that I am an authorized personnel of Barangay Buru-un.
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1a472a] py-3 text-sm font-bold text-white transition hover:bg-[#143520]"
            >
              Submit Request
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <p className="absolute bottom-6 right-8 text-xs text-gray-400">
          &copy; 2026 Barangay Buru-un, Iligan City. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function StaffRequestAccessPage() {
  return (
    <PublicOnlyRoute>
      <StaffRequestAccessForm />
    </PublicOnlyRoute>
  )
}
