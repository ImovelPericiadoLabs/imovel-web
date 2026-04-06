import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'
import { processPayment, getPaymentStatus } from './payments'

vi.mock('@/utils/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock('@/utils/session', () => ({
  getSessionDeduplicated: vi.fn(),
}))

describe('Payments Service', () => {
  const mockToken = 'mock-token'
  const mockProcessData = {
    place_id: '123',
    document_id: 'doc-001',
    plan_id: 'plan-xyz',
    name: 'Jeff',
    document: '99999999999',
    whatsapp: '11999999999',
    complement: 'Apto 101',
    registration_number: '1455',
    notary: '1º Cartório de Registro de Imóveis',
    lot_number: '12',
    lot_name: 'Loteamente 4',
    block_number: 'Quadra 1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('document', { cookie: 'next-auth.session-token=mock' })
    vi.mocked(getSessionDeduplicated).mockResolvedValue({ accessToken: mockToken } as never)
  })

  describe('processPayment', () => {
    it('should call api.post with correct endpoint, payload and token', async () => {
      const mockedResponse = { id: 'pay-123', success: true }
      ;(api.post as Mock).mockResolvedValue(mockedResponse)

      const result = await processPayment(mockProcessData)

      expect(api.post).toHaveBeenCalledWith(
        endpoint.payments.process,
        mockProcessData,
        mockToken,
        undefined,
      )
      expect(result).toEqual(mockedResponse)
    })

    it('should work when optional fields like complement are missing', async () => {
      const { complement, ...minimalData } = mockProcessData
      const mockedResponse = { id: 'pay-124' }
      ;(api.post as Mock).mockResolvedValue(mockedResponse)

      const result = await processPayment(minimalData)

      expect(api.post).toHaveBeenCalledWith(
        endpoint.payments.process,
        minimalData,
        mockToken,
        undefined,
      )
      expect(result).toEqual(mockedResponse)
    })

    it('should throw error when api.post fails', async () => {
      const error = new Error('Network Error')
      ;(api.post as Mock).mockRejectedValue(error)

      await expect(processPayment(mockProcessData)).rejects.toThrow('Network Error')
    })
  })

  describe('getPaymentStatus', () => {
    it('should call api.get with correct formatted URL and token', async () => {
      const paymentId = 'pay-789'
      const mockedResponse = { status: 'CONFIRMED' }
      
      const expectedUrl = `/payments/${paymentId}/`

      ;(api.get as Mock).mockResolvedValue(mockedResponse)

      const result = await getPaymentStatus(paymentId)

      expect(api.get).toHaveBeenCalledWith(expectedUrl, mockToken)
      expect(result).toEqual(mockedResponse)
    })

    it('should throw error when api.get fails', async () => {
      const paymentId = 'pay-error'
      ;(api.get as Mock).mockRejectedValue(new Error('Status Fail'))

      await expect(getPaymentStatus(paymentId)).rejects.toThrow('Status Fail')
    })
  })
})