import * as XLSX from 'xlsx'

/** Máximo de linhas de dados por campanha no browser (alinhado à API por omissão). */
export const OUTREACH_MAX_DATA_ROWS = 40000

/** Linhas por pedido JSON (create / append); alinhar com OUTREACH_MAX_ROWS_PER_REQUEST na API. */
export const OUTREACH_JSON_BATCH_ROWS = 5000

/**
 * Lê CSV ou Excel no browser e devolve cabeçalho + linhas como objetos (primeira folha).
 * Usado para enviar JSON em lotes à API, sem multipart nem limite de upload da Cloudflare.
 */
export async function spreadsheetFileToColumnsAndRows(file: File): Promise<{
  columns: string[]
  rows: Record<string, string>[]
}> {
  const lower = file.name.toLowerCase()
  const wb =
    lower.endsWith('.csv') || file.type === 'text/csv'
      ? XLSX.read(await file.text(), { type: 'string', cellDates: true })
      : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })

  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    throw new Error('O ficheiro não tem folhas.')
  }
  const ws = wb.Sheets[sheetName]
  if (!ws) {
    throw new Error('Folha inválida.')
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(ws, {
    header: 1,
    blankrows: false,
    defval: '',
  }) as unknown[][]

  if (!matrix.length) {
    throw new Error('Ficheiro vazio.')
  }

  const headerRow = matrix[0] as unknown[]
  const columns = headerRow.map((h) => String(h ?? '').trim()).filter((h) => h.length > 0)
  if (!columns.length) {
    throw new Error('Cabeçalho inválido (primeira linha deve ter nomes de colunas).')
  }

  const rows: Record<string, string>[] = []
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r] as unknown[] | undefined
    const obj: Record<string, string> = {}
    for (let c = 0; c < columns.length; c++) {
      const key = columns[c]
      const v = line?.[c]
      obj[key] = v === null || v === undefined ? '' : String(v).trim()
    }
    rows.push(obj)
  }

  if (rows.length > OUTREACH_MAX_DATA_ROWS) {
    throw new Error(`No máximo ${OUTREACH_MAX_DATA_ROWS} linhas de dados (ficheiro tem ${rows.length}).`)
  }

  return { columns, rows }
}

/**
 * Converte Excel (.xlsx / .xls) para CSV UTF-8 no browser (primeira folha).
 * Mantido para exportações ou fluxos que ainda precisem de ficheiro CSV local.
 */
export async function spreadsheetFileToCsvFile(file: File): Promise<File> {
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.csv') || file.type === 'text/csv') {
    return file
  }
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) {
    throw new Error('O ficheiro Excel não tem folhas.')
  }
  const ws = wb.Sheets[sheetName]
  if (!ws) {
    throw new Error('Folha inválida no Excel.')
  }
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', blankrows: false })
  const baseName = file.name.replace(/\.(xlsx|xls)$/i, '')
  const outName = `${baseName || 'lista'}.csv`
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })
  return new File([blob], outName, { type: 'text/csv' })
}
