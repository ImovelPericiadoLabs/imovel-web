'use client'

import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone,
  RefreshCw,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Inbox,
  Eye,
  Send,
  RotateCcw,
  ListChecks,
  BarChart3,
  Search,
  LayoutGrid,
  Download,
  Users,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
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
  getCampaign,
  listCampaignRecipients,
  type DatasetQuality,
  type OutreachCampaign,
  type RegistryTemplateMeta,
  type WhatsAppSpec,
} from '@/services/outreach'
import { spreadsheetFileToCsvFile } from '@/utils/outreachXlsx'

type Step = 1 | 2 | 3 | 4 | 5

type CampaignPreviewPayload = Awaited<ReturnType<typeof previewCampaign>>

const LIST_PAGE_SIZE = 100

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  preview_ready: 'Prévia',
  sending: 'Enviando',
  completed: 'Concluído',
  failed: 'Falhou',
}

const DEFAULT_RECIPIENT_RULES_JSON = `{
  "empty_fill": {},
  "by_row": {},
  "skip_rows": []
}`

const STEPS: { n: Step; label: string; short: string }[] = [
  { n: 1, label: 'Canais', short: '1' },
  { n: 2, label: 'Modelo + CSV', short: '2' },
  { n: 3, label: 'Mapeamento', short: '3' },
  { n: 4, label: 'Prévia', short: '4' },
  { n: 5, label: 'Envio', short: '5' },
]

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s.includes('fail') || s.includes('error') || s.includes('invalid')) {
    return 'bg-red-50 text-red-800 ring-1 ring-red-200/80'
  }
  if (s.includes('complete') || s.includes('sent') || s.includes('done') || s.includes('success')) {
    return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80'
  }
  if (s.includes('queue') || s.includes('process') || s.includes('pend') || s.includes('run')) {
    return 'bg-amber-50 text-amber-950 ring-1 ring-amber-200/80'
  }
  if (s.includes('draft') || s.includes('new')) {
    return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/80'
  }
  return 'bg-gray-50 text-gray-800 ring-1 ring-gray-200/80'
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-800">{children}</label>
      {hint ? <p className="text-xs leading-relaxed text-gray-500">{hint}</p> : null}
    </div>
  )
}

