'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Megaphone, RefreshCw } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import Alert from '@/components/alert'
import { getMe } from '@/services/account'
import { url as apiBaseUrl } from '@/constants/api'
import {
  createCampaignMultipart,
  listCampaigns,
  listEmailTemplates,
  listRegistryTemplates,
  listWhatsappSpecs,
  patchCampaign,
  previewCampaign,
  sendCampaign,
  syncMetaTemplates,
  type OutreachCampaign,
  type RegistryTemplateMeta,
  type WhatsAppSpec,
} from '@/services/outreach'

type Step = 1 | 2 | 3 | 4 | 5

type CampaignPreviewPayload = Awaited<ReturnType<typeof previewCampaign>>

export default function AdminOutreachPage() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: registry } = useQuery({
    queryKey: ['outreach-registry'],
    queryFn: listRegistryTemplates,
    enabled: Boolean(me?.is_superuser),
  })
  const { data: waSpecs } = useQuery({
    queryKey: ['outreach-wa-specs'],
    queryFn: listWhatsappSpecs,
    enabled: Boolean(me?.is_superuser),
  })
  const { data: emailTpls } = useQuery({
    queryKey: ['outreach-email-tpls'],
    queryFn: listEmailTemplates,
    enabled: Boolean(me?.is_superuser),
  })
  const { data: campaigns } = useQuery({
    queryKey: ['outreach-campaigns'],
    queryFn: listCampaigns,
    enabled: Boolean(me?.is_superuser),
  })

  const [step, setStep] = useState<Step>(1)
  const [channels, setChannels] = useState<string[]>(['email'])
  const [registryTemplateId, setRegistryTemplateId] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [whatsappSpecId, setWhatsappSpecId] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [campaign, setCampaign] = useState<OutreachCampaign | null>(null)
  const [, setSampleRows] = useState<Record<string, string>[]>([])
  const [emailColumn, setEmailColumn] = useState('')
  const [phoneColumn, setPhoneColumn] = useState('')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [pixelBase, setPixelBase] = useState('')
  const [lgpdOk, setLgpdOk] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<CampaignPreviewPayload | null>(null)
  const [syncSummary, setSyncSummary] = useState<string | null>(null)

  const registryMeta: RegistryTemplateMeta | undefined = useMemo(
    () => registry?.templates.find((t) => t.id === registryTemplateId),
    [registry, registryTemplateId],
  )
  const waSpec: WhatsAppSpec | undefined = useMemo(
    () => waSpecs?.find((s) => s.id === whatsappSpecId),
    [waSpecs, whatsappSpecId],
  )

  const varsToMap = useMemo(() => {
    const keys = new Set<string>()
    if (channels.includes('whatsapp')) {
      if (whatsappSpecId && waSpec) {
        waSpec.body_parameter_names.forEach((p) => keys.add(p))
      } else if (registryTemplateId && registryMeta?.required_vars_whatsapp) {
        registryMeta.required_vars_whatsapp.forEach((p) => keys.add(p))
      }
    }
    if (channels.includes('email')) {
      if (emailTemplateId) {
        /* placeholders são nomes de colunas no HTML — operador mapeia colunas CSV iguais aos nomes ou usa mapeamento genérico */
      } else if (registryTemplateId && registryMeta?.required_vars_email) {
        registryMeta.required_vars_email.forEach((p) => keys.add(p))
      }
    }
    return Array.from(keys)
  }, [channels, whatsappSpecId, waSpec, registryTemplateId, registryMeta, emailTemplateId])

  const createMut = useMutation({
    mutationFn: async () => {
      if (!csvFile) throw new Error('Selecione um CSV.')
      const fd = new FormData()
      fd.append('csv_file', csvFile)
      fd.append('channels', JSON.stringify(channels))
      fd.append('dry_run_sample_limit', '10')
      if (registryTemplateId) fd.append('registry_template_id', registryTemplateId)
      if (emailTemplateId) fd.append('email_template_id', emailTemplateId)
      if (whatsappSpecId) fd.append('whatsapp_spec_id', whatsappSpecId)
      return createCampaignMultipart(fd)
    },
    onSuccess: (data) => {
      setCampaign(data.campaign)
      setSampleRows(data.sample_rows)
      setStep(3)
      setPageError(null)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const patchMut = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('Sem campanha.')
      return patchCampaign(campaign.id, {
        email_column: emailColumn,
        phone_column: phoneColumn,
        column_mapping: columnMapping,
        channels,
        registry_template_id: registryTemplateId || null,
        email_template: emailTemplateId || null,
        whatsapp_spec: whatsappSpecId || null,
      })
    },
    onSuccess: (c) => {
      setCampaign(c)
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const previewMut = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('Sem campanha.')
      await patchMut.mutateAsync()
      return previewCampaign(campaign.id)
    },
    onSuccess: (data) => {
      setPreviewResult(data)
      setStep(4)
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('Sem campanha.')
      const base = pixelBase.trim() || apiBaseUrl.replace(/\/v1\/?$/, '')
      return sendCampaign(campaign.id, base || undefined)
    },
    onSuccess: () => {
      setStep(5)
      setPageError(null)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const syncMut = useMutation({
    mutationFn: () => syncMetaTemplates(),
    onSuccess: (r) => {
      setSyncSummary(`Criados: ${r.created}, atualizados: ${r.updated}, ignorados: ${r.skipped}`)
      void queryClient.invalidateQueries({ queryKey: ['outreach-wa-specs'] })
    },
    onError: (e: Error) => setSyncSummary(`Erro: ${e.message}`),
  })

  const setMap = useCallback((key: string, col: string) => {
    setColumnMapping((m) => ({ ...m, [key]: col }))
  }, [])

  if (meLoading) {
    return <div className="p-6 text-gray-600">Carregando…</div>
  }

  if (!me?.is_superuser) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Alert variant="error" message="Acesso restrito a superusuários." />
        <Link href="/consultas" className="mt-4 inline-block text-primary font-medium">
          Voltar às consultas
        </Link>
      </div>
    )
  }

  const columns = campaign?.csv_columns ?? []

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto flex flex-col gap-6 pb-24">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Megaphone className="size-7 text-primary" />
        </div>
        <div>
          <TextTitle className="text-xl text-gray-900">Divulgação em massa</TextTitle>
          <TextSubtitle className="text-sm text-gray-600">
            Superusuário: CSV, mapeamento, pré-visualização e envio (e-mail e WhatsApp).
          </TextSubtitle>
        </div>
      </div>

      {pageError && <Alert variant="error" message={pageError} />}

      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className={step >= 1 ? 'font-semibold text-primary' : ''}>1. Canais</span>
        <span>→</span>
        <span className={step >= 2 ? 'font-semibold text-primary' : ''}>2. Modelo + CSV</span>
        <span>→</span>
        <span className={step >= 3 ? 'font-semibold text-primary' : ''}>3. Mapeamento</span>
        <span>→</span>
        <span className={step >= 4 ? 'font-semibold text-primary' : ''}>4. Prévia</span>
        <span>→</span>
        <span className={step >= 5 ? 'font-semibold text-primary' : ''}>5. Envio</span>
      </div>

      {step === 1 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="font-semibold text-gray-900">Canais</p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={channels.includes('email')}
              onChange={() =>
                setChannels((c) =>
                  c.includes('email') ? c.filter((x) => x !== 'email') : [...c, 'email'],
                )
              }
            />
            E-mail
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={channels.includes('whatsapp')}
              onChange={() =>
                setChannels((c) =>
                  c.includes('whatsapp') ? c.filter((x) => x !== 'whatsapp') : [...c, 'whatsapp'],
                )
              }
            />
            WhatsApp
          </label>
          <Button className="rounded-xl h-11" onClick={() => setStep(2)} disabled={channels.length === 0}>
            Continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-gray-900">Modelos WhatsApp (DB)</p>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg text-sm"
              disabled={syncMut.isPending}
              onClick={() => syncMut.mutate()}
              icon={<RefreshCw className={`size-4 ${syncMut.isPending ? 'animate-spin' : ''}`} />}
            >
              Sincronizar com a Meta
            </Button>
          </div>
          {syncSummary && <p className="text-sm text-gray-600">{syncSummary}</p>}
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={whatsappSpecId}
            onChange={(e) => setWhatsappSpecId(e.target.value)}
          >
            <option value="">— Template WhatsApp (DB) —</option>
            {waSpecs?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.template_name} ({s.lang})
              </option>
            ))}
          </select>

          <p className="font-semibold text-gray-900 pt-2">Template e-mail (DB)</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={emailTemplateId}
            onChange={(e) => setEmailTemplateId(e.target.value)}
          >
            <option value="">— Opcional —</option>
            {emailTpls?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <p className="font-semibold text-gray-900 pt-2">Template registry (código)</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={registryTemplateId}
            onChange={(e) => setRegistryTemplateId(e.target.value)}
          >
            <option value="">— Nenhum —</option>
            {registry?.templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}
              </option>
            ))}
          </select>

          <p className="font-semibold text-gray-900 pt-2">Arquivo CSV</p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="text-sm"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="rounded-xl h-11" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button
              className="rounded-xl h-11"
              disabled={!csvFile || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? 'Enviando…' : 'Carregar CSV'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && campaign && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Colunas: <span className="font-mono text-xs">{columns.join(', ')}</span> — {campaign.row_count}{' '}
            linhas
          </p>
          {channels.includes('email') && (
            <div>
              <label className="text-sm font-medium text-gray-700">Coluna do e-mail</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={emailColumn}
                onChange={(e) => setEmailColumn(e.target.value)}
              >
                <option value="">—</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          {channels.includes('whatsapp') && (
            <div>
              <label className="text-sm font-medium text-gray-700">Coluna do telefone (DDD+número)</label>
              <select
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={phoneColumn}
                onChange={(e) => setPhoneColumn(e.target.value)}
              >
                <option value="">—</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          {varsToMap.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">Variáveis do template → coluna CSV</p>
              {varsToMap.map((v) => (
                <div key={v} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-mono w-40 shrink-0">{v}</span>
                  <select
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    value={columnMapping[v] ?? ''}
                    onChange={(e) => setMap(v, e.target.value)}
                  >
                    <option value="">—</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="rounded-xl h-11" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button
              className="rounded-xl h-11"
              disabled={previewMut.isPending}
              onClick={() => previewMut.mutate()}
            >
              Pré-visualizar (dry-run)
            </Button>
          </div>
        </div>
      )}

      {step === 4 ? (
        previewResult !== null ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
            <p className="font-semibold text-gray-900">Resultado da pré-visualização</p>
            <pre className="text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(previewResult, null, 2)}
            </pre>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={lgpdOk} onChange={(e) => setLgpdOk(e.target.checked)} />
              Confirmo que a lista foi obtida com base legal (LGPD) e que os destinatários podem receber esta
              comunicação.
            </label>
            <div>
              <label className="text-sm text-gray-600">URL base do pixel (opcional, default API)</label>
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={pixelBase}
                onChange={(e) => setPixelBase(e.target.value)}
                placeholder={apiBaseUrl.replace(/\/v1\/?$/, '')}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl h-11" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button
                className="rounded-xl h-11"
                disabled={!lgpdOk || sendMut.isPending}
                onClick={() => sendMut.mutate()}
              >
                {sendMut.isPending ? 'Enfileirando…' : 'Enviar campanha'}
              </Button>
            </div>
          </div>
        ) : null
      ) : null}

      {step === 5 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <Alert variant="success" message="Envio enfileirado. Acompanhe o processamento no servidor (Celery)." />
          <Button className="mt-4 rounded-xl h-11" variant="outline" onClick={() => window.location.reload()}>
            Nova campanha
          </Button>
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <p className="font-semibold text-gray-900 mb-2">Campanhas recentes</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {campaigns.slice(0, 15).map((c) => (
              <li key={c.id}>
                {c.id.slice(0, 8)}… — {c.status} — {c.row_count} linhas
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
