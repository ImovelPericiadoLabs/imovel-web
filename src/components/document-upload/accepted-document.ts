export const CONSULT_DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'])

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export const CONSULT_DOCUMENT_MAX_BYTES = 250 * 1024 * 1024

export function consultDocumentExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot < 0 || lastDot === fileName.length - 1) return ''
  return fileName.slice(lastDot + 1).toLowerCase()
}

export function isAcceptedConsultDocument(file: File): boolean {
  if (file.size > CONSULT_DOCUMENT_MAX_BYTES) return false
  const mime = (file.type || '').toLowerCase()
  if (ACCEPTED_MIME_TYPES.has(mime)) return true
  return ACCEPTED_EXTENSIONS.has(consultDocumentExtension(file.name))
}

/** API accepts `.jpg` but not `.jpeg`; some pickers also omit or use non-standard image MIME. */
export function normalizeConsultDocumentFile(file: File): File {
  const ext = consultDocumentExtension(file.name)
  let name = file.name
  let type = (file.type || '').toLowerCase()

  if (ext === 'jpeg') {
    name = `${file.name.slice(0, file.name.lastIndexOf('.'))}.jpg`
  }

  if (type === 'image/jpg' || type === 'image/pjpeg' || type === 'image/x-png') {
    type = ext === 'png' ? 'image/png' : 'image/jpeg'
  }

  if (!type) {
    type = MIME_BY_EXTENSION[ext === 'jpeg' ? 'jpg' : ext] || file.type
  }

  if (name === file.name && type === file.type) return file
  return new File([file], name, { type, lastModified: file.lastModified })
}
