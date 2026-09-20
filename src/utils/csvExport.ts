function escapeCsvValue(value: string | number): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function formatExportDateStamp(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Masks personal names in exports when privacy settings require it. */
export function maskPersonalNameForExport(name: string, enabled: boolean): string {
  if (!enabled || !name.trim()) return name
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].length <= 1 ? '*' : `${parts[0][0]}***`
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
