'use client'

import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

import Button from '@/components/button'
import { decideConsent, getConsentMetadata } from '@/services/partners'

const OAUTH_KEYS = [
  'client_id',
  'response_type',
  'redirect_uri',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
] as const

type SearchParams = Record<string, string | string[] | undefined>

function buildRawQuery(searchParams: SearchParams): string {
  const params = new URLSearchParams()

  for (const key of OAUTH_KEYS) {
    const value = searchParams[key]
    if (typeof value === 'string' && value) {
      params.append(key, value)
    }
  }

  return params.toString()
}

function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
    </div>
  )
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
  )
}

export default function AuthorizeClient({ searchParams }: { searchParams: SearchParams }) {
  const rawQuery = useMemo(() => buildRawQuery(searchParams), [searchParams])

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-consent', rawQuery],
    queryFn: () => getConsentMetadata(rawQuery),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: rawQuery.length > 0,
  })

  const decide = useMutation({
    mutationFn: (allow: boolean) => decideConsent(rawQuery, allow),
    onSuccess: (result) => {
      if (result.redirect_to) {
        window.location.href = result.redirect_to
      }
    },
  })

  if (isLoading) {
    return <Spinner />
  }

  if (error || !data) {
    return (
      <CardShell>
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-semibold text-slate-900">Solicitação inválida</h1>
          <p className="mt-2 text-sm text-slate-500">
            {(error as Error)?.message || 'Não foi possível validar a solicitação de autorização.'}
          </p>
        </div>
      </CardShell>
    )
  }

  const partnerName = data.partner.application || 'Parceiro'
  const organization = data.partner.organization
  const isPending = decide.isPending

  return (
    <CardShell>
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </span>

        <h1 className="text-lg font-semibold text-slate-900">Autorizar acesso</h1>

        <p className="mt-2 text-sm text-slate-500">
          <strong className="text-slate-700">{partnerName}</strong>
          {organization ? <> ({organization})</> : null} está solicitando acesso à sua conta na
          Imóvel Periciado.
        </p>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Permissões solicitadas
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {data.scopes.map((scope) => (
            <li key={scope.id} className="flex items-start gap-2 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{scope.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {decide.isError ? (
        <p className="mt-4 text-center text-sm text-red-600">
          {(decide.error as Error)?.message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => decide.mutate(true)} disabled={isPending}>
          {isPending ? 'Processando...' : 'Autorizar'}
        </Button>

        <Button variant="outline" onClick={() => decide.mutate(false)} disabled={isPending}>
          Negar
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Você pode revogar este acesso a qualquer momento em Conta &rsaquo; Parceiros conectados.
      </p>
    </CardShell>
  )
}
