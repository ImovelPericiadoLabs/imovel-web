import { describe, it, expect, vi, afterEach } from 'vitest'
import { authOptions } from './route'
import { verifyAuth } from '@/services/account'

vi.mock('@/services/account', () => ({
  verifyAuth: vi.fn(),
}))

vi.mock('next-auth/providers/credentials', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth/providers/credentials')>()
  return {
    ...actual,
    default: (config: any) => ({
      ...config,
      type: 'credentials',
      id: 'credentials',
      name: 'Credentials',
    }),
  }
})

describe('NextAuth Configuration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Credentials Provider authorize', () => {
    const credentialsProvider = authOptions.providers.find(
      (p: any) => p.id === 'credentials'
    ) as any

    it('should throw error if credentials are missing', async () => {
      await expect(credentialsProvider.authorize({})).rejects.toThrow(
        'Email e código são obrigatórios.'
      )
    })

    it('should return user object on successful verification', async () => {
      const mockResponse = { access: 'access-token', refresh: 'refresh-token' }
      vi.mocked(verifyAuth).mockResolvedValue(mockResponse)

      const credentials = { email: 'test@example.com', code: '123456' }
      const result = await credentialsProvider.authorize(credentials)

      expect(verifyAuth).toHaveBeenCalledWith(credentials)
      expect(result).toEqual({
        id: credentials.email,
        email: credentials.email,
        name: credentials.email,
        accessToken: mockResponse.access,
        refreshToken: mockResponse.refresh,
      })
    })

    it('should throw error if verification response is invalid', async () => {
      vi.mocked(verifyAuth).mockResolvedValue({} as any)

      const credentials = { email: 'test@example.com', code: '123456' }

      await expect(credentialsProvider.authorize(credentials)).rejects.toThrow(
        'Código inválido ou resposta inesperada.'
      )
    })

    it('should throw specific API error message if verifyAuth fails', async () => {
      const apiError = {
        response: {
          data: {
            detail: 'Código expirado',
          },
        },
      }
      vi.mocked(verifyAuth).mockRejectedValue(apiError)

      const credentials = { email: 'test@example.com', code: '123456' }

      await expect(credentialsProvider.authorize(credentials)).rejects.toThrow(
        'Código expirado'
      )
    })

    it('should throw default error message if API error structure is unknown', async () => {
      vi.mocked(verifyAuth).mockRejectedValue(new Error('Network Error'))

      const credentials = { email: 'test@example.com', code: '123456' }

      await expect(credentialsProvider.authorize(credentials)).rejects.toThrow(
        'Network Error'
      )
    })
  })

  describe('Callbacks', () => {
    it('should merge user data into token in jwt callback', async () => {
      const token = {}
      const user = {
        id: 'user-id',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      const result = await authOptions.callbacks?.jwt?.({ token, user } as any)

      expect(result).toEqual({
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        id: user.id,
      })
    })

    it('should return existing token if no user is present in jwt callback', async () => {
      const token = { existing: 'data' }
      const result = await authOptions.callbacks?.jwt?.({ token, user: undefined } as any)

      expect(result).toEqual(token)
    })

    it('should merge token data into session in session callback', async () => {
      const session = { user: { name: 'Test' } }
      const token = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        id: 'user-id',
      }

      const result = await authOptions.callbacks?.session?.({ session, token } as any)

      expect(result).toEqual({
        user: { name: 'Test', id: 'user-id' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })
  })
})