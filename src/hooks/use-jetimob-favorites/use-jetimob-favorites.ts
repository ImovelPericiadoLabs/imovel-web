import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'jetimob:favorite-property-codes'
const EMPTY_FAVORITES: ReadonlySet<string> = new Set()

type Listener = () => void

let cache: Set<string> | null = null
const listeners = new Set<Listener>()

function readStoredFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeStoredFavorites(codes: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(codes)))
  } catch {
    // Quota excedida ou localStorage indisponível (modo privado) — favoritar é um
    // reforço de UX, não uma feature crítica; falha silenciosa é aceitável aqui.
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

/** Snapshot estável: só recomputa do localStorage quando algo realmente mudou. */
function getSnapshot(): ReadonlySet<string> {
  if (cache === null) cache = readStoredFavorites()
  return cache
}

function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_FAVORITES
}

function toggleFavoriteInStore(code: string) {
  if (!code) return
  const next = new Set(getSnapshot())
  if (next.has(code)) next.delete(code)
  else next.add(code)
  cache = next
  writeStoredFavorites(next)
  emitChange()
}

/**
 * Favoritos do catálogo Jetimob, persistidos localmente (sem backend — é uma
 * conveniência de navegação, não um dado de negócio). `useSyncExternalStore` evita
 * o mismatch de SSR/hidratação (localStorage não existe no servidor) sem precisar de
 * setState dentro de um effect.
 */
export function useJetimobFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleFavorite = useCallback((code: string) => toggleFavoriteInStore(code), [])
  const isFavorite = useCallback((code: string) => favorites.has(code), [favorites])

  return { favorites, isFavorite, toggleFavorite }
}
