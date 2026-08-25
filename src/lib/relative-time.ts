/**
 * "Atualizado há X dias" no estilo da referência de design — sem dependência externa
 * (date-fns/dayjs não estão no projeto). Recebe `now` só para ser testável (sem
 * depender de `Date.now()` real em cada assert).
 */
export function formatRelativeDate(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return ''

  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''

  const diffMs = now.getTime() - then.getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)

  if (diffMinutes < 1) return 'agora mesmo'
  if (diffMinutes < 60) return `há ${diffMinutes} min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `há ${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}`

  const diffYears = Math.floor(diffMonths / 12)
  return `há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`
}
