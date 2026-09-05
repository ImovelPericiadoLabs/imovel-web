import { describe, expect, it } from 'vitest'
import {
  CONSULT_DOCUMENT_MAX_BYTES,
  isAcceptedConsultDocument,
  normalizeConsultDocumentFile,
} from './accepted-document'

function file(name: string, type: string, size = 1024): File {
  const blob = new File(['x'.repeat(Math.min(size, 16))], name, { type })
  Object.defineProperty(blob, 'size', { value: size })
  return blob
}

describe('isAcceptedConsultDocument', () => {
  it('accepts pdf, png and jpeg by mime', () => {
    expect(isAcceptedConsultDocument(file('a.pdf', 'application/pdf'))).toBe(true)
    expect(isAcceptedConsultDocument(file('a.png', 'image/png'))).toBe(true)
    expect(isAcceptedConsultDocument(file('a.jpg', 'image/jpeg'))).toBe(true)
  })

  it('accepts jpg/png when the picker leaves mime empty or non-standard', () => {
    expect(isAcceptedConsultDocument(file('matricula.jpg', ''))).toBe(true)
    expect(isAcceptedConsultDocument(file('matricula.JPG', ''))).toBe(true)
    expect(isAcceptedConsultDocument(file('matricula.jpeg', ''))).toBe(true)
    expect(isAcceptedConsultDocument(file('matricula.png', ''))).toBe(true)
    expect(isAcceptedConsultDocument(file('matricula.jpg', 'image/jpg'))).toBe(true)
    expect(isAcceptedConsultDocument(file('matricula.jpg', 'image/pjpeg'))).toBe(true)
  })

  it('rejects unsupported types and oversized files', () => {
    expect(isAcceptedConsultDocument(file('a.js', 'text/javascript'))).toBe(false)
    expect(isAcceptedConsultDocument(file('a.heic', 'image/heic'))).toBe(false)
    expect(isAcceptedConsultDocument(file('a.png', 'image/png', CONSULT_DOCUMENT_MAX_BYTES + 1))).toBe(
      false,
    )
  })
})

describe('normalizeConsultDocumentFile', () => {
  it('renames .jpeg to .jpg so the API validator accepts the file', () => {
    const normalized = normalizeConsultDocumentFile(file('doc arthur.jpeg', 'image/jpeg'))
    expect(normalized.name).toBe('doc arthur.jpg')
    expect(normalized.type).toBe('image/jpeg')
  })

  it('fills mime from extension when the browser sends an empty type', () => {
    const jpg = normalizeConsultDocumentFile(file('foto.jpg', ''))
    expect(jpg.type).toBe('image/jpeg')
    const png = normalizeConsultDocumentFile(file('foto.png', ''))
    expect(png.type).toBe('image/png')
  })

  it('maps image/jpg to image/jpeg', () => {
    const normalized = normalizeConsultDocumentFile(file('foto.jpg', 'image/jpg'))
    expect(normalized.type).toBe('image/jpeg')
    expect(normalized.name).toBe('foto.jpg')
  })

  it('returns the same file when nothing changes', () => {
    const original = file('ok.jpg', 'image/jpeg')
    expect(normalizeConsultDocumentFile(original)).toBe(original)
  })
})
