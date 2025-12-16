import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withAuth } from 'next-auth/middleware'

vi.mock('next-auth/middleware', () => ({
  withAuth: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(),
  },
}))

import './middleware'

describe('Middleware Auth Logic', () => {
  let authorizedCallback: (params: { req: any; token: any }) => boolean

  beforeEach(() => {
    const mockedWithAuth = vi.mocked(withAuth)

    const args = mockedWithAuth.mock.calls[0] as any
    const config = args[1]
    
    authorizedCallback = config.callbacks.authorized
  })

  const createReq = (pathname: string) => ({
    nextUrl: { pathname },
  })

  it('should allow access to public paths without a token', () => {
    const publicPaths = ['/login', '/cadastro', '/esqueci-senha']

    publicPaths.forEach((path) => {
      const result = authorizedCallback({
        req: createReq(path),
        token: null,
      })
      expect(result).toBe(true)
    })
  })

  it('should deny access to protected paths without a token', () => {
    const protectedPaths = ['/consultar-imovel', '/dashboard', '/profile']

    protectedPaths.forEach((path) => {
      const result = authorizedCallback({
        req: createReq(path),
        token: null,
      })
      expect(result).toBe(false)
    })
  })

  it('should allow access to protected paths with a valid token', () => {
    const protectedPaths = ['/consultar-imovel', '/dashboard']
    const mockToken = { name: 'User', email: 'user@example.com' }

    protectedPaths.forEach((path) => {
      const result = authorizedCallback({
        req: createReq(path),
        token: mockToken,
      })
      expect(result).toBe(true)
    })
  })

  it('should allow access to public paths even with a token (existing session)', () => {
    const result = authorizedCallback({
      req: createReq('/login'),
      token: { name: 'User' },
    })
    expect(result).toBe(true)
  })
})