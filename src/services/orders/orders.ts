import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSession, signOut } from 'next-auth/react'

async function handleUnauthorized() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('auth:unauthorized'))
  await signOut({ redirect: false })
}

export type SemaphoreStatus = 'green' | 'yellow' | 'red' | 'blue' | 'gray'
export type AnalisisStatus = {
  value: SemaphoreStatus
  label: string
}

export type GenericStatus = {
  value: string
  label: string
}

export type OrderAnalysisResult = {
  id: string
  title: string
  status: AnalisisStatus
  reason: string
}

export type Order = {
  id: string
  code: number
  status: GenericStatus
  amount: string
  documents: Document[]
  place_id: string
  formatted_address: string | null
  complement: string | null
  created: string
  modified: string
  
  owners?: OwnersDetails[]
  semaphore?: SemaphoreStatus
  analysis?: OrderAnalysisResult[]
}

export type OwnersDetails = {
    id: string
    name: string,
    textId: string,
    undivided_interest: number
}

export type AnalysisStatusDetail = {
  value: string
  label: string
}

export type Document = {
  id: string
  file_path: string
  file_hash: string | null
  original_name: string
  extension: string
}

export type AnalysisDocument = {
  id: string
  file_path: string
  file_hash: string | null
  original_name: string
  extension: string
}

export type OrderAnalysisDetail = {
  id: string
  title: string
  status: AnalysisStatusDetail
  reason: string
  documents: AnalysisDocument | null
}

export type OrdersApiResponse = {
  meta: {
    total_items: number
    total_pages: number
    page: number
    limit: number
    has_next: boolean
    has_previous: boolean
  }
  links: {
    next: string | null
    previous: string | null
  }
  items: Order[]
}

async function guard<T>(callback: (token: string) => Promise<T>): Promise<T> {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    await handleUnauthorized()
    throw new Error('Sessão inválida ou expirada.')
  }

  try {
    return await callback(token)
  } catch (error: any) {
    if (error?.status === 401) {
      await handleUnauthorized()
    }
    throw error
  }
}

export type ListOrdersRequest = {
  limit?: number
  p?: number
  status?: string
}

export async function listOrders(params: ListOrdersRequest = {}) {
  return guard(async (token) => {
    const { limit = 20, p = 1, status } = params

    const queryParams = new URLSearchParams({
      limit: String(limit),
      p: String(p),
    })

    if (status) {
      queryParams.append('status', status)
    }

    const url = `${endpoint.orders}?${queryParams.toString()}`

    return api.get(url, token) as Promise<OrdersApiResponse>
  })
}

export async function getOrder(orderId: string) {
  return guard(async (token) => {
    const baseUrl = endpoint.orders.replace(/\/$/, '')
    const url = `${baseUrl}/${orderId}/`

    return api.get(url, token) as Promise<Order>
  })
}

export async function getOrderAnalysisDetail(
  orderId: string,
  analysisId: string,
) {
  return guard(async (token) => {
    const url = `${endpoint.orders}${orderId}/analysis/${analysisId}/`
    return api.get(url, token) as Promise<OrderAnalysisDetail>
  })
}

export async function listPlans() {
  return guard(async (token) => {
    const response = (await api.get(endpoint.plans, token)) as any
    return Array.isArray(response) ? response : response?.plans || []
  })
}
