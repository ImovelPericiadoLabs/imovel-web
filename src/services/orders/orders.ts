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
  code: number
  analysis_status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | string
  payment_status: 'CREATED' | 'WAITING' | 'PAID' | 'FAILED' | 'CANCELED' | string
  amount: string
  document: string | null
  place_id: string | null
  formatted_address: string | null
  created: string
  modified: string
}

export type OrdersApiResponse = {
  items: Order[]
  meta: {
    total_items: number
    total_pages: number
    page: number
    limit: number
  }
  links: {
    next: string | null
    previous: string | null
  }
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

  return api.get(url, token) as Promise<OrdersApiResponse>
}

export async function getOrder(orderId: string) {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  if (!orderId) {
    throw new Error('ID do pedido é obrigatório')
  }

  const baseUrl = endpoint.orders.replace(/\/$/, '')
  const url = `${baseUrl}/${orderId}/`

  return api.get(url, token) as Promise<Order>
}

export async function listPlans() {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  const response = (await api.get(endpoint.plans, token)) as any

  if (Array.isArray(response)) {
    return response as Plan[]
  }

  return (response as PlansApiResponse)?.plans || []
}