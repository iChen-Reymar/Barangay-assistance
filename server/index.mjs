import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const envPath = path.join(rootDir, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const usingSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
const apiPort = Number(process.env.API_PORT || 3001)
let supabase = null

async function clear(table, column = 'id') {
  const { error } = await supabase.from(table).delete().not(column, 'is', null)
  if (error) throw new Error(error.message)
}

function missingColumn(message) {
  const schemaCache = message.match(/Could not find the '([^']+)' column/)
  if (schemaCache) return schemaCache[1]
  const missing = message.match(/column [\w."]+\.(\w+) does not exist/)
  return missing ? missing[1] : null
}

async function insert(table, rows) {
  if (!rows.length) return
  let pending = rows.map((row) => ({ ...row }))
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const { error } = await supabase.from(table).insert(pending)
    if (!error) return
    const column = missingColumn(error.message)
    if (!column || pending.every((row) => !(column in row))) throw new Error(error.message)
    pending = pending.map((row) => {
      const next = { ...row }
      delete next[column]
      return next
    })
  }
  throw new Error(`Could not save ${table}.`)
}

async function rowsOf(table, column) {
  let query = supabase.from(table).select('*')
  if (column) query = query.order(column)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

function userRow(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    status: user.status,
    association_name: user.associationName || null,
    payload: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      contactNumber: user.contactNumber || '',
      position: user.position || '',
      department: user.department || '',
      roleLabel: user.roleLabel || '',
      associationType: user.associationType || null,
      associationAddress: user.associationAddress || null,
      registrationNumber: user.registrationNumber || null,
      createdAt: user.createdAt || new Date().toISOString(),
    },
  }
}

async function saveUserRow(user) {
  const row = userRow(user)
  const inserted = await supabase.from('users').insert(row)
  if (!inserted.error) return
  const duplicate = inserted.error.code === '23505' || inserted.error.message.includes('duplicate')
  if (!duplicate) throw new Error(inserted.error.message)
  const updated = await supabase.from('users').update({
    full_name: row.full_name,
    role: row.role,
    status: row.status,
    association_name: row.association_name,
    payload: row.payload,
  }).eq('email', row.email)
  if (updated.error) throw new Error(updated.error.message)
}

async function saveUsers(users) {
  if (!Array.isArray(users) || users.length === 0) return
  for (const user of users) await saveUserRow(user)
}

async function saveAssociations(rows) {
  if (!Array.isArray(rows)) return
  await clear('associations')
  await insert('associations', rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    head_user_id: row.headUserId ?? null,
    contact_person: row.contactPerson,
    contact_number: row.contactNumber,
    members: Number(row.members ?? 0),
    payload: row,
  })))
}

async function saveMembers(rows) {
  if (!Array.isArray(rows)) return
  await clear('association_members')
  await insert('association_members', rows.map((row) => ({
    id: row.id,
    association_name: row.associationName ?? null,
    name: row.name,
    age: Number(row.age ?? 0),
    contact_number: row.contactNumber,
    address: row.address,
    date_joined: row.dateJoined,
    family_size: Number(row.familySize ?? 0),
    is_pwd: Boolean(row.isPwd),
    is_senior: Boolean(row.isSenior),
    membership_status: row.membershipStatus,
    vulnerability: row.vulnerability,
    assistance_status: row.assistanceStatus,
    notes: row.notes ?? null,
    payload: row,
  })))
}

async function saveBeneficiaries(rows) {
  if (!Array.isArray(rows)) return
  await clear('beneficiaries')
  await insert('beneficiaries', rows.map((row) => ({
    id: row.id,
    name: row.name,
    association_name: row.association,
    family_size: Number(row.familySize ?? 0),
    monthly_income: Number(row.monthlyIncome ?? 0),
    vulnerability: row.vulnerability,
    verification: row.verification,
    payload: row,
  })))
}

