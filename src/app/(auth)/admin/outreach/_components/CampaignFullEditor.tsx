'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Loader2,
  Mail,
  MessageSquare,
  Save,
  Eye,
  Send,
  Plus,
  Ban,
  Undo2,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'
import { url as apiBaseUrl } from '@/constants/api'
import {
  appendCampaignRows,
  getCampaign,
  listEmailTemplates,
  listRegistryTemplates,
  listWhatsappSpecs,
  patchCampaign,
  previewCampaign,
  sendCampaign,
  type DatasetQuality,
  type OutreachCampaign,
  type RecipientRules,
  type RegistryTemplateMeta,
  type WhatsAppSpec,
} from '@/services/outreach'
import { DatasetQualityColumnBars, DatasetQualityTemplateBars } from './dataset-quality-charts'
import {
  normalizeRecipientRules,
  recipientRulesToApiPayload,
} from '@/utils/recipientRules'
import { RecipientRulesEditor } from './RecipientRulesEditor'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  preview_ready: 'Prévia',
  sending: 'Enviando',
  completed: 'Concluído',
  failed: 'Falhou',
}

const EDITABLE_STATUSES = new Set(['draft', 'preview_ready', 'failed'])

function allowsFullEdit(c: OutreachCampaign | undefined) {
  if (!c?.is_active) return false
  return EDITABLE_STATUSES.has(c.status)
}

function formatCampaignDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function SelectShell({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-base text-gray-900 shadow-sm outline-none transition',
        'hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-base font-semibold text-gray-900">{children}</label>
      {hint ? <p className="text-sm leading-relaxed text-gray-600">{hint}</p> : null}
    </div>
  )
}

