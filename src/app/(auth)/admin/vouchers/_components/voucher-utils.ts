import type { VoucherBatchStatus, VoucherStatus } from '@/services/staff/vouchers'

export const formatBRL = (value: number | string) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'

export const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'

/** Rótulos em português; o backend devolve o enum cru. */
export const BATCH_STATUS_LABEL: Record<VoucherBatchStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  EXPIRED: 'Expirado',
  CANCELED: 'Cancelado',
}

export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  ISSUED: 'Emitido',
  REDEEMED: 'Resgatado',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
}

type Variant = 'active' | 'inactive' | 'neutral' | 'warning' | 'brand'

export const batchStatusVariant = (status: VoucherBatchStatus): Variant =>
  status === 'ACTIVE' ? 'active'
    : status === 'DRAFT' ? 'neutral'
    : status === 'PAUSED' ? 'warning'
    : 'inactive'

export const voucherStatusVariant = (status: VoucherStatus): Variant =>
  status === 'REDEEMED' ? 'brand'
    : status === 'ISSUED' ? 'active'
    : status === 'EXPIRED' ? 'warning'
    : 'inactive'

/** Dispara o download do PDF no navegador sem navegar para fora da página. */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
