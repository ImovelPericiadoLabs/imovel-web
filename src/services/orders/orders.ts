import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSession } from 'next-auth/react'

export type OrderStatus = 'CREATED' | 'PAID' | 'CANCELED' | 'PENDING'

export type ListOrdersRequest = {
  limit?: number
  p?: number
  status?: OrderStatus | string
}

export type Order = {
  id: string
  status: string
  total: number
  createdAt: string
}

export type OrdersApiResponse = {
  results: Order[]
  count?: number
  next?: string | null
  previous?: string | null
}

export type Plan = {
  id: string
  name: string
  price: number
  features: string[]
}

export type PlansApiResponse = {
  plans: Plan[]
}

export async function listOrders(params: ListOrdersRequest = {}) {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const { limit = 20, p = 0, status } = params
  const queryParams = new URLSearchParams()
  queryParams.append('limit', String(limit))
  queryParams.append('p', String(p))

  if (status) {
    queryParams.append('status', status)
  }

  const url = `${endpoint.orders}?${queryParams.toString()}`

  try {
    return (await api.get(url, token)) as OrdersApiResponse
  } catch (error: any) {
    if (error.message === 'Network Error') {
      throw new Error('Erro de conexão. Verifique sua internet.')
    }
    throw error
  }
}

export async function listPlans() {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = (await api.get(endpoint.plans, token)) as PlansApiResponse | Plan[]

  return Array.isArray(response) ? response : (response as PlansApiResponse).plans || []
}