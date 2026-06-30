'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { listPlansPublic, type Plan } from '@/services/orders/orders'
import { CONSULT_PRODUCT_PRICE } from '@/utils/analytics/gtm'

export function usePublicPlan() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans-public'],
    queryFn: listPlansPublic,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const plan = useMemo((): Plan | null => {
    const arr = Array.isArray(plans) ? plans : []
    return arr[0] ?? null
  }, [plans])

  const price = useMemo(() => {
    const p = plan?.price
    return typeof p === 'number' ? p : CONSULT_PRODUCT_PRICE
  }, [plan])

  return { plan, price, isLoading }
}

/** @deprecated Use `usePublicPlan` — mantido para compatibilidade. */
export function usePublicPlanPrice() {
  const { price, isLoading } = usePublicPlan()
  return { price, isLoading }
}
