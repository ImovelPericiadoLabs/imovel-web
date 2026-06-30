import { useQuery } from '@tanstack/react-query'

import {
  CONSULT_PRODUCT_PRICE,
  CONSULT_PRICE_WITH_CERTIFICATES,
} from '@/utils/analytics/gtm'
import { getQuote } from '@/services/payments'

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
  uf: string | null
  newPricing: boolean
  includeCertificates: boolean
  isLoading: boolean
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

  const { data, isLoading } = useQuery({
    queryKey: ['payment-quote', entryPath ?? '', Boolean(includeCertificates), uf ?? ''],
    queryFn: () =>
      getQuote({
        entry_path: entryPath,
        include_certificates: Boolean(includeCertificates),
        uf: uf ?? undefined,
      }),
    enabled: Boolean(entryPath),
    staleTime: 5 * 60_000,
    retry: false,
  })

  if (data?.new_pricing) {
    return {
      price: data.amount,
      basePrice: data.base_price,
      surcharge: data.surcharge,
      uf: data.uf,
      newPricing: true,
      includeCertificates: data.include_certificates,
      isLoading,
    }
  }

  return {
    price: fallback.price,
    basePrice: fallback.price,
    surcharge: 0,
    uf: uf ? uf.trim().toUpperCase().slice(0, 2) : null,
    newPricing: false,
    includeCertificates: fallback.includeCertificates,
    isLoading,
  }
}
