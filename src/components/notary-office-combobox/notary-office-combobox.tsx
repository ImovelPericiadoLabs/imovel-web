'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Building } from 'lucide-react'
import type { NotariesCompactFile, NotaryOfficeRow } from '@/types/notaries-compact'

const DATA_URL = '/notaries-compact.json'
const MAX_RESULTS = 40

function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function rowHaystack(row: NotaryOfficeRow): string {
  const [uf, city, num, label] = row
  return normalizeSearch(`${uf} ${city} ${num} ${label}`)
}

/**
 * Texto enviado ao backend / exibido no resumo.
 * O `label` costuma ser o nome ONR já com o grau (ex.: "12º OFICIAL...").
 * O terceiro campo da linha compacta nem sempre é esse mesmo grau (ex.: São Paulo),
 * então não prefixar `numº` quando o label já abre com ordinal — evita "4º 12º ...".
 */
export function formatNotaryForOrder(row: NotaryOfficeRow): string {
  const [, , num, label] = row
  const t = String(label ?? '').trim()
  if (!t) return ''

  if (/^\d+[°º]\s*/i.test(t)) {
    return t
  }

  const n = typeof num === 'number' && Number.isFinite(num) ? num : Number(num)
  if (!n || n < 1 || Number.isNaN(n)) {
    return t
  }
  return `${n}º ${t}`.replace(/\s+/g, ' ').trim()
}

type NotaryOfficeGeo = {
  uf: string
  city: string
}

type NotaryOfficeComboboxProps = {
  value: string
  onChange: (canonical: string) => void
  onGeoChange?: (geo: NotaryOfficeGeo) => void
  error?: string
  inputId?: string
}

export function NotaryOfficeCombobox({
  value,
  onChange,
  onGeoChange,
  error,
  inputId = 'notaryName',
}: NotaryOfficeComboboxProps) {
  const [rows, setRows] = useState<NotaryOfficeRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(DATA_URL, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as NotariesCompactFile
        if (!Array.isArray(data.o)) throw new Error('Formato inválido')
        if (!cancelled) setRows(data.o)
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível carregar a lista de cartórios. Digite o nome manualmente.')
          setRows([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const nq = normalizeSearch(query)
  const filtered = useMemo(() => {
    if (!rows || !nq || nq.length < 2) return []
    const out: NotaryOfficeRow[] = []
    for (const row of rows) {
      if (rowHaystack(row).includes(nq)) {
        out.push(row)
        if (out.length >= MAX_RESULTS) break
      }
    }
    return out
  }, [rows, nq])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = useCallback(
    (row: NotaryOfficeRow) => {
      const [uf, city] = row
      const text = formatNotaryForOrder(row)
      setQuery(text)
      onChange(text)
      onGeoChange?.({ uf: String(uf || '').trim().toUpperCase(), city: String(city || '').trim() })
      setOpen(false)
    },
    [onChange, onGeoChange],
  )

  const showList = open && filtered.length > 0 && nq.length >= 2

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-700">Cartório de Registro de Imóveis</span>
      <p className="text-[11px] text-gray-500 leading-snug -mt-0.5">
        Pesquise por cidade, UF ou trecho do nome — escolha na lista para formatar o número corretamente no pedido.
      </p>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary pointer-events-none z-10">
          <Building className="size-5" />
        </div>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          placeholder="Ex.: digite Florianópolis, SP ou Oficial…"
          maxLength={150}
          value={query}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            onChange(v)
            onGeoChange?.({ uf: '', city: '' })
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? `${inputId}-listbox` : undefined}
        />
        {showList ? (
          <ul
            ref={listRef}
            id={`${inputId}-listbox`}
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1"
          >
            {filtered.map((row, i) => {
              const [uf, city, num, label] = row
              const key = `${uf}-${city}-${num}-${i}`
              return (
                <li key={key} role="option">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-primary/5 active:bg-primary/10 border-b border-gray-50 last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(row)}
                  >
                    <span className="font-semibold text-gray-900 block leading-snug">
                      {num}º — {city} / {uf}
                    </span>
                    <span className="text-gray-600 leading-snug block mt-0.5">{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
      {loadError ? <span className="text-xs text-amber-700">{loadError}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
