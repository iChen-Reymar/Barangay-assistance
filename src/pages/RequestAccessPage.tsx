import { Link } from 'react-router-dom'
import { Briefcase, ChevronRight, Users } from 'lucide-react'
import { AuthBrandingPanel } from '../components/auth/AuthBrandingPanel'
import { PublicOnlyRoute } from '../components/auth/ProtectedRoute'

function RequestAccessChoose() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandingPanel />

      <div className="relative flex flex-col justify-center bg-white px-8 py-16 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-lg">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Request Access</h2>
          <p className="mb-8 text-sm text-gray-500">
            Choose the type of account you need. Your request will be reviewed by the barangay
            administrator before you can sign in.
          </p>

          <div className="space-y-4">
            <Link
              to="/request-access/staff"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 p-5 shadow-sm transition hover:border-primary hover:bg-green-50/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-primary group-hover:bg-white">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900">Barangay Staff</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  For barangay hall personnel, social services, and authorized desk officers.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-primary" />
            </Link>

            <Link
              to="/register/association-head"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 p-5 shadow-sm transition hover:border-primary hover:bg-green-50/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 text-primary group-hover:bg-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900">Association Head</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Register your association and request portal access as the authorized representative.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-primary" />
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
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

export default function RequestAccessPage() {
  return (
    <PublicOnlyRoute>
      <RequestAccessChoose />
    </PublicOnlyRoute>
  )
}