function DatasetQualityPanel({ dq }: { dq: DatasetQuality }) {
  const colEntries = Object.entries(dq.columns ?? {})
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/90 p-4 ring-1 ring-slate-200/60">
      <div className="flex flex-wrap items-center gap-2">
        <BarChart3 className="size-5 shrink-0 text-primary" aria-hidden />
        <h3 className="text-sm font-bold text-gray-900">Métricas do ficheiro (dataset completo)</h3>
      </div>
      <p className="text-xs leading-relaxed text-gray-600">
        Contagem de células vazias por coluna, canais (e-mail / WhatsApp) e variáveis do template. As regras JSON
        (empty_fill, by_row) já entram neste cálculo após gravar no passo anterior.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200/80">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Linhas no CSV</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{dq.row_count}</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200/80">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Com algum problema</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{dq.rows_with_any_issue}</p>
          <p className="text-[10px] text-slate-500">{dq.rows_with_any_issue_pct}%</p>
        </div>
        {typeof dq.skip_rows_count === 'number' ? (
          <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ignorar no envio</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{dq.skip_rows_count}</p>
            <p className="text-[10px] text-slate-500">skip_rows</p>
          </div>
        ) : null}
        {typeof dq.estimated_rows_to_process === 'number' ? (
          <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200/80">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Estimativa a processar</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{dq.estimated_rows_to_process}</p>
          </div>
        ) : null}
      </div>

      {dq.channel_gaps && Object.keys(dq.channel_gaps).length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
          <p className="mb-2 font-bold text-slate-900">Canais</p>
          <ul className="space-y-2">
            {Object.entries(dq.channel_gaps).map(([k, v]) => (
              <li key={k} className="font-mono text-[11px] leading-relaxed">
                <span className="font-semibold text-primary">{k}</span>: {JSON.stringify(v)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(dq.template_variables?.whatsapp?.length ?? 0) > 0 || (dq.template_variables?.email?.length ?? 0) > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
          <p className="mb-2 font-bold text-slate-900">Variáveis do template (vazias após mapeamento + regras)</p>
          {dq.template_variables.whatsapp?.length ? (
            <ul className="mb-2 list-inside list-disc text-slate-700">
              {dq.template_variables.whatsapp.map((w) => (
                <li key={w.variable}>
                  <span className="font-mono">{w.variable}</span>: {w.empty_rows} vazias ({w.empty_pct}%)
                  {w.mapped_csv_column ? (
                    <span className="text-slate-500"> · coluna {w.mapped_csv_column}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {dq.template_variables.email?.length ? (
            <ul className="list-inside list-disc text-slate-700">
              {dq.template_variables.email.map((w) => (
                <li key={w.variable}>
                  <span className="font-mono">{w.variable}</span>: {w.empty_rows} vazias ({w.empty_pct}%)
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {colEntries.length > 0 ? (
        <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Colunas CSV · % vazio</p>
          <table className="w-full text-left text-[11px]">
            <thead className="text-slate-500">
              <tr>
                <th className="px-2 py-1">Coluna</th>
                <th className="px-2 py-1">Vazias</th>
                <th className="px-2 py-1">Preenchidas</th>
                <th className="px-2 py-1">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {colEntries.map(([name, st]) => (
                <tr key={name}>
                  <td className="px-2 py-1 font-mono">{name}</td>
                  <td className="px-2 py-1 tabular-nums">{st.empty}</td>
                  <td className="px-2 py-1 tabular-nums">{st.non_empty}</td>
                  <td className="px-2 py-1 tabular-nums">{st.empty_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {dq.sample_problem_row_indices?.length ? (
        <p className="text-[11px] text-slate-600">
          <span className="font-semibold">Amostra de linhas com problema (índice 0-based):</span>{' '}
          {dq.sample_problem_row_indices.join(', ')}
        </p>
      ) : null}
    </div>
  )
}

function SelectShell({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 shadow-sm outline-none transition',
        'hover:border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10',
        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export default function AdminOutreachPage() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const { data: registry, isFetching: registryLoading } = useQuery({
    queryKey: ['outreach-registry'],
    queryFn: listRegistryTemplates,
    enabled: Boolean(me?.is_superuser),
  })
  const { data: waSpecs, isFetching: waLoading } = useQuery({
    queryKey: ['outreach-wa-specs'],
    queryFn: listWhatsappSpecs,
    enabled: Boolean(me?.is_superuser),
  })
  const { data: emailTpls, isFetching: emailLoading } = useQuery({
    queryKey: ['outreach-email-tpls'],
    queryFn: listEmailTemplates,
    enabled: Boolean(me?.is_superuser),
  })
  const [listStatus, setListStatus] = useState('')
  const [listChannel, setListChannel] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
  const [recipientsOffset, setRecipientsOffset] = useState(0)
  const [panelTab, setPanelTab] = useState<'resumo' | 'destinatarios'>('resumo')

  useEffect(() => {
    const t = window.setTimeout(() => setListSearch(searchDraft.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchDraft])

  useEffect(() => {
    setRecipientsOffset(0)
  }, [selectedPanelId])

  const { data: campaignListData, isFetching: campaignsLoading } = useQuery({
    queryKey: ['outreach-campaigns', listStatus, listChannel, listSearch],
    queryFn: () =>
      listCampaigns({
        status: listStatus || undefined,
        channel: listChannel || undefined,
        search: listSearch || undefined,
        limit: LIST_PAGE_SIZE,
        offset: 0,
      }),
    enabled: Boolean(me?.is_superuser),
  })

  const campaigns = campaignListData?.results ?? []
  const campaignTotal = campaignListData?.total ?? 0
  const statusCounts = campaignListData?.status_counts ?? {}

  const RECIP_PAGE = 40
  const { data: panelCampaign, isFetching: panelCampaignLoading } = useQuery({
    queryKey: ['outreach-campaign', selectedPanelId],
    queryFn: () => getCampaign(selectedPanelId!),
    enabled: Boolean(me?.is_superuser && selectedPanelId),
  })

  const { data: recipientsData, isFetching: recipientsLoading } = useQuery({
    queryKey: ['outreach-recipients', selectedPanelId, recipientsOffset],
    queryFn: () => listCampaignRecipients(selectedPanelId!, { limit: RECIP_PAGE, offset: recipientsOffset }),
    enabled: Boolean(me?.is_superuser && selectedPanelId),
  })

  const [step, setStep] = useState<Step>(1)
  const [channels, setChannels] = useState<string[]>(['email'])
  const [registryTemplateId, setRegistryTemplateId] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [whatsappSpecId, setWhatsappSpecId] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvDragOver, setCsvDragOver] = useState(false)
  const [csvConverting, setCsvConverting] = useState(false)
  const [recipientRulesText, setRecipientRulesText] = useState(DEFAULT_RECIPIENT_RULES_JSON)
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
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const registryMeta: RegistryTemplateMeta | undefined = useMemo(
    () => registry?.templates.find((t) => t.id === registryTemplateId),
    [registry, registryTemplateId],
  )
  const waSpec: WhatsAppSpec | undefined = useMemo(
    () => waSpecs?.find((s) => s.id === whatsappSpecId),
    [waSpecs, whatsappSpecId],
  )
  const emailTpl = useMemo(
    () => emailTpls?.find((t) => t.id === emailTemplateId),
    [emailTpls, emailTemplateId],
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

  const resetWizard = useCallback(() => {
    setStep(1)
    setChannels(['email'])
    setRegistryTemplateId('')
    setEmailTemplateId('')
    setWhatsappSpecId('')
    setCsvFile(null)
    setCampaign(null)
    setSampleRows([])
    setEmailColumn('')
    setPhoneColumn('')
    setColumnMapping({})
    setRecipientRulesText(DEFAULT_RECIPIENT_RULES_JSON)
    setPixelBase('')
    setLgpdOk(false)
    setPreviewResult(null)
    setCsvConverting(false)
    setPageError(null)
    setSyncSummary(null)
    setSelectedPanelId(null)
    setSearchDraft('')
    setListSearch('')
    setListStatus('')
    setListChannel('')
    setPanelTab('resumo')
  }, [])

  const autoMapColumns = useCallback(() => {
    const cols = campaign?.csv_columns ?? []
    setColumnMapping((prev) => {
      const next = { ...prev }
      for (const v of varsToMap) {
        const exact = cols.find((c) => c === v)
        if (exact) next[v] = exact
      }
      return next
    })
  }, [campaign?.csv_columns, varsToMap])

  const copyText = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      /* ignore */
    }
  }, [])

  const exportWizardMapping = useCallback(() => {
    if (!campaign) return
    let recipient_rules: Record<string, unknown> = {}
    try {
      recipient_rules = recipientRulesText.trim()
        ? (JSON.parse(recipientRulesText) as Record<string, unknown>)
        : {}
    } catch {
      recipient_rules = { _error: 'JSON de regras inválido no export' }
    }
    const payload = {
      campaign_id: campaign.id,
      email_column: emailColumn,
      phone_column: phoneColumn,
      column_mapping: columnMapping,
      channels,
      recipient_rules,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outreach-mapeamento-${campaign.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [campaign, emailColumn, phoneColumn, columnMapping, channels, recipientRulesText])

  const ingestSpreadsheetOrCsv = useCallback(async (f: File | null) => {
    if (!f) {
      setCsvFile(null)
      return
    }
    setPageError(null)
    const lower = f.name.toLowerCase()
    const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls')
    try {
      if (isExcel) {
        setCsvConverting(true)
        const csv = await spreadsheetFileToCsvFile(f)
        setCsvFile(csv)
      } else if (lower.endsWith('.csv') || f.type === 'text/csv' || f.type === 'application/vnd.ms-excel') {
        setCsvFile(f)
      } else {
        setPageError('Formato não suportado. Use .csv, .xlsx ou .xls.')
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Não foi possível ler o Excel.')
    } finally {
      setCsvConverting(false)
    }
  }, [])

  const onCsvDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setCsvDragOver(false)
      const f = e.dataTransfer.files?.[0]
      if (f) void ingestSpreadsheetOrCsv(f)
    },
    [ingestSpreadsheetOrCsv],
  )

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
      setRecipientRulesText(DEFAULT_RECIPIENT_RULES_JSON)
      setStep(3)
      setPageError(null)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const patchMut = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('Sem campanha.')
      let recipient_rules: Record<string, unknown> = {}
      try {
        recipient_rules = recipientRulesText.trim()
          ? (JSON.parse(recipientRulesText) as Record<string, unknown>)
          : {}
      } catch {
        throw new Error('JSON inválido em "Regras por destinatário". Corrija antes de continuar.')
      }
      return patchCampaign(campaign.id, {
        email_column: emailColumn,
        phone_column: phoneColumn,
        column_mapping: columnMapping,
        channels,
        registry_template_id: registryTemplateId.trim(),
        email_template: emailTemplateId || null,
        whatsapp_spec: whatsappSpecId || null,
        recipient_rules,
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
    return (
      <div className="min-h-[50vh] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-10 w-2/3 rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!me?.is_superuser) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col justify-center px-4 py-12">
        <Alert variant="error" message="Acesso restrito a superusuários." />
        <Link href="/consultas" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
          Voltar às consultas
        </Link>
      </div>
    )
  }

  const columns = campaign?.csv_columns ?? []
  const tplLoading = registryLoading || waLoading || emailLoading

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(11,27,58,0.06),transparent)] pb-28 md:pb-16">
      <div className="border-b border-slate-800/10 bg-[#0b1b3a] text-center text-[11px] font-medium tracking-wide text-slate-300">
        Área restrita · operações de campanha (superusuário)
      </div>
      <div className="border-b border-slate-200/90 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10 xl:py-7">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
              <Megaphone className="size-7 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <TextTitle className="text-xl text-gray-900 md:text-2xl">Outreach</TextTitle>
              <TextSubtitle className="mt-1 max-w-xl text-sm text-gray-600 md:text-[15px]">
                Campanhas em massa por e-mail e WhatsApp: modelos, CSV, mapeamento, pré-visualização e envio.
              </TextSubtitle>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl text-sm"
              onClick={resetWizard}
              icon={<RotateCcw className="size-4" />}
            >
              Novo fluxo
            </Button>
            <Link
              href="/consultas"
              className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary"
            >
              Consultas
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start lg:gap-10 lg:px-10 xl:grid-cols-[minmax(0,56rem)_minmax(20rem,26rem)] 2xl:grid-cols-[minmax(0,58rem)_minmax(22rem,28rem)]">
        <div className="min-w-0 space-y-6 xl:space-y-8">
          {/* Stepper */}
          <nav aria-label="Etapas da campanha" className="overflow-x-auto pb-1">
            <ol className="flex min-w-max items-center gap-1 sm:gap-2 md:min-w-0 md:flex-wrap">
              {STEPS.map((s, i) => {
                const active = step === s.n
                const done = step > s.n
                return (
                  <li key={s.n} className="flex items-center">
                    <button
                      type="button"
                      disabled={s.n > step}
                      onClick={() => {
                        if (s.n < step) setStep(s.n)
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                        done && 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/70',
                        active && !done && 'bg-primary text-white shadow-md shadow-primary/25',
                        !active && !done && 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50',
                        s.n > step && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] sm:size-7 sm:text-xs',
                          done && 'bg-emerald-600 text-white',
                          active && !done && 'bg-white/20 text-white',
                          !active && !done && 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {done ? <Check className="size-3.5" strokeWidth={3} /> : s.short}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.short}</span>
                    </button>
                    {i < STEPS.length - 1 ? (
                      <ChevronRight className="mx-0.5 size-4 shrink-0 text-gray-300 sm:mx-1" aria-hidden />
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </nav>

          {pageError ? <Alert variant="error" message={pageError} /> : null}

          {step === 1 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] md:p-8">
              <div className="mb-6 flex items-center gap-2">
                <ListChecks className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Canais de envio</h2>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Escolha pelo menos um canal. Você poderá combinar e-mail (HTML do banco) e WhatsApp (templates aprovados
                na Meta).
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { id: 'email' as const, label: 'E-mail', desc: 'HTML do template no banco + pixel de abertura.', Icon: Mail },
                    {
                      id: 'whatsapp' as const,
                      label: 'WhatsApp',
                      desc: 'Mensagens via API com templates sincronizados.',
                      Icon: MessageSquare,
                    },
                  ] as const
                ).map(({ id, label, desc, Icon }) => {
                  const on = channels.includes(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setChannels((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                      }
                      className={cn(
                        'flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition md:p-5',
                        on
                          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/80',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex size-10 items-center justify-center rounded-xl',
                            on ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <span className="text-base font-bold text-gray-900">{label}</span>
                        <span
                          className={cn(
                            'ml-auto inline-flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold',
                            on ? 'border-primary bg-primary text-white' : 'border-gray-300 text-transparent',
                          )}
                        >
                          ✓
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-gray-600 md:text-sm">{desc}</p>
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <Button className="h-11 rounded-xl px-8" onClick={() => setStep(2)} disabled={channels.length === 0}>
                  Continuar
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] md:p-8">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">Modelos e arquivo</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-600">
                    Sincronize templates da Meta quando necessário, escolha modelos e envie o CSV com destinatários.
                  </p>
                </div>
                <div className="shrink-0 justify-self-start sm:justify-self-end sm:pt-0.5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-auto min-w-[10.5rem] rounded-xl px-4 text-sm"
                    disabled={syncMut.isPending}
                    onClick={() => syncMut.mutate()}
                    icon={<RefreshCw className={cn('size-4', syncMut.isPending && 'animate-spin')} />}
                  >
                    Sincronizar Meta
                  </Button>
                </div>
              </div>
              {syncSummary ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-slate-200/80">
                  {syncSummary}
                </p>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel hint="Templates cadastrados no banco e aprovados na Meta.">
                    WhatsApp (template DB)
                  </FieldLabel>
                  {tplLoading ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <SelectShell value={whatsappSpecId} onChange={(e) => setWhatsappSpecId(e.target.value)}>
                      <option value="">Selecione um template…</option>
                      {waSpecs?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.template_name} · {s.lang}
                          {!s.is_active ? ' (inativo)' : ''}
                        </option>
                      ))}
                    </SelectShell>
                  )}
                  <p className="text-xs text-gray-500">{waSpecs?.length ?? 0} template(s) carregado(s)</p>
                </div>

                <div className="space-y-2">
                  <FieldLabel hint="Opcional se você usar só variáveis do registry.">E-mail (template DB)</FieldLabel>
                  {tplLoading ? (
                    <Skeleton className="h-11 w-full rounded-xl" />
                  ) : (
                    <SelectShell value={emailTemplateId} onChange={(e) => setEmailTemplateId(e.target.value)}>
                      <option value="">Nenhum / depois no HTML</option>
                      {emailTpls?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </SelectShell>
                  )}
                  {emailTpl ? (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Assunto:</span> {emailTpl.subject_template}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">{emailTpls?.length ?? 0} template(s) carregado(s)</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel hint="Modelo de código para variáveis padrão (cartório etc.).">Registry (código)</FieldLabel>
                {tplLoading ? (
                  <Skeleton className="h-11 w-full rounded-xl" />
                ) : (
                  <SelectShell value={registryTemplateId} onChange={(e) => setRegistryTemplateId(e.target.value)}>
                    <option value="">Nenhum</option>
                    {registry?.templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id.slice(0, 10)}… · {t.requires_media ? 'com mídia' : 'sem mídia'}
                      </option>
                    ))}
                  </SelectShell>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel hint="CSV/Excel: conversão no navegador (primeira folha). O servidor aceita ficheiros grandes (limite configurável; 0 = sem limite na API). Para listas muito grandes ou integrações, use a API JSON POST …/campaigns/create-from-rows/ (até 5000 linhas por pedido) e …/campaigns/{id}/append-rows/ para lotes seguintes.">
                  Arquivo de destinatários
                </FieldLabel>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      document.getElementById('outreach-csv-input')?.click()
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setCsvDragOver(true)
                  }}
                  onDragLeave={() => setCsvDragOver(false)}
                  onDrop={onCsvDrop}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition md:py-12',
                    csvDragOver ? 'border-primary bg-primary/[0.04]' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50',
                  )}
                  onClick={() => document.getElementById('outreach-csv-input')?.click()}
                >
                  <FileSpreadsheet className="mb-3 size-10 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-800">
                    {csvConverting
                      ? 'A converter Excel para CSV…'
                      : csvFile
                        ? csvFile.name
                        : 'Arraste CSV ou Excel aqui ou clique para escolher'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    .csv, .xlsx ou .xls · conversão local · cabeçalho na primeira linha
                  </p>
                  <input
                    id="outreach-csv-input"
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(e) => void ingestSpreadsheetOrCsv(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
                <Button variant="outline" className="h-11 rounded-xl sm:min-w-[8rem]" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  className="h-11 rounded-xl sm:min-w-[11rem]"
                  disabled={!csvFile || createMut.isPending || csvConverting}
                  onClick={() => createMut.mutate()}
                  icon={
                    createMut.isPending || csvConverting ? <Loader2 className="size-4 animate-spin" /> : undefined
                  }
                >
                  {csvConverting ? 'A processar…' : createMut.isPending ? 'Carregando…' : 'Carregar ficheiro'}
                </Button>
              </div>
            </section>
          )}

          {step === 3 && campaign && (
            <section className="relative space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] md:p-8">
              {previewMut.isPending ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-gray-700">Gerando pré-visualização…</p>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Mapeamento</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {campaign.row_count} linha(s) · colunas detectadas no CSV
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="max-w-[200px] truncate rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-800 sm:max-w-xs">
                    {campaign.id}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-lg px-3 text-xs"
                    onClick={() => copyText(campaign.id, 'cid')}
                    icon={copiedId === 'cid' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  >
                    {copiedId === 'cid' ? 'Copiado' : 'Copiar ID'}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
                {columns.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-medium text-slate-800 ring-1 ring-slate-200"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {channels.includes('email') ? (
                  <div className="space-y-2">
                    <FieldLabel>Coluna do e-mail</FieldLabel>
                    <SelectShell value={emailColumn} onChange={(e) => setEmailColumn(e.target.value)}>
                      <option value="">Selecione…</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </SelectShell>
                  </div>
                ) : null}
                {channels.includes('whatsapp') ? (
                  <div className="space-y-2">
                    <FieldLabel hint="Formato DDI+DDD+número quando aplicável.">Coluna do telefone</FieldLabel>
                    <SelectShell value={phoneColumn} onChange={(e) => setPhoneColumn(e.target.value)}>
                      <option value="">Selecione…</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </SelectShell>
                  </div>
                ) : null}
              </div>

              {varsToMap.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Variáveis do template → coluna CSV</h3>
                    <Button type="button" variant="outline" className="h-9 rounded-lg text-xs" onClick={autoMapColumns}>
                      Preencher nomes iguais
                    </Button>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full min-w-[280px] text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2.5">Variável</th>
                          <th className="px-3 py-2.5">Coluna CSV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {varsToMap.map((v) => (
                          <tr key={v}>
                            <td className="px-3 py-2 font-mono text-xs text-gray-900">{v}</td>
                            <td className="px-3 py-2">
                              <SelectShell
                                className="border-0 bg-gray-50 py-2 ring-0 focus:ring-2"
                                value={columnMapping[v] ?? ''}
                                onChange={(e) => setMap(v, e.target.value)}
                              >
                                <option value="">—</option>
                                {columns.map((c) => (
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
                </div>
              ) : null}

              <div className="space-y-2 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 ring-1 ring-indigo-100">
                <FieldLabel hint='JSON: "empty_fill" preenche variáveis vazias em todas as linhas; "by_row" usa índice da linha (0 = primeira linha de dados); "skip_rows" lista índices a não enviar. Chaves de variáveis coincidem com o mapeamento (e "email" / "phone" para canais).'>
                  Regras por destinatário (opcional)
                </FieldLabel>
                <textarea
                  className="min-h-[11rem] w-full resize-y rounded-xl border border-indigo-200/90 bg-white px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  spellCheck={false}
                  value={recipientRulesText}
                  onChange={(e) => setRecipientRulesText(e.target.value)}
                  aria-label="Regras JSON por destinatário"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-between sm:gap-3">
                <Button variant="outline" className="h-11 w-full shrink-0 rounded-xl sm:w-auto sm:min-w-[8rem]" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 w-full whitespace-normal rounded-xl border-slate-200 px-4 py-2.5 text-center text-sm leading-snug text-slate-700 sm:max-w-[14rem] sm:py-2.5"
                    onClick={exportWizardMapping}
                    icon={<Download className="size-4 shrink-0" />}
                  >
                    Exportar mapeamento (JSON)
                  </Button>
                  <Button
                    className="h-11 w-full shrink-0 rounded-xl sm:w-auto sm:min-w-[12rem]"
                    disabled={previewMut.isPending}
                    onClick={() => previewMut.mutate()}
                    icon={previewMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                  >
                    Pré-visualizar
                  </Button>
                </div>
              </div>
            </section>
          )}

          {step === 4 && previewResult === null && (
            <Alert variant="error" message="Pré-visualização indisponível. Volte ao mapeamento e tente novamente." />
          )}

          {step === 4 && previewResult !== null && (
            <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] md:p-8">
              <div className="flex items-center gap-2">
                <Eye className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-gray-900">Pré-visualização (dry-run)</h2>
              </div>

              {previewResult.mapping_errors.length > 0 ? (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
                  <div>
                    <p className="font-semibold text-amber-950">Avisos de mapeamento</p>
                    <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
                      {previewResult.mapping_errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {previewResult.dataset_quality ? (
                <DatasetQualityPanel dq={previewResult.dataset_quality} />
              ) : (
                <p className="text-xs text-gray-500">
                  Métricas completas do dataset não estão disponíveis nesta versão da API.
                </p>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">E-mail</th>
                      <th className="px-3 py-3">WhatsApp</th>
                      <th className="px-3 py-3">Erros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewResult.previews.map((row) => (
                      <tr key={row.row_index} className="bg-white">
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">{row.row_index}</td>
                        <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-gray-800">
                          {row.email ? JSON.stringify(row.email) : '—'}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-gray-800">
                          {row.whatsapp ? JSON.stringify(row.whatsapp) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          {row.errors.length ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200">
                              {row.errors.join('; ')}
                            </span>
                          ) : (
                            <span className="text-emerald-700">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="rounded-xl border border-gray-200 bg-slate-50/80 p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-gray-800">JSON completo</summary>
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(previewResult, null, 2)}
                </pre>
              </details>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                  checked={lgpdOk}
                  onChange={(e) => setLgpdOk(e.target.checked)}
                />
                <span className="text-sm leading-relaxed text-gray-700">
                  Confirmo que a lista foi obtida com <strong>base legal (LGPD)</strong> e que os destinatários podem
                  receber esta comunicação.
                </span>
              </label>

              <div className="space-y-2">
                <FieldLabel hint="Usado em links de pixel / rastreio quando aplicável.">URL base do pixel (opcional)</FieldLabel>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={pixelBase}
                  onChange={(e) => setPixelBase(e.target.value)}
                  placeholder={apiBaseUrl.replace(/\/v1\/?$/, '')}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between">
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => setStep(3)}>
                  Voltar
                </Button>
                <Button
                  className="h-11 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 sm:min-w-[12rem]"
                  disabled={!lgpdOk || sendMut.isPending}
                  onClick={() => sendMut.mutate()}
                  icon={sendMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                >
                  {sendMut.isPending ? 'Enfileirando…' : 'Enviar campanha'}
                </Button>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-sm ring-1 ring-emerald-100">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <Sparkles className="size-8 text-emerald-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Envio enfileirado</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                A campanha seguirá para processamento no servidor (Celery). Monitore logs e filas conforme o runbook da
                equipe.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button className="h-11 rounded-xl" variant="outline" onClick={() => window.location.reload()}>
                  Recarregar página
                </Button>
                <Button className="h-11 rounded-xl" onClick={resetWizard}>
                  Nova campanha
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Painel operacional: métricas, filtros e auditoria (API autenticada) */}
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1 xl:top-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Com filtro</span>
                <LayoutGrid className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{campaignTotal}</p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Rascunhos</span>
                <BarChart3 className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{statusCounts.draft ?? 0}</p>
              <p className="text-[10px] text-slate-400">total no projeto</p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Em envio</span>
                <RefreshCw className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{statusCounts.sending ?? 0}</p>
              <p className="text-[10px] text-slate-400">total no projeto</p>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Concluídas</span>
                <Check className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{statusCounts.completed ?? 0}</p>
              <p className="text-[10px] text-slate-400">total no projeto</p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-white p-5 shadow-sm ring-1 ring-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-5 shrink-0" />
              <p className="text-sm font-bold">Boas práticas</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-700 md:text-sm">
              <li>• Sincronize templates após mudanças na Meta.</li>
              <li>• Excel é convertido no navegador para CSV; o servidor só recebe texto.</li>
              <li>• Use pré-visualização: métricas de nulos e regras JSON antes do envio.</li>
              <li>• Confirme LGPD e origem da lista.</li>
              <li>• Use colunas claras no CSV (sem espaços estranhos).</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md ring-1 ring-slate-900/[0.04] md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="size-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Campanhas</h3>
              </div>
              <div className="flex items-center gap-2">
                {campaignsLoading ? <Loader2 className="size-4 animate-spin text-slate-400" aria-hidden /> : null}
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-xs font-semibold"
                  onClick={() => {
                    void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
                    if (selectedPanelId) {
                      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', selectedPanelId] })
                      void queryClient.invalidateQueries({ queryKey: ['outreach-recipients', selectedPanelId] })
                    }
                  }}
                  icon={<RefreshCw className="size-3.5" />}
                >
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Buscar por ID (UUID) ou registry…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <SelectShell
                value={listStatus}
                onChange={(e) => setListStatus(e.target.value)}
                className="h-10 rounded-xl text-sm"
              >
                <option value="">Todos os status</option>
                <option value="draft">Rascunho</option>
                <option value="preview_ready">Pronto (prévia)</option>
                <option value="sending">Enviando</option>
                <option value="completed">Concluído</option>
                <option value="failed">Falhou</option>
              </SelectShell>
              <SelectShell
                value={listChannel}
                onChange={(e) => setListChannel(e.target.value)}
                className="h-10 rounded-xl text-sm"
              >
                <option value="">Todos os canais</option>
                <option value="email">E-mail</option>
                <option value="whatsapp">WhatsApp</option>
              </SelectShell>
            </div>

            {campaigns.length > 0 ? (
              <ul className="max-h-[min(22rem,42vh)] space-y-2 overflow-y-auto pr-0.5 xl:max-h-[min(26rem,46vh)]">
                {campaigns.map((c) => {
                  const selected = selectedPanelId === c.id
                  return (
                    <li key={c.id}>
                      <div
                        className={cn(
                          'flex overflow-hidden rounded-xl border text-xs transition',
                          selected
                            ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/25'
                            : 'border-slate-100 bg-slate-50/40 hover:border-slate-200 hover:bg-white',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPanelId(c.id)
                            setPanelTab('resumo')
                          }}
                          className="min-w-0 flex-1 p-3 text-left"
                        >
                          <code className="block truncate font-mono text-[11px] font-medium text-slate-800">
                            {c.id.slice(0, 10)}…
                          </code>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                statusBadgeClass(c.status),
                              )}
                            >
                              {STATUS_LABELS[c.status] ?? c.status}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">{c.row_count} linhas</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(c.channels ?? []).map((ch) => (
                              <span
                                key={ch}
                                className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 ring-1 ring-slate-200"
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                        </button>
                        <button
                          type="button"
                          className="shrink-0 border-l border-slate-200/80 px-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Copiar ID"
                          onClick={() => void copyText(c.id, c.id)}
                        >
                          {copiedId === c.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma campanha neste filtro.</p>
            )}

            {campaignTotal > LIST_PAGE_SIZE ? (
              <p className="mt-3 border-t border-slate-100 pt-3 text-center text-[11px] text-amber-800">
                Há mais de {LIST_PAGE_SIZE} campanhas neste critério. Refine a busca ou o filtro de status.
              </p>
            ) : null}
          </div>

          {selectedPanelId ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md ring-1 ring-slate-900/[0.04] md:p-5">
              <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users className="size-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Auditoria</h3>
              </div>
              <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPanelTab('resumo')}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-bold transition',
                    panelTab === 'resumo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  Resumo
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('destinatarios')}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-bold transition',
                    panelTab === 'destinatarios'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  Destinatários
                </button>
              </div>

              {panelTab === 'resumo' ? (
                <div className="space-y-3 text-xs text-slate-700">
                  {panelCampaignLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                    </div>
                  ) : panelCampaign ? (
                    <>
                      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                          <dt className="text-[10px] font-bold uppercase text-slate-500">Status</dt>
                          <dd className="mt-0.5 font-semibold text-slate-900">
                            {STATUS_LABELS[panelCampaign.status] ?? panelCampaign.status}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                          <dt className="text-[10px] font-bold uppercase text-slate-500">Linhas</dt>
                          <dd className="mt-0.5 font-semibold text-slate-900">{panelCampaign.row_count}</dd>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 sm:col-span-2">
                          <dt className="text-[10px] font-bold uppercase text-slate-500">Registry</dt>
                          <dd className="mt-0.5 break-all font-mono text-[11px] text-slate-800">
                            {panelCampaign.registry_template_id || '—'}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 sm:col-span-2">
                          <dt className="text-[10px] font-bold uppercase text-slate-500">Regras (recipient_rules)</dt>
                          <dd className="mt-0.5 text-[11px] text-slate-800">
                            {panelCampaign.recipient_rules &&
                            typeof panelCampaign.recipient_rules === 'object' &&
                            Object.keys(panelCampaign.recipient_rules).length > 0
                              ? `${Object.keys(panelCampaign.recipient_rules).join(', ')} · ver export JSON`
                              : '—'}
                          </dd>
                        </div>
                      </dl>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full rounded-xl text-xs"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(panelCampaign, null, 2)], {
                            type: 'application/json',
                          })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `campanha-${panelCampaign.id.slice(0, 8)}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        icon={<Download className="size-3.5" />}
                      >
                        Exportar JSON (snapshot)
                      </Button>
                    </>
                  ) : (
                    <p className="text-slate-500">Não foi possível carregar a campanha.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recipientsLoading && !recipientsData ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                    </div>
                  ) : recipientsData && recipientsData.results.length > 0 ? (
                    <>
                      <p className="text-[11px] text-slate-500">
                        Mostrando {recipientsData.offset + 1}–
                        {recipientsData.offset + recipientsData.results.length} de {recipientsData.total}
                      </p>
                      <div className="max-h-[min(20rem,38vh)] overflow-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[240px] text-left text-[11px]">
                          <thead className="sticky top-0 bg-slate-100 font-bold uppercase tracking-wide text-slate-600">
                            <tr>
                              <th className="px-2 py-2">#</th>
                              <th className="px-2 py-2">E-mail</th>
                              <th className="px-2 py-2">WA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {recipientsData.results.map((r) => (
                              <tr key={r.id} className="text-slate-800">
                                <td className="px-2 py-1.5 font-mono">{r.row_index}</td>
                                <td className="max-w-[100px] truncate px-2 py-1.5" title={r.email ?? ''}>
                                  {r.email ?? '—'}
                                </td>
                                <td className="max-w-[80px] truncate px-2 py-1.5" title={r.phone ?? ''}>
                                  {r.whatsapp_status || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {recipientsData.offset + recipientsData.results.length < recipientsData.total ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-full rounded-xl text-xs"
                          disabled={recipientsLoading}
                          onClick={() => setRecipientsOffset((o) => o + RECIP_PAGE)}
                        >
                          Mais destinatários
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Sem registros de destinatários (campanha ainda não enviada ou sem logs).
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
