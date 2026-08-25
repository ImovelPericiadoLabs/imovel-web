'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, LogOut, Package, RefreshCw } from 'lucide-react'

import Button from '@/components/button'
import { BRAND_LOGO_LIGHT_SRC, BRAND_LOGO_HEIGHT, BRAND_LOGO_WIDTH } from '@/constants/brand-logo'
import { ConsultPropertyDialog, PropertyCatalog } from '@/sections/jetimob/property-catalog'
import type { JetimobPropertyRow } from '@/services/jetimob'
import { cn } from '@/utils/tailwind'
import {
  buildJetimobConsultPrefill,
  storeJetimobConsultPrefill,
  type JetimobConsultDraftResponse,
  type JetimobConsultEntryPath,
  type JetimobConsultModeDraft,
} from '@/lib/jetimob-consult-prefill'

const JETIMOB_PANEL_URL = 'https://app.jetimob.io'

const ConsultProperty = dynamic(() => import('@/sections/consult-property'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
    </div>
  ),
})

type JetimobSession = {
  connection_id: string
  jetimob_system_id: string
  user_email?: string
  expires_at: string
}

/** Container do design: largura máxima e gutters iguais no hero e no conteúdo. */
const SHELL = 'mx-auto w-full max-w-[var(--size-jetimob-shell-max)] px-4 sm:px-6 lg:px-8'

function StatusPill({ session }: { session: JetimobSession | null }) {
  if (!session) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3.5 py-2 text-[13px] font-medium text-amber-100">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden />
        Conta Jetimob não conectada
      </span>
    )
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-medium text-white">
      <span className="size-2 shrink-0 rounded-full bg-[var(--color-jetimob-active-dot)]" aria-hidden />
      <span className="truncate">
        Conectado — {session.user_email || `conta ${session.jetimob_system_id}`}
      </span>
    </span>
  )
}

function ConnectCard({ onReload }: { onReload: () => void }) {
  const steps = [
    'Abra o painel da Jetimob e acesse Integrações.',
    'Ative o app Imóvel Periciado na sua conta.',
    'Você volta para cá já conectado, com sua carteira carregada.',
  ]

  return (
    <section className="mx-auto max-w-2xl rounded-[var(--radius-jetimob-panel)] border border-[var(--color-jetimob-border)] bg-[var(--color-jetimob-surface)] p-6 shadow-[var(--shadow-jetimob-panel)] md:p-8">
      <h2 className="text-lg font-bold text-[var(--color-jetimob-text-title)]">
        Conecte sua conta Jetimob
      </h2>
      <p className="mt-1 text-sm text-[var(--color-jetimob-text-muted)]">
        Uma única ativação libera consultas para toda a sua carteira de imóveis.
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        {steps.map((step, idx) => (
          <li key={step} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-jetimob-accent)]/10 text-xs font-bold text-[var(--color-jetimob-accent)]">
              {idx + 1}
            </span>
            <p className="pt-1 text-sm text-[var(--color-jetimob-text-body)]">{step}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button
          href={JETIMOB_PANEL_URL}
          className="h-11 w-full rounded-xl sm:w-auto sm:px-6"
          icon={<ExternalLink className="size-5" />}
        >
          Abrir painel da Jetimob
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
          className="h-11 w-full rounded-xl sm:w-auto sm:px-6"
          icon={<RefreshCw className="size-5" />}
        >
          Já ativei — recarregar
        </Button>
      </div>
    </section>
  )
}

export default function JetimobIntegrationPage() {
  const [session, setSession] = useState<JetimobSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<JetimobPropertyRow | null>(null)
  const [draft, setDraft] = useState<JetimobConsultDraftResponse | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [consultOpen, setConsultOpen] = useState(false)

  const loadSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/jetimob/session', { cache: 'no-store' })
      if (res.status === 401) {
        setSession(null)
        return
      }
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error?.message || 'Não foi possível carregar a conexão.')
        return
      }
      setSession(body)
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet e recarregue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const selectProperty = async (row: JetimobPropertyRow) => {
    const code = String(row.code || '')
    if (!code) return

    setSelected(row)
    setDraft(null)
    setDraftError(null)
    setDraftLoading(true)

    try {
      const res = await fetch(
        `/api/jetimob/properties/${encodeURIComponent(code)}/consultation-draft`,
        { cache: 'no-store' },
      )
      const body = (await res.json()) as JetimobConsultDraftResponse
      if (!res.ok) {
        setDraftError(body?.error?.message || 'Não foi possível preparar a consulta deste imóvel.')
        return
      }
      setDraft(body)
    } catch {
      setDraftError('Sem conexão com o servidor ao preparar a consulta.')
    } finally {
      setDraftLoading(false)
    }
  }

  const startConsultation = (
    entryPath: JetimobConsultEntryPath,
    mode: JetimobConsultModeDraft,
    options: { writeback: boolean },
  ) => {
    const code = String(selected?.code || '')
    if (!code) return

    storeJetimobConsultPrefill(
      buildJetimobConsultPrefill(
        code,
        mode,
        entryPath,
        session?.jetimob_system_id,
        options.writeback,
      ),
    )
    setSelected(null)
    setConsultOpen(true)
  }

  const disconnect = async () => {
    await fetch('/api/jetimob/session', { method: 'DELETE' })
    setSession(null)
    setSelected(null)
    setDraft(null)
  }

  return (
    <>
      {consultOpen && (
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            </div>
          }
        >
          <ConsultProperty onExit={() => setConsultOpen(false)} />
        </Suspense>
      )}

      <div className={cn('flex min-h-dvh flex-col bg-[var(--color-jetimob-canvas)]', consultOpen && 'hidden')}>
        <header className="bg-gradient-to-b from-[var(--color-jetimob-hero-from)] to-[var(--color-jetimob-hero-to)]">
          <nav className={cn(SHELL, 'flex items-center justify-between gap-4 pt-5')}>
            <Link href="/" aria-label="Ir para a página inicial">
              <Image
                src={BRAND_LOGO_LIGHT_SRC}
                alt="Imóvel Periciado"
                width={BRAND_LOGO_WIDTH}
                height={BRAND_LOGO_HEIGHT}
                className="h-9 w-auto object-contain md:h-11"
                priority
              />
            </Link>
            <Link
              href="/consultas"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Package className="size-[18px]" aria-hidden />
              Minhas consultas
            </Link>
          </nav>

          <div className={cn(SHELL, 'pb-12 pt-7 md:pb-14')}>
            <p className="text-[11px] font-bold uppercase leading-none tracking-[0.2em] text-white/50">
              Integração Jetimob
            </p>
            <h1 className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[34px]">
              Consulte imóveis direto da sua carteira
            </h1>
            <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-white/75">
              Escolha um imóvel da Jetimob, escolha como consultar e receba a análise completa do
              Imóvel Periciado — sem redigitar nada.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <StatusPill session={session} />
              {session && (
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="size-4" aria-hidden />
                  Desconectar
                </button>
              )}
            </div>
          </div>
        </header>

        <main className={cn(SHELL, 'flex-1 py-8 md:py-10')}>
          {loading && (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            </div>
          )}

          {!loading && error && (
            <section className="mx-auto max-w-2xl rounded-[var(--radius-jetimob-panel)] border border-red-100 bg-white p-6 shadow-[var(--shadow-jetimob-panel)]">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadSession()}
                className="mt-4 h-10 rounded-xl px-5"
                icon={<RefreshCw className="size-4" />}
              >
                Tentar de novo
              </Button>
            </section>
          )}

          {!loading && !error && !session && <ConnectCard onReload={() => void loadSession()} />}

          {!loading && !error && session && (
            <PropertyCatalog
              enabled={Boolean(session)}
              selectedCode={selected?.code}
              onSelect={(row) => void selectProperty(row)}
            />
          )}
        </main>
      </div>

      <ConsultPropertyDialog
        property={selected}
        draft={draft}
        loading={draftLoading}
        error={draftError}
        onOpenChange={(open) => !open && setSelected(null)}
        onStart={startConsultation}
      />
    </>
  )
}
