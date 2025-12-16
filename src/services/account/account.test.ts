import { describe, it, expect, vi, afterEach } from 'vitest'
import { startAuth, verifyAuth, refreshToken } from './account'
import api from '@/utils/api/client'
import { endpoint } from '@/constants/api'

vi.mock('@/utils/api/client', () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock('@/constants/api', () => ({
  endpoint: {
    start: '/mock-start',
    verify: '/mock-verify',
    refresh: '/mock-refresh',
  },
}))

describe('Account Services', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should call startAuth with correct parameters', async () => {
    const mockResponse = { detail: 'Email sent' }
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const payload = { email: 'test@example.com' }
    const result = await startAuth(payload)

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(endpoint.start, payload)
    expect(result).toEqual(mockResponse)
  })

  it('should call verifyAuth with correct parameters', async () => {
    const mockResponse = { access: 'token', refresh: 'refresh-token' }
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const payload = { email: 'test@example.com', code: '123456' }
    const result = await verifyAuth(payload)

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(endpoint.verify, payload)
    expect(result).toEqual(mockResponse)
  })

  it('should call refreshToken with correct parameters', async () => {
    const mockResponse = { access: 'new-token' }
    vi.mocked(api.post).mockResolvedValue(mockResponse)

    const token = 'old-refresh-token'
    const result = await refreshToken(token)

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(endpoint.refresh, { refresh: token })
    expect(result).toEqual(mockResponse)
  })

  it('should propagate errors from the api client', async () => {
    const error = new Error('Network Error')
    vi.mocked(api.post).mockRejectedValue(error)

    await expect(startAuth({ email: 'fail@example.com' })).rejects.toThrow('Network Error')
  })
})