'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  buildJetimobConsultPrefill,
  storeJetimobConsultPrefill,
  type JetimobConsultDraftResponse,
  type JetimobConsultEntryPath,
  type JetimobConsultModeDraft,
} from '@/lib/jetimob-consult-prefill'

type JetimobSession = {
  connection_id: string
  jetimob_system_id: string
  user_email?: string
  expires_at: string
  me?: Record<string, unknown>
}

type PropertyRow = {
  code?: string
  title?: string
  address?: string
}

type PropertiesPayload = {
  items?: PropertyRow[]
  total_items?: number
  pagination?: { total_items?: number; page?: string | number }
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  address_hint: 'endereço',
  registration_number: 'matrícula (não veio da Jetimob)',
  notary_name: 'cartório (preencher no fluxo)',
}

const MODE_LABELS: Record<JetimobConsultEntryPath, { title: string; description: string }> = {
  address: {
    title: 'Endereço',
    description: 'Fluxo B2C por localização — certidões opcionais.',
  },
  registry: {
    title: 'Matrícula + cartório',
    description: 'Pré-preenche matrícula; cartório ainda é manual.',
  },
  document: {
    title: 'Documento do imóvel',
    description: 'Endereço como referência; upload na próxima etapa.',
  },
}

function modePreviewLines(mode: JetimobConsultModeDraft | undefined): string[] {
  if (!mode?.preview) return []
  const lines: string[] = []
  const addressLine = mode.preview.address_line
  if (typeof addressLine === 'string' && addressLine.trim()) {
    lines.push(addressLine.trim())
  }
  const registration = mode.preview.registration_number
  if (typeof registration === 'string' && registration.trim()) {
    lines.push(`Matrícula: ${registration.trim()}`)
  }
  const note = mode.preview.note
  if (typeof note === 'string' && note.trim()) {
    lines.push(note.trim())
  }
  return lines
}