async function savePrograms(rows) {
  if (!Array.isArray(rows)) return
  await clear('assistance_programs')
  await insert('assistance_programs', rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    sponsoring_agency: row.sponsoringAgency,
    description: row.description,
    eligibility_criteria: row.eligibilityCriteria,
    max_beneficiaries: row.maxBeneficiaries ?? null,
    budget_allocation: row.budgetAllocation ?? null,
    start_date: row.startDate,
    end_date: row.endDate ?? null,
    status: row.status,
    date_created: row.dateCreated,
    payload: row,
  })))
}

async function saveRequests(rows) {
  if (!Array.isArray(rows)) return
  await clear('request_documents')
  await clear('qualification_checks')
  await clear('request_decisions')
  await clear('assistance_requests')
  await insert('assistance_requests', rows.map((row) => {
    const details = row.details ?? {}
    return {
      id: row.id,
      source: row.source,
      association_name: row.association,
      request_type: row.requestType,
      vulnerability: row.vulnerability,
      request_date: row.date,
      status: row.status,
      score: row.score ?? null,
      program_name: row.program ?? null,
      description: row.description ?? null,
      previous_assistance: row.previousAssistance ?? null,
      submitted_by: details.submittedBy ?? null,
      contact_number: details.contactNumber ?? null,
      email: details.email ?? null,
      address: details.address ?? null,
      member_count: details.memberCount ?? null,
      purpose: details.purpose ?? null,
      requested_items: details.requestedItems ?? null,
      supporting_info: details.supportingInfo ?? null,
      submitted_at: details.submittedAt ?? null,
      association_type: details.associationType ?? null,
      monthly_income: details.monthlyIncome ?? null,
      vulnerability_score: details.vulnerabilityScore ?? null,
      payload: row,
    }
  }))
  await insert('request_documents', rows.flatMap((row) => (row.documents ?? []).map((doc) => ({
    id: doc.id,
    request_id: row.id,
    name: doc.name,
    file_type: doc.type,
    uploaded_at: doc.uploadedAt,
    file_size: doc.fileSize,
    status: doc.status,
    verified_by: doc.verifiedBy ?? null,
    verified_at: doc.verifiedAt ?? null,
  }))))
  await insert('qualification_checks', rows.flatMap((row) => (row.qualifications ?? []).map((check) => ({
    id: check.id,
    request_id: row.id,
    criterion: check.criterion,
    description: check.description,
    status: check.status,
    verified_by: check.verifiedBy ?? null,
    verified_at: check.verifiedAt ?? null,
    notes: check.notes ?? null,
  }))))
  await insert('request_decisions', rows.flatMap((row) => (row.decisions ?? []).map((decision) => ({
    id: decision.id,
    request_id: row.id,
    decision: decision.decision,
    notes: decision.notes,
    decided_by: decision.decidedBy,
    decided_by_email: decision.decidedByEmail ?? null,
    decided_at: decision.decidedAt,
    previous_status: decision.previousStatus,
    new_status: decision.newStatus,
  }))))
}

async function saveGenerated(rows) {
  if (!Array.isArray(rows)) return
  await clear('generated_assistance_list', 'rank_no')
  await insert('generated_assistance_list', rows.map((row) => ({
    rank_no: row.rank,
    beneficiary_name: row.name,
    association_name: row.association,
    score: row.score,
    classification: row.classification,
    program_name: row.program,
    verification: row.verification,
    reason: row.reason,
    generated_at: row.generatedAt,
    payload: row,
  })))
}

async function savePriority(rows) {
  if (!Array.isArray(rows)) return
  await clear('priority_list')
  await insert('priority_list', rows.map((row) => ({
    id: row.id,
    rank_no: row.rank,
    association_name: row.association,
    score: row.score,
    classification: row.classification,
    recommended: row.recommended,
    previous_aid: row.previousAid,
    status: row.status,
    notes: row.notes ?? null,
    payload: row,
  })))
}

