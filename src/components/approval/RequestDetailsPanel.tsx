import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  FileText,
  ShieldCheck,
  XCircle,
  Download,
  Eye,
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { DecisionTimeline } from './DecisionTimeline'
import { VulnerabilityBadge, StatusBadge } from '../admin/StatusBadge'
import { formatDecisionDate } from '../../services/decisionStorage'
import { formatDate } from '../../services/authStorage'
import type {
  DocumentStatus,
  QualificationStatus,
  ReviewableAssistanceItem,
} from '../../types/approval'

interface RequestDetailsPanelProps {
  item: ReviewableAssistanceItem
  canVerify?: boolean
  onVerifyDocument?: (documentId: string, status: DocumentStatus) => void
  onVerifyQualification?: (checkId: string, status: QualificationStatus, notes?: string) => void
  showDecisionHistory?: boolean
}

const tabs = ['Details', 'Documents', 'Qualifications'] as const
type Tab = (typeof tabs)[number]

function docStatusVariant(status: DocumentStatus) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

function qualStatusVariant(status: QualificationStatus) {
  if (status === 'passed') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

function qualStatusLabel(status: QualificationStatus) {
  if (status === 'passed') return 'Verified'
  if (status === 'failed') return 'Failed'
  if (status === 'pending') return 'Pending'
  return 'N/A'
}

export function RequestDetailsPanel({
  item,
  canVerify = false,
  onVerifyDocument,
  onVerifyQualification,
  showDecisionHistory = true,
}: RequestDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const details = item.details
  const documents = item.documents ?? []
  const qualifications = item.qualifications ?? []

  const verifiedDocs = documents.filter((d) => d.status === 'verified').length
  const passedChecks = qualifications.filter((q) => q.status === 'passed').length
  const pendingChecks = qualifications.filter((q) => q.status === 'pending').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{item.association}</h3>
          <p className="text-sm text-gray-500">{item.requestType}</p>
          <p className="mt-1 text-xs text-gray-400">Request ID: {item.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <VulnerabilityBadge level={item.vulnerability as 'HIGH' | 'MEDIUM' | 'LOW'} />
          <StatusBadge status={item.status} />
          {item.score !== undefined && (
            <Badge variant="warning">{`AI Score: ${item.score}`}</Badge>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'Documents' && documents.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">({verifiedDocs}/{documents.length})</span>
            )}
            {tab === 'Qualifications' && qualifications.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">({passedChecks}/{qualifications.length})</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Details' && details && (
        <div className="space-y-4">
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <FileText className="h-4 w-4 text-primary" />
              Full Request Details
            </h4>
            <dl className="grid gap-3 rounded-lg border border-gray-100 bg-white p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Submitted By</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{details.submittedBy}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Submitted On</dt>
                <dd className="mt-0.5 text-gray-900">{formatDecisionDate(details.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Contact Number</dt>
                <dd className="mt-0.5 text-gray-900">{details.contactNumber}</dd>
              </div>
              {details.email && (
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Email</dt>
                  <dd className="mt-0.5 text-gray-900">{details.email}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Address</dt>
                <dd className="mt-0.5 text-gray-900">{details.address}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Members / Household Size</dt>
                <dd className="mt-0.5 text-gray-900">{details.memberCount}</dd>
              </div>
              {details.monthlyIncome && (
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Monthly Income</dt>
                  <dd className="mt-0.5 text-gray-900">{details.monthlyIncome}</dd>
                </div>
              )}
              {details.vulnerabilityScore !== undefined && (
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Vulnerability Score</dt>
                  <dd className="mt-0.5 font-semibold text-orange-600">{details.vulnerabilityScore}/100</dd>
                </div>
              )}
              {details.associationType && (
                <div>
                  <dt className="text-[10px] font-semibold uppercase text-gray-400">Association Type</dt>
                  <dd className="mt-0.5 text-gray-900">{details.associationType}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Purpose / Reason</dt>
                <dd className="mt-0.5 text-gray-900">{details.purpose}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Requested Assistance</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{details.requestedItems}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-semibold uppercase text-gray-400">Supporting Information</dt>
                <dd className="mt-0.5 text-gray-700">{details.supportingInfo}</dd>
              </div>
            </dl>
          </section>

          {item.description && (
            <section className="rounded-lg border border-green-100 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase text-green-700">AI Assessment Summary</p>
              <p className="mt-1 text-sm text-green-900">{item.description}</p>
              {item.previousAssistance && (
                <p className="mt-2 text-xs text-green-700">
                  Previous Assistance: {item.previousAssistance}
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {activeTab === 'Documents' && (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <FileText className="h-4 w-4 text-primary" />
            Supporting Documents ({verifiedDocs} of {documents.length} verified)
          </h4>
          {documents.length === 0 ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              No supporting documents uploaded.
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <Badge variant={docStatusVariant(doc.status)}>{doc.status.toUpperCase()}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {doc.type} · {doc.fileSize} · Uploaded {formatDecisionDate(doc.uploadedAt)}
                    </p>
                    {doc.verifiedBy && doc.verifiedAt && (
                      <p className="mt-1 text-xs text-green-600">
                        Verified by {doc.verifiedBy} on {formatDate(doc.verifiedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    {canVerify && doc.status !== 'verified' && onVerifyDocument && (
                      <>
                        <Button size="sm" onClick={() => onVerifyDocument(doc.id, 'verified')}>
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerifyDocument(doc.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'Qualifications' && (
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Qualification Verification ({passedChecks} passed · {pendingChecks} pending)
          </h4>
          {qualifications.length === 0 ? (
            <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
              No qualification checks configured.
            </p>
          ) : (
            <ul className="space-y-3">
              {qualifications.map((check) => (
                <li
                  key={check.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {check.status === 'passed' && (
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      )}
                      {check.status === 'failed' && (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      )}
                      {check.status === 'pending' && (
                        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      )}
                      {check.status === 'not_applicable' && (
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{check.criterion}</p>
                        <p className="mt-0.5 text-sm text-gray-600">{check.description}</p>
                        {check.verifiedBy && check.verifiedAt && (
                          <p className="mt-1 text-xs text-gray-500">
                            Verified by {check.verifiedBy} · {formatDecisionDate(check.verifiedAt)}
                          </p>
                        )}
                        {check.notes && (
                          <p className="mt-1 text-xs text-gray-600">{check.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={qualStatusVariant(check.status)}>
                      {qualStatusLabel(check.status)}
                    </Badge>
                  </div>
                  {canVerify && check.status === 'pending' && onVerifyQualification && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <Button size="sm" onClick={() => onVerifyQualification(check.id, 'passed')}>
                        Mark Verified
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onVerifyQualification(check.id, 'failed', 'Did not meet eligibility criteria.')
                        }
                      >
                        Mark Failed
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showDecisionHistory && item.decisions.length > 0 && (
        <section className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-sm font-bold text-gray-900">Approval Decision History</h4>
          <DecisionTimeline decisions={item.decisions} />
        </section>
      )}
    </div>
  )
}
