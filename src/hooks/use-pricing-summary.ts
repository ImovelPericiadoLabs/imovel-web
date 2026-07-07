'use client'

import { useQuery } from '@tanstack/react-query'

import { getPricingTable } from '@/services/payments'
import { CONSULT_PRODUCT_PRICE } from '@/utils/analytics/gtm'

export const TABELA_PRECOS_HREF = '/tabela-precos'

/**
 * Resumo da tabela pública de preços por UF para exibição promocional
 * (entrada da consulta, banners). Cai no preço fixo enquanto carrega.
 */
export function usePricingSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['pricing-table-public'],
    queryFn: getPricingTable,
    staleTime: 30 * 60_000,
    retry: 1,
  })

  const basePrice = typeof data?.base_price === 'number' ? data.base_price : CONSULT_PRODUCT_PRICE
  const addressPrices = (data?.rows ?? []).map((row) => row.address_price)
  const minAddressPrice = addressPrices.length ? Math.min(...addressPrices) : basePrice
  const maxAddressPrice = addressPrices.length ? Math.max(...addressPrices) : basePrice

  return { basePrice, minAddressPrice, maxAddressPrice, isLoading }
}
