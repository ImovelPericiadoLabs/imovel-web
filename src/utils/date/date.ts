/** Short relative past string for “última atividade” (pt-BR). */
export function formatRelativePastShort(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return '—'
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 20) return 'agora'

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return rtf.format(-diffMin, 'minute')
  }

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 48) {
    return rtf.format(-diffHour, 'hour')
  }

  const diffDay = Math.floor(diffHour / 24)
  return rtf.format(-diffDay, 'day')
}

export function formatDateWithTime(isoDate: string): string {
  const date = new Date(isoDate)

  const day = date.getDate()
  const month = date.toLocaleString('pt-BR', { month: 'short' })
  const year = date.getFullYear()

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month.replace('.', '')} ${year} às ${hours}:${minutes}`
}
