import assert from 'node:assert/strict'
import test from 'node:test'

class MemoryStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  removeItem(key) { this.values.delete(key) }
}

globalThis.window = {}
globalThis.localStorage = new MemoryStorage()
globalThis.sessionStorage = new MemoryStorage()

const persistence = await import('../src/services/sessionPersistence.ts')
const recovery = await import('../src/services/passwordRecovery.ts')
const workflow = await import('../src/services/assistanceWorkflow.ts')
const eligibility = await import('../src/services/assistanceListEligibility.ts')

test('non-remembered Supabase sessions stay in session storage', () => {
  persistence.setRememberSession(false)
  persistence.supabaseSessionStorage.setItem('supabase-token', 'session-value')
  assert.equal(sessionStorage.getItem('supabase-token'), 'session-value')
  assert.equal(localStorage.getItem('supabase-token'), null)
})

test('remembered Supabase sessions use local storage and remove session copies', () => {
  sessionStorage.setItem('supabase-token', 'old-value')
  persistence.setRememberSession(true)
  persistence.supabaseSessionStorage.setItem('supabase-token', 'remembered-value')
  assert.equal(localStorage.getItem('supabase-token'), 'remembered-value')
  assert.equal(sessionStorage.getItem('supabase-token'), null)
})

test('removing an auth session clears both storage locations', () => {
  localStorage.setItem('supabase-token', 'one')
  sessionStorage.setItem('supabase-token', 'two')
  persistence.supabaseSessionStorage.removeItem('supabase-token')
  assert.equal(localStorage.getItem('supabase-token'), null)
  assert.equal(sessionStorage.getItem('supabase-token'), null)
})

test('password recovery rejects internal addresses and weak passwords', () => {
  assert.match(recovery.recoveryEmailError('rico@buruun.local'), /cannot receive email/)
  assert.equal(recovery.recoveryEmailError('resident@example.com'), '')
  assert.match(recovery.newPasswordError('123', '123'), /8 characters/)
  assert.match(recovery.newPasswordError('long-password', 'different-password'), /do not match/)
  assert.equal(recovery.newPasswordError('long-password', 'long-password'), '')
})

test('final list generation requires the persisted Staff-review transition', () => {
  assert.match(workflow.listGenerationTransitionError('PENDING'), /enter Staff review/)
  assert.equal(workflow.listGenerationTransitionError('UNDER REVIEW'), null)
  assert.match(workflow.listGenerationTransitionError('APPROVED'), /finalized/i)
})

test('assistance lists retain only linked members with complete verified assessments', () => {
  const baseMember = {
    name: 'RUPERTO GILLO',
    associationName: 'ERPAT',
  }
  const members = [
    { ...baseMember, id: 'ruperto' },
    { ...baseMember, id: 'pending', name: 'PENDING MEMBER' },
    { ...baseMember, id: 'unlinked', name: 'UNLINKED MEMBER' },
    { ...baseMember, id: 'incomplete', name: 'INCOMPLETE MEMBER' },
  ]
  const completeAssessment = {
    association: 'ERPAT',
    familySize: 3,
    monthlyIncome: 5000,
    workingHouseholdMembers: 1,
    age: 61,
    employmentStatus: 'Self-Employed',
    housingCondition: 'Temporary',
    verification: 'VERIFIED',
  }
  const assessments = [
    { ...completeAssessment, id: 'beneficiary-1', memberId: 'ruperto' },
    { ...completeAssessment, id: 'beneficiary-2', memberId: 'pending', verification: 'PENDING' },
    { ...completeAssessment, id: 'beneficiary-3', memberId: 'different-member' },
    { ...completeAssessment, id: 'beneficiary-4', memberId: 'incomplete', housingCondition: '' },
  ]

  const eligible = eligibility.verifiedMembersForAssistance(members, assessments, 'ERPAT')
  assert.deepEqual(eligible.map((member) => member.id), ['ruperto'])

  const generated = eligibility.generatedRowsForVerifiedMembers([
    { beneficiaryId: 'ruperto', requestId: 'request-1' },
    { beneficiaryId: 'unlinked', requestId: 'request-1' },
    { beneficiaryId: 'ruperto', requestId: 'old-request' },
  ], 'request-1', new Set(eligible.map((member) => member.id)))
  assert.deepEqual(generated, [{ beneficiaryId: 'ruperto', requestId: 'request-1' }])
})

test('a new request can retain and rescore the same member independently', () => {
  const requestA = {
    id: 'request-a:member-1',
    requestId: 'request-a',
    beneficiaryId: 'member-1',
    score: 70,
  }
  const requestB = {
    id: 'request-b:member-1',
    requestId: 'request-b',
    beneficiaryId: 'member-1',
    score: 82,
  }

  const combined = eligibility.replaceGeneratedRowsForRequest([requestA], [requestB], 'request-b')
  assert.deepEqual(combined, [requestB, requestA])
})

test('regenerating one request replaces only that request rows', () => {
  const oldRequestA = { id: 'request-a:member-1', requestId: 'request-a', score: 70 }
  const requestB = { id: 'request-b:member-1', requestId: 'request-b', score: 82 }
  const newRequestA = { id: 'request-a:member-1', requestId: 'request-a', score: 91 }

  const combined = eligibility.replaceGeneratedRowsForRequest(
    [oldRequestA, requestB],
    [newRequestA],
    'request-a',
  )
  assert.deepEqual(combined, [newRequestA, requestB])
})
