'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPlansPublic } from '@/services/orders/orders'
import { CONSULT_PRODUCT_PRICE } from '@/utils/analytics/gtm'

export function usePublicPlanPrice() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans-public'],
    queryFn: listPlansPublic,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const price = useMemo(() => {
    const arr = Array.isArray(plans) ? plans : []
    const p = arr[0]?.price
    return typeof p === 'number' ? p : CONSULT_PRODUCT_PRICE
  }, [plans])

  return { price, isLoading }
}
