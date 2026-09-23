function pageStream(lines: string[]) {
  const commands = ['BT', '/F1 10 Tf', '40 760 Td']
  lines.forEach((line, index) => {
    const shown = line.slice(0, 100)
    if (index === 0) commands.push(`(${shown}) Tj`)
    else commands.push('0 -14 Td', `(${shown}) Tj`)
  })
  commands.push('ET')
  return commands.join('\n')
}

function sanitize(line: string) {
  return line
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

export function downloadPdf(filename: string, lines: string[]) {
  const sanitized = lines.map(sanitize)
  const chunks: string[][] = []
  for (let index = 0; index < sanitized.length; index += 40) {
    chunks.push(sanitized.slice(index, index + 40))
  }
  if (chunks.length === 0) chunks.push(['No records.'])

  const fontObjectId = 2 + chunks.length * 2 + 1
  const kids: string[] = []
  const objectBodies: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '']

  chunks.forEach((chunk, index) => {
    const pageId = 3 + index * 2
    const contentId = pageId + 1
    kids.push(`${pageId} 0 R`)
    const stream = pageStream(chunk)
    objectBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>`,
    )
    objectBodies.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })

  objectBodies[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${chunks.length} >>`
  objectBodies.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let body = '%PDF-1.4\n'
  const offsets = [0]
  objectBodies.forEach((content, index) => {
    offsets.push(body.length)
    body += `${index + 1} 0 obj\n${content}\nendobj\n`
  })
  const xrefStart = body.length
  let xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  body += `${xref}trailer\n<< /Size ${objectBodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  const blob = new Blob([body], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
