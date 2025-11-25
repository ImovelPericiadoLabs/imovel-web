import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'
import { processPayment } from './payments'

vi.mock('@/utils/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('processPayment', () => {
  const mockData = {
    place_id: '123',
    document_id: 'doc-001',
    name: 'Jeff',
    document: '99999999999',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call api.post with correct endpoint and payload', async () => {
    const mockedResponse = { success: true }
    ;(api.post as unknown as Mock).mockResolvedValue(mockedResponse)

    const result = await processPayment(mockData)

    expect(api.post).toHaveBeenCalledWith(endpoint.payments.process, mockData)
    expect(result).toEqual(mockedResponse)
  })

  it('should work when document_id is not provided', async () => {
    const dataWithoutDocId = {
      place_id: '123',
      name: 'Jeff',
      document: '99999999999',
    }

    const mockedResponse = { payment: 'ok' }
    ;(api.post as unknown as Mock).mockResolvedValue(mockedResponse)

    const result = await processPayment(dataWithoutDocId)

    expect(api.post).toHaveBeenCalledWith(endpoint.payments.process, dataWithoutDocId)
    expect(result).toEqual(mockedResponse)
  })

  it('should throw error when api.post rejects', async () => {
    const error = new Error('API Error')
    ;(api.post as unknown as Mock).mockRejectedValue(error)

    await expect(processPayment(mockData)).rejects.toThrow('API Error')
  })
})
