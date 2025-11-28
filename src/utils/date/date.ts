export function formatDateWithTime(isoDate: string): string {
  const date = new Date(isoDate)

  const day = date.getDate()
  const month = date.toLocaleString('pt-BR', { month: 'short' })
  const year = date.getFullYear()

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month.replace('.', '')} ${year} às ${hours}:${minutes}`
}
