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

export type PdfTableSection = {
  heading: string
  headers: string[]
  rows: string[][]
}

export type PdfReport = {
  title: string
  details: string[]
  sections: PdfTableSection[]
}

function pdfLiteral(value: string): string {
  const clean = value
    .replace(/\u00f1/g, 'n')
    .replace(/\u00d1/g, 'N')
    .replace(/[^\x20-\x7E]/g, ' ')
  return `(${clean.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')})`
}

function wrapText(value: string, maxChars: number): string[] {
  const text = value.trim() || '—'
  const limit = Math.max(4, maxChars)
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const pieces = word.length > limit ? word.match(new RegExp(`.{1,${limit}}`, 'g')) ?? [word] : [word]
    for (const piece of pieces) {
      const next = current ? `${current} ${piece}` : piece
      if (current && next.length > limit) {
        lines.push(current)
        current = piece
      } else {
        current = next
      }
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines.slice(0, 3) : ['—']
}

function downloadBlob(filename: string, body: string) {
  const blob = new Blob([body], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadPdfReport(filename: string, report: PdfReport): void {
  const pageWidth = 792
  const pageHeight = 612
  const margin = 32
  const contentWidth = pageWidth - margin * 2
  const streams: string[] = []
  let commands: string[] = []
  let cursorY = pageHeight - margin

  function newPage() {
    if (commands.length > 0) streams.push(commands.join('\n'))
    commands = []
    cursorY = pageHeight - margin
  }

  function ensure(height: number) {
    if (cursorY - height < margin + 18) newPage()
  }

  function text(value: string, x: number, y: number, size: number, font: 'F1' | 'F2', color = '0 0 0') {
    commands.push(
      'BT',
      `/${font} ${size} Tf`,
      `${color} rg`,
      `1 0 0 1 ${x} ${y} Tm`,
      `${pdfLiteral(value)} Tj`,
      'ET',
    )
  }

  function paintHeader() {
    text(report.title, margin, cursorY - 14, 16, 'F2', '0.12 0.34 0.18')
    cursorY -= 22
    for (const line of report.details) {
      text(line, margin, cursorY - 10, 9, 'F1', '0.35 0.35 0.35')
      cursorY -= 12
    }
    cursorY -= 8
  }

  function paintTable(section: PdfTableSection) {
    ensure(48)
    text(section.heading, margin, cursorY - 12, 11, 'F2')
    cursorY -= 18
    const columnCount = Math.max(1, section.headers.length)
    const columnWidth = contentWidth / columnCount
    const maxChars = Math.max(6, Math.floor(columnWidth / 4.4))

    const drawHead = () => {
      ensure(20)
      commands.push(`0.12 0.34 0.18 rg ${margin} ${cursorY - 16} ${contentWidth} 16 re f`)
      section.headers.forEach((header, index) => {
        text(header, margin + index * columnWidth + 3, cursorY - 12, 8, 'F2', '1 1 1')
      })
      cursorY -= 16
    }

    drawHead()
    const source = section.rows.length > 0 ? section.rows : [['No records.']]
    source.forEach((row, rowIndex) => {
      const wrapped = section.headers.map((_, index) => wrapText(String(row[index] ?? ''), maxChars))
      const lineCount = Math.max(...wrapped.map((lines) => lines.length))
      const rowHeight = lineCount * 10 + 6
      if (cursorY - rowHeight < margin + 18) {
        newPage()
        paintHeader()
        text(`${section.heading} (continued)`, margin, cursorY - 12, 11, 'F2')
        cursorY -= 18
        drawHead()
      }
      if (rowIndex % 2 === 0) {
        commands.push(`0.95 0.97 0.95 rg ${margin} ${cursorY - rowHeight} ${contentWidth} ${rowHeight} re f`)
      }
      wrapped.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => {
          text(line, margin + index * columnWidth + 3, cursorY - 11 - lineIndex * 10, 8, 'F1')
        })
      })
      cursorY -= rowHeight
    })
    cursorY -= 14
  }

  paintHeader()
  for (const section of report.sections) paintTable(section)
  if (commands.length > 0) streams.push(commands.join('\n'))

  const fontObjectId = 3 + streams.length * 2
  const boldFontId = fontObjectId + 1
  const kids: string[] = []
  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '']
  streams.forEach((stream, index) => {
    const pageId = 3 + index * 2
    const contentId = pageId + 1
    kids.push(`${pageId} 0 R`)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R /F2 ${boldFontId} 0 R >> >> >>`,
    )
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })
  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${streams.length} >>`
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  let body = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((content, index) => {
    offsets.push(body.length)
    body += `${index + 1} 0 obj\n${content}\nendobj\n`
  })
  const xrefStart = body.length
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  body += `${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  downloadBlob(filename, body)
}
