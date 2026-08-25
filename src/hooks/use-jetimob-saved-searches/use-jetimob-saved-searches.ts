import { useCallback, useSyncExternalStore } from 'react'

import { FILTER_ALL, type JetimobPropertyFilters } from '@/lib/jetimob-property-filters'

const STORAGE_KEY = 'jetimob:saved-searches'
const MAX_SAVED_SEARCHES = 8
const EMPTY_SEARCHES: readonly JetimobSavedSearch[] = []

export type JetimobSavedSearch = {
  id: string
  label: string
  filters: JetimobPropertyFilters
  createdAt: string
}

type Listener = () => void

let cache: JetimobSavedSearch[] | null = null
const listeners = new Set<Listener>()

function readStoredSearches(): JetimobSavedSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as JetimobSavedSearch[]) : []
  } catch {
    return []
  }
}

function writeStoredSearches(searches: JetimobSavedSearch[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // Busca salva é conveniência local — falha silenciosa (quota/modo privado) é aceitável.
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function getSnapshot(): readonly JetimobSavedSearch[] {
  if (cache === null) cache = readStoredSearches()
  return cache
}

function getServerSnapshot(): readonly JetimobSavedSearch[] {
  return EMPTY_SEARCHES
}

/** Resumo curto e legível dos critérios ativos, para rotular a busca salva sem pedir nome. */
export function summarizeJetimobFilters(filters: JetimobPropertyFilters): string {
  const parts: string[] = []
  if (filters.city !== FILTER_ALL) parts.push(filters.city)
  if (filters.neighborhood !== FILTER_ALL) parts.push(filters.neighborhood)
  if (filters.propertyType !== FILTER_ALL) parts.push(filters.propertyType)
  if (filters.priceMin || filters.priceMax) {
    parts.push(`R$ ${filters.priceMin || '0'}–${filters.priceMax || '∞'}`)
  }
  if (filters.search.trim()) parts.push(`"${filters.search.trim()}"`)
  return parts.length > 0 ? parts.join(' · ') : 'Todos os imóveis'
}

function saveSearchInStore(filters: JetimobPropertyFilters): JetimobSavedSearch {
  const entry: JetimobSavedSearch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: summarizeJetimobFilters(filters),
    filters,
    createdAt: new Date().toISOString(),
  }
  const next = [entry, ...getSnapshot()].slice(0, MAX_SAVED_SEARCHES)
  cache = next
  writeStoredSearches(next)
  emitChange()
  return entry
}

function removeSearchFromStore(id: string) {
  const next = getSnapshot().filter((s) => s.id !== id)
  cache = next
  writeStoredSearches(next)
  emitChange()
}

/**
 * Buscas salvas do catálogo Jetimob, persistidas localmente. Mesmo padrão de
 * `useJetimobFavorites` (`useSyncExternalStore`, sem setState em effect).
 */
export function useJetimobSavedSearches() {
  const searches = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const saveSearch = useCallback((filters: JetimobPropertyFilters) => saveSearchInStore(filters), [])
  const removeSearch = useCallback((id: string) => removeSearchFromStore(id), [])

  return { searches, saveSearch, removeSearch }
}
