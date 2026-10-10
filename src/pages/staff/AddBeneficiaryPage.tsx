import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardNavbar } from '../../components/layout/DashboardNavbar'
import { Button } from '../../components/ui/Button'
import { getAssociations } from '../../services/associationStorage'
import { useStaffDisplayUser } from '../../hooks/useStaffDisplayUser'
import { addStaffBeneficiary } from '../../services/staffBeneficiaryStorage'
import { logAuditEvent } from '../../services/auditStorage'
import { useAuth } from '../../context/AuthContext'
import type { VulnerabilityLevel } from '../../data/staffMockData'

const vulnerabilityIndicators = [
  'Elderly Member (60+)',
  'PWD Member (Person with Disability)',
  'Children Under 5 Years Old',
  'Unemployed Adult Members',
  'No Previous Government Assistance Received',
]

export default function AddBeneficiaryPage() {
  const displayUser = useStaffDisplayUser()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const association = String(data.get('association') ?? '').trim()
    const familySize = Number(data.get('familySize'))
    const monthlyIncome = Number(data.get('monthlyIncome'))
    const indicators = data.getAll('vulnerabilityIndicators').map(String)

    if (!name || !association || !Number.isFinite(familySize) || familySize < 1) {
      setError('Enter the beneficiary name, association, and a valid family size.')
      return
    }
    if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
      setError('Enter a valid monthly income.')
      return
    }

    let vulnerability: VulnerabilityLevel = 'LOW'
    if (indicators.length >= 3 || monthlyIncome < 5000) vulnerability = 'HIGH'
    else if (indicators.length > 0 || monthlyIncome < 8000) vulnerability = 'MEDIUM'

    const beneficiary = addStaffBeneficiary({
      id: crypto.randomUUID(),
      name,
      association,
      familySize,
      monthlyIncome,
      vulnerability,
      verification: 'PENDING',
      age: Number(data.get('age')) || undefined,
      sex: String(data.get('sex') ?? '') || undefined,
      contactNumber: String(data.get('contactNumber') ?? '').trim() || undefined,
      address: String(data.get('address') ?? '').trim() || undefined,
      employmentStatus: String(data.get('employmentStatus') ?? '') || undefined,
      housingCondition: String(data.get('housingCondition') ?? '') || undefined,
      vulnerabilityIndicators: indicators,
      membershipType: String(data.get('membershipType') ?? '') || undefined,
    })

    logAuditEvent({
      user: profile?.fullName ?? user?.fullName ?? displayUser.name,
      userEmail: profile?.email ?? user?.email,
      action: 'Beneficiary Added',
      actionColor: 'green',
      description: `Added beneficiary record for ${beneficiary.name}.`,
      entityType: 'beneficiary',
      entityId: beneficiary.id,
    })

    navigate('/staff/beneficiaries')
  }

  return (
    <>
      <DashboardNavbar
        title="Add New Beneficiary"
        searchPlaceholder="Search records, requests, files..."
        userName={displayUser.name}
        userInitials={displayUser.initials}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Full Name</label>
                <input name="name" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Enter complete name (e.g. Juan dela Cruz)" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Age</label>
                <input name="age" type="number" min="0" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Years" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Sex</label>
                <select name="sex" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Contact Number</label>
                <input name="contactNumber" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. 09171234567" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Address</label>
                <input name="address" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Purok, Street, Barangay Buru-un" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900">Household Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Family Size</label>
                <input name="familySize" type="number" min="1" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="No. of members" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₱</span>
                  <input name="monthlyIncome" type="number" min="0" step="0.01" required className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Employment Status</label>
                <select name="employmentStatus" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option>Employed</option>
                  <option>Self-Employed</option>
                  <option>Unemployed</option>
                  <option>Seasonal Worker</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Housing Condition</label>
                <select name="housingCondition" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
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
                  <input name="vulnerabilityIndicators" value={label} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary accent-primary" />
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
                <select name="association" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">Select Local Association Group</option>
                  <option value="Unassigned">Unassigned / No Association</option>
                  {getAssociations().map((association) => (
                    <option key={association.id} value={association.name}>{association.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">Membership Type</label>
                <select name="membershipType" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
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
