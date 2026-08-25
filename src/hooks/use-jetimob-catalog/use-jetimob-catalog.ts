import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchJetimobProperties, type JetimobPropertyRow } from '@/services/jetimob'

/**
 * Páginas maiores reduzem round-trips ao carregar o catálogo inteiro para filtragem
 * client-side + virtualização (spec 06 — Jetimob). Alinhado ao teto aceito pelo backend
 * (`apps/jetimob/client.py: list_properties`, cap de 200).
 */
const PAGE_LIMIT = 200

/** Trava de segurança: 500 páginas × 200 = 100k imóveis. Nenhuma carteira real chega
 * perto disso; existe só para nunca entrar em loop infinito por payload inesperado. */
const MAX_PAGES = 500

export type UseJetimobCatalogState = {
  items: JetimobPropertyRow[]
  /** true enquanto ainda há páginas sendo buscadas em segundo plano. */
  loading: boolean
  /** true quando o catálogo completo já foi carregado (ou a busca falhou/foi abortada). */
  complete: boolean
  totalItems: number | null
  loadedCount: number
  error: string | null
  reload: () => void
}

/**
 * Carrega progressivamente TODO o catálogo Jetimob (não paginado) para permitir filtros
 * avançados e virtualização precisos sobre o conjunto completo, em vez de uma página por
 * vez. Os itens já carregados ficam disponíveis (e filtráveis) antes da carga terminar —
 * a UI deve tratar `loading`/`complete` para comunicar progresso, não bloquear a tela.
 */
export function useJetimobCatalog(enabled: boolean): UseJetimobCatalogState {
  const [items, setItems] = useState<JetimobPropertyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [totalItems, setTotalItems] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setItems([])
    setError(null)
    setComplete(false)
    setTotalItems(null)
    setLoading(true)

    try {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const data = await fetchJetimobProperties({
          page,
          pageLimit: PAGE_LIMIT,
          signal: controller.signal,
        })

        // `abort()` só rejeita fetch EM VOO: se a resposta já tinha resolvido, uma carga
        // superseded continuaria concatenando itens duplicados no estado. Checar o sinal
        // depois de cada await é o que garante "só a carga mais recente escreve".
        if (controller.signal.aborted) return

        const pageItems = data.items ?? []
        setItems((prev) => [...prev, ...pageItems])

        const total = data.total_items ?? data.pagination?.total_items
        if (typeof total === 'number') setTotalItems(total)

        // DIVERGÊNCIA CONHECIDA (mantida de propósito — decisão do time).
        // Pela doc da API legada (https://docs-apps.jetimob.io/legacy), `page_limit` na
        // resposta é o TOTAL DE PÁGINAS, não o tamanho da página (exemplo oficial:
        // total_items 8 com page_limit 1). Aqui ele é lido como tamanho, então o laço
        // pede algumas páginas a mais e só para quando vem uma vazia — funciona, mas
        // desperdiça round-trips. Corrigir junto com os nomes de parâmetro do request
        // (`busca`/`per_page`), que também divergem.
        const limit = Number(data.pagination?.page_limit) || PAGE_LIMIT
        const reachedTotal = typeof total === 'number' && page * limit >= total
        const shortPage = pageItems.length < limit

        if (pageItems.length === 0 || shortPage || reachedTotal) break
      }
      if (!controller.signal.aborted) setComplete(true)
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('Não foi possível carregar o catálogo completo da Jetimob.')
      setComplete(true)
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    void load()
    return () => abortRef.current?.abort()
  }, [enabled, load])

  return { items, loading, complete, totalItems, loadedCount: items.length, error, reload: load }
}
