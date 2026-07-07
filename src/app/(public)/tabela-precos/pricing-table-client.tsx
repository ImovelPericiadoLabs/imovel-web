'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Search, X } from 'lucide-react'

import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'

export type PricingRow = {
  uf: string
  uf_name: string
  registry_price: number
  address_surcharge: number
  address_price: number
}

export type PricingTable = {
  new_pricing: boolean
  base_price: number
  certificates_upsell: number
  updated_at: string | null
  rows: PricingRow[]
}

function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function PricingTableClient({ table }: { table: PricingTable }) {
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = normalize(query)
    if (!q) return table.rows
    return table.rows.filter((row) => {
      const name = normalize(row.uf_name)
      const uf = row.uf.toLowerCase()
      return name.includes(q) || uf.startsWith(q) || q.split(/\s+/).every((part) => name.includes(part))
    })
  }, [table.rows, query])

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(11,27,58,0.06)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-[#0b1b3a]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-700">
              Valores por estado
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {table.updated_at && (
              <span className="hidden text-xs text-slate-500 md:inline">
                Atualizado em {new Date(table.updated_at).toLocaleDateString('pt-BR')}
              </span>
            )}
            <label className="relative flex w-full items-center sm:w-64">
              <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar estado ou UF (ex.: SP, Bahia…)"
                aria-label="Buscar estado ou UF"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b1b3a]/40 focus:ring-2 focus:ring-[#0b1b3a]/10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            Nenhum estado encontrado para «{query}».
          </div>
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Por matrícula</th>
                    <th className="px-6 py-3 text-right">Por endereço (inteiro teor)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.uf}
                      className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-slate-900">{row.uf_name}</span>
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                          {row.uf}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {brl(row.registry_price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                        {brl(row.address_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {rows.map((row) => (
                <li key={row.uf} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{row.uf_name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {row.uf}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Por matrícula
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brl(row.registry_price)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Por endereço
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brl(row.address_price)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-4 py-4 text-xs leading-5 text-slate-500 sm:px-6">
          <p className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            O pedido por endereço inclui a busca da matrícula no cartório competente e a certidão
            de inteiro teor, cujo emolumento varia conforme a tabela oficial de cada estado.
          </p>
          <p className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            Certidões oficiais complementares podem ser adicionadas no pedido por endereço por{' '}
            {brl(table.certificates_upsell)}.
          </p>
          <p className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            Valores em reais (BRL), já com todos os custos de cartório e análise inclusos. O valor
            exibido no checkout é sempre o desta tabela.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={CONSULTAR_IMOVEL_INICIO_HREF}
          prefetch={false}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0b1b3a] shadow-sm transition hover:border-[#0b1b3a]/25 hover:shadow"
        >
          <ArrowLeft className="size-4" />
          Voltar para o início da consulta
        </Link>
        <Link
          href={CONSULTAR_IMOVEL_INICIO_HREF}
          prefetch={false}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b1b3a] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12264d]"
        >
          Iniciar consulta agora
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
