'use client'

import { useCallback, useId, useMemo, useState } from 'react'
import { ChevronDown, Plus, Trash2, Info } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import type { RecipientRules } from '@/services/outreach'
import { emptyRecipientRules, recipientRulesToApiPayload } from '@/utils/recipientRules'

type RowOverride = { rowKey: string; pairs: { key: string; value: string }[] }

function rulesToEmptyFillList(rules: RecipientRules): { key: string; value: string }[] {
  const o = rules.empty_fill ?? {}
  return Object.entries(o).map(([key, value]) => ({ key, value }))
}

function listToEmptyFill(rows: { key: string; value: string }[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const r of rows) {
    const k = r.key.trim()
    if (!k) continue
    out[k] = r.value
  }
  return out
}

function rulesToByRowList(rules: RecipientRules): RowOverride[] {
  const br = rules.by_row ?? {}
  return Object.entries(br).map(([rowKey, inner]) => ({
    rowKey,
    pairs: Object.entries(inner).map(([key, value]) => ({ key, value })),
  }))
}

function byRowListToRecord(rows: RowOverride[]): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const block of rows) {
    const rk = block.rowKey.trim()
    if (rk === '') continue
    const inner: Record<string, string> = {}
    for (const p of block.pairs) {
      const k = p.key.trim()
      if (!k) continue
      inner[k] = p.value
    }
    if (Object.keys(inner).length > 0) out[rk] = inner
  }
  return out
}

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]',
        className,
      )}
    >
      <div className="flex gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="mt-0.5 shrink-0 rounded-md bg-slate-200/80 p-1.5 text-slate-600">
          <Info className="size-3.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{description}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const inputClass =
  'w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10'

const ghostBtn =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900'

