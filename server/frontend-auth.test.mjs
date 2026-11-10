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
