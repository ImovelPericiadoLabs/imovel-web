'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react'

import Button from '@/components/button'
import { decideConsent, getConsentMetadata } from '@/services/partners'
import { InsertStep } from '@/sections/login/steps/insert-step'
import { VerifyCodeStep } from '@/sections/login/steps/verify-step'
import { validations, FormTypes } from '@/sections/login/validations'
import {
  BRAND_LOGO_DARK_SRC,
  BRAND_LOGO_HEIGHT,
  BRAND_LOGO_WIDTH,
} from '@/constants/brand-logo'

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

function safeHost(u: string | null): string | null {
  if (!u) return null
  try {
    return new URL(u).host
  } catch {
    return u
  }
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

function BrandMark() {
  return (
    <div className="flex justify-center">
      <Image
        src={BRAND_LOGO_DARK_SRC}
        alt="Imóvel Periciado"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        unoptimized
        priority
        className="h-12 w-auto sm:h-14"
      />
    </div>
  )
}

/** Nome de exibição do parceiro: a organização, sem sufixos técnicos do app. */
function partnerDisplayName(partner: {
  organization: string | null
  application: string | null
}): string {
  const raw = partner.organization || partner.application || 'Parceiro'
  return raw.replace(/\s*\((consent|login|m2m)\)\s*$/i, '').trim() || 'Parceiro'
}

function PartnerLogo({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false)

  if (src && !broken) {
    return (
      // Logo do parceiro vem de host externo/GCS: sempre via <img> (nunca SVG inline).
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-contain p-1.5"
      />
    )
  }

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-primary/10 text-2xl font-bold text-primary">
      {initial}
    </div>
  )
}

/** Entrar/criar conta sem sair da tela de autorização (preserva o state/PKCE da query). */
function InlineLogin() {
  const { update } = useSession()
  const [flow, setFlow] = useState<'email' | 'code'>('email')

  const methods = useForm<FormTypes>({
    resolver: zodResolver(validations),
    mode: 'onChange',
    defaultValues: { email: '', code: '' },
  })

  return (
    <CardShell>
      <BrandMark />

      <div className="mt-5 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Entrar para continuar</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Acesse sua conta <strong className="font-semibold text-slate-700">Imóvel Periciado</strong>{' '}
          para concluir a autorização da integração. Não tem conta? Ela é criada automaticamente ao
          validar o código.
        </p>
      </div>

      <div className="mt-6">
        <FormProvider {...methods}>
          {flow === 'email' ? (
            <InsertStep onNext={() => setFlow('code')} />
          ) : (
            <VerifyCodeStep onBack={() => setFlow('email')} onSuccess={() => void update()} />
          )}
        </FormProvider>
      </div>
    </CardShell>
  )
}

export default function AuthorizeClient({ searchParams }: { searchParams: SearchParams }) {
  const rawQuery = useMemo(() => buildRawQuery(searchParams), [searchParams])
  const { data: session, status } = useSession()

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-consent', rawQuery],
    queryFn: () => getConsentMetadata(rawQuery),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: rawQuery.length > 0 && status === 'authenticated',
  })

  const decide = useMutation({
    mutationFn: (allow: boolean) => decideConsent(rawQuery, allow),
    onSuccess: (result) => {
      if (result.redirect_to) {
        window.location.href = result.redirect_to
      }
    },
  })

  // 1) Sessão carregando.
  if (status === 'loading') {
    return <Spinner />
  }

  // 2) Deslogado → login/criação de conta inline, na mesma rota.
  if (status === 'unauthenticated') {
    return <InlineLogin />
  }

  // 3) Autenticado → valida e mostra o consentimento.
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

  const partner = data.partner
  const partnerName = partnerDisplayName(partner)
  const websiteHost = safeHost(partner.website)
  const redirectHost = safeHost(data.redirect_uri)
  const userEmail = session?.user?.email
  const reconnect = data.already_connected
  const currentIds = new Set(data.current_scopes.map((s) => s.id))
  const isPending = decide.isPending

  return (
    <CardShell>
      <BrandMark />

      <div className="mt-6 flex flex-col items-center text-center">
        <PartnerLogo src={partner.logo_url} name={partnerName} />

        <h1 className="mt-4 text-lg font-medium text-slate-900">
          {reconnect ? (
            <>
              Reconectar <strong className="font-bold">{partnerName}</strong>
            </>
          ) : (
            <>
              <strong className="font-bold">{partnerName}</strong> quer acessar sua conta
            </>
          )}
        </h1>

        {partner.description ? (
          <p className="mt-1.5 text-sm text-slate-500">{partner.description}</p>
        ) : (
          <p className="mt-1.5 text-sm text-slate-500">
            Acesso à sua conta na Imóvel Periciado.
          </p>
        )}

        {websiteHost ? (
          <a
            href={partner.website ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {websiteHost} <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}

        {userEmail ? (
          <p className="mt-3 text-xs text-slate-400">
            Conectado como <strong className="font-semibold text-slate-700">{userEmail}</strong>
          </p>
        ) : null}
      </div>

      {reconnect ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Você já conectou este parceiro. Vamos <strong>reutilizar a mesma conexão</strong> e
            atualizar as permissões abaixo — nada é duplicado.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {reconnect ? 'Permissões após a reconexão' : 'Permissões solicitadas'}
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {data.scopes.map((scope) => {
            const isNew = reconnect && !currentIds.has(scope.id)
            return (
              <li key={scope.id} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1">{scope.description}</span>
                {isNew ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    novo
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      {decide.isError ? (
        <p className="mt-4 text-center text-sm text-red-600">{(decide.error as Error)?.message}</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => decide.mutate(true)} disabled={isPending}>
          {isPending ? 'Processando...' : reconnect ? 'Reconectar e atualizar' : 'Autorizar'}
        </Button>

        <Button variant="outline" onClick={() => decide.mutate(false)} disabled={isPending}>
          Negar
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        {redirectHost ? (
          <>
            Você será redirecionado para{' '}
            <strong className="font-semibold text-slate-600">{redirectHost}</strong>.{' '}
          </>
        ) : null}
        Revogue quando quiser em Conta › Parceiros conectados.
      </p>
    </CardShell>
  )
}
