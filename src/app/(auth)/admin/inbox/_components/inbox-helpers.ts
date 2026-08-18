export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]?.[0] || ''
    const b = parts[1]?.[0] || ''
    return (a + b).toUpperCase() || '?'
  }
  const s = parts[0] || '?'
  return s.slice(0, 2).toUpperCase()
}

export function formatRelativePt(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = Date.now()
  const diffMs = now - d.getTime()
  const abs = Math.abs(diffMs)

  if (abs < 60_000) return 'agora'
  if (abs < 3_600_000) {
    const m = Math.floor(abs / 60_000)
    return `há ${m} min`
  }
  if (abs < 86_400_000) {
    const h = Math.floor(abs / 3_600_000)
    return h === 1 ? 'há cerca de 1 hora' : `há cerca de ${h} horas`
  }
  if (abs < 7 * 86_400_000) {
    const days = Math.floor(abs / 86_400_000)
    return days === 1 ? 'há 1 dia' : `há ${days} dias`
  }

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatMessageStamp(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
