import type { SupportingDocument } from '../types/approval'

export type DocumentPreviewKind = 'text' | 'image' | 'spreadsheet' | 'archive'

export interface DocumentPreviewContext {
  association: string
  requestId: string
  requestType: string
}

export interface DocumentPreview {
  document: SupportingDocument
  kind: DocumentPreviewKind
  title: string
  lines: string[]
}

function extension(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : ''
}

function kindFromName(name: string): DocumentPreviewKind {
  const ext = extension(name)
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet'
  if (['zip', 'rar'].includes(ext)) return 'archive'
  return 'text'
}

export function buildDocumentPreview(
  document: SupportingDocument,
  context: DocumentPreviewContext,
): DocumentPreview {
  const kind = kindFromName(document.name)
  const baseMeta = [
    `Association: ${context.association}`,
    `Request: ${context.requestType} (${context.requestId})`,
    `Document type: ${document.type}`,
    `File size: ${document.fileSize}`,
    `Status: ${document.status.toUpperCase()}`,
  ]

  if (document.name.includes('Residency')) {
    return {
      document,
      kind,
      title: document.name,
      lines: [
        ...baseMeta,
        '',
        'BARANGAY BURU-UN, ILIGAN CITY',
        'CERTIFICATE OF RESIDENCY',
        '',
        `This is to certify that ${context.association} is a registered organization / applicant`,
        'with principal address in Barangay Buru-un, Iligan City.',
        '',
        'Issued for assistance program verification purposes.',
      ],
    }
  }

  if (document.name.includes('Government ID') || kind === 'image') {
    return {
      document,
      kind: 'image',
      title: document.name,
      lines: [
        ...baseMeta,
        '',
        '[Photo ID preview]',
        'Association head identification on file.',
        'Name and photo match submitted registration records.',
      ],
    }
  }

  if (kind === 'spreadsheet' || document.name.includes('Masterlist')) {
    return {
      document,
      kind: 'spreadsheet',
      title: document.name,
      lines: [
        ...baseMeta,
        '',
        'Member Name | Age | PWD | Senior | Status',
        'Maria Santos | 42 | No | No | Active',
        'Juan dela Cruz | 38 | No | No | Active',
        'Ana Garcia | 55 | No | Yes | Active',
        'Pedro Santos | 61 | Yes | Yes | Active',
        'Elena Torres | 48 | No | No | Active',
      ],
    }
  }

  if (kind === 'archive') {
    return {
      document,
      kind: 'archive',
      title: document.name,
      lines: [
        ...baseMeta,
        '',
        'Archive contents:',
        '· situation_report_oct2023.pdf',
        '· damage_photos_01.jpg',
        '· damage_photos_02.jpg',
        '· member_affidavit.pdf',
      ],
    }
  }

  return {
    document,
    kind: 'text',
    title: document.name,
    lines: [
      ...baseMeta,
      '',
      'Document summary attached to this assistance request.',
      'Review metadata and verification status before approval.',
    ],
  }
}

export function downloadSupportingDocument(
  document: SupportingDocument,
  context: DocumentPreviewContext,
): void {
  const preview = buildDocumentPreview(document, context)
  const content = preview.lines.join('\r\n')
  const ext = extension(document.name)
  const downloadName =
    ext === 'xlsx' || ext === 'xls'
      ? document.name.replace(/\.xlsx?$/i, '.csv')
      : ext === 'jpg' || ext === 'jpeg' || ext === 'png'
        ? document.name.replace(/\.(jpe?g|png|webp)$/i, '.txt')
        : document.name.replace(/\.pdf$/i, '.txt')

  const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = downloadName
  link.click()
  URL.revokeObjectURL(url)
}
