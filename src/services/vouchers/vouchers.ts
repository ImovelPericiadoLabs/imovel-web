import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import type { BenefitKind, EntryPath } from '@/services/staff/vouchers'

/** Regra de UMA modalidade, já com o texto pronto vindo do backend. */
export type PublicVoucherBenefit = {
  entry_path: EntryPath
  kind: BenefitKind
  /** Percentual em PERCENT, reais em AMOUNT, nulo em FREE. */
  value: string | null
  /** Texto pronto ("Por Documento (grátis)") — o mesmo que sai impresso no cartão. */
  describe: string
}

export type VoucherValidation =
  | {
      valid: true
      event_name: string
      benefits: PublicVoucherBenefit[]
      benefits_display: string
      allowed_entry_paths: EntryPath[]
      allowed_entry_paths_display: string
      valid_until: string
      /** Ainda falta identificar a pessoa: "uma por conta" só é conferido após o login. */
      requires_login: boolean
    }
  | { valid: false; code: string; message: string }

/**
 * POST /vouchers/validate/ — confere o código SEM consumir.
 *
 * Público de propósito: quem escaneia o QR do cartão impresso ainda não tem conta.
 * O backend responde 200 mesmo para código inválido (com `valid: false`), porque o
 * motivo da recusa é conteúdo de tela, não erro de transporte.
 */
export async function validateVoucher(
  code: string,
  entryPath?: EntryPath,
): Promise<VoucherValidation> {
  return api.post(endpoint.voucherValidate, {
    code,
    ...(entryPath ? { entry_path: entryPath } : {}),
  }) as Promise<VoucherValidation>
}