export function RecipientRulesEditor({
  value,
  onChange,
  variableSuggestions = [],
}: {
  value: RecipientRules
  onChange: (next: RecipientRules) => void
  /** Nomes de variáveis do template / colunas CSV para sugestão em datalist */
  variableSuggestions?: string[]
}) {
  const baseId = useId()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const emptyRows = useMemo(() => rulesToEmptyFillList(value), [value])
  const byRows = useMemo(() => rulesToByRowList(value), [value])
  const skipSorted = useMemo(
    () => [...(value.skip_rows ?? [])].sort((a, b) => a - b),
    [value.skip_rows],
  )

  const datalistId = `${baseId}-vars`

  const pushRules = useCallback(
    (patch: Partial<RecipientRules>) => {
      onChange({ ...emptyRecipientRules(), ...value, ...patch })
    },
    [onChange, value],
  )

  const setEmptyFillRows = useCallback(
    (rows: { key: string; value: string }[]) => {
      pushRules({ empty_fill: listToEmptyFill(rows) })
    },
    [pushRules],
  )

  const setByRowBlocks = useCallback(
    (blocks: RowOverride[]) => {
      pushRules({ by_row: byRowListToRecord(blocks) })
    },
    [pushRules],
  )

  const [skipDraft, setSkipDraft] = useState('')

  const addSkipRow = useCallback(() => {
    const n = parseInt(skipDraft.trim(), 10)
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return
    const next = new Set([...(value.skip_rows ?? []), n])
    pushRules({ skip_rows: [...next].sort((a, b) => a - b) })
    setSkipDraft('')
  }, [skipDraft, value.skip_rows, pushRules])

  const removeSkip = useCallback(
    (idx: number) => {
      pushRules({ skip_rows: (value.skip_rows ?? []).filter((x) => x !== idx) })
    },
    [value.skip_rows, pushRules],
  )

  const previewJson = useMemo(() => JSON.stringify(recipientRulesToApiPayload(value), null, 2), [value])

  return (
    <div className="space-y-4">
      <datalist id={datalistId}>
        {['email', 'phone', ...variableSuggestions].map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <SectionCard
        title="Preenchimento global"
        description="Quando uma variável estiver vazia no CSV para todas as linhas, use um valor fixo. Útil para textos legais ou fallbacks."
      >
        <div className="space-y-2">
          {emptyRows.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma regra. Adicione pares variável → valor por defeito.</p>
          ) : (
            <div className="space-y-2">
              {emptyRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <input
                    aria-label={`Variável ${i + 1}`}
                    className={cn(inputClass, 'font-mono text-xs sm:max-w-[12rem]')}
                    list={datalistId}
                    placeholder="variável"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...emptyRows]
                      next[i] = { ...next[i], key: e.target.value }
                      setEmptyFillRows(next)
                    }}
                  />
                  <span className="hidden text-slate-400 sm:inline">→</span>
                  <input
                    aria-label={`Valor por defeito ${i + 1}`}
                    className={cn(inputClass, 'flex-1 min-w-[8rem]')}
                    placeholder="Valor quando vazio"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...emptyRows]
                      next[i] = { ...next[i], value: e.target.value }
                      setEmptyFillRows(next)
                    }}
                  />
                  <button
                    type="button"
                    className={cn(ghostBtn, 'shrink-0 text-red-600 hover:bg-red-50 hover:text-red-800')}
                    onClick={() => setEmptyFillRows(emptyRows.filter((_, j) => j !== i))}
                    aria-label={`Remover regra ${i + 1}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className={cn(ghostBtn, 'mt-1 text-slate-800 hover:bg-slate-100')}
            onClick={() => setEmptyFillRows([...emptyRows, { key: '', value: '' }])}
          >
            <Plus className="size-3.5" />
            Adicionar regra global
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Substituições por linha"
        description="O índice é a linha de dados no ficheiro (0 = primeira linha após o cabeçalho). Permite corrigir valores só para destinos específicos."
      >
        <div className="space-y-3">
          {byRows.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma excepção por linha.</p>
          ) : (
            byRows.map((block, bi) => (
              <div
                key={bi}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 ring-1 ring-slate-900/[0.03]"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <span className="whitespace-nowrap">Índice da linha</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className={cn(inputClass, 'w-24 font-mono text-xs')}
                      value={block.rowKey}
                      onChange={(e) => {
                        const next = [...byRows]
                        next[bi] = { ...next[bi], rowKey: e.target.value }
                        setByRowBlocks(next)
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className={cn(ghostBtn, 'ml-auto text-red-600 hover:bg-red-50')}
                    onClick={() => setByRowBlocks(byRows.filter((_, j) => j !== bi))}
                  >
                    <Trash2 className="size-3.5" />
                    Remover linha
                  </button>
                </div>
                <div className="space-y-2 pl-0 sm:pl-1">
                  {block.pairs.map((p, pi) => (
                    <div key={pi} className="flex flex-wrap items-center gap-2">
                      <input
                        className={cn(inputClass, 'font-mono text-xs sm:max-w-[11rem]')}
                        list={datalistId}
                        placeholder="variável"
                        value={p.key}
                        onChange={(e) => {
                          const next = [...byRows]
                          const pairs = [...next[bi].pairs]
                          pairs[pi] = { ...pairs[pi], key: e.target.value }
                          next[bi] = { ...next[bi], pairs }
                          setByRowBlocks(next)
                        }}
                      />
                      <input
                        className={cn(inputClass, 'min-w-[6rem] flex-1')}
                        placeholder="valor nesta linha"
                        value={p.value}
                        onChange={(e) => {
                          const next = [...byRows]
                          const pairs = [...next[bi].pairs]
                          pairs[pi] = { ...pairs[pi], value: e.target.value }
                          next[bi] = { ...next[bi], pairs }
                          setByRowBlocks(next)
                        }}
                      />
                      <button
                        type="button"
                        className={cn(ghostBtn, 'text-red-600 hover:bg-red-50')}
                        onClick={() => {
                          const next = [...byRows]
                          next[bi] = { ...next[bi], pairs: next[bi].pairs.filter((_, j) => j !== pi) }
                          setByRowBlocks(next)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={cn(ghostBtn, 'text-slate-800 hover:bg-slate-100')}
                    onClick={() => {
                      const next = [...byRows]
                      next[bi] = { ...next[bi], pairs: [...next[bi].pairs, { key: '', value: '' }] }
                      setByRowBlocks(next)
                    }}
                  >
                    <Plus className="size-3.5" />
                    Variável nesta linha
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            type="button"
            className={cn(ghostBtn, 'text-slate-800 hover:bg-slate-100')}
            onClick={() => setByRowBlocks([...byRows, { rowKey: '', pairs: [{ key: '', value: '' }] }])}
          >
            <Plus className="size-3.5" />
            Adicionar linha com excepções
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Linhas a ignorar no envio"
        description="Índices de linha de dados que não devem receber e-mail nem WhatsApp nesta campanha (útil para testes ou exclusões pontuais)."
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[6rem] flex-1">
            <label htmlFor={`${baseId}-skip`} className="mb-1 block text-xs font-medium text-slate-700">
              Índice (0-based)
            </label>
            <input
              id={`${baseId}-skip`}
              type="number"
              min={0}
              step={1}
              className={inputClass}
              placeholder="ex.: 0"
              value={skipDraft}
              onChange={(e) => setSkipDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkipRow()
                }
              }}
            />
          </div>
          <button
            type="button"
            className="h-10 shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            onClick={addSkipRow}
          >
            Adicionar
          </button>
        </div>
        {skipSorted.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {skipSorted.map((idx) => (
              <li
                key={idx}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-xs font-mono font-medium text-slate-800 shadow-sm"
              >
                {idx}
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => removeSkip(idx)}
                  aria-label={`Remover índice ${idx}`}
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Nenhuma linha ignorada.</p>
        )}
      </SectionCard>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-100/80"
          onClick={() => setAdvancedOpen((o) => !o)}
          aria-expanded={advancedOpen}
        >
          <span>Avançado · pré-visualização JSON enviado à API</span>
          <ChevronDown className={cn('size-4 shrink-0 transition', advancedOpen && 'rotate-180')} />
        </button>
        {advancedOpen ? (
          <div className="border-t border-slate-200 px-4 py-3">
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
              {previewJson}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}
