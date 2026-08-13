'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  ScrollText,
  Search,
} from 'lucide-react'

import Button from '@/components/button'
import useDebounce from '@/hooks/use-debounce'
import { BRAND_LOGO_LIGHT_SRC, BRAND_LOGO_HEIGHT, BRAND_LOGO_WIDTH } from '@/constants/brand-logo'
import { darkHeroSurfaceGradient, darkHeroSurfaceShell } from '@/styles/surfaces'
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

type PropertyRow = {
  code?: string
  title?: string
  address?: string
  photo?: string
}

type PropertiesPayload = {
  items?: PropertyRow[]
  total_items?: number
  pagination?: { page?: string | number; page_limit?: string | number; total_items?: number }
  error?: { message?: string }
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  address_hint: 'endereço incompleto na Jetimob',
  registration_number: 'matrícula não cadastrada na Jetimob',
  notary_name: 'cartório — você informa no fluxo',
}

const MODE_META: Record<
  JetimobConsultEntryPath,
  { title: string; description: string; Icon: typeof MapPin }
> = {
  address: {
    title: 'Por endereço',
    description: 'Você confirma o endereço no mapa e recebe a análise completa.',
    Icon: MapPin,
  },
  registry: {
    title: 'Por matrícula',
    description: 'Matrícula + cartório. Vai direto ao registro do imóvel.',
    Icon: ScrollText,
  },
  document: {
    title: 'Por documento',
    description: 'Envie matrícula, escritura ou contrato do imóvel.',
    Icon: FileText,
  },
}

function StatusPill({ session }: { session: JetimobSession | null }) {
  if (!session) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden />
        Conta Jetimob não conectada
      </span>
    )
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
      <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-400" aria-hidden />
      <span className="truncate">
        Conectado — {session.user_email || `conta ${session.jetimob_system_id}`}
      </span>
    </span>
  )
}

function PropertyPhoto({ photo, title }: { photo?: string; title: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={title}
        loading="lazy"
        className="size-full object-cover"
      />
    )
  }

  return (
    <div className="flex size-full items-center justify-center bg-primary/5">
      <Home className="size-6 text-primary/40" />
    </div>
  )
}

function ConnectCard({ onReload }: { onReload: () => void }) {
  const steps = [
    'Abra o painel da Jetimob e acesse Integrações.',
    'Ative o app Imóvel Periciado na sua conta.',
    'Você volta para cá já conectado, com sua carteira carregada.',
  ]

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-bold text-primary">Conecte sua conta Jetimob</h2>
      <p className="mt-1 text-sm text-gray-500">
        Uma única ativação libera consultas para toda a sua carteira de imóveis.
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        {steps.map((step, idx) => (
          <li key={step} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {idx + 1}
            </span>
            <p className="pt-1 text-sm text-gray-700">{step}</p>
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

function ModeButton({
  entryPath,
  mode,
  onStart,
}: {
  entryPath: JetimobConsultEntryPath
  mode?: JetimobConsultModeDraft
  onStart: (entryPath: JetimobConsultEntryPath, mode: JetimobConsultModeDraft) => void
}) {
  const { title, description, Icon } = MODE_META[entryPath]
  const available = Boolean(mode?.available)
  const pending = (mode?.missing_fields || []).map((f) => MISSING_FIELD_LABELS[f] || f)

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => mode && onStart(entryPath, mode)}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
        available
          ? 'border-gray-200 bg-white hover:border-primary hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
          : 'cursor-not-allowed border-dashed border-gray-200 bg-gray-50/60',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg',
          available ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400',
        )}
      >
        <Icon className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', available ? 'text-primary' : 'text-gray-400')}>
            {title}
          </span>
          {available ? (
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
          )}
        </span>
        <span className={cn('mt-0.5 block text-xs', available ? 'text-gray-500' : 'text-gray-400')}>
          {description}
        </span>
        {pending.length > 0 && (
          <span className="mt-1.5 block text-[11px] leading-snug text-amber-700">
            {pending.join(' · ')}
          </span>
        )}
      </span>

      {available && (
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-gray-300 transition group-hover:text-primary" aria-hidden />
      )}
    </button>
  )
}

