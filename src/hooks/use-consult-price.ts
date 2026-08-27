import { useQuery } from '@tanstack/react-query'

import {
  CONSULT_PRODUCT_PRICE,
  CONSULT_PRICE_WITH_CERTIFICATES,
} from '@/utils/analytics/gtm'
import { getQuote, type QuoteVoucher } from '@/services/payments'
import { readVoucherCode } from '@/utils/voucher-session'

export type EntryPath = 'address' | 'document' | 'registry'

export function resolveConsultPrice(
  entryPath?: EntryPath,
  includeCertificates?: boolean,
): { price: number; includeCertificates: boolean } {
  if (entryPath === 'document' || entryPath === 'registry') {
    return { price: CONSULT_PRODUCT_PRICE, includeCertificates: true }
  }

  if (entryPath === 'address') {
    if (includeCertificates) {
      return { price: CONSULT_PRICE_WITH_CERTIFICATES, includeCertificates: true }
    }
    return { price: CONSULT_PRODUCT_PRICE, includeCertificates: false }
  }

  return {
    price: includeCertificates ? CONSULT_PRICE_WITH_CERTIFICATES : CONSULT_PRODUCT_PRICE,
    includeCertificates: Boolean(includeCertificates),
  }
}

export function useConsultPrice(entryPath?: EntryPath, includeCertificates?: boolean) {
  return resolveConsultPrice(entryPath, includeCertificates)
}

export type ConsultDynamicPrice = {
  price: number
  basePrice: number
  surcharge: number
  certificatesSurcharge: number
  uf: string | null
  newPricing: boolean
  surchargeConfigured: boolean
  includeCertificates: boolean
  isLoading: boolean
  /** Desconto do voucher desta modalidade, calculado no backend. */
  voucher: QuoteVoucher | null
  /** O que o cliente ainda paga depois do voucher. Igual a `price` quando não há voucher. */
  payable: number
}

/**
 * Preço dinâmico via /payments/quote/ (precificação global Fase 2). Aditivo: enquanto a flag
 * NEW_PRICING_ENABLED estiver off (new_pricing=false), cai no preço atual (resolveConsultPrice).
 * Com a flag on, o fluxo por endereço soma a sobretaxa Inteiro-Teor da UF.
 */
export function useConsultDynamicPrice(params: {
  entryPath?: EntryPath
  includeCertificates?: boolean
  uf?: string | null
}): ConsultDynamicPrice {
  const { entryPath, includeCertificates, uf } = params
  const fallback = resolveConsultPrice(entryPath, includeCertificates)
  // Lido a cada render de propósito: o código chega por sessionStorage vindo de
  // /resgate, sem passar por estado do React, então não há nada que dispare re-render.
  const voucherCode = readVoucherCode()

  const { data, isLoading } = useQuery({
    queryKey: [
      'payment-quote', entryPath ?? '', Boolean(includeCertificates), uf ?? '', voucherCode,
    ],
    queryFn: () =>
      getQuote({
        entry_path: entryPath,
        include_certificates: Boolean(includeCertificates),
        uf: uf ?? undefined,
        ...(voucherCode ? { voucher_code: voucherCode } : {}),
      }),
    enabled: Boolean(entryPath),
    staleTime: 5 * 60_000,
    retry: false,
  })

  const voucher = data?.voucher ?? null
  const payableFrom = (full: number) =>
    voucher?.applied ? voucher.payable : full

  if (data?.new_pricing) {
    return {
      price: data.amount,
      basePrice: data.base_price,
      surcharge: data.surcharge,
      certificatesSurcharge: data.certificates_surcharge,
      uf: data.uf,
      newPricing: true,
      surchargeConfigured: data.surcharge_configured,
      includeCertificates: data.include_certificates,
      isLoading,
      voucher,
      payable: payableFrom(data.amount),
    }
  }

  return {
    price: fallback.price,
    basePrice: fallback.price,
    surcharge: 0,
    certificatesSurcharge: 0,
    uf: uf ? uf.trim().toUpperCase().slice(0, 2) : null,
    newPricing: false,
    surchargeConfigured: false,
    includeCertificates: fallback.includeCertificates,
    isLoading,
    voucher,
    payable: payableFrom(fallback.price),
  }
}
