import { supabase } from '../lib/supabase'
import type { SupportingDocument } from '../types/approval'

const REQUEST_DOCUMENTS_BUCKET = 'request-documents'

function safeFilename(name: string) {
  const cleaned = name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'document'
}

export async function uploadRequestDocument(requestId: string, file: File) {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Your session expired before the document could be uploaded.')
  const path = `${userData.user.id}/${requestId}/${crypto.randomUUID()}-${safeFilename(file.name)}`
  const { error } = await supabase.storage.from(REQUEST_DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

export async function resolveRequestDocumentUrl(document: SupportingDocument) {
  if (document.dataUrl) return document.dataUrl
  if (!document.storagePath) return null
  const { data, error } = await supabase.storage
    .from(REQUEST_DOCUMENTS_BUCKET)
    .createSignedUrl(document.storagePath, 60)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function downloadRequestDocument(document: SupportingDocument) {
  const url = await resolveRequestDocumentUrl(document)
  if (!url) throw new Error('The uploaded file is not available.')
  const link = window.document.createElement('a')
  link.href = url
  link.download = document.name
  link.rel = 'noopener'
  link.click()
}
