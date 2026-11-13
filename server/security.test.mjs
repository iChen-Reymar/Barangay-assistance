import assert from 'node:assert/strict'
import test from 'node:test'

process.env.NODE_ENV = 'test'
const {
  canWriteResource,
  generateTemporaryPassword,
  payloadIdentity,
  requestWriteError,
  requestWriteOperation,
  scopeStoresForActor,
  trustedAuditEntry,
} = await import('./index.mjs')

test('temporary passwords are short, readable, and unique', () => {
  const generated = new Set(Array.from({ length: 50 }, () => generateTemporaryPassword()))
  assert.equal(generated.size, 50)
  for (const password of generated) assert.match(password, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
})

test('resource writes follow the role matrix', () => {
  assert.equal(canWriteResource({ role: 'admin' }, 'barangay_privacy_settings'), true)
  assert.equal(canWriteResource({ role: 'staff' }, 'barangay_users'), false)
  assert.equal(canWriteResource({ role: 'staff' }, 'barangay_reviewable_items'), true)
  assert.equal(canWriteResource({ role: 'association' }, 'barangay_association_members'), true)
  assert.equal(canWriteResource({ role: 'association' }, 'barangay_audit_logs'), true)
  assert.equal(canWriteResource({ role: 'association' }, 'barangay_assistance_programs'), false)
})

test('audit identity is bound to the authenticated non-admin account', () => {
  const forged = {
    id: 'audit-1',
    user: 'Forged Administrator',
    userEmail: 'admin@example.com',
    action: 'SUBMITTED',
  }
  const actor = {
    role: 'association',
    full_name: 'ERPAT Head',
    email: 'erpat@example.com',
  }
  assert.deepEqual(trustedAuditEntry(forged, actor), {
    ...forged,
    user: 'ERPAT Head',
    userEmail: 'erpat@example.com',
  })
  assert.equal(trustedAuditEntry(forged, { role: 'admin' }), forged)
})

test('record identity must come from stable IDs, not display rank', () => {
  assert.equal(payloadIdentity({}, { id: 'beneficiary-42', rank: 1 }), 'beneficiary-42')
  assert.equal(payloadIdentity({ identity: 'default' }, {}), 'default')
})

test('association bootstrap removes records owned by other associations', () => {
  const stores = [{
    key: 'barangay_association_members',
    payload: JSON.stringify([
      { id: 'a', name: 'Allowed', associationName: 'Association A' },
      { id: 'b', name: 'Hidden', associationName: 'Association B' },
    ]),
  }]
  const scoped = scopeStoresForActor(stores, {
    id: 'head-a',
    role: 'association',
    association_name: 'Association A',
  })
  assert.deepEqual(JSON.parse(scoped[0].payload), [
    { id: 'a', name: 'Allowed', associationName: 'Association A' },
  ])
})

test('staff generates final lists while admin monitors requests', () => {
  const pending = { source: 'assistance', status: 'PENDING', decisions: [] }
  const current = { status: 'PENDING', payload: pending }
  const review = { ...pending, status: 'UNDER REVIEW' }
  const reviewedCurrent = { status: 'UNDER REVIEW', payload: review }
  const generated = {
    ...review,
    status: 'LIST GENERATED',
    documents: [],
    qualifications: [],
  }
  const approved = { ...pending, status: 'APPROVED', decisions: [{ id: 'decision-1', decision: 'approve', newStatus: 'APPROVED' }] }

  assert.equal(requestWriteError({ role: 'association' }, pending, null), null)
  assert.match(requestWriteError({ role: 'association' }, review, null), /pending/i)
  assert.match(requestWriteError({ role: 'association' }, pending, current), /cannot modify/i)
  assert.equal(requestWriteError({ role: 'staff' }, review, current), null)
  assert.match(requestWriteError({ role: 'staff' }, generated, current), /enter Staff review/i)
  assert.equal(requestWriteError({ role: 'staff' }, generated, reviewedCurrent), null)
  assert.match(requestWriteError({ role: 'staff' }, approved, current), /cannot manually approve/i)
  assert.match(requestWriteError({ role: 'admin' }, approved, current), /monitor/i)
  assert.match(requestWriteError({ role: 'association' }, {
    ...pending,
    qualifications: [{ status: 'passed' }],
  }, null), /pending/i)
})

test('staff request validation ignores object key order but rejects changed details', () => {
  const storedDetails = {
    email: 'head@example.com',
    purpose: 'Emergency assistance',
    memberCount: 3,
  }
  const reorderedDetails = {
    memberCount: 3,
    purpose: 'Emergency assistance',
    email: 'head@example.com',
  }
  const storedPayload = {
    id: 'asst-1',
    source: 'assistance',
    association: 'ERPAT',
    requestType: 'Tulong Bayan',
    program: 'Tulong Bayan',
    status: 'UNDER REVIEW',
    decisions: [],
    details: storedDetails,
  }
  const current = { status: 'UNDER REVIEW', payload: storedPayload }

  assert.equal(requestWriteError({ role: 'staff' }, {
    ...storedPayload,
    details: reorderedDetails,
  }, current), null)
  assert.match(requestWriteError({ role: 'staff' }, {
    ...storedPayload,
    details: { ...reorderedDetails, memberCount: 4 },
  }, current), /cannot change/i)
})

test('request persistence separates new inserts from existing updates', () => {
  assert.equal(requestWriteOperation(null), 'insert')
  assert.equal(requestWriteOperation({ id: 'asst-1' }), 'update')
})