export default function JetimobIntegrationPage() {
  const router = useRouter()
  const [session, setSession] = useState<JetimobSession | null>(null)
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [propertiesTotal, setPropertiesTotal] = useState<number | null>(null)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [draft, setDraft] = useState<JetimobConsultDraftResponse | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const sessionRes = await fetch('/api/jetimob/session', { cache: 'no-store' })
      if (sessionRes.status === 401) {
        setSession(null)
        setProperties([])
        return
      }
      const sessionBody = await sessionRes.json()
      if (!sessionRes.ok) {
        setError(sessionBody?.error?.message || 'Falha ao carregar sessão.')
        return
      }
      setSession(sessionBody)

      const propsRes = await fetch('/api/jetimob/properties?page=1', { cache: 'no-store' })
      const propsBody = (await propsRes.json()) as PropertiesPayload & {
        error?: { message?: string }
      }

      if (!propsRes.ok) {
        setProperties([])
        setPropertiesTotal(null)
        setPropertiesError(propsBody?.error?.message || 'Falha ao listar imóveis Jetimob.')
        return
      }

      setPropertiesError(null)
      setProperties(propsBody.items ?? [])
      const total = propsBody.total_items ?? propsBody.pagination?.total_items
      setPropertiesTotal(typeof total === 'number' ? total : null)
    } catch {
      setError('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const loadDraft = async (code: string) => {
    setSelectedCode(code)
    setDraft(null)
    setDraftError(null)
    setDraftLoading(true)

    try {
      const res = await fetch(`/api/jetimob/properties/${encodeURIComponent(code)}/consultation-draft`, {
        cache: 'no-store',
      })
      const body = (await res.json()) as JetimobConsultDraftResponse
      if (!res.ok) {
        setDraftError(body?.error?.message || 'Falha ao mapear imóvel.')
        return
      }
      setDraft(body)
    } catch {
      setDraftError('Erro de rede ao mapear imóvel.')
    } finally {
      setDraftLoading(false)
    }
  }

  const startConsultation = (entryPath: JetimobConsultEntryPath, mode: JetimobConsultModeDraft | undefined) => {
    if (!selectedCode || !mode?.available) return

    storeJetimobConsultPrefill(
      buildJetimobConsultPrefill(selectedCode, mode, entryPath, session?.jetimob_system_id),
    )
    router.push('/consultar-imovel')
  }

  const disconnect = async () => {
    await fetch('/api/jetimob/session', { method: 'DELETE' })
    setSession(null)
    setProperties([])
    setPropertiesTotal(null)
    setPropertiesError(null)
    setSelectedCode(null)
    setDraft(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integração Jetimob (localhost)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Valide OAuth e mapeie um imóvel Jetimob para os 3 modos de consulta Imóvel Periciado.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-900">Como testar</h2>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
          <li>
            Acesse{' '}
            <a className="text-primary underline" href="https://app.jetimob.io" target="_blank" rel="noreferrer">
              app.jetimob.io
            </a>{' '}
            e ative o app Imóvel Periciado.
          </li>
          <li>
            Clique no botão de acesso — redirect em{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">http://localhost:3000/callback?code=…</code>
          </li>
          <li>Selecione um imóvel abaixo e escolha o modo de consulta.</li>
        </ol>
      </section>

      {loading && <p className="text-sm text-gray-500">Carregando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !session && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Não conectado. Ative o app na Jetimob para receber o redirect com código OAuth.
        </div>
      )}

      {session && (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">Sessão ativa</h2>
              <button
                type="button"
                onClick={() => void disconnect()}
                className="text-xs text-red-600 hover:underline"
              >
                Desconectar
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-400">system_id</dt>
                <dd className="font-mono">{session.jetimob_system_id}</dd>
              </div>
              <div>
                <dt className="text-gray-400">E-mail</dt>
                <dd>{session.user_email || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="font-semibold mb-1">Imóveis (API legada)</h2>
            {propertiesTotal !== null && (
              <p className="text-xs text-gray-400 mb-3">total_items na Jetimob: {propertiesTotal}</p>
            )}
            {propertiesError && <p className="text-sm text-red-600 mb-2">{propertiesError}</p>}
            {properties.length === 0 ? (
              <p className="text-sm text-gray-500">
                {propertiesTotal === 0
                  ? 'Conta homolog conectada, mas sem imóveis cadastrados. Cadastre um imóvel em app.jetimob.io para testar o mapeamento.'
                  : 'Nenhum imóvel retornado nesta página.'}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {properties.slice(0, 20).map((row, idx) => {
                  const code = String(row.code || '')
                  const isSelected = selectedCode === code

                  return (
                    <li
                      key={String(row.code || idx)}
                      className={`text-sm border rounded-lg p-3 ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{row.title || row.code || `Imóvel ${idx + 1}`}</p>
                          {row.address && <p className="text-gray-500 text-xs mt-0.5">{row.address}</p>}
                          {code && <p className="text-xs text-gray-400 mt-1 font-mono">code: {code}</p>}
                        </div>
                        {code && (
                          <button
                            type="button"
                            onClick={() => void loadDraft(code)}
                            className="text-xs shrink-0 rounded-md bg-primary px-3 py-1.5 text-white hover:opacity-90"
                          >
                            {isSelected && draftLoading ? 'Mapeando…' : 'Mapear'}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {selectedCode && (
            <section className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4">
              <div>
                <h2 className="font-semibold">Consulta Imóvel — imóvel {selectedCode}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Escolha um modo. Os dados vão para{' '}
                  <Link href="/consultar-imovel" className="text-primary underline">
                    /consultar-imovel
                  </Link>{' '}
                  via sessionStorage.
                </p>
              </div>

              {draftLoading && <p className="text-sm text-gray-500">Gerando rascunhos…</p>}
              {draftError && <p className="text-sm text-red-600">{draftError}</p>}

              {draft?.modes && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['address', 'registry', 'document'] as JetimobConsultEntryPath[]).map((entryPath) => {
                    const mode = draft.modes?.[entryPath]
                    const meta = MODE_LABELS[entryPath]
                    const preview = modePreviewLines(mode)

                    return (
                      <article
                        key={entryPath}
                        className={`rounded-lg border p-3 flex flex-col gap-2 ${
                          mode?.available ? 'border-gray-200' : 'border-dashed border-gray-200 opacity-60'
                        }`}
                      >
                        <h3 className="font-medium text-sm">{meta.title}</h3>
                        <p className="text-xs text-gray-500">{meta.description}</p>

                        {preview.length > 0 && (
                          <ul className="text-xs text-gray-600 flex flex-col gap-1">
                            {preview.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        )}

                        {mode?.missing_fields && mode.missing_fields.length > 0 && (
                          <p className="text-xs text-amber-700">
                            Pendente: {mode.missing_fields.map((f) => MISSING_FIELD_LABELS[f] || f).join(', ')}
                          </p>
                        )}

                        <button
                          type="button"
                          disabled={!mode?.available}
                          onClick={() => startConsultation(entryPath, mode)}
                          className="mt-auto text-xs rounded-md border border-primary px-3 py-1.5 text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/5"
                        >
                          Iniciar consulta
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
