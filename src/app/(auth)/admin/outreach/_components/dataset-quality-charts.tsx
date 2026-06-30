'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/utils/tailwind'
import type { DatasetQuality } from '@/services/outreach/outreach'

function PctBar({ pct, className }: { pct: number; className?: string }) {
  const w = Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0))
  return (
    <div
      className={cn('h-1.5 w-full min-w-[3rem] overflow-hidden rounded-full bg-slate-100', className)}
      title={`${w}%`}
      role="img"
      aria-label={`${Math.round(w)} por cento`}
    >
      <div
        className="h-full rounded-full bg-slate-500/90 transition-[width] duration-200 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

function PctBarWarn({ pct }: { pct: number }) {
  const w = Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0))
  return (
    <div className="h-1.5 w-full min-w-[3rem] overflow-hidden rounded-full bg-amber-100" title={`${w}%`}>
      <div
        className="h-full rounded-full bg-amber-500/90 transition-[width] duration-200 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

type VarRow = { variable: string; empty_rows: number; empty_pct: number; mapped_csv_column?: string | null }

const TemplateVarRows = memo(function TemplateVarRows({ rows, channel }: { rows: VarRow[]; channel: string }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.empty_pct ?? 0) - (a.empty_pct ?? 0)).slice(0, 48),
    [rows],
  )
  if (!sorted.length) return null
  return (
    <ul className="space-y-2.5" aria-label={`Variáveis ${channel} — percentagem vazia`}>
      {sorted.map((w) => (
        <li key={w.variable} className="rounded-lg bg-white/80 px-2 py-1.5 ring-1 ring-slate-100">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="truncate font-mono font-semibold text-slate-900" title={w.variable}>
              {w.variable}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">
              {w.empty_rows} vazias · {w.empty_pct}%
            </span>
          </div>
          <div className="mt-1.5">
            <PctBarWarn pct={w.empty_pct} />
          </div>
          {w.mapped_csv_column ? (
            <p className="mt-1 truncate text-[10px] text-slate-500">Coluna: {w.mapped_csv_column}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
})

const ColumnPctRows = memo(function ColumnPctRows({
  entries,
  maxRows = 40,
}: {
  entries: [string, { empty_pct: number; empty: number; non_empty: number }][]
  maxRows?: number
}) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b[1].empty_pct ?? 0) - (a[1].empty_pct ?? 0)).slice(0, maxRows),
    [entries, maxRows],
  )
  if (!sorted.length) return null
  return (
    <ul className="space-y-2" aria-label="Colunas CSV — percentagem vazia">
      {sorted.map(([name, st]) => (
        <li key={name} className="rounded-md bg-slate-50/90 px-2 py-1.5 ring-1 ring-slate-100">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="truncate font-mono font-medium text-slate-800" title={name}>
              {name}
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">{st.empty_pct}%</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <PctBar pct={st.empty_pct} className="min-w-0 flex-1" />
            <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
              {st.empty}/{st.empty + st.non_empty}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
})

export const DatasetQualityColumnBars = memo(function DatasetQualityColumnBars({ dq }: { dq: DatasetQuality }) {
  const entries = useMemo(() => Object.entries(dq.columns ?? {}), [dq.columns])
  if (!entries.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Colunas CSV · vazias</p>
      <ColumnPctRows entries={entries} />
    </div>
  )
})

export const DatasetQualityTemplateBars = memo(function DatasetQualityTemplateBars({ dq }: { dq: DatasetQuality }) {
  const wa = dq.template_variables?.whatsapp ?? []
  const em = dq.template_variables?.email ?? []
  if (!wa.length && !em.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
      <p className="mb-3 font-bold text-slate-900">Variáveis do template (vazias após mapeamento + regras)</p>
      {dq.template_variables?.whatsapp_error ? (
        <p className="mb-2 text-[11px] text-amber-800">WhatsApp: {dq.template_variables.whatsapp_error}</p>
      ) : null}
      {dq.template_variables?.email_error ? (
        <p className="mb-2 text-[11px] text-amber-800">E-mail: {dq.template_variables.email_error}</p>
      ) : null}
      {wa.length ? (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">WhatsApp</p>
          <TemplateVarRows rows={wa} channel="WhatsApp" />
        </div>
      ) : null}
      {em.length ? (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">E-mail</p>
          <TemplateVarRows rows={em} channel="E-mail" />
        </div>
      ) : null}
    </div>
  )
})
