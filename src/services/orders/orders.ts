import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSession, signOut } from 'next-auth/react'

export type SemaphoreStatus = 'green' | 'yellow' | 'red'
export type AnalysisStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PaymentStatus = 'CREATED' | 'PROCESSING' | 'PAID' | 'FAILED'

// Novo tipo para refletir a estrutura do sinal
export type Signal = {
  label: SemaphoreStatus
  value: string
}

export type OrderAnalysisResult = {
  id: string
  title: string
  signal: Signal // Alterado de SemaphoreStatus para Signal
  reason: string
}

export type GenericStatus = {
  value: string; // Ex: "PENDING", "APPROVED"
  label: string; // Ex: "Pendente", "Aprovado"
}

export type Order = {
  id: string 
  code: number
  status: GenericStatus;    // Mudou de analysis_status/payment_status para 'status' objeto
  signal?: Signal;          // Agora opcional, pois pode não vir se estiver pendente
  amount: string
  document: string | null
  place_id: string
  formatted_address: string | null
  complement: string | null
  created: string 
  modified: string 
  analysis?: OrderAnalysisResult[] // Opcional
}

export type ListOrdersRequest = {
  limit?: number
  p?: number
  status?: PaymentStatus
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
  const handleAuthError = async () => {
    if (typeof window !== 'undefined') {
      await signOut({ redirect: false })
      window.location.reload()
    }
  }

  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    await handleAuthError()
    throw new Error('Sessão inválida ou expirada.')
  }

  try {
    return await callback(token)
  } catch (error: any) {
    if (error?.status === 401) {
      await handleAuthError()
    }
    throw error
  }
}

export async function listOrders(params: ListOrdersRequest = {}) {
  return guard(async (token) => {
    const { limit = 20, p = 1, status } = params
    const queryParams = new URLSearchParams()

    queryParams.append('limit', String(limit))
    queryParams.append('p', String(p))

    if (status) {
      queryParams.append('status', status)
    }

    const url = `${endpoint.orders}?${queryParams.toString()}`

    return api.get(url, token) as Promise<OrdersApiResponse>
  })
}

export async function getOrder(orderId: string) {
  return guard(async (token) => {
    if (!orderId) {
      throw new Error('ID do consulta é obrigatório')
    }

    const baseUrl = endpoint.orders.replace(/\/$/, '')
    const url = `${baseUrl}/${orderId}/`

    return api.get(url, token) as Promise<Order>
  })
}

export async function listPlans() {
  return guard(async (token) => {
    const response = (await api.get(endpoint.plans, token)) as any
    if (Array.isArray(response)) return response as any[]
    return response?.plans || []
  })
}