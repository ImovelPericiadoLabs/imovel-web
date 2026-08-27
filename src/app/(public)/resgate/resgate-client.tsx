'use client'

import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Ticket, TriangleAlert } from 'lucide-react'

import { CONSULTAR_IMOVEL_INICIO_HREF } from '@/constants/consult-flow'
import { validateVoucher } from '@/services/vouchers'
import { rememberVoucherCode } from '@/utils/voucher-session'

function formatValidUntil(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(date)
}

export default function ResgateClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromQr = searchParams.get('code') ?? ''

  const [typedCode, setTypedCode] = useState(codeFromQr)
  // Só o que já foi submetido dispara consulta. Começa com o código do QR, que é o
  // caminho normal — a pessoa apontou a câmera e a tela precisa conferir sozinha.
  const [submitted, setSubmitted] = useState(codeFromQr.trim())

  const query = useQuery({
    queryKey: ['voucher-validate', submitted],
    // Sem `entry_path`: aqui ainda não se sabe qual consulta a pessoa vai fazer, e
    // mandar um chute faria um voucher válido aparecer como recusado.
    queryFn: () => validateVoucher(submitted),
    enabled: Boolean(submitted),
    retry: false,
    staleTime: 30_000,
  })

  const check = useCallback(() => {
    const clean = typedCode.trim()
    if (!clean) return
    // Reconferir o mesmo código precisa refazer a chamada: entre uma tentativa e
    // outra o lote pode ter sido ativado, que é justamente o socorro no evento.
    if (clean === submitted) void query.refetch()
    else setSubmitted(clean)
  }, [typedCode, submitted, query])

  const use = useCallback(() => {
    rememberVoucherCode(submitted || typedCode.trim())
    router.push(CONSULTAR_IMOVEL_INICIO_HREF)
  }, [router, submitted, typedCode])

  const result = query.data ?? null
  const isChecking = query.isFetching

  return (
    <section className="min-h-screen bg-[var(--color-background,#F6F5FA)]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm">
            <Ticket className="size-3.5 text-[#0b1b3a]" />
            Voucher
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0b1b3a] sm:text-4xl">
            Resgatar voucher
          </h1>
        </div>

        {/* Campo sempre visível: no evento o QR falha por luz, capa de celular ou
            câmera ruim, e o código está impresso no cartão logo abaixo dele. */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:p-6">
          <label htmlFor="voucher-code" className="text-sm font-medium text-slate-700">
            Código do cartão
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="voucher-code"
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') check()
              }}
              placeholder="ABCD-1234-EFGH"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-base tracking-wider text-slate-900 outline-none transition focus:border-[#0b1b3a] focus:ring-2 focus:ring-[#0b1b3a]/10"
            />
            <button
              type="button"
              onClick={check}
              disabled={isChecking || !typedCode.trim()}
              className="shrink-0 rounded-xl bg-[#0b1b3a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b1b3a]/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isChecking ? 'Conferindo…' : 'Conferir'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Pode digitar com ou sem hífen, maiúscula ou minúscula.
          </p>
        </div>

        {query.isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Não conseguimos conferir agora</p>
              <p className="text-sm leading-6 text-amber-800">
                Parece falha de conexão, não problema no voucher. Guarde o cartão e tente de novo
                em instantes.
              </p>
            </div>
          </div>
        )}

        {result?.valid === false && !query.isFetching && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-rose-900">Voucher não pode ser usado</p>
              <p className="text-sm leading-6 text-rose-800">{result.message}</p>
              <Link
                href={CONSULTAR_IMOVEL_INICIO_HREF}
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-900 underline underline-offset-4"
              >
                Fazer a consulta mesmo assim
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}

        {result?.valid === true && !query.isFetching && (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-[0_4px_24px_rgba(11,27,58,0.06)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-50 p-2.5">
                <BadgeCheck className="size-5 text-emerald-600" />
              </span>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-950">Voucher válido</p>
                <p className="text-sm text-slate-600">{result.event_name}</p>
              </div>
            </div>

            {/* Uma linha por modalidade, com o texto que o backend já monta — a mesma
                frase do cartão impresso, para papel e tela nunca divergirem. */}
            <ul className="space-y-2">
              {result.benefits.map((benefit) => (
                <li
                  key={benefit.entry_path}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800"
                >
                  <BadgeCheck className="size-4 shrink-0 text-emerald-600" />
                  {benefit.describe}
                </li>
              ))}
            </ul>

            <p className="text-xs text-slate-500">
              Válido até {formatValidUntil(result.valid_until)}. Um voucher por pessoa.
              {result.requires_login && ' Você vai identificar-se na hora de finalizar.'}
            </p>

            <button
              type="button"
              onClick={use}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1b3a] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b1b3a]/90"
            >
              Usar meu voucher
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