export default function JetimobIntegrationPage() {
  const [session, setSession] = useState<JetimobSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [propertiesTotal, setPropertiesTotal] = useState<number | null>(null)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageLimit, setPageLimit] = useState<number | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 600)

  const [selected, setSelected] = useState<PropertyRow | null>(null)
  const [draft, setDraft] = useState<JetimobConsultDraftResponse | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [consultOpen, setConsultOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

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

  const loadProperties = useCallback(async (pageArg: number, searchArg: string) => {
    setPropertiesLoading(true)
    setPropertiesError(null)
    try {
      const params = new URLSearchParams({ page: String(pageArg) })
      if (searchArg.trim()) params.set('search', searchArg.trim())

      const res = await fetch(`/api/jetimob/properties?${params}`, { cache: 'no-store' })
      const body = (await res.json()) as PropertiesPayload

      if (!res.ok) {
        setProperties([])
        setPropertiesError(body?.error?.message || 'Não foi possível listar seus imóveis.')
        return
      }

      setProperties(body.items ?? [])
      const total = body.total_items ?? body.pagination?.total_items
      setPropertiesTotal(typeof total === 'number' ? total : null)
      const limit = Number(body.pagination?.page_limit)
      setPageLimit(Number.isFinite(limit) && limit > 0 ? limit : null)
    } catch {
      setProperties([])
      setPropertiesError('Sem conexão com o servidor ao listar imóveis.')
    } finally {
      setPropertiesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    if (!session) return
    void loadProperties(page, debouncedSearch)
  }, [session, page, debouncedSearch, loadProperties])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const selectProperty = async (row: PropertyRow) => {
    const code = String(row.code || '')
    if (!code) return

    setSelected(row)
    setDraft(null)
    setDraftError(null)
    setDraftLoading(true)

    // Mobile: painel fica após a lista — levar o usuário até ele.
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

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

  const startConsultation = (entryPath: JetimobConsultEntryPath, mode: JetimobConsultModeDraft) => {
    const code = String(selected?.code || '')
    if (!code) return

    storeJetimobConsultPrefill(
      buildJetimobConsultPrefill(code, mode, entryPath, session?.jetimob_system_id),
    )
    setConsultOpen(true)
  }

  const disconnect = async () => {
    await fetch('/api/jetimob/session', { method: 'DELETE' })
    setSession(null)
    setProperties([])
    setPropertiesTotal(null)
    setSelected(null)
    setDraft(null)
  }

  const totalPages =
    propertiesTotal !== null && pageLimit ? Math.max(1, Math.ceil(propertiesTotal / pageLimit)) : null
  const hasPrev = page > 1
  const hasNext = totalPages !== null ? page < totalPages : properties.length > 0 && pageLimit !== null

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

    <div className={cn('flex min-h-dvh flex-col bg-background', consultOpen && 'hidden')}>
      {/* Hero */}
      <header className={cn(darkHeroSurfaceShell, darkHeroSurfaceGradient, 'pb-20 md:pb-24')}>
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-4 md:px-6">
          <Link href="/" aria-label="Ir para a página inicial">
            <Image
              src={BRAND_LOGO_LIGHT_SRC}
              alt="Imóvel Periciado"
              width={BRAND_LOGO_WIDTH}
              height={BRAND_LOGO_HEIGHT}
              className="h-10 w-auto object-contain md:h-12"
              priority
            />
          </Link>
          <Link
            href="/consultas"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <Package className="size-4" aria-hidden />
            Minhas consultas
          </Link>
        </nav>

        <div className="mx-auto w-full max-w-5xl px-4 pt-8 md:px-6 md:pt-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            Integração Jetimob
          </p>
          <h1 className="mt-2 max-w-xl text-2xl font-bold leading-tight text-white md:text-4xl">
            Consulte imóveis direto da sua carteira
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            Escolha um imóvel da Jetimob, escolha como consultar e receba a análise completa do
            Imóvel Periciado — sem redigitar nada.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusPill session={session} />
            {session && (
              <button
                type="button"
                onClick={() => void disconnect()}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-3.5" aria-hidden />
                Desconectar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo sobreposto ao hero */}
      <main className="mx-auto -mt-12 w-full max-w-5xl flex-1 px-4 pb-16 md:-mt-14 md:px-6">
        {loading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
          </div>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
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
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start">
            {/* Carteira */}
            <section className="flex flex-col gap-3 lg:col-span-7">
              <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                <label className="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition focus-within:bg-gray-50">
                  <Search className="size-4 shrink-0 text-gray-400 group-focus-within:text-primary" aria-hidden />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por código, endereço ou título"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </label>
              </div>

              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-700">Sua carteira</h2>
                {propertiesTotal !== null && (
                  <span className="text-xs text-gray-400">
                    {propertiesTotal} {propertiesTotal === 1 ? 'imóvel' : 'imóveis'}
                  </span>
                )}
              </div>

              {propertiesError && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {propertiesError}
                </p>
              )}

              {propertiesLoading ? (
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
                  ))}
                </div>
              ) : properties.length === 0 && !propertiesError ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                  <Home className="mx-auto size-8 text-gray-300" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {debouncedSearch
                      ? 'Nenhum imóvel encontrado para essa busca.'
                      : 'Sua carteira Jetimob ainda não tem imóveis.'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {debouncedSearch
                      ? 'Tente outro código, rua ou bairro.'
                      : 'Cadastre um imóvel no painel da Jetimob e ele aparece aqui.'}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {properties.map((row, idx) => {
                    const code = String(row.code || '')
                    const isSelected = Boolean(code) && selected?.code === code
                    const title = row.title || (code ? `Imóvel ${code}` : `Imóvel ${idx + 1}`)

                    return (
                      <li key={code || idx}>
                        <button
                          type="button"
                          onClick={() => void selectProperty(row)}
                          disabled={!code}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition',
                            isSelected
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-gray-100 hover:border-primary/40 hover:shadow-md',
                          )}
                        >
                          <span className="size-16 shrink-0 overflow-hidden rounded-xl md:size-20">
                            <PropertyPhoto photo={row.photo} title={title} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {title}
                            </span>
                            {row.address && (
                              <span className="mt-0.5 block truncate text-xs text-gray-500">
                                {row.address}
                              </span>
                            )}
                            {code && (
                              <span className="mt-1.5 inline-block rounded-md bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                                #{code}
                              </span>
                            )}
                          </span>

                          <ChevronRight
                            className={cn(
                              'size-5 shrink-0 transition',
                              isSelected ? 'text-primary' : 'text-gray-300',
                            )}
                            aria-hidden
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {(hasPrev || hasNext) && (
                <div className="mt-1 flex items-center justify-between px-1">
                  <button
                    type="button"
                    disabled={!hasPrev || propertiesLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Anterior
                  </button>
                  <span className="text-xs text-gray-400">
                    Página {page}
                    {totalPages !== null ? ` de ${totalPages}` : ''}
                  </span>
                  <button
                    type="button"
                    disabled={!hasNext || propertiesLoading}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    Próxima
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </section>

            {/* Painel de consulta */}
            <aside ref={panelRef} className="scroll-mt-4 lg:sticky lg:top-6 lg:col-span-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                {!selected ? (
                  <div className="py-10 text-center">
                    <Search className="mx-auto size-8 text-gray-200" aria-hidden />
                    <h2 className="mt-3 text-sm font-semibold text-gray-700">
                      Escolha um imóvel da carteira
                    </h2>
                    <p className="mx-auto mt-1 max-w-[240px] text-xs text-gray-400">
                      Toque em um imóvel ao lado para ver as formas de consulta disponíveis.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg">
                        <PropertyPhoto
                          photo={selected.photo}
                          title={selected.title || `Imóvel ${selected.code}`}
                        />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold text-gray-900">
                          {selected.title || `Imóvel ${selected.code}`}
                        </h2>
                        {selected.address && (
                          <p className="truncate text-xs text-gray-500">{selected.address}</p>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                      Como você quer consultar?
                    </h3>

                    {draftLoading && (
                      <div className="mt-3 flex flex-col gap-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-50" />
                        ))}
                      </div>
                    )}

                    {draftError && (
                      <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {draftError}
                      </p>
                    )}

                    {draft?.modes && !draftLoading && (
                      <div className="mt-3 flex flex-col gap-2">
                        {(['address', 'registry', 'document'] as JetimobConsultEntryPath[]).map(
                          (entryPath) => (
                            <ModeButton
                              key={entryPath}
                              entryPath={entryPath}
                              mode={draft.modes?.[entryPath]}
                              onStart={startConsultation}
                            />
                          ),
                        )}
                      </div>
                    )}

                    <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
                      Os dados do imóvel entram já preenchidos na consulta. Você revisa tudo antes
                      de pagar.
                    </p>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
    </>
  )
}