function linesToList(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function listToLines(arr: string[] | undefined): string {
  return (arr ?? []).join('\n')
}

function DatasetQualitySummary({ dq }: { dq: DatasetQuality }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 text-sm text-slate-800">
      <p className="text-base font-bold text-slate-900">Métricas do dataset (pré-visualização)</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
          <p className="text-xs font-bold uppercase text-slate-500">Linhas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{dq.row_count}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
          <p className="text-xs font-bold uppercase text-slate-500">Com problema</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{dq.rows_with_any_issue}</p>
          <p className="text-xs text-slate-500">{dq.rows_with_any_issue_pct}%</p>
        </div>
        {typeof dq.skip_rows_count === 'number' ? (
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
            <p className="text-xs font-bold uppercase text-slate-500">skip_rows</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{dq.skip_rows_count}</p>
          </div>
        ) : null}
        {typeof dq.estimated_rows_to_process === 'number' ? (
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
            <p className="text-xs font-bold uppercase text-slate-500">Estimativa envio</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{dq.estimated_rows_to_process}</p>
          </div>
        ) : null}
      </div>
      <div className="max-h-64 space-y-3 overflow-auto">
        <DatasetQualityTemplateBars dq={dq} />
        <DatasetQualityColumnBars dq={dq} />
      </div>
      <details className="rounded-xl border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">JSON completo (métricas)</summary>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {JSON.stringify(dq, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default function CampaignFullEditor({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient()
  const hydrated = useRef(false)

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
  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery({
    queryKey: ['outreach-campaign', campaignId],
    queryFn: () => getCampaign(campaignId),
    enabled: Boolean(me?.is_superuser && campaignId),
  })

  const [channels, setChannels] = useState<string[]>(['email'])
  const [registryTemplateId, setRegistryTemplateId] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [whatsappSpecId, setWhatsappSpecId] = useState('')
  const [emailColumn, setEmailColumn] = useState('')
  const [phoneColumn, setPhoneColumn] = useState('')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [recipientRules, setRecipientRules] = useState<RecipientRules>(() => normalizeRecipientRules({}))
  const [dryRunLimit, setDryRunLimit] = useState(10)
  const [headerMediaUrl, setHeaderMediaUrl] = useState('')
  const [pixelBase, setPixelBase] = useState('')
  const [targetingAudienceMode, setTargetingAudienceMode] = useState('all')
  const [targetingTestColumn, setTargetingTestColumn] = useState('')
  const [targetingTestValuesText, setTargetingTestValuesText] = useState('')
  const [requirePresentText, setRequirePresentText] = useState('')
  const [requireAbsentText, setRequireAbsentText] = useState('')
  const [predicatesJson, setPredicatesJson] = useState('[]')
  const [pacingMax, setPacingMax] = useState<string>('')
  const [pacingHours, setPacingHours] = useState<string>('')
  const [appendJson, setAppendJson] = useState('')
  const [pageError, setPageError] = useState<string | null>(null)
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof previewCampaign>> | null>(null)
  const [lgpdOk, setLgpdOk] = useState(false)

  useEffect(() => {
    hydrated.current = false
  }, [campaignId])

  useEffect(() => {
    if (!campaign || hydrated.current) return
    hydrated.current = true
    setChannels(campaign.channels?.length ? campaign.channels : ['email'])
    setRegistryTemplateId((campaign.registry_template_id || '').trim())
    setEmailTemplateId(campaign.email_template || '')
    setWhatsappSpecId(campaign.whatsapp_spec || '')
    setEmailColumn(campaign.email_column || '')
    setPhoneColumn(campaign.phone_column || '')
    setColumnMapping(
      campaign.column_mapping && typeof campaign.column_mapping === 'object' && !Array.isArray(campaign.column_mapping)
        ? { ...campaign.column_mapping }
        : {},
    )
    setRecipientRules(normalizeRecipientRules(campaign.recipient_rules))
    setDryRunLimit(Math.max(1, Math.min(500, Number(campaign.dry_run_sample_limit) || 10)))
    setHeaderMediaUrl((campaign.header_media_url || '').trim())
    setPixelBase((campaign.pixel_base_url || '').trim())
    setTargetingAudienceMode(campaign.targeting_audience_mode || 'all')
    setTargetingTestColumn((campaign.targeting_test_column || '').trim())
    setTargetingTestValuesText(listToLines(campaign.targeting_test_values))
    setRequirePresentText(listToLines(campaign.targeting_require_columns_present))
    setRequireAbsentText(listToLines(campaign.targeting_require_columns_absent))
    try {
      setPredicatesJson(JSON.stringify(campaign.targeting_column_predicates ?? [], null, 2))
    } catch {
      setPredicatesJson('[]')
    }
    setPacingMax(
      campaign.send_pacing_max_recipients != null ? String(campaign.send_pacing_max_recipients) : '',
    )
    setPacingHours(
      campaign.send_pacing_interval_hours != null ? String(campaign.send_pacing_interval_hours) : '',
    )
    setPreviewResult(null)
    setLgpdOk(false)
  }, [campaign])

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
        void emailTemplateId
      } else if (registryTemplateId && registryMeta?.required_vars_email) {
        registryMeta.required_vars_email.forEach((p) => keys.add(p))
      }
    }
    return Array.from(keys)
  }, [channels, whatsappSpecId, waSpec, registryTemplateId, registryMeta, emailTemplateId])

  const csvColumns = campaign?.csv_columns ?? []
  const canEdit = allowsFullEdit(campaign)

  const buildPatchBody = useCallback(() => {
    let predicates: unknown[] = []
    try {
      const parsed = JSON.parse(predicatesJson.trim() || '[]')
      predicates = Array.isArray(parsed) ? parsed : []
    } catch {
      throw new Error('Predicados (JSON) inválidos. Use um array JSON.')
    }
    const testVals = linesToList(targetingTestValuesText)
    const pacingMaxN = pacingMax.trim() === '' ? null : Number(pacingMax)
    const pacingHoursN = pacingHours.trim() === '' ? null : Number(pacingHours)
    if ((pacingMaxN === null) !== (pacingHoursN === null)) {
      throw new Error('Ritmo: preencha ambos «máx. destinos» e «horas» ou deixe os dois vazios.')
    }
    return {
      channels,
      column_mapping: columnMapping,
      recipient_rules: recipientRulesToApiPayload(recipientRules),
      email_column: emailColumn,
      phone_column: phoneColumn,
      registry_template_id: registryTemplateId.trim(),
      email_template: emailTemplateId || null,
      whatsapp_spec: whatsappSpecId || null,
      dry_run_sample_limit: dryRunLimit,
      header_media_url: headerMediaUrl.trim(),
      pixel_base_url: pixelBase.trim(),
      targeting_audience_mode: targetingAudienceMode,
      targeting_test_column: targetingTestColumn.trim(),
      targeting_test_values: testVals,
      targeting_require_columns_present: linesToList(requirePresentText),
      targeting_require_columns_absent: linesToList(requireAbsentText),
      targeting_column_predicates: predicates,
      send_pacing_max_recipients: pacingMaxN,
      send_pacing_interval_hours: pacingHoursN,
    }
  }, [
    channels,
    columnMapping,
    recipientRules,
    emailColumn,
    phoneColumn,
    registryTemplateId,
    emailTemplateId,
    whatsappSpecId,
    dryRunLimit,
    headerMediaUrl,
    pixelBase,
    targetingAudienceMode,
    targetingTestColumn,
    targetingTestValuesText,
    requirePresentText,
    requireAbsentText,
    predicatesJson,
    pacingMax,
    pacingHours,
  ])

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = buildPatchBody()
      return patchCampaign(campaignId, body)
    },
    onSuccess: (c) => {
      void queryClient.setQueryData(['outreach-campaign', campaignId], c)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const previewMut = useMutation({
    mutationFn: async () => {
      const body = buildPatchBody()
      await patchCampaign(campaignId, body)
      return previewCampaign(campaignId)
    },
    onSuccess: (data) => {
      setPreviewResult(data)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', campaignId] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const sendMut = useMutation({
    mutationFn: async () => {
      const base = pixelBase.trim() || apiBaseUrl.replace(/\/v1\/?$/, '')
      return sendCampaign(campaignId, base || undefined)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', campaignId] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const deactivateMut = useMutation({
    mutationFn: () => patchCampaign(campaignId, { is_active: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', campaignId] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const reactivateMut = useMutation({
    mutationFn: () => patchCampaign(campaignId, { is_active: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', campaignId] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const appendMut = useMutation({
    mutationFn: async () => {
      let rows: Record<string, unknown>[]
      try {
        const parsed = JSON.parse(appendJson.trim() || '[]')
        if (!Array.isArray(parsed)) throw new Error('O JSON deve ser um array de objetos (linhas).')
        rows = parsed as Record<string, unknown>[]
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : 'JSON inválido.')
      }
      if (!rows.length) throw new Error('Indique pelo menos uma linha no array JSON.')
      return appendCampaignRows(campaignId, rows)
    },
    onSuccess: (c) => {
      void queryClient.setQueryData(['outreach-campaign', campaignId], c)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      setAppendJson('')
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const setMap = useCallback((key: string, col: string) => {
    setColumnMapping((m) => ({ ...m, [key]: col }))
  }, [])

  if (meLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-16">
        <Skeleton className="h-12 w-1/2 rounded-xl" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!me?.is_superuser) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Alert variant="error" message="Acesso restrito a superusuários." />
        <Link href="/admin/outreach" className="mt-4 inline-block text-primary hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  if (campaignLoading) {
    return (
      <div className="mx-auto flex max-w-[1600px] items-center justify-center px-6 py-24">
        <Loader2 className="size-12 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  if (campaignError || !campaign) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Alert variant="error" message="Não foi possível carregar esta campanha." />
        <Link href="/admin/outreach" className="mt-4 inline-block font-semibold text-primary hover:underline">
          ← Lista de campanhas
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/90 to-slate-50 pb-20">
      <header className="border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/admin/outreach"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Lista de campanhas
            </Link>
            <TextTitle className="mt-3 text-2xl text-slate-900 md:text-3xl">Editor de campanha</TextTitle>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Ecrã completo para rever dados, mapeamento, regras, público-alvo, ritmo e voltar a pré-visualizar ou
              enviar (reenviar após corrigir falhas).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm text-slate-800">{campaign.id}</code>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700 ring-1 ring-slate-200">
                {STATUS_LABELS[campaign.status] ?? campaign.status}
              </span>
              {campaign.is_active === false ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  Desativada
                </span>
              ) : null}
              <span className="text-sm text-slate-500">
                {campaign.row_count} linhas · actualizada {formatCampaignDate(campaign.modified) || '—'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 space-y-10">
          {pageError ? <Alert variant="error" message={pageError} /> : null}

          {!canEdit ? (
            <Alert
              variant="warning"
              message={
                campaign.is_active === false
                  ? 'Campanha desactivada: reative-a na barra lateral de acções para poder gravar alterações.'
                  : 'Neste estado (a enviar ou concluída) só pode visualizar. Use a lista para outras campanhas ou crie uma nova.'
              }
            />
          ) : null}

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Dados do ficheiro</h2>
            <p className="mt-2 text-base text-slate-600">
              Colunas detectadas no dataset ({csvColumns.length}). Para acrescentar linhas use a secção no fundo da
              página (JSON).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {csvColumns.map((c) => (
                <span
                  key={c}
                  className="inline-flex rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-sm font-medium text-slate-800 ring-1 ring-slate-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Canais e modelos</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(
                [
                  { id: 'email' as const, label: 'E-mail', Icon: Mail },
                  { id: 'whatsapp' as const, label: 'WhatsApp', Icon: MessageSquare },
                ] as const
              ).map(({ id, label, Icon }) => {
                const on = channels.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() =>
                      setChannels((ch) => (ch.includes(id) ? ch.filter((x) => x !== id) : [...ch, id]))
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-5 text-left text-base transition',
                      on
                        ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <Icon className="size-6 text-primary" />
                    <span className="font-semibold text-slate-900">{label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel hint="Opcional se usar só modelos do banco.">Registry (template código)</FieldLabel>
                <SelectShell
                  value={registryTemplateId}
                  disabled={!canEdit}
                  onChange={(e) => setRegistryTemplateId(e.target.value)}
                >
                  <option value="">—</option>
                  {(registry?.templates ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </SelectShell>
              </div>
              <div className="space-y-2">
                <FieldLabel>Template e-mail (BD)</FieldLabel>
                <SelectShell
                  value={emailTemplateId}
                  disabled={!canEdit}
                  onChange={(e) => setEmailTemplateId(e.target.value)}
                >
                  <option value="">—</option>
                  {(emailTpls ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </SelectShell>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <FieldLabel>Template WhatsApp (Meta / BD)</FieldLabel>
                <SelectShell
                  value={whatsappSpecId}
                  disabled={!canEdit}
                  onChange={(e) => setWhatsappSpecId(e.target.value)}
                >
                  <option value="">—</option>
                  {(waSpecs ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.template_name} ({s.lang})
                    </option>
                  ))}
                </SelectShell>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Mapeamento</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {channels.includes('email') ? (
                <div className="space-y-2">
                  <FieldLabel>Coluna do e-mail</FieldLabel>
                  <SelectShell value={emailColumn} disabled={!canEdit} onChange={(e) => setEmailColumn(e.target.value)}>
                    <option value="">—</option>
                    {csvColumns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </SelectShell>
                </div>
              ) : null}
              {channels.includes('whatsapp') ? (
                <div className="space-y-2">
                  <FieldLabel>Coluna do telefone</FieldLabel>
                  <SelectShell value={phoneColumn} disabled={!canEdit} onChange={(e) => setPhoneColumn(e.target.value)}>
                    <option value="">—</option>
                    {csvColumns.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </SelectShell>
                </div>
              ) : null}
            </div>

            {varsToMap.length > 0 ? (
              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full min-w-[480px] text-left text-base">
                  <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Variável</th>
                      <th className="px-4 py-3">Coluna CSV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {varsToMap.map((v) => (
                      <tr key={v}>
                        <td className="px-4 py-3 font-mono text-sm text-slate-900">{v}</td>
                        <td className="px-4 py-3">
                          <SelectShell
                            className="border-0 bg-slate-50 py-3 text-base"
                            disabled={!canEdit}
                            value={columnMapping[v] ?? ''}
                            onChange={(e) => setMap(v, e.target.value)}
                          >
                            <option value="">—</option>
                            {csvColumns.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </SelectShell>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-base text-slate-500">Sem variáveis de template detectadas para mapear.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Regras por destinatário</h2>
            <p className="mt-2 text-base text-slate-600">empty_fill, by_row e skip_rows — mesma API que o assistente.</p>
            <fieldset disabled={!canEdit} className="mt-6 min-w-0 border-0 p-0">
              <RecipientRulesEditor
                value={recipientRules}
                onChange={setRecipientRules}
                variableSuggestions={Array.from(new Set([...varsToMap, ...csvColumns]))}
              />
            </fieldset>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Opções de envio e URL</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Limite de linhas na pré-visualização (dry-run)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={500}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={dryRunLimit}
                  onChange={(e) => setDryRunLimit(Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel hint="Cabeçalho de media no WhatsApp, se o template exigir.">URL media cabeçalho</FieldLabel>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={headerMediaUrl}
                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <FieldLabel>URL base do pixel</FieldLabel>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={pixelBase}
                  onChange={(e) => setPixelBase(e.target.value)}
                  placeholder={apiBaseUrl.replace(/\/v1\/?$/, '')}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Público-alvo e ritmo</h2>
            <p className="mt-2 text-base text-slate-600">
              Alinhado aos campos <span className="font-mono text-sm">targeting_*</span> e{' '}
              <span className="font-mono text-sm">send_pacing_*</span> da API.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Modo de audiência</FieldLabel>
                <SelectShell
                  value={targetingAudienceMode}
                  disabled={!canEdit}
                  onChange={(e) => setTargetingAudienceMode(e.target.value)}
                >
                  <option value="all">Todas as linhas (com filtros por coluna)</option>
                  <option value="test_group">Só linhas com valor na coluna de teste</option>
                </SelectShell>
              </div>
              <div className="space-y-2">
                <FieldLabel>Coluna de teste (se modo teste)</FieldLabel>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={targetingTestColumn}
                  onChange={(e) => setTargetingTestColumn(e.target.value)}
                  placeholder="ex.: Segmento"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <FieldLabel hint="Um valor por linha (lista enviada à API).">Valores permitidos na coluna de teste</FieldLabel>
                <textarea
                  disabled={!canEdit}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={targetingTestValuesText}
                  onChange={(e) => setTargetingTestValuesText(e.target.value)}
                  placeholder="Imobiliárias&#10;Outro segmento"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel hint="Uma coluna por linha.">Obrigar colunas preenchidas</FieldLabel>
                <textarea
                  disabled={!canEdit}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={requirePresentText}
                  onChange={(e) => setRequirePresentText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel hint="Uma coluna por linha.">Obrigar colunas vazias</FieldLabel>
                <textarea
                  disabled={!canEdit}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={requireAbsentText}
                  onChange={(e) => setRequireAbsentText(e.target.value)}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <FieldLabel hint='Array JSON de objectos com column, op e value; op ∈ gt,gte,lt,lte,eq,neq,contains,in.'>
                  Predicados (JSON)
                </FieldLabel>
                <textarea
                  disabled={!canEdit}
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={predicatesJson}
                  onChange={(e) => setPredicatesJson(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Máx. destinos por onda (ritmo)</FieldLabel>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={pacingMax}
                  onChange={(e) => setPacingMax(e.target.value)}
                  placeholder="vazio = sem ritmo"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>Horas entre ondas</FieldLabel>
                <input
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={pacingHours}
                  onChange={(e) => setPacingHours(e.target.value)}
                  placeholder="ex.: 6"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
            <h2 className="text-xl font-bold text-slate-900">Acrescentar linhas (JSON)</h2>
            <p className="mt-2 text-base text-slate-600">
              Array JSON de objectos com as mesmas chaves que o CSV. Só em rascunho / prévia / falhou (API). Estado
              passa a rascunho após acrescentar.
            </p>
            <textarea
              rows={12}
              disabled={!canEdit}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={appendJson}
              onChange={(e) => setAppendJson(e.target.value)}
              placeholder='[{"Email":"a@b.com","Telefone":"5511999999999"}, …]'
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4 h-12 rounded-xl px-6 text-base"
              disabled={!canEdit || appendMut.isPending}
              onClick={() => appendMut.mutate()}
              icon={appendMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            >
              Acrescentar ao dataset
            </Button>
          </section>

          {previewResult ? (
            <section className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8 lg:p-10">
              <h2 className="text-xl font-bold text-slate-900">Última pré-visualização</h2>
              {previewResult.mapping_errors.length > 0 ? (
                <Alert variant="warning" message={previewResult.mapping_errors.join(' · ')} />
              ) : null}
              {previewResult.dataset_quality ? (
                <DatasetQualitySummary dq={previewResult.dataset_quality} />
              ) : null}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">E-mail</th>
                      <th className="px-3 py-3">WhatsApp</th>
                      <th className="px-3 py-3">Erros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewResult.previews.map((row) => (
                      <tr key={row.row_index} className="bg-white">
                        <td className="px-3 py-2 font-mono text-xs">{row.row_index}</td>
                        <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs">
                          {row.email ? JSON.stringify(row.email) : '—'}
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs">
                          {row.whatsapp ? JSON.stringify(row.whatsapp) : '—'}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {row.errors.length ? (
                            <span className="text-red-700">{row.errors.join('; ')}</span>
                          ) : (
                            <span className="text-emerald-700">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </main>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md ring-1 ring-slate-900/[0.04]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Acções</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button
                type="button"
                className="h-12 w-full justify-center rounded-xl text-base"
                disabled={!canEdit || saveMut.isPending}
                onClick={() => saveMut.mutate()}
                icon={saveMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
              >
                Guardar alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full justify-center rounded-xl text-base"
                disabled={!canEdit || previewMut.isPending}
                onClick={() => previewMut.mutate()}
                icon={previewMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Eye className="size-5" />}
              >
                Gravar e pré-visualizar
              </Button>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-slate-300 text-primary"
                  checked={lgpdOk}
                  onChange={(e) => setLgpdOk(e.target.checked)}
                  disabled={!canEdit}
                />
                <span className="leading-relaxed text-slate-700">
                  Confirmo base legal (LGPD) para reenvio / envio em massa.
                </span>
              </label>
              <Button
                type="button"
                className="h-12 w-full justify-center rounded-xl bg-emerald-600 text-base text-white hover:bg-emerald-700"
                disabled={!canEdit || !lgpdOk || sendMut.isPending || campaign.status !== 'preview_ready'}
                onClick={() => sendMut.mutate()}
                icon={sendMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              >
                Enviar / reenfileirar
              </Button>
              {campaign.status !== 'preview_ready' && canEdit ? (
                <p className="text-xs leading-relaxed text-slate-500">
                  O botão de envio só fica activo com estado «Prévia» na API. Use «Gravar e pré-visualizar» primeiro.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Campanha</p>
            <div className="mt-3 flex flex-col gap-2">
              {campaign.is_active === false ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  disabled={reactivateMut.isPending}
                  onClick={() => reactivateMut.mutate()}
                  icon={reactivateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                >
                  Reativar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-amber-200 text-amber-950"
                  disabled={deactivateMut.isPending}
                  onClick={() => {
                    if (
                      campaign.status === 'sending' &&
                      !window.confirm('Interromper envio activo? A API marcará como falhou.')
                    ) {
                      return
                    }
                    void deactivateMut.mutate()
                  }}
                  icon={deactivateMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                >
                  Desactivar
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
