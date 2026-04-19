import * as XLSX from 'xlsx'

/**
 * Converte Excel (.xlsx / .xls) para CSV UTF-8 no browser (primeira folha).
 * O servidor só aceita CSV; assim evitamos enviar binários e fórmulas do Excel.
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
