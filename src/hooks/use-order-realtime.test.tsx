/**
 * Regressão das rajadas de fallback HTTP.
 *
 * O bug: o WS conectava, o servidor derrubava ~5s depois (TimeoutError do Redis no
 * channel layer) e o `onopen` zerava o contador de tentativas. Resultado: backoff
 * preso em 1s, reconexão eterna a cada ~5s e, a cada queda, `connected: false`
 * reabilitava o polling — daí as rajadas de GET /v1/orders/<id>/ e /events/.
 */
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useOrderRealtime } from './use-order-realtime'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { accessToken: 'jwt-token' } }),
}))

/** Sockets criados no teste, para simular open/close vindos do servidor. */
const sockets: MockSocket[] = []

class MockSocket {
  static instances = sockets
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  close = vi.fn()

  constructor(public url: string) {
    sockets.push(this)
  }
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return React.createElement(QueryClientProvider, { client }, children)
}

describe('useOrderRealtime', () => {
  beforeEach(() => {
    sockets.length = 0
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', MockSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('não liga o fallback na primeira queda do WebSocket', () => {
    const { result } = renderHook(() => useOrderRealtime('order-1'), { wrapper })

    act(() => {
      sockets[0].onopen?.()
      sockets[0].onclose?.()
    })

    expect(result.current.connected).toBe(false)
    // Este é o ponto: socket caiu, mas o polling continua DESLIGADO.
    expect(result.current.fallbackActive).toBe(false)
  })

  it('liga o fallback só após 3 falhas consecutivas', () => {
    const { result } = renderHook(() => useOrderRealtime('order-1'), { wrapper })

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        sockets[sockets.length - 1].onopen?.()
        sockets[sockets.length - 1].onclose?.()
      })
      // Avança o backoff (com jitter, o teto do passo i é 1s * 2^i).
      act(() => {
        vi.advanceTimersByTime(60_000)
      })
    }

    expect(result.current.fallbackActive).toBe(true)
  })

  it('o backoff cresce mesmo quando o handshake sempre dá certo antes de cair', () => {
    renderHook(() => useOrderRealtime('order-1'), { wrapper })

    const openThenClose = () => {
      const ws = sockets[sockets.length - 1]
      act(() => {
        ws.onopen?.()
        ws.onclose?.()
      })
    }

    openThenClose()
    // Passo 1: no máximo 1s. Antes do fix o `onopen` zerava o contador e TODA
    // tentativa ficava presa nesse patamar — a reconexão a cada ~5s do incidente.
    act(() => {
      vi.advanceTimersByTime(1_100)
    })
    expect(sockets.length).toBe(2)

    openThenClose()
    // Passo 2: teto de 2s. Se o contador tivesse sido zerado, já teria reconectado em 1s.
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(sockets.length).toBe(2)
    act(() => {
      vi.advanceTimersByTime(1_200)
    })
    expect(sockets.length).toBe(3)
  })

  it('desliga o fallback quando a conexão se prova estável', () => {
    const { result } = renderHook(() => useOrderRealtime('order-1'), { wrapper })

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        sockets[sockets.length - 1].onopen?.()
        sockets[sockets.length - 1].onclose?.()
      })
      act(() => {
        vi.advanceTimersByTime(60_000)
      })
    }
    expect(result.current.fallbackActive).toBe(true)

    // Reconecta e AGUENTA: passados os 20s de HEALTHY_AFTER_MS o polling desliga.
    act(() => {
      sockets[sockets.length - 1].onopen?.()
    })
    act(() => {
      vi.advanceTimersByTime(21_000)
    })

    expect(result.current.fallbackActive).toBe(false)
    expect(result.current.connected).toBe(true)
  })

  it('heartbeat mantém o canal vivo sem invalidar cache', () => {
    const { result } = renderHook(() => useOrderRealtime('order-1'), { wrapper })

    act(() => {
      sockets[0].onopen?.()
      sockets[0].onmessage?.({
        data: JSON.stringify({ type: 'heartbeat', at: '2026-08-27T00:00:00Z' }),
      })
    })

    expect(result.current.connected).toBe(true)
    // heartbeat não carrega estado do pedido — não pode virar lastMessageAt/status.
    expect(result.current.status).toBeUndefined()
    expect(result.current.lastMessageAt).toBeUndefined()
  })
})
