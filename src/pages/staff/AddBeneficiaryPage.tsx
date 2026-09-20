import { Link } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Button } from '../../components/ui/Button'
import { associations } from '../../data/staffMockData'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'

const vulnerabilityIndicators = [
  'Elderly Member (60+)',
  'PWD Member (Person with Disability)',
  'Children Under 5 Years Old',
  'Unemployed Adult Members',
  'No Previous Government Assistance Received',
]

export default function AddBeneficiaryPage() {
  const displayUser = useStaffDisplayUser()

  return (
    <>
      <DashboardNavbar
        title="Add New Beneficiary"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <form className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Full Name</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Enter complete name (e.g. Juan dela Cruz)" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Age</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Years" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Sex</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Contact Number</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. 09171234567" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Address</label>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Purok, Street, Barangay Buru-un" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Household Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Family Size</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="No. of members" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
                  <input type="number" className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Employment Status</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option>Employed</option>
                  <option>Self-Employed</option>
                  <option>Unemployed</option>
                  <option>Seasonal Worker</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Housing Condition</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option>Concrete</option>
                  <option>Light Materials</option>
                  <option>Makeshift / Salvaged</option>
                  <option>Temporary</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Vulnerability Indicators</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {vulnerabilityIndicators.map((label) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Association</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Belonging Association</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select Local Association Group</option>
                  {associations.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Membership Type</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select Membership Category</option>
                  <option>Regular Member</option>
                  <option>Officer</option>
                  <option>Associate Member</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link to="/staff/beneficiaries">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Save Beneficiary</Button>
          </div>
        </form>
      </main>
    </>
  )
}
