import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomInt } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { publicSupabaseKey, publicSupabaseUrl } from '../config/supabase-public.mjs'

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || publicSupabaseUrl
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicSupabaseKey
const usingSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
const apiPort = Number(process.env.API_PORT || 3001)
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${String(host).replace(/^https?:\/\//, '')}`)
const allowedOrigins = new Set(
  (process.env.APP_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)
for (const origin of vercelOrigins) allowedOrigins.add(origin)
let systemSupabase = null
let connectionPromise = null
const databaseContext = new AsyncLocalStorage()
const supabase = new Proxy({}, {
  get(_target, property) {
    const client = databaseContext.getStore() || systemSupabase
    if (!client) throw new Error('Supabase is not connected.')
    const value = client[property]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

function authenticatedClient(token) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

function linkedText(value) {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

async function clear(table, column = 'id') {
  const { error } = await supabase.from(table).delete().not(column, 'is', null)
  if (error) throw new Error(error.message)
}

async function upsertRows(table, rows) {
  if (!rows.length) return
  const { error } = await supabase.from(table).upsert(rows)
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

async function reconcileChildRows(table, parentColumn, parentId, rows) {
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select('id')
    .eq(parentColumn, parentId)
  if (readError) throw new Error(readError.message)
  const nextIds = new Set(rows.map((row) => String(row.id)))
  const staleIds = (existing ?? []).map((row) => String(row.id)).filter((id) => !nextIds.has(id))
  if (staleIds.length) {
    const { error: deleteError } = await supabase.from(table).delete().in('id', staleIds)
    if (deleteError) throw new Error(deleteError.message)
  }
  await upsertRows(table, rows)
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
      mustChangePassword: Boolean(user.mustChangePassword),
      temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || null,
      temporaryPasswordIssuedBy: user.temporaryPasswordIssuedBy || null,
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
  await upsertRows('associations', rows.map((row) => ({
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
  await upsertRows('association_members', rows.map((row) => ({
    id: row.id,
    association_name: linkedText(row.associationName),
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
  for (const row of rows) {
    const files = [
      ['barangay_certificate', row.barangayCertificate],
      ['government_id', row.governmentId],
    ]
    const documents = files.flatMap(([kind, file]) => (file ? [{
      id: `${row.id}:${kind}`,
      member_id: row.id,
      document_kind: kind,
      name: file.name,
      data_url: file.dataUrl,
      file_size: file.fileSize,
      uploaded_at: file.uploadedAt,
      status: file.status ?? 'uploaded',
      verified_by: file.verifiedBy ?? null,
      verified_at: file.verifiedAt ?? null,
    }] : []))
    await reconcileChildRows('member_documents', 'member_id', row.id, documents)
  }
}

async function saveAidRecords(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('aid_records', rows.map((row) => ({
    id: row.id,
    association_name: linkedText(row.associationName),
    member_id: linkedText(row.memberId),
    member_name: row.memberName ?? row.member ?? '',
    program_name: linkedText(row.program),
    date_received: row.dateReceived ?? '',
    quantity: row.quantity ?? '',
    comments: row.comments ?? '',
    status: row.status ?? 'RECEIVED',
    submitted_by: row.submittedBy ?? null,
    submitted_at: row.submittedAt ?? null,
    payload: row,
  })))
}

async function saveBeneficiaries(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('beneficiaries', rows.map((row) => ({
    id: row.id,
    member_id: row.memberId || null,
    name: row.name,
    association_name: linkedText(row.association),
    family_size: Number(row.familySize ?? 0),
    monthly_income: Number(row.monthlyIncome ?? 0),
    vulnerability: row.vulnerability,
    verification: row.verification,
    payload: row,
  })))
}

async function savePrograms(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('assistance_programs', rows.map((row) => ({
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

async function saveNotifications(rows) {
  if (!Array.isArray(rows)) return
  const mapped = rows.map((row) => ({
    id: row.id,
    user_id: linkedText(row.recipientUserId),
    association_name: linkedText(row.associationName),
    message: row.message,
    notice_time: row.time,
    created_at: row.createdAt ?? null,
    is_read: Boolean(row.read),
    notice_type: row.type ?? 'info',
    document_name: row.documentName ?? null,
    member_name: row.memberName ?? null,
    rejected_by: row.rejectedBy ?? null,
    payload: row,
  }))
  try {
    await upsertRows('notifications', mapped)
  } catch (error) {
    const message = String(error?.message ?? error)
    if (!/notice_type|check constraint/i.test(message)) throw error
    await upsertRows('notifications', mapped.map((row) => ({ ...row, notice_type: 'info' })))
  }
}

async function saveRequests(rows, operation) {
  if (!Array.isArray(rows)) return
  const mappedRows = rows.map((row) => {
    const details = row.details ?? {}
    return {
      id: row.id,
      source: row.source,
      association_name: linkedText(row.association),
      request_type: row.requestType,
      vulnerability: row.vulnerability,
      request_date: row.date,
      status: row.status,
      score: row.score ?? null,
      program_name: linkedText(row.program),
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
  })
  if (operation === 'insert') {
    await insert('assistance_requests', mappedRows)
  } else if (operation === 'update') {
    for (const row of mappedRows) {
      const { data, error } = await supabase
        .from('assistance_requests')
        .update(row)
        .eq('id', row.id)
        .select('id')
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) throw new Error(`Assistance request ${row.id} is no longer available for update.`)
    }
  } else {
    throw new Error('An explicit assistance-request write operation is required.')
  }
  for (const row of rows) {
    const documents = (row.documents ?? []).map((doc) => ({
      id: String(doc.id).startsWith(`${row.id}:`) ? doc.id : `${row.id}:${doc.id}`,
      request_id: row.id,
      name: doc.name,
      file_type: doc.type,
      uploaded_at: doc.uploadedAt,
      file_size: doc.fileSize,
      status: doc.status,
      verified_by: doc.verifiedBy ?? null,
      verified_at: doc.verifiedAt ?? null,
      data_url: doc.dataUrl ?? null,
      storage_path: doc.storagePath ?? null,
    }))
    const checks = (row.qualifications ?? []).map((check) => ({
      id: String(check.id).startsWith(`${row.id}:`) ? check.id : `${row.id}:${check.id}`,
      request_id: row.id,
      criterion: check.criterion,
      description: check.description,
      status: check.status,
      verified_by: check.verifiedBy ?? null,
      verified_at: check.verifiedAt ?? null,
      notes: check.notes ?? null,
    }))
    const decisions = (row.decisions ?? []).map((decision) => ({
      id: String(decision.id).startsWith(`${row.id}:`) ? decision.id : `${row.id}:${decision.id}`,
      request_id: row.id,
      decision: decision.decision,
      notes: decision.notes,
      decided_by: decision.decidedBy,
      decided_by_email: decision.decidedByEmail ?? null,
      decided_at: decision.decidedAt,
      previous_status: decision.previousStatus,
      new_status: decision.newStatus,
    }))
    await reconcileChildRows('request_documents', 'request_id', row.id, documents)
    await reconcileChildRows('qualification_checks', 'request_id', row.id, checks)
    await reconcileChildRows('request_decisions', 'request_id', row.id, decisions)
  }
}

async function saveGenerated(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('generated_assistance_list', rows.map((row) => ({
    id: row.id,
    beneficiary_id: row.beneficiaryId || row.id,
    request_id: row.requestId || null,
    rank_no: row.rank,
    beneficiary_name: row.name,
    association_name: linkedText(row.association),
    score: Math.max(0, Math.min(100, Math.round(Number(row.score) || 0))),
    classification: row.classification,
    program_name: linkedText(row.program),
    verification: row.verification,
    reason: row.reason,
    generated_at: row.generatedAt,
    payload: row,
  })))
}

async function savePriority(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('priority_list', rows.map((row) => ({
    id: row.id,
    rank_no: row.rank,
    association_name: linkedText(row.association),
    score: row.score,
    classification: row.classification,
    recommended: row.recommended,
    previous_aid: row.previousAid,
    status: row.status,
    notes: row.notes ?? null,
    payload: row,
  })))
}

function trustedAuditEntry(row, actor) {
  if (!actor || actor.role === 'admin') return row
  return {
    ...row,
    user: actor.full_name,
    userEmail: actor.email,
  }
}

function auditWritePolicy(actor, current) {
  if (!actor || actor.role === 'admin' || !current) return 'write'
  const owner = String(current.user_email || '').trim().toLowerCase()
  const actorEmail = String(actor.email || '').trim().toLowerCase()
  return owner && owner === actorEmail ? 'ignore' : 'reject'
}

async function saveAudit(rows, actor) {
  if (!Array.isArray(rows)) return
  const trustedRows = rows.map((row) => trustedAuditEntry(row, actor))
  await upsertRows('audit_logs', trustedRows.map((row) => ({
    id: row.id,
    created_at: row.timestamp,
    display_date: row.date,
    user_name: row.user,
    user_email: linkedText(row.userEmail),
    action: row.action,
    action_color: row.actionColor,
    description: row.description,
    ip_address: row.ipAddress,
    entity_type: row.entityType ?? null,
    entity_id: row.entityId ?? null,
    payload: row,
  })))
  const { data: existingChanges, error } = await supabase.from('audit_changes').select('audit_log_id')
  if (error) throw new Error(error.message)
  const logsWithChanges = new Set((existingChanges ?? []).map((row) => row.audit_log_id))
  await insert('audit_changes', trustedRows.filter((row) => !logsWithChanges.has(row.id)).flatMap((row) => (row.changes ?? []).map((change) => ({
    audit_log_id: row.id,
    field_name: change.field,
    old_value: change.oldValue,
    new_value: change.newValue,
  }))))
}

async function saveReports(rows) {
  if (!Array.isArray(rows)) return
  await upsertRows('report_history', rows.map((row) => ({
    id: row.id,
    name: row.name,
    generated_by: row.generatedBy,
    user_id: linkedText(row.userId),
    generated_date: row.date,
    format: row.format,
    report_type: row.reportType,
    payload: row,
  })))
}

async function saveProfile(profile) {
  const name = linkedText(profile?.name)
  if (!profile || typeof profile !== 'object' || Array.isArray(profile) || !name) return
  await upsertRows('association_profiles', [{
    id: profile.id || 'profile',
    name,
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
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return
  await upsertRows('privacy_settings', [{
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
    updated_by: linkedText(settings.updatedByUserId),
    payload: settings,
  }])
}

const savers = {
  barangay_users: saveUsers,
  barangay_associations: saveAssociations,
  barangay_association_members: saveMembers,
  barangay_association_notifications: saveNotifications,
  barangay_aid_records: saveAidRecords,
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

function attachmentsFor(memberId, documents) {
  const files = documents.filter((row) => row.member_id === memberId)
  const certificate = files.find((row) => row.document_kind === 'barangay_certificate')
  const governmentId = files.find((row) => row.document_kind === 'government_id')
  const asAttachment = (row) => row ? {
    name: row.name,
    dataUrl: row.data_url,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
    status: row.status,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
  } : undefined
  return {
    barangayCertificate: asAttachment(certificate),
    governmentId: asAttachment(governmentId),
  }
}

function storedRecords(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  const records = rows
    .map((row) => row?.payload)
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
  return records.length === rows.length ? records : null
}

async function loadStores(actor) {
  const optionalAidRecords = rowsOf('aid_records').catch((error) => {
    const message = String(error?.message || '')
    if (/does not exist|schema cache|Could not find the table|relation/i.test(message)) return []
    throw error
  })
  const [
    users, associations, members, memberDocuments, notifications, beneficiaries,
    aidRecords, programs, requests, documents, checks, decisions, generated,
    priority, audits, changes, reports, initialProfiles, privacy,
  ] = await Promise.all([
    rowsOf('users'), rowsOf('associations'), rowsOf('association_members'),
    rowsOf('member_documents'), rowsOf('notifications'), rowsOf('beneficiaries'),
    optionalAidRecords, rowsOf('assistance_programs'), rowsOf('assistance_requests'),
    rowsOf('request_documents'), rowsOf('qualification_checks'), rowsOf('request_decisions'),
    rowsOf('generated_assistance_list', 'rank_no'), rowsOf('priority_list', 'rank_no'),
    rowsOf('audit_logs'), rowsOf('audit_changes'), rowsOf('report_history'),
    rowsOf('association_profiles'), rowsOf('privacy_settings'),
  ])
  let profiles = initialProfiles
  if (actor?.role === 'association') {
    const association = String(actor.association_name || '').trim().toLowerCase()
    profiles = profiles.filter((row) => String(row.name || '').trim().toLowerCase() === association)
  }
  const privacyRows = privacy.filter((row) => row.id === 'default')

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
        mustChangePassword: Boolean(extra.mustChangePassword),
        temporaryPasswordIssuedAt: extra.temporaryPasswordIssuedAt || undefined,
        temporaryPasswordIssuedBy: extra.temporaryPasswordIssuedBy || undefined,
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
    if (stored) {
      push('barangay_association_members', stored.map((item, index) => ({
        ...item,
        associationName: item.associationName || members[index].association_name || undefined,
      })))
    } else push('barangay_association_members', members.map((row) => ({
      id: row.id, name: row.name, age: row.age, contactNumber: row.contact_number, address: row.address,
      dateJoined: row.date_joined, familySize: row.family_size, isPwd: yes(row.is_pwd), isSenior: yes(row.is_senior),
      membershipStatus: row.membership_status, vulnerability: row.vulnerability,
      assistanceStatus: row.assistance_status, notes: row.notes ?? undefined,
      associationName: row.association_name ?? undefined,
      ...attachmentsFor(row.id, memberDocuments),
    })))
  }
  if (notifications.length > 0) {
    const stored = storedRecords(notifications)
    if (stored) push('barangay_association_notifications', stored)
    else push('barangay_association_notifications', notifications.map((row) => ({
      id: row.id,
      associationName: row.association_name ?? '',
      recipientUserId: row.user_id ?? undefined,
      message: row.message,
      time: row.notice_time,
      createdAt: row.created_at ?? row.notice_time,
      read: yes(row.is_read),
      type: row.notice_type ?? 'info',
      documentName: row.document_name ?? undefined,
      memberName: row.member_name ?? undefined,
      rejectedBy: row.rejected_by ?? undefined,
      reason: row.payload?.reason ?? undefined,
    })))
  }
  if (aidRecords.length > 0) {
    const stored = storedRecords(aidRecords)
    if (stored) push('barangay_aid_records', stored)
    else push('barangay_aid_records', aidRecords.map((row) => ({
      id: row.id,
      associationName: row.association_name ?? '',
      memberId: row.member_id ?? '',
      memberName: row.member_name ?? '',
      program: row.program_name ?? '',
      dateReceived: row.date_received ?? '',
      quantity: row.quantity ?? '',
      comments: row.comments ?? '',
      status: row.status ?? 'RECEIVED',
      submittedBy: row.submitted_by ?? '',
      submittedAt: row.submitted_at ?? '',
    })))
  }
  if (beneficiaries.length > 0) {
    const stored = storedRecords(beneficiaries)
    if (stored) push('barangay_staff_beneficiaries', stored.map((item, index) => ({
      ...item,
      memberId: item.memberId || beneficiaries[index].member_id || undefined,
    })))
    else push('barangay_staff_beneficiaries', beneficiaries.map((row) => ({
      id: row.id, memberId: row.member_id || undefined, name: row.name, association: row.association_name, familySize: row.family_size,
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
        dataUrl: doc.data_url ?? undefined, storagePath: doc.storage_path ?? undefined,
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
    if (stored) push('barangay_generated_assistance_list', stored.map((item, index) => ({
      ...item,
      id: item.id || generated[index].id,
      beneficiaryId: item.beneficiaryId || generated[index].beneficiary_id || generated[index].id,
      requestId: item.requestId || generated[index].request_id || undefined,
    })))
    else push('barangay_generated_assistance_list', generated.map((row) => ({
      id: row.id, beneficiaryId: row.beneficiary_id || row.id, requestId: row.request_id || undefined,
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
    if (stored) {
      push('barangay_report_history', reports.map((row, index) => ({
        ...stored[index],
        userId: stored[index].userId || row.user_id || undefined,
      })))
    } else push('barangay_report_history', reports.map((row) => ({
      id: row.id, name: row.name, generatedBy: row.generated_by, userId: row.user_id || undefined,
      date: row.generated_date, format: row.format, reportType: row.report_type,
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
    if (row.payload && typeof row.payload === 'object') {
      push('barangay_privacy_settings', {
        ...row.payload,
        updatedByUserId: row.payload.updatedByUserId || row.updated_by || undefined,
      })
    } else push('barangay_privacy_settings', {
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
      updatedByUserId: row.updated_by || undefined,
    })
  }
  return stores
}

async function connectSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.')
  }
  systemSupabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const app = express()
app.disable('x-powered-by')
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) callback(null, true)
    else callback(new Error('Origin is not allowed.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '8mb' }))
app.use((req, _res, next) => {
  if (usingSecretKey || !systemSupabase) {
    next()
    return
  }
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    next()
    return
  }
  databaseContext.run(authenticatedClient(token), next)
})

const accessRequestAttempts = new Map()
function limitAccessRequests(req, res, next) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const key = String(req.ip || req.socket.remoteAddress || 'unknown')
  const recent = (accessRequestAttempts.get(key) || []).filter((time) => now - time < windowMs)
  if (recent.length >= 5) {
    res.status(429).json({ error: 'Too many access requests. Try again later.' })
    return
  }
  recent.push(now)
  accessRequestAttempts.set(key, recent)
  next()
}

function initializeServer() {
  if (!connectionPromise) connectionPromise = connectSupabase()
  return connectionPromise
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: Boolean(systemSupabase),
    database: 'supabase',
    writes: usingSecretKey ? 'service-role' : 'authenticated-rls',
    authAdministration: usingSecretKey,
  })
})

async function authenticate(req, res) {
  if (!systemSupabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return null
  }
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    res.status(401).json({ error: 'Sign in to continue.' })
    return null
  }
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Your session is invalid or expired.' })
    return null
  }
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id,email,full_name,role,status,association_name')
    .eq('id', data.user.id)
    .maybeSingle()
  if (profileError || !profile || profile.status !== 'approved') {
    res.status(403).json({ error: 'Your account is not approved.' })
    return null
  }
  return profile
}

async function requireRole(req, res, roles) {
  const actor = await authenticate(req, res)
  if (!actor) return null
  if (!roles.includes(actor.role)) {
    res.status(403).json({ error: 'You do not have permission to perform this action.' })
    return null
  }
  return actor
}

function scopeStoresForActor(stores, actor) {
  if (actor.role === 'admin') return stores
  if (actor.role === 'staff') {
    const hidden = new Set(['barangay_users', 'barangay_privacy_settings'])
    return stores.filter((row) => !hidden.has(row.key))
  }

  const association = String(actor.association_name || '').trim().toLowerCase()
  const allowed = new Set([
    'barangay_users', 'barangay_associations', 'barangay_association_members',
    'barangay_association_notifications', 'barangay_aid_records', 'barangay_assistance_programs',
    'barangay_reviewable_items', 'barangay_generated_assistance_list', 'barangay_priority_list',
    'barangay_association_details',
  ])
  return stores.flatMap((row) => {
    if (!allowed.has(row.key)) return []
    let value
    try { value = JSON.parse(row.payload) } catch { return [] }
    if (row.key === 'barangay_users') {
      value = Array.isArray(value) ? value.filter((item) => item.id === actor.id) : []
    } else if (Array.isArray(value) && row.key !== 'barangay_assistance_programs') {
      value = value.filter((item) => {
        const itemAssociation = String(item.associationName || item.association || item.name || '').trim().toLowerCase()
        return itemAssociation === association || item.recipientUserId === actor.id || item.headUserId === actor.id
      })
    } else if (row.key === 'barangay_association_details') {
      if (String(value?.name || '').trim().toLowerCase() !== association) return []
    }
    return [{ ...row, payload: JSON.stringify(value) }]
  })
}

app.get('/api/bootstrap', async (req, res) => {
  const actor = await authenticate(req, res)
  if (!actor) return
  if (!systemSupabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  try {
    res.json({ stores: scopeStoresForActor(await loadStores(actor), actor) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

function memberAssociation(member) {
  const payload = member.payload && typeof member.payload === 'object' ? member.payload : {}
  return String(payload.associationName || member.association_name || '').trim()
}

function memberIsPresident(member) {
  const payload = member.payload && typeof member.payload === 'object' ? member.payload : {}
  const position = String(payload.position || payload.notes || '').toLowerCase()
  return position.includes('president') && !position.includes('vice')
}

async function findAuthUser(id, emails) {
  const byId = await supabase.auth.admin.getUserById(id)
  if (!byId.error && byId.data?.user) return byId.data.user
  const wanted = new Set(emails.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))
  for (let page = 1; page <= 20; page += 1) {
    const listed = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (listed.error) throw new Error(listed.error.message)
    const users = listed.data?.users ?? []
    const match = users.find((user) => wanted.has(String(user.email || '').toLowerCase()))
    if (match) return match
    if (users.length < 200) return null
  }
  return null
}

async function requireAdmin(req, res) {
  return Boolean(await requireRole(req, res, ['admin']))
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const characters = Array.from({ length: 8 }, () => alphabet[randomInt(0, alphabet.length)])
  return `${characters.slice(0, 4).join('')}-${characters.slice(4).join('')}`
}

app.post('/api/users', async (req, res) => {
  if (!systemSupabase || !usingSecretKey) {
    res.status(503).json({ error: 'Supabase is not ready to create login accounts.' })
    return
  }
  if (!(await requireAdmin(req, res))) return
  const firstName = String(req.body?.firstName || '').trim()
  const lastName = String(req.body?.lastName || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const contactNumber = String(req.body?.contactNumber || '').trim()
  const role = String(req.body?.role || '')
  const associationName = String(req.body?.associationName || '').trim()
  if (!firstName || !lastName || !email.includes('@') || password.length < 8) {
    res.status(400).json({ error: 'Name, valid email, and a password of at least 8 characters are required.' })
    return
  }
  if (!['admin', 'staff', 'association'].includes(role)) {
    res.status(400).json({ error: 'Select a valid account role.' })
    return
  }
  if (role === 'association' && !associationName) {
    res.status(400).json({ error: 'Select an association for the Association Head.' })
    return
  }
  const fullName = `${firstName} ${lastName}`
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'association' ? 'Association Head' : 'Barangay Staff'
  const now = new Date().toISOString()
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role, status: 'approved', association_name: associationName || null },
  })
  if (created.error || !created.data.user) {
    res.status(400).json({ error: created.error?.message || 'Could not create the login.' })
    return
  }
  const account = {
    id: created.data.user.id,
    email,
    password: '',
    firstName,
    lastName,
    fullName,
    contactNumber,
    position: roleLabel,
    department: role === 'association' ? 'registered-associations' : 'barangay-hall',
    role,
    roleLabel,
    status: 'approved',
    associationName: associationName || undefined,
    createdAt: now,
    approvedAt: now,
  }
  try {
    await saveUserRow(account)
    res.status(201).json({ ok: true, user: account })
  } catch (error) {
    await supabase.auth.admin.deleteUser(created.data.user.id)
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/users/:id/role', async (req, res) => {
  if (!(await requireAdmin(req, res))) return
  const id = String(req.params.id || '')
  const role = String(req.body?.role || '')
  if (!['admin', 'staff', 'association'].includes(role)) {
    res.status(400).json({ error: 'Select a valid account role.' })
    return
  }
  const { data: current, error: currentError } = await supabase.from('users').select('role,status').eq('id', id).maybeSingle()
  if (currentError || !current) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  if (current.role === 'admin' && current.status === 'approved' && role !== 'admin') {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin').eq('status', 'approved')
    if ((count ?? 0) <= 1) {
      res.status(400).json({ error: 'At least one approved administrator must remain.' })
      return
    }
  }
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'association' ? 'Association Head' : 'Barangay Staff'
  const { data: row } = await supabase.from('users').select('payload').eq('id', id).maybeSingle()
  const payload = { ...(row?.payload || {}), roleLabel, position: roleLabel }
  const { error } = await supabase.from('users').update({ role, payload }).eq('id', id)
  if (error) {
    res.status(400).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

app.delete('/api/users/:id', async (req, res) => {
  if (!usingSecretKey) {
    res.status(503).json({ error: 'Deleting a Supabase Auth login requires the optional server secret key.' })
    return
  }
  const actor = await requireRole(req, res, ['admin'])
  if (!actor) return
  const id = String(req.params.id || '')
  if (id === actor.id) {
    res.status(400).json({ error: 'You cannot remove the account you are signed in with.' })
    return
  }
  const { data: current } = await supabase.from('users').select('role,status').eq('id', id).maybeSingle()
  if (!current) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  if (current.role === 'admin' && current.status === 'approved') {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin').eq('status', 'approved')
    if ((count ?? 0) <= 1) {
      res.status(400).json({ error: 'At least one approved administrator must remain.' })
      return
    }
  }
  const authDelete = await supabase.auth.admin.deleteUser(id)
  if (authDelete.error) {
    res.status(400).json({ error: authDelete.error.message })
    return
  }
  const deleted = await supabase.from('users').delete().eq('id', id)
  if (deleted.error) {
    res.status(400).json({ error: deleted.error.message })
    return
  }
  res.json({ ok: true })
})

app.post('/api/users/:id/temporary-password', async (req, res) => {
  if (!systemSupabase || !usingSecretKey) {
    res.status(503).json({ error: 'Temporary password resets require Supabase Auth administration.' })
    return
  }
  const actor = await requireRole(req, res, ['admin'])
  if (!actor) return

  const id = String(req.params.id || '')
  if (!id || id === actor.id) {
    res.status(400).json({ error: 'Use Account Settings to change your own password.' })
    return
  }

  try {
    const { data: existing, error: existingError } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
    if (existingError) throw new Error(existingError.message)
    if (!existing) {
      res.status(404).json({ error: 'User not found.' })
      return
    }

    const authUser = await findAuthUser(id, [existing.email])
    if (!authUser) {
      res.status(404).json({ error: 'The user does not have a Supabase login account.' })
      return
    }

    const previousPayload = existing.payload && typeof existing.payload === 'object' ? existing.payload : {}
    const issuedAt = new Date().toISOString()
    const nextPayload = {
      ...previousPayload,
      mustChangePassword: true,
      temporaryPasswordIssuedAt: issuedAt,
      temporaryPasswordIssuedBy: actor.id,
    }
    const marked = await supabase.from('users').update({ payload: nextPayload }).eq('id', id)
    if (marked.error) throw new Error(marked.error.message)

    const temporaryPassword = generateTemporaryPassword()
    const changed = await supabase.auth.admin.updateUserById(authUser.id, {
      password: temporaryPassword,
      user_metadata: {
        ...(authUser.user_metadata || {}),
        must_change_password: true,
      },
    })
    if (changed.error) {
      await supabase.from('users').update({ payload: previousPayload }).eq('id', id)
      res.status(400).json({ error: changed.error.message })
      return
    }

    res.setHeader('Cache-Control', 'no-store')
    res.json({
      ok: true,
      temporaryPassword,
      user: {
        id,
        mustChangePassword: true,
        temporaryPasswordIssuedAt: issuedAt,
        temporaryPasswordIssuedBy: actor.id,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/account/password-reset-complete', async (req, res) => {
  if (!systemSupabase || !usingSecretKey) {
    res.status(503).json({ error: 'Supabase Auth administration is unavailable.' })
    return
  }
  const actor = await authenticate(req, res)
  if (!actor) return
  const password = String(req.body?.password || '')
  if (password.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters.' })
    return
  }

  try {
    const { data: existing, error: existingError } = await supabase.from('users').select('email,payload').eq('id', actor.id).maybeSingle()
    if (existingError) throw new Error(existingError.message)
    if (!existing) {
      res.status(404).json({ error: 'User not found.' })
      return
    }
    const payload = existing.payload && typeof existing.payload === 'object' ? { ...existing.payload } : {}
    if (payload.mustChangePassword !== true) {
      res.status(400).json({ error: 'This account does not have an active temporary password.' })
      return
    }
    const authUser = await findAuthUser(actor.id, [existing.email, actor.email])
    if (!authUser) {
      res.status(404).json({ error: 'The user does not have a Supabase login account.' })
      return
    }
    const authUpdate = await supabase.auth.admin.updateUserById(authUser.id, {
      password,
      user_metadata: {
        ...(authUser.user_metadata || {}),
        must_change_password: false,
      },
    })
    if (authUpdate.error) {
      res.status(400).json({ error: authUpdate.error.message })
      return
    }

    payload.mustChangePassword = false
    payload.passwordChangedAt = new Date().toISOString()
    delete payload.temporaryPasswordIssuedAt
    delete payload.temporaryPasswordIssuedBy
    const saved = await supabase.from('users').update({ payload }).eq('id', actor.id)
    if (saved.error) throw new Error(saved.error.message)

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.patch('/api/users/:id', async (req, res) => {
  if (!systemSupabase) {
    res.status(503).json({ error: 'Supabase is not connected.' })
    return
  }
  if (!(await requireAdmin(req, res))) return

  const id = String(req.params.id || '')
  const firstName = String(req.body?.firstName || '').trim()
  const lastName = String(req.body?.lastName || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const fullName = `${firstName} ${lastName}`.trim()
  if (!fullName || !email.includes('@')) {
    res.status(400).json({ error: 'Name and a valid email are required.' })
    return
  }
  if (password && password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' })
    return
  }

  try {
    const { data: existing, error: existingError } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
    if (existingError) throw new Error(existingError.message)
    if (!existing) {
      res.status(404).json({ error: 'User not found.' })
      return
    }
    if (!usingSecretKey && (email !== String(existing.email || '').toLowerCase() || password)) {
      res.status(503).json({
        error: 'Changing another login email or password requires the optional Supabase server secret. You can still update the user name and role.',
      })
      return
    }
    const { data: duplicate, error: duplicateError } = await supabase.from('users').select('id').eq('email', email).neq('id', id).maybeSingle()
    if (duplicateError) throw new Error(duplicateError.message)
    if (duplicate) {
      res.status(400).json({ error: 'An account with this email already exists.' })
      return
    }

    const previousPayload = existing.payload && typeof existing.payload === 'object' ? existing.payload : {}
    const nextPayload = {
      ...previousPayload,
      firstName,
      lastName,
      fullName,
      email,
      password: '',
    }
    if (email.endsWith('@buruun.local')) nextPayload.username = email.slice(0, email.indexOf('@'))

    const saved = await supabase.from('users').update({
      email,
      full_name: fullName,
      payload: nextPayload,
    }).eq('id', id)
    if (saved.error) {
      res.status(400).json({ error: saved.error.message })
      return
    }

    if (!usingSecretKey) {
      res.json({
        ok: true,
        user: { id, email, fullName, firstName, lastName, passwordChanged: false },
      })
      return
    }

    const attributes = {
      email,
      email_confirm: true,
      user_metadata: {
        ...(typeof previousPayload === 'object' ? {} : {}),
        full_name: fullName,
        username: nextPayload.username,
      },
    }
    if (password) attributes.password = password
    const authUser = await findAuthUser(id, [existing.email, email])
    const authUpdate = authUser
      ? await supabase.auth.admin.updateUserById(authUser.id, attributes)
      : password
        ? await supabase.auth.admin.createUser({
          id,
          email,
          password,
          email_confirm: true,
          user_metadata: attributes.user_metadata,
        })
        : { error: null }
    if (authUpdate.error) {
      await supabase.from('users').update({
        email: existing.email,
        full_name: existing.full_name,
        payload: previousPayload,
      }).eq('id', id)
      res.status(400).json({ error: authUpdate.error.message })
      return
    }

    const { data: associations, error: associationError } = await supabase.from('associations').select('id,payload').eq('head_user_id', id)
    if (associationError) throw new Error(associationError.message)
    for (const association of associations ?? []) {
      const payload = {
        ...(association.payload && typeof association.payload === 'object' ? association.payload : {}),
        email,
        headUserId: id,
      }
      if (nextPayload.username) payload.username = nextPayload.username
      await supabase.from('associations').update({ payload }).eq('id', association.id)
    }

    res.json({
      ok: true,
      user: {
        id,
        email,
        fullName,
        firstName,
        lastName,
        passwordChanged: Boolean(password),
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/association-users', async (req, res) => {
  if (!systemSupabase || !usingSecretKey) {
    res.status(503).json({ error: 'Supabase is not ready to create login accounts.' })
    return
  }
  if (!(await requireAdmin(req, res))) return
  const email = String(req.body?.email || '').trim()
  const password = String(req.body?.password || '')
  const associationName = String(req.body?.associationName || '').trim()
  const firstName = String(req.body?.firstName || '').trim()
  const lastName = String(req.body?.lastName || '').trim()
  if (!email.includes('@') || password.length < 8 || !associationName) {
    res.status(400).json({ error: 'Association, email, and a password of at least 8 characters are required.' })
    return
  }
  try {
    const { data: associations, error: associationError } = await supabase.from('associations').select('*').eq('name', associationName)
    if (associationError) throw new Error(associationError.message)
    const association = (associations ?? [])[0]
    if (!association) {
      res.status(400).json({ error: 'That association is not in Supabase.' })
      return
    }
    const { data: members, error: memberError } = await supabase.from('association_members').select('name,payload')
    if (memberError) throw new Error(memberError.message)
    const president = (members ?? []).find((member) => memberAssociation(member).toLowerCase() === associationName.toLowerCase() && memberIsPresident(member))
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || president?.name || association.contact_person || associationName
    const nameParts = fullName.split(/\s+/).filter(Boolean)
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'association',
        status: 'approved',
        association_name: associationName,
      },
    })
    if (created.error || !created.data.user) {
      res.status(400).json({ error: created.error?.message || 'Could not create the login.' })
      return
    }
    const id = created.data.user.id
    const now = new Date().toISOString()
    const account = {
      id,
      email,
      password: '',
      firstName: firstName || nameParts[0] || '',
      lastName: lastName || nameParts.slice(1).join(' '),
      fullName,
      contactNumber: '',
      position: 'Association Head',
      department: 'registered-associations',
      role: 'association',
      roleLabel: 'Association Head',
      status: 'approved',
      associationName,
      createdAt: now,
      approvedAt: now,
    }
    const { error: insertError } = await supabase.from('users').insert({
      id,
      email,
      full_name: fullName,
      role: 'association',
      status: 'approved',
      association_name: associationName,
      payload: account,
    })
    if (insertError) {
      await supabase.auth.admin.deleteUser(id)
      res.status(400).json({ error: insertError.message })
      return
    }
    if (!association.head_user_id) {
      const payload = { ...(association.payload || {}), headUserId: id, email }
      await supabase.from('associations').update({ head_user_id: id, payload }).eq('id', association.id)
    }
    res.json({ ok: true, user: account })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/access-requests', limitAccessRequests, async (req, res) => {
  if (!systemSupabase) {
    res.status(503).json({ error: 'Account registration is not available.' })
    return
  }
  const requested = req.body ?? {}
  const role = requested.role === 'association' ? 'association' : requested.role === 'staff' ? 'staff' : null
  const email = String(requested.email || '').trim().toLowerCase()
  const fullName = String(requested.fullName || '').trim()
  const password = String(requested.password || '')
  if (!role || !email.includes('@') || !fullName || password.length < 8) {
    res.status(400).json({ error: 'Name, valid email, role, and a password of at least 8 characters are required.' })
    return
  }
  const metadata = {
    ...requested,
    password: undefined,
    role,
    full_name: fullName,
    status: 'pending',
  }
  const created = usingSecretKey
    ? await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })
    : await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
  if (created.error || !created.data.user) {
    res.status(400).json({ error: created.error?.message || 'Could not create the access request.' })
    return
  }
  const user = {
    ...requested,
    id: created.data.user.id,
    email,
    fullName,
    password: '',
    role,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  if (usingSecretKey) {
    try {
      await saveUserRow(user)
    } catch (error) {
      await supabase.auth.admin.deleteUser(created.data.user.id)
      res.status(500).json({ error: error.message })
      return
    }
  }
  res.status(201).json({
    ok: true,
    user,
    emailConfirmationRequired: !usingSecretKey && !created.data.session,
  })
})

const recordResources = {
  barangay_users: { table: 'users', column: 'id', save: (item) => saveUsers([item]) },
  barangay_associations: { table: 'associations', column: 'id', save: (item) => saveAssociations([item]) },
  barangay_association_members: { table: 'association_members', column: 'id', associationColumn: 'association_name', save: (item) => saveMembers([item]) },
  barangay_association_notifications: { table: 'notifications', column: 'id', associationColumn: 'association_name', save: (item) => saveNotifications([item]) },
  barangay_aid_records: { table: 'aid_records', column: 'id', associationColumn: 'association_name', save: (item) => saveAidRecords([item]) },
  barangay_staff_beneficiaries: { table: 'beneficiaries', column: 'id', associationColumn: 'association_name', save: (item) => saveBeneficiaries([item]) },
  barangay_assistance_programs: { table: 'assistance_programs', column: 'id', save: (item) => savePrograms([item]) },
  barangay_reviewable_items: {
    table: 'assistance_requests',
    column: 'id',
    associationColumn: 'association_name',
    save: (item, context) => saveRequests([item], context?.requestExists ? 'update' : 'insert'),
  },
  barangay_generated_assistance_list: { table: 'generated_assistance_list', column: 'id', associationColumn: 'association_name', save: (item) => saveGenerated([item]) },
  barangay_priority_list: { table: 'priority_list', column: 'id', associationColumn: 'association_name', save: (item) => savePriority([item]) },
  barangay_audit_logs: { table: 'audit_logs', column: 'id', save: (item, context) => saveAudit([item], context?.actor) },
  barangay_report_history: { table: 'report_history', column: 'id', save: (item) => saveReports([item]) },
  barangay_association_details: { table: 'association_profiles', column: 'id', associationColumn: 'name', save: saveProfile },
  barangay_privacy_settings: { table: 'privacy_settings', column: 'id', identity: 'default', save: savePrivacy },
}

const associationWritableResources = new Set([
  'barangay_association_members', 'barangay_association_notifications', 'barangay_aid_records',
  'barangay_reviewable_items', 'barangay_association_details', 'barangay_audit_logs',
])
const associationDeletableResources = new Set([
  'barangay_association_members', 'barangay_association_notifications', 'barangay_aid_records',
])
const staffBlockedResources = new Set(['barangay_users', 'barangay_associations', 'barangay_privacy_settings'])

function canWriteResource(actor, key) {
  if (actor.role === 'admin') return true
  if (actor.role === 'staff') return !staffBlockedResources.has(key)
  return associationWritableResources.has(key)
}

function requestWriteError(actor, payload, current = null) {
  const status = String(payload?.status || '')
  const decisions = Array.isArray(payload?.decisions) ? payload.decisions : []
  const currentDecisions = Array.isArray(current?.payload?.decisions) ? current.payload.decisions : []

  if (actor.role === 'admin') {
    return 'Admin accounts monitor assistance requests and cannot alter generated beneficiary rankings.'
  }
  if (actor.role === 'association') {
    if (current) return 'Association Heads cannot modify a request after it has been submitted.'
    if (payload?.source !== 'assistance' || status !== 'PENDING' || decisions.length > 0) {
      return 'Association Heads can submit only new pending assistance requests without decisions.'
    }
    if ((payload.documents ?? []).some((entry) => entry?.status !== 'uploaded') ||
        (payload.qualifications ?? []).some((entry) => entry?.status !== 'pending')) {
      return 'Submitted evidence and qualifications must remain pending until Staff validation.'
    }
    return null
  }
  if (actor.role === 'staff') {
    if (!current) return 'Staff cannot create assistance requests.'
    if (current.status === 'LIST GENERATED' || current.status === 'APPROVED' || current.status === 'REJECTED') {
      return 'Finalized assistance lists cannot be modified.'
    }
    if (status !== 'PENDING' && status !== 'UNDER REVIEW' && status !== 'LIST GENERATED') {
      return 'Staff can validate requests and generate lists but cannot manually approve or reject beneficiaries.'
    }
    if (current.status === 'PENDING' && status === 'LIST GENERATED') {
      return 'A request must enter Staff review before its final list can be generated.'
    }
    if (!isDeepStrictEqual(decisions, currentDecisions)) {
      return 'Staff cannot add or change final decision records.'
    }
    const immutable = ['id', 'source', 'association', 'requestType', 'program', 'details']
    if (immutable.some((key) => !isDeepStrictEqual(payload?.[key], current.payload?.[key]))) {
      return 'Staff can validate a request but cannot change its submitted identity or request details.'
    }
  }
  return null
}

function payloadIdentity(resource, payload) {
  if (resource.identity === 'default') return 'default'
  if (resource.identity) return String(payload?.[resource.identity] ?? '')
  return String(payload?.id ?? '')
}

function requestWriteOperation(current) {
  return current ? 'update' : 'insert'
}

function payloadAssociation(payload, key) {
  if (key === 'barangay_association_details') return String(payload?.name || '')
  return String(payload?.associationName || payload?.association || '')
}

async function associationOwnsRecord(actor, resource, id, allowMissing = false) {
  if (!resource.associationColumn) return false
  const { data, error } = await supabase
    .from(resource.table)
    .select(resource.associationColumn)
    .eq(resource.column, id)
    .maybeSingle()
  if (error) return false
  if (!data) return allowMissing
  const expected = String(actor.association_name || '').trim().toLowerCase()
  return String(data[resource.associationColumn] || '').trim().toLowerCase() === expected
}

app.put('/api/records/:key/:id', async (req, res) => {
  const actor = await requireRole(req, res, ['admin', 'staff', 'association'])
  if (!actor) return
  const key = String(req.params.key || '')
  const id = String(req.params.id || '')
  const resource = recordResources[key]
  if (!resource) {
    res.status(404).json({ error: 'Unknown record resource.' })
    return
  }
  if (!canWriteResource(actor, key)) {
    res.status(403).json({ error: 'You cannot update this record type.' })
    return
  }
  const payload = req.body?.payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    res.status(400).json({ error: 'A record object is required.' })
    return
  }
  if (payloadIdentity(resource, payload) !== id) {
    res.status(400).json({ error: 'The record ID does not match the request path.' })
    return
  }
  if (key === 'barangay_audit_logs' && actor.role !== 'admin') {
    const { data: currentAudit, error: auditError } = await supabase
      .from('audit_logs')
      .select('user_email')
      .eq('id', id)
      .maybeSingle()
    if (auditError) {
      res.status(500).json({ error: auditError.message })
      return
    }
    const policy = auditWritePolicy(actor, currentAudit)
    if (policy === 'reject') {
      res.status(403).json({ error: 'Audit entries are immutable and belong to the account that created them.' })
      return
    }
    if (policy === 'ignore') {
      res.json({ ok: true, id })
      return
    }
  }
  if (actor.role === 'association' && key !== 'barangay_audit_logs') {
    const expected = String(actor.association_name || '').trim().toLowerCase()
    if (!expected || payloadAssociation(payload, key).trim().toLowerCase() !== expected) {
      res.status(403).json({ error: 'You can update only records assigned to your association.' })
      return
    }
    if (!(await associationOwnsRecord(actor, resource, id, true))) {
      res.status(403).json({ error: 'That record belongs to another association.' })
      return
    }
  }
  let requestExists = false
  if (key === 'barangay_reviewable_items') {
    const { data: current, error } = await supabase
      .from('assistance_requests')
      .select('status,payload')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    requestExists = requestWriteOperation(current) === 'update'
    const policyError = requestWriteError(actor, payload, current)
    if (policyError) {
      res.status(403).json({ error: policyError })
      return
    }
  }
  try {
    await resource.save(payload, { actor, requestExists })
    res.json({ ok: true, id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/records/:key/:id', async (req, res) => {
  const actor = await requireRole(req, res, ['admin', 'staff', 'association'])
  if (!actor) return
  const key = String(req.params.key || '')
  const id = String(req.params.id || '')
  const resource = recordResources[key]
  if (!resource) {
    res.status(404).json({ error: 'Unknown record resource.' })
    return
  }
  if (key === 'barangay_users') {
    res.status(405).json({ error: 'Use the account-management workflow to remove users.' })
    return
  }
  if (key === 'barangay_reviewable_items') {
    res.status(403).json({ error: 'Submitted assistance requests are immutable workflow records and cannot be deleted.' })
    return
  }
  if (!canWriteResource(actor, key) || (actor.role === 'association' && !associationDeletableResources.has(key))) {
    res.status(403).json({ error: 'You cannot delete this record type.' })
    return
  }
  if (actor.role === 'association' && !(await associationOwnsRecord(actor, resource, id))) {
    res.status(403).json({ error: 'You can delete only records assigned to your association.' })
    return
  }
  try {
    const { error } = await supabase.from(resource.table).delete().eq(resource.column, id)
    if (error) throw new Error(error.message)
    res.json({ ok: true, id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.all('/api/store/:key', async (req, res) => {
  if (!(await authenticate(req, res))) return
  res.status(410).json({ error: 'Bulk store synchronization was retired. Use record-level endpoints.' })
})

// -- ML proxy ------------------------------------------------------------
//
// The machine learning module is a separate Python service (see ml-service/),
// matching the three-tier design: the browser talks only to this application
// layer, and this layer reaches the ML service and the database. Proxying here
// rather than calling Python from the browser keeps a single origin, so there
// is no CORS configuration in production and the client never needs to know
// where the models are hosted.
//
// When Python is down the proxy answers 503. Operational list generation fails
// safely and never finalizes a request from a local heuristic fallback.

const mlPort = Number(process.env.ML_PORT || 5050)
const mlUrl = process.env.ML_URL || `http://127.0.0.1:${mlPort}`
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 20000)

async function callMl(path, body) {
  const mlHeaders = {}
  if (body !== undefined) mlHeaders['Content-Type'] = 'application/json'
  if (process.env.ML_INTERNAL_TOKEN) mlHeaders['X-ML-Internal-Token'] = process.env.ML_INTERNAL_TOKEN
  const response = await fetch(`${mlUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: mlHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(ML_TIMEOUT_MS),
  })
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { ok: false, error: 'ML service returned a malformed response.' }
  }
  return { status: response.status, payload }
}

app.get('/api/ml-health', async (_req, res) => {
  try {
    const { status, payload } = await callMl('/api/health')
    if (status < 200 || status >= 300) {
      res.status(503).json({ ok: false, service: 'barangay-vulnerability-ml' })
      return
    }
    res.json({
      ok: true,
      service: 'barangay-vulnerability-ml',
      modelLoaded: Boolean(payload?.modelLoaded),
    })
  } catch {
    res.status(503).json({ ok: false, service: 'barangay-vulnerability-ml' })
  }
})

// The client builds `${ML_BASE}/api/...`, so with the default ML_BASE=/api/ml it
// requests /api/ml/api/score. Mounting strips that prefix and forwards what is
// left, so Python sees /api/score. Forwarding the suffix rather than declaring a
// handful of fixed routes is what keeps VITE_ML_URL pointing straight at the
// service behaving exactly the same way - both ends of ML_BASE agree on paths.
app.use('/api/ml', async (req, res) => {
  const trainRequest = /\/api\/train(?:\?|$)/.test(req.originalUrl)
  const actor = await requireRole(req, res, trainRequest ? ['admin'] : ['admin', 'staff', 'association'])
  if (!actor) return
  const suffix = req.originalUrl.slice('/api/ml'.length) || '/'
  const isBodyless = req.method === 'GET' || req.method === 'HEAD'
  try {
    const { status, payload } = await callMl(suffix, isBodyless ? undefined : (req.body ?? {}))
    res.status(status).json(payload)
  } catch (error) {
    res.status(503).json({ ok: false, error: 'ML service is not running.', detail: error.message })
  }
})

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(apiPort, () => {
    console.log(`API listening on http://localhost:${apiPort}`)
    console.log(`ML service expected at ${mlUrl} (proxied under /api/ml)`)
  })

  initializeServer()
    .then(() => {
      console.log('Supabase ready.')
      if (!usingSecretKey) {
        console.log('Using authenticated Supabase RLS mode (no server secret configured).')
        console.log('Auth Admin operations such as creating or deleting another login remain unavailable.')
      }
    })
    .catch((error) => {
      console.error('Supabase is not connected. Records stay in the browser until the project is configured.')
      console.error(error.message)
    })
}

export {
  app,
  auditWritePolicy,
  canWriteResource,
  generateTemporaryPassword,
  initializeServer,
  payloadIdentity,
  requestWriteError,
  requestWriteOperation,
  scopeStoresForActor,
  trustedAuditEntry,
}
