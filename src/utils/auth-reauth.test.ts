import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  requestReauth,
  resetReauthGuard,
  AUTH_UNAUTHORIZED_EVENT,
  AUTH_REAUTHENTICATED_EVENT,
} from './auth-reauth'
import { touchAuthClientFlag, clearAuthClientFlag } from './auth-client-flag'

function countReauthEvents(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.filter(
    ([event]: [Event]) => event.type === AUTH_UNAUTHORIZED_EVENT,
  ).length
}

describe('requestReauth', () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetReauthGuard()
    clearAuthClientFlag()
    dispatchSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    dispatchSpy.mockRestore()
  })

  it('não abre o modal para usuário anônimo (sem flag de sessão)', () => {
    requestReauth()
    expect(countReauthEvents(dispatchSpy)).toBe(0)
  })

  it('dispara o evento uma única vez enquanto a re-auth está pendente', () => {
    touchAuthClientFlag()
    requestReauth()
    requestReauth()
    requestReauth()
    expect(countReauthEvents(dispatchSpy)).toBe(1)
  })

  it('volta a permitir o modal após auth:reauthenticated', () => {
    touchAuthClientFlag()
    requestReauth()
    expect(countReauthEvents(dispatchSpy)).toBe(1)

    window.dispatchEvent(new Event(AUTH_REAUTHENTICATED_EVENT))

    requestReauth()
    expect(countReauthEvents(dispatchSpy)).toBe(2)
  })
})
