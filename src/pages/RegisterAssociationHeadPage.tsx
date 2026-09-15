import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthBrandingPanel } from '../components/auth/AuthBrandingPanel'
import {
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
import { associationTypes } from '../data/mockData'

function RegisterAssociationHeadForm() {
  const { submitAssociationHeadRequest } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [associationName, setAssociationName] = useState('')
  const [associationType, setAssociationType] = useState('Agricultural')
  const [associationAddress, setAssociationAddress] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
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

    const result = submitAssociationHeadRequest({
      firstName,
      lastName,
      email,
      contactNumber,
      associationName,
      associationType,
      associationAddress,
      registrationNumber: registrationNumber || undefined,
      password,
    })

    if (!result.success) {
      setError(result.error ?? 'Unable to submit registration.')
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
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Registration Submitted</h2>
            <p className="mb-6 text-sm text-gray-600">
              Your Association Head registration for <strong>{associationName}</strong> has been sent
              to the barangay administrator. You will be able to sign in once your account is
              approved.
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
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Association Head Registration</h2>
          <p className="mb-8 text-sm text-gray-500">
            Register your barangay association and request portal access as the authorized head or
            representative.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                Personal Information
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  id="firstName"
                  icon={UserIcon}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ricardo"
                  required
                />
                <FormField
                  label="Last Name"
                  id="lastName"
                  icon={UserIcon}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Lopez"
                  required
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Email Address"
                id="email"
                type="email"
                icon={MailIcon}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="head@yourassociation.org"
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

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                Association Information
              </p>
              <div className="space-y-5">
                <FormField
                  label="Association Name"
                  id="associationName"
                  icon={BuildingIcon}
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value)}
                  placeholder="e.g. Sitoy Farmer's Group"
                  required
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormSelect
                    label="Association Type"
                    id="associationType"
                    icon={BuildingIcon}
                    value={associationType}
                    onChange={(e) => setAssociationType(e.target.value)}
                    required
                  >
                    {associationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </FormSelect>
                  <FormField
                    label="Registration Number (optional)"
                    id="registrationNumber"
                    icon={BuildingIcon}
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="BRU-AG-2020-014"
                  />
                </div>
                <FormField
                  label="Association Address"
                  id="associationAddress"
                  icon={BuildingIcon}
                  value={associationAddress}
                  onChange={(e) => setAssociationAddress(e.target.value)}
                  placeholder="Purok, Sitio, Barangay Buru-un, Iligan City"
                  required
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                Account Security
              </p>
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
                I confirm that I am the authorized head or representative of this registered
                barangay association.
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1a472a] py-3 text-sm font-bold text-white transition hover:bg-[#143520]"
            >
              Submit Registration
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Barangay staff member?{' '}
            <Link to="/request-access" className="font-semibold text-primary hover:underline">
              Request Staff Access
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-100 bg-green-50 p-4">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-600">
              After approval, you can manage members, submit assistance requests, and track aid
              distribution for your association.
            </p>
          </div>
        </div>

        <p className="absolute bottom-6 right-8 text-xs text-gray-400">
          &copy; 2026 Barangay Buru-un, Iligan City. All rights reserved.
        </p>

        <Link
          to="/"
          className="absolute left-8 top-6 text-sm text-gray-400 transition hover:text-primary lg:hidden"
        >
          &larr; Back to Home
        </Link>
      </div>
    </div>
  )
}

export default function RegisterAssociationHeadPage() {
  return (
    <PublicOnlyRoute>
      <RegisterAssociationHeadForm />
    </PublicOnlyRoute>
  )
}
