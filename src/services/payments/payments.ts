import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSession } from 'next-auth/react'

type PaymentRequest = {
  place_id: string
  plan_id: string
  document_id?: string
  name: string
  document: string
}

export async function processPayment(data: PaymentRequest) {
  const session = await getSession()
  const token = session?.accessToken

  if (!token) {
    throw new Error('Usuário não autenticado')
  }

  return api.post(endpoint.payments.process, data, token)
}

export async function getPaymentStatus(paymentId: string) {
  const session = await getSession()
  const token = session?.accessToken

  return api.get(`${endpoint.payments.status}/${paymentId}/`, token)
}