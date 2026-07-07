import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileSearch, MapPinned, ScrollText } from 'lucide-react'

import { url } from '@/constants/api'
import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'

import { PricingTableClient, type PricingTable } from './pricing-table-client'

export const metadata: Metadata = {
  title: 'Tabela de preços por estado | Imóvel Periciado',
  description:
    'Valores oficiais da consulta de matrícula por estado (UF): pedido por número de matrícula e pedido por endereço, com certidão de inteiro teor.',
  robots: {
    index: false,
    follow: true,
  },
}

export const revalidate = 3600

function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

async function getPricingTable(): Promise<PricingTable | null> {
  try {
    const res = await fetch(`${url}/payments/pricing-table/`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return (await res.json()) as PricingTable
  } catch {
    return null
  }
}

export default async function PricingTablePage() {
  const table = await getPricingTable()

  return (
    <section className="min-h-screen bg-[var(--color-background,#F6F5FA)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:px-8">
        <div>
          <Link
            href={CONSULTAR_IMOVEL_INICIO_HREF}
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[#0b1b3a]"
          >
            <ArrowLeft className="size-4" />
            Voltar para o início da consulta
          </Link>
        </div>

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
            <ScrollText className="size-3.5 text-[#0b1b3a]" />
            Tabela oficial de preços
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0b1b3a] sm:text-4xl">
              Preços por estado
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              Valores finais da consulta completa, definidos por estado conforme a tabela de
              emolumentos de cada Tribunal de Justiça. Sem surpresas: o valor exibido aqui é
              exatamente o valor cobrado no checkout.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#0b1b3a]/5 p-2.5">
                <FileSearch className="size-5 text-[#0b1b3a]" />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-950">Pedido por matrícula</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Você informa o número da matrícula e o cartório. Preço único nacional
                  {table ? ` de ${brl(table.base_price)}` : ''}, com certidões incluídas.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#0b1b3a]/5 p-2.5">
                <MapPinned className="size-5 text-[#0b1b3a]" />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-950">Pedido por endereço</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Localizamos a matrícula no cartório a partir do endereço, com certidão de
                  inteiro teor. O valor varia por estado conforme os emolumentos oficiais.
                </p>
              </div>
            </div>
          </div>
        </div>

        <PricingTableClient initialTable={table} />
      </div>
    </section>
  )
}
