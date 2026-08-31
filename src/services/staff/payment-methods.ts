import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

export type StaffPaymentMethod = {
  code: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD'
  label: string
  enabled: boolean
  auto_disabled: boolean
  auto_disabled_reason: string
  auto_disabled_at: string | null
  available: boolean
  last_error: string
  last_error_at: string | null
}

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const session = await getSessionDeduplicated()
  const token = session?.accessToken
  if (!token) throw new Error('Sessão não encontrada. Entre novamente.')
  return fn(token)
}

export async function listStaffPaymentMethods(): Promise<StaffPaymentMethod[]> {
  const data = (await withToken((token) =>
    api.get(endpoint.staff.paymentMethods, token),
  )) as { methods: StaffPaymentMethod[] }
  return data.methods
}

export async function setStaffPaymentMethodEnabled(
  code: StaffPaymentMethod['code'],
  enabled: boolean,
): Promise<StaffPaymentMethod[]> {
  const data = (await withToken((token) =>
    api.patch(endpoint.staff.paymentMethods, { code, enabled }, token),
  )) as { methods: StaffPaymentMethod[] }
  return data.methods
}
