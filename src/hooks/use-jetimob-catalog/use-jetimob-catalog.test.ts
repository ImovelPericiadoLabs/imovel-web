import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useJetimobCatalog } from './use-jetimob-catalog'

function mockPage(items: unknown[], { page, pageLimit, total }: { page: number; pageLimit: number; total: number }) {
  return {
    ok: true,
    json: async () => ({
      items,
      total_items: total,
      pagination: { page, page_limit: pageLimit, total_items: total },
    }),
  }
}

describe('useJetimobCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não busca nada quando desabilitado', () => {
    renderHook(() => useJetimobCatalog(false))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('carrega uma única página curta e marca como completo', async () => {
    const items = [{ code: 'A1' }, { code: 'A2' }]
    vi.mocked(fetch).mockResolvedValueOnce(
      mockPage(items, { page: 1, pageLimit: 200, total: 2 }) as Response,
    )

    const { result } = renderHook(() => useJetimobCatalog(true))

    await waitFor(() => expect(result.current.complete).toBe(true))

    expect(result.current.items).toEqual(items)
    expect(result.current.totalItems).toBe(2)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('pagina até esgotar o catálogo, acumulando itens de todas as páginas', async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => ({ code: `P1-${i}` }))
    const page2 = Array.from({ length: 1 }, (_, i) => ({ code: `P2-${i}` }))

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockPage(page1, { page: 1, pageLimit: 2, total: 3 }) as Response)
      .mockResolvedValueOnce(mockPage(page2, { page: 2, pageLimit: 2, total: 3 }) as Response)

    const { result } = renderHook(() => useJetimobCatalog(true))

    await waitFor(() => expect(result.current.complete).toBe(true))

    expect(result.current.items).toHaveLength(3)
    expect(result.current.items.map((i) => i.code)).toEqual(['P1-0', 'P1-1', 'P2-0'])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('reporta erro sem travar em loop quando a API falha', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'boom' } }),
    } as Response)

    const { result } = renderHook(() => useJetimobCatalog(true))

    await waitFor(() => expect(result.current.complete).toBe(true))

    expect(result.current.error).toBeTruthy()
    expect(result.current.loading).toBe(false)
  })

  it('reload() reinicia a busca do zero', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockPage([{ code: 'A1' }], { page: 1, pageLimit: 200, total: 1 }) as Response,
    )

    const { result } = renderHook(() => useJetimobCatalog(true))
    await waitFor(() => expect(result.current.complete).toBe(true))

    const callsAfterFirstLoad = vi.mocked(fetch).mock.calls.length

    act(() => {
      result.current.reload()
    })

    await waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsAfterFirstLoad),
    )
  })
})
