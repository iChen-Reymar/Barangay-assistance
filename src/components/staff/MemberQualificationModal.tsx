import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle, ChevronLeft, FileText, ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatDate } from '../../services/authStorage'
import { getAssociationMembers, subscribeMemberStorage, verifyMemberRecord } from '../../services/memberStorage'
import {
  addStaffBeneficiary,
  getStaffBeneficiaries,
  subscribeStaffBeneficiaryStorage,
  updateStaffBeneficiary,
} from '../../services/staffBeneficiaryStorage'
import type { AssociationMember } from '../../data/associationMockData'
import type { StaffBeneficiary } from '../../data/staffMockData'

interface MemberQualificationModalProps {
  open: boolean
  onClose: () => void
  association: string | null
  reviewerName: string
}

interface HouseholdForm {
  familySize: number
  monthlyIncome: number
  workingHouseholdMembers: number
  age: number
  employmentStatus: string
  housingCondition: string
}

function sameAssociation(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function findAssessment(records: StaffBeneficiary[], memberId: string) {
  return records.find((row) => row.memberId === memberId || row.id === memberId)
}

export function MemberQualificationModal({
  open,
  onClose,
  association,
  reviewerName,
}: MemberQualificationModalProps) {
  const [members, setMembers] = useState<AssociationMember[]>([])
  const [assessments, setAssessments] = useState<StaffBeneficiary[]>([])
  const [memberId, setMemberId] = useState('')

  useEffect(() => {
    if (!open || !association) return
    const load = () => {
      setMembers(getAssociationMembers(association))
      setAssessments(getStaffBeneficiaries().filter((row) => sameAssociation(row.association, association)))
    }
    load()
    const stopMembers = subscribeMemberStorage(load)
    const stopAssessments = subscribeStaffBeneficiaryStorage(load)
    return () => {
      stopMembers()
      stopAssessments()
    }
  }, [open, association])

  useEffect(() => {
    if (open) queueMicrotask(() => setMemberId(''))
  }, [open, association])

  if (!association) return null
  const selected = members.find((member) => member.id === memberId)

  return (
    <Modal open={open} onClose={onClose} title={selected?.name ?? association} size="xl">
      {selected ? (
        <MemberReview
          key={selected.id}
          member={selected}
          association={association}
          assessment={findAssessment(assessments, selected.id)}
          reviewerName={reviewerName}
          onBack={() => setMemberId('')}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Select a member from {association} to review household details and verify qualification.
          </p>
          {members.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
              No members are linked to this requested association.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
              {members.map((member) => {
                const verified = member.staffVerified && findAssessment(assessments, member.id)?.verification === 'VERIFIED'
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setMemberId(member.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span>
                        <span className="block font-medium text-gray-900">{member.name}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {member.membershipStatus} · {member.assistanceStatus}
                        </span>
                      </span>
                      <Badge variant={verified ? 'success' : 'warning'}>{verified ? 'VERIFIED' : 'PENDING'}</Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

function MemberReview({
  member,
  association,
  assessment,
  reviewerName,
  onBack,
}: {
  member: AssociationMember
  association: string
  assessment?: StaffBeneficiary
  reviewerName: string
  onBack: () => void
}) {
  const [form, setForm] = useState<HouseholdForm>(() => ({
    familySize: assessment?.familySize ?? member.familySize,
    monthlyIncome: assessment?.monthlyIncome ?? member.monthlyIncome ?? 0,
    workingHouseholdMembers: assessment?.workingHouseholdMembers ?? member.workingHouseholdMembers ?? 0,
    age: assessment?.age ?? member.age,
    employmentStatus: assessment?.employmentStatus ?? member.employmentStatus ?? '',
    housingCondition: assessment?.housingCondition ?? member.housingCondition ?? '',
  }))
  const [message, setMessage] = useState('')
  const verified = member.staffVerified && assessment?.verification === 'VERIFIED'

  function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    if (form.familySize < 1) return setMessage('Family size must be at least 1.')
    if (form.monthlyIncome <= 0) return setMessage('Monthly income must be greater than zero.')
    if (form.workingHouseholdMembers < 0 || form.workingHouseholdMembers > form.familySize) {
      return setMessage('Working household members must be between 0 and the family size.')
    }
    if (form.age < 1) return setMessage('Age is required.')
    if (!form.employmentStatus.trim()) return setMessage('Employment status is required.')
    if (!form.housingCondition.trim()) return setMessage('Housing condition is required.')

    const record: StaffBeneficiary = {
      ...(assessment ?? {}),
      id: assessment?.id ?? crypto.randomUUID(),
      memberId: member.id,
      name: member.name.trim(),
      association,
      familySize: form.familySize,
      monthlyIncome: form.monthlyIncome,
      workingHouseholdMembers: form.workingHouseholdMembers,
      age: form.age,
      contactNumber: member.contactNumber,
      address: member.address,
      employmentStatus: form.employmentStatus,
      housingCondition: form.housingCondition,
      vulnerability: member.vulnerability,
      verification: 'VERIFIED',
      vulnerabilityIndicators: assessment?.vulnerabilityIndicators ?? [
        ...(member.isPwd ? ['PWD Member (Person with Disability)'] : []),
        ...(member.isSenior ? ['Elderly Member (60+)'] : []),
      ],
    }
    if (assessment) updateStaffBeneficiary(record)
    else addStaffBeneficiary(record)
    verifyMemberRecord(member.id, reviewerName)
    setMessage('Member verified and ready for assistance-list generation.')
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          {association} members
        </button>
        {verified ? <Badge variant="success">VERIFIED</Badge> : null}
      </div>
      {verified && member.staffVerifiedBy && member.staffVerifiedAt ? (
        <p className="text-xs text-green-700">
          Verified by {member.staffVerifiedBy} on {formatDate(member.staffVerifiedAt)}.
        </p>
      ) : null}

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <FileText className="h-4 w-4 text-primary" /> Details
        </h3>
        <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm sm:grid-cols-2">
          <Field label="Association" value={association} />
          <Field label="Age" value={String(member.age || 0)} />
          <Field label="Contact Number" value={member.contactNumber || '—'} />
          <Field label="Family Size" value={String(member.familySize || 0)} />
          <Field label="Address" value={member.address || '—'} wide />
          <Field label="Date Joined" value={member.dateJoined} />
          <Field label="Membership" value={member.membershipStatus} />
          <Field label="Assistance Status" value={member.assistanceStatus} />
          <Field label="Vulnerability" value={member.vulnerabilitySource === 'ml' ? `${member.vulnerability} · ${member.vulnerabilityScore ?? '—'}/100` : 'Awaiting AI generation'} />
          <Field label="Senior Citizen" value={member.isSenior ? 'Yes' : 'No'} />
          <Field label="PWD" value={member.isPwd ? 'Yes' : 'No'} />
          <Field label="Verification" value={verified ? 'VERIFIED' : 'UNVERIFIED'} />
          {member.notes ? <Field label="Notes" value={member.notes} wide /> : null}
        </dl>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <ShieldCheck className="h-4 w-4 text-primary" /> Member Qualification Data
          </h3>
          {verified ? <Badge variant="success">VERIFIED</Badge> : null}
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Complete these household fields and verify the member for ML vulnerability scoring.</p>
          {message ? (
            <p className={`rounded-lg border px-3 py-2 text-sm ${message.startsWith('Member verified') ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Family Size" type="number" min={1} value={form.familySize || ''} onChange={(value) => setForm((current) => ({ ...current, familySize: Number(value) || 0 }))} />
            <Input label="Monthly Income" type="number" min={0.01} step="0.01" value={form.monthlyIncome || ''} onChange={(value) => setForm((current) => ({ ...current, monthlyIncome: Number(value) || 0 }))} />
            <Input label="Working Members" type="number" min={0} max={form.familySize} value={form.workingHouseholdMembers} onChange={(value) => setForm((current) => ({ ...current, workingHouseholdMembers: Number(value) || 0 }))} />
            <Input label="Age" type="number" min={1} value={form.age || ''} onChange={(value) => setForm((current) => ({ ...current, age: Number(value) || 0 }))} />
            <label className="text-xs font-semibold uppercase text-gray-500">Employment
              <select required value={form.employmentStatus} onChange={(event) => setForm((current) => ({ ...current, employmentStatus: event.target.value }))} className={inputClass}>
                <option value="">Select status</option><option>Employed</option><option>Self-Employed</option><option>Seasonal Worker</option><option>Unemployed</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase text-gray-500">Housing Condition
              <select required value={form.housingCondition} onChange={(event) => setForm((current) => ({ ...current, housingCondition: event.target.value }))} className={inputClass}>
                <option value="">Select condition</option><option>Concrete</option><option>Light Materials</option><option>Renter</option><option>Makeshift / Salvaged</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm"><CheckCircle className="h-4 w-4" />{verified ? 'Update Verification' : 'Save & Verify Member'}</Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Input({ label, onChange, ...props }: { label: string; onChange: (value: string) => void; type: string; min: number; max?: number; step?: string; value: string | number }) {
  return (
    <label className="text-xs font-semibold uppercase text-gray-500">{label}
      <input required {...props} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
    </label>
  )
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-[10px] font-semibold uppercase text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value}</dd>
    </div>
  )
}