async function saveAudit(rows) {
  if (!Array.isArray(rows)) return
  await clear('audit_changes', 'id')
  await clear('audit_logs')
  await insert('audit_logs', rows.map((row) => ({
    id: row.id,
    created_at: row.timestamp,
    display_date: row.date,
    user_name: row.user,
    user_email: row.userEmail ?? null,
    action: row.action,
    action_color: row.actionColor,
    description: row.description,
    ip_address: row.ipAddress,
    entity_type: row.entityType ?? null,
    entity_id: row.entityId ?? null,
    payload: row,
  })))
  await insert('audit_changes', rows.flatMap((row) => (row.changes ?? []).map((change) => ({
    audit_log_id: row.id,
    field_name: change.field,
    old_value: change.oldValue,
    new_value: change.newValue,
  }))))
}

async function saveReports(rows) {
  if (!Array.isArray(rows)) return
  await clear('report_history')
  await insert('report_history', rows.map((row) => ({
    id: row.id,
    name: row.name,
    generated_by: row.generatedBy,
    generated_date: row.date,
    format: row.format,
    report_type: row.reportType,
    payload: row,
  })))
}

async function saveProfile(profile) {
  await clear('association_profiles')
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return
  await insert('association_profiles', [{
    id: profile.id || 'profile',
    name: profile.name ?? '',
    type: profile.type ?? 'Agricultural',
    registration_number: profile.registrationNumber ?? null,
    date_registered: profile.dateRegistered ?? null,
    address: profile.address ?? null,
    contact_person: profile.contactPerson ?? null,
    contact_number: profile.contactNumber ?? null,
    email: profile.email ?? null,
    total_members: Number(profile.totalMembers ?? 0),
    description: profile.description ?? null,
    status: profile.status || 'ACTIVE',
    payload: profile,
  }])
}

async function savePrivacy(settings) {
  await clear('privacy_settings')
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return
  await insert('privacy_settings', [{
    id: 'default',
    mask_contact_in_exports: Boolean(settings.maskContactInExports),
    mask_ip_in_audit_logs: Boolean(settings.maskIpInAuditLogs),
    mask_email_in_audit_logs: Boolean(settings.maskEmailInAuditLogs),
    anonymize_rejected_requests: Boolean(settings.anonymizeRejectedRequests),
    anonymization_level: settings.anonymizationLevel ?? 'partial',
    audit_log_retention_days: Number(settings.auditLogRetentionDays ?? 365),
    assistance_record_retention_days: Number(settings.assistanceRecordRetentionDays ?? 730),
    access_request_retention_days: Number(settings.accessRequestRetentionDays ?? 180),
    auto_purge_enabled: Boolean(settings.autoPurgeEnabled),
    last_anonymization_run: settings.lastAnonymizationRun ?? null,
    last_purge_run: settings.lastPurgeRun ?? null,
    payload: settings,
  }])
}

const savers = {
  barangay_users: saveUsers,
  barangay_associations: saveAssociations,
  barangay_association_members: saveMembers,
  barangay_staff_beneficiaries: saveBeneficiaries,
  barangay_assistance_programs: savePrograms,
  barangay_reviewable_items: saveRequests,
  barangay_generated_assistance_list: saveGenerated,
  barangay_priority_list: savePriority,
  barangay_audit_logs: saveAudit,
  barangay_report_history: saveReports,
  barangay_association_details: saveProfile,
  barangay_privacy_settings: savePrivacy,
}

function yes(value) {
  return value === 1 || value === true
}

function storedRecords(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  const records = rows
    .map((row) => row?.payload)
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
  return records.length === rows.length ? records : null
}

