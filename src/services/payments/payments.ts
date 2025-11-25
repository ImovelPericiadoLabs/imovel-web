import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

type PaymentRequest = {
  place_id: string
  document_id?: string
  name: string
  document: string
}

export async function processPayment(data: PaymentRequest) {
  return api.post(endpoint.payments.process, data)
}
