export function formatBRL(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n)
}

export function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR')
}

export function partnerDisplayName(first: string, last: string, email: string) {
  const full = `${first ?? ''} ${last ?? ''}`.trim()
  return full || email
}

export function reasonLabel(reason: string) {
  return reason === 'INITIAL'
    ? 'Inicial'
    : reason === 'TOP_UP'
      ? 'Recarga'
      : reason === 'ADJUSTMENT'
        ? 'Ajuste'
        : reason
}