async function loadStores() {
  const users = await rowsOf('users')
  const associations = await rowsOf('associations')
  const members = await rowsOf('association_members')
  const beneficiaries = await rowsOf('beneficiaries')
  const programs = await rowsOf('assistance_programs')
  const requests = await rowsOf('assistance_requests')
  const documents = await rowsOf('request_documents')
  const checks = await rowsOf('qualification_checks')
  const decisions = await rowsOf('request_decisions')
  const generated = await rowsOf('generated_assistance_list', 'rank_no')
  const priority = await rowsOf('priority_list', 'rank_no')
  const audits = await rowsOf('audit_logs')
  const changes = await rowsOf('audit_changes')
  const reports = await rowsOf('report_history')
  const profiles = await rowsOf('association_profiles')
  const privacyRows = (await rowsOf('privacy_settings')).filter((row) => row.id === 'default')

  const stores = []
  const push = (key, value) => stores.push({ key, payload: JSON.stringify(value) })

  if (users.length > 0) {
    push('barangay_users', users.map((row) => {
      const extra = row.payload && typeof row.payload === 'object' ? row.payload : {}
      const fullName = row.full_name || ''
      const parts = fullName.trim().split(/\s+/).filter(Boolean)
      const role = row.role
      const roleLabel = extra.roleLabel || row.role_label || (role === 'admin' ? 'Administrator' : role === 'association' ? 'Association Head' : 'Barangay Staff')
      return {
        id: row.id, email: row.email, password: '',
        firstName: extra.firstName || row.first_name || parts[0] || '',
        lastName: extra.lastName || row.last_name || parts.slice(1).join(' '),
        fullName, contactNumber: extra.contactNumber || row.contact_number || '',
        position: extra.position || row.position || '', department: extra.department || row.department || '',
        role, roleLabel, status: row.status || 'approved',
        associationName: row.association_name || extra.associationName || undefined,
        associationType: extra.associationType || row.association_type || undefined,
        associationAddress: extra.associationAddress || row.association_address || undefined,
        registrationNumber: extra.registrationNumber || row.registration_number || undefined,
        createdAt: extra.createdAt || row.created_at || new Date().toISOString(),
        approvedAt: row.approved_at ?? undefined, rejectedAt: row.rejected_at ?? undefined,
        reviewNotes: row.review_notes ?? undefined, reviewedBy: row.reviewed_by ?? undefined,
        reviewedByEmail: row.reviewed_by_email ?? undefined, reviewedAt: row.reviewed_at ?? undefined,
        reviewDecision: row.review_decision ?? undefined, isAnonymized: yes(row.is_anonymized),
        anonymizedAt: row.anonymized_at ?? undefined,
      }
    }))
  }
  if (associations.length > 0) {
    const stored = storedRecords(associations)
    if (stored) push('barangay_associations', stored)
    else push('barangay_associations', associations.map((row) => ({
      id: row.id, name: row.name, type: row.type, status: row.status,
      headUserId: row.head_user_id ?? undefined, contactPerson: row.contact_person,
      contactNumber: row.contact_number, email: row.email ?? undefined, address: row.address ?? undefined,
      description: row.description ?? undefined, registrationNumber: row.registration_number ?? undefined,
      dateRegistered: row.date_registered ?? '', members: row.members ?? row.member_count ?? 0,
    })))
  }
  if (members.length > 0) {
    const stored = storedRecords(members)
    if (stored) push('barangay_association_members', stored)
    else push('barangay_association_members', members.map((row) => ({
      id: row.id, name: row.name, age: row.age, contactNumber: row.contact_number, address: row.address,
      dateJoined: row.date_joined, familySize: row.family_size, isPwd: yes(row.is_pwd), isSenior: yes(row.is_senior),
      membershipStatus: row.membership_status, vulnerability: row.vulnerability,
      assistanceStatus: row.assistance_status, notes: row.notes ?? undefined,
    })))
  }
  if (beneficiaries.length > 0) {
    const stored = storedRecords(beneficiaries)
    if (stored) push('barangay_staff_beneficiaries', stored)
    else push('barangay_staff_beneficiaries', beneficiaries.map((row) => ({
      id: row.id, name: row.name, association: row.association_name, familySize: row.family_size,
      monthlyIncome: Number(row.monthly_income), vulnerability: row.vulnerability, verification: row.verification,
    })))
  }
  if (programs.length > 0) {
    const stored = storedRecords(programs)
    if (stored) push('barangay_assistance_programs', stored)
    else push('barangay_assistance_programs', programs.map((row) => ({
      id: row.id, name: row.name, category: row.category, sponsoringAgency: row.sponsoring_agency,
      description: row.description, eligibilityCriteria: row.eligibility_criteria,
      maxBeneficiaries: row.max_beneficiaries ?? undefined,
      budgetAllocation: row.budget_allocation == null ? undefined : Number(row.budget_allocation),
      startDate: row.start_date, endDate: row.end_date ?? undefined, status: row.status, dateCreated: row.date_created,
    })))
  }
  if (requests.length > 0) {
    const stored = storedRecords(requests)
    if (stored) push('barangay_reviewable_items', stored)
    else push('barangay_reviewable_items', requests.map((row) => ({
      id: row.id, source: row.source, association: row.association_name, requestType: row.request_type,
      vulnerability: row.vulnerability, date: row.request_date, status: row.status, score: row.score ?? undefined,
      program: row.program_name ?? undefined, description: row.description ?? undefined,
      previousAssistance: row.previous_assistance ?? undefined,
      details: {
        submittedBy: row.submitted_by ?? '', contactNumber: row.contact_number ?? '', email: row.email ?? undefined,
        address: row.address ?? '', memberCount: row.member_count ?? 0, purpose: row.purpose ?? '',
        requestedItems: row.requested_items ?? '', supportingInfo: row.supporting_info ?? '',
        submittedAt: row.submitted_at ?? '', associationType: row.association_type ?? undefined,
        monthlyIncome: row.monthly_income ?? undefined, vulnerabilityScore: row.vulnerability_score ?? undefined,
      },
      documents: documents.filter((doc) => doc.request_id === row.id).map((doc) => ({
        id: doc.id, name: doc.name, type: doc.file_type, uploadedAt: doc.uploaded_at, fileSize: doc.file_size,
        status: doc.status, verifiedBy: doc.verified_by ?? undefined, verifiedAt: doc.verified_at ?? undefined,
      })),
      qualifications: checks.filter((check) => check.request_id === row.id).map((check) => ({
        id: check.id, criterion: check.criterion, description: check.description, status: check.status,
        verifiedBy: check.verified_by ?? undefined, verifiedAt: check.verified_at ?? undefined, notes: check.notes ?? undefined,
      })),
      decisions: decisions.filter((decision) => decision.request_id === row.id).map((decision) => ({
        id: decision.id, decision: decision.decision, notes: decision.notes, decidedBy: decision.decided_by,
        decidedByEmail: decision.decided_by_email ?? undefined, decidedAt: decision.decided_at,
        previousStatus: decision.previous_status, newStatus: decision.new_status,
      })),
    })))
  }
  if (generated.length > 0) {
    const stored = storedRecords(generated)
    if (stored) push('barangay_generated_assistance_list', stored)
    else push('barangay_generated_assistance_list', generated.map((row) => ({
      rank: row.rank_no, name: row.beneficiary_name, association: row.association_name, score: row.score,
      classification: row.classification, program: row.program_name, verification: row.verification,
      reason: row.reason, generatedAt: row.generated_at,
    })))
  }
  if (priority.length > 0) {
    const stored = storedRecords(priority)
    if (stored) push('barangay_priority_list', stored)
    else push('barangay_priority_list', priority.map((row) => ({
      id: row.id, rank: row.rank_no, association: row.association_name, score: row.score,
      classification: row.classification, recommended: row.recommended, previousAid: row.previous_aid,
      status: row.status, notes: row.notes ?? undefined,
    })))
  }
  if (audits.length > 0) {
    const stored = storedRecords(audits)
    if (stored) push('barangay_audit_logs', stored)
    else push('barangay_audit_logs', audits.map((row) => ({
      id: row.id, timestamp: row.created_at, date: row.display_date, user: row.user_name,
      userEmail: row.user_email ?? undefined, action: row.action, actionColor: row.action_color,
      description: row.description, ipAddress: row.ip_address, entityType: row.entity_type ?? undefined,
      entityId: row.entity_id ?? undefined,
      changes: changes.filter((change) => change.audit_log_id === row.id).map((change) => ({
        field: change.field_name, oldValue: change.old_value, newValue: change.new_value,
      })),
    })))
  }
  if (reports.length > 0) {
    const stored = storedRecords(reports)
    if (stored) push('barangay_report_history', stored)
    else push('barangay_report_history', reports.map((row) => ({
      id: row.id, name: row.name, generatedBy: row.generated_by, date: row.generated_date,
      format: row.format, reportType: row.report_type,
    })))
  }
  if (profiles[0]) {
    const row = profiles[0]
    if (row.payload && typeof row.payload === 'object') push('barangay_association_details', row.payload)
    else push('barangay_association_details', {
      id: row.id, name: row.name, type: row.type, registrationNumber: row.registration_number ?? '',
      dateRegistered: row.date_registered ?? '', address: row.address ?? '', contactPerson: row.contact_person ?? '',
      contactNumber: row.contact_number ?? '', email: row.email ?? '', totalMembers: row.total_members,
      description: row.description ?? '', status: row.status,
    })
  }
  if (privacyRows[0]) {
    const row = privacyRows[0]
    if (row.payload && typeof row.payload === 'object') push('barangay_privacy_settings', row.payload)
    else push('barangay_privacy_settings', {
      maskContactInExports: yes(row.mask_contact_in_exports),
      maskIpInAuditLogs: yes(row.mask_ip_in_audit_logs),
      maskEmailInAuditLogs: yes(row.mask_email_in_audit_logs),
      anonymizeRejectedRequests: yes(row.anonymize_rejected_requests),
      anonymizationLevel: row.anonymization_level,
      auditLogRetentionDays: row.audit_log_retention_days,
      assistanceRecordRetentionDays: row.assistance_record_retention_days,
      accessRequestRetentionDays: row.access_request_retention_days,
      autoPurgeEnabled: yes(row.auto_purge_enabled),
      lastAnonymizationRun: row.last_anonymization_run ?? undefined,
      lastPurgeRun: row.last_purge_run ?? undefined,
    })
  }
  return stores
}

async function connectSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
  }
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) {
    supabase = null
    throw new Error(`${error.message} Run database/schema.sql in the Supabase SQL editor, then restart.`)
  }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '8mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: Boolean(supabase), database: 'supabase', writes: usingSecretKey })
})

app.get('/api/bootstrap', async (_req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  try {
    res.json({ stores: await loadStores() })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/access-requests', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  const user = req.body ?? {}
  if (!user.email || !user.fullName || !user.role) {
    res.status(400).json({ error: 'Name, email, and role are required.' })
    return
  }
  try {
    await saveUserRow(user)
  } catch (error) {
    const blocked = error.message.includes('row-level security')
    res.status(blocked ? 403 : 500).json({
      error: blocked
        ? 'Supabase blocked the save. In the SQL Editor, run the access policy at the bottom of database/schema.sql, then submit again.'
        : error.message,
    })
    return
  }
  res.json({ ok: true })
})

app.put('/api/store/:key', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  const key = String(req.params.key)
  const save = savers[key]
  if (!save) {
    res.json({ ok: true, skipped: true })
    return
  }
  const payloadText = typeof req.body?.payload === 'string' ? req.body.payload : JSON.stringify(req.body?.payload ?? null)
  let payload
  try {
    payload = JSON.parse(payloadText)
  } catch {
    res.status(400).json({ error: 'Payload must be JSON.' })
    return
  }
  try {
    await save(payload)
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/store/:key', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  const key = String(req.params.key)
  const save = savers[key]
  if (!save) {
    res.json({ ok: true })
    return
  }
  const empty = key === 'barangay_association_details' || key === 'barangay_privacy_settings' ? null : []
  try {
    await save(empty)
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(apiPort, () => {
  console.log(`API listening on http://localhost:${apiPort}`)
})

connectSupabase()
  .then(() => {
    console.log('Supabase ready.')
    if (!usingSecretKey) {
      console.log('Saves are blocked by row security. Add SUPABASE_SECRET_KEY to .env, then restart.')
    }
  })
  .catch((error) => {
    console.error('Supabase is not connected. Records stay in the browser until the project is configured.')
    console.error(error.message)
  })
