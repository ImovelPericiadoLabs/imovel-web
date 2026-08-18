'use client'

import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
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
  Trash2,
  Ban,
  Undo2,
  PencilLine,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import {
  AdminKpiStrip,
  AdminPageShell,
  AdminPanelHeader,
  ADMIN_KPI,
  ADMIN_PANEL,
  ADMIN_PANEL_INTELLIGENCE,
} from '@/components/admin'
import Button from '@/components/button'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'
import { url as apiBaseUrl } from '@/constants/api'
import {
  appendCampaignRows,
  createCampaignFromRows,
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
  deleteCampaign,
  type DatasetQuality,
  type OutreachCampaign,
  type RecipientRules,
  type RegistryTemplateMeta,
  type WhatsAppSpec,
} from '@/services/outreach'
import {
  OUTREACH_JSON_BATCH_ROWS_DEFAULT,
  OUTREACH_JSON_BATCH_ROWS_MAX,
  OUTREACH_JSON_BATCH_ROWS_MIN,
  clampOutreachJsonBatchRows,
  getOutreachJsonBatchRows,
  setOutreachJsonBatchRows,
  spreadsheetFileToColumnsAndRows,
} from '@/utils/outreachXlsx'
import {
  emptyRecipientRules,
  formatRecipientRulesSummary,
  normalizeRecipientRules,
  recipientRulesToApiPayload,
} from '@/utils/recipientRules'
import { RecipientRulesEditor } from './_components/RecipientRulesEditor'
import { DatasetQualityColumnBars, DatasetQualityTemplateBars } from './_components/dataset-quality-charts'

type Step = 1 | 2 | 3 | 4 | 5

type CampaignPreviewPayload = Awaited<ReturnType<typeof previewCampaign>>

/** Máximo suportado pela API de listagem de campanhas. */
const CAMPAIGN_PAGE_LIMIT = 200

const EMAIL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
  skipped: 'Ignorado',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  preview_ready: 'Prévia',
  sending: 'Enviando',
  completed: 'Concluído',
  failed: 'Falhou',
}

/** Alinhado à API: PATCH de mapeamento / recipient_rules permitido nestes estados. */
const CAMPAIGN_WIZARD_EDITABLE_STATUSES = new Set(['draft', 'preview_ready', 'failed'])

function outreachCampaignAllowsWizardEdit(c: OutreachCampaign) {
  if (!c.is_active) return false
  return CAMPAIGN_WIZARD_EDITABLE_STATUSES.has(c.status)
}

const STEPS: { n: Step; label: string; short: string }[] = [
  { n: 1, label: 'Canais', short: '1' },
  { n: 2, label: 'Modelo + CSV', short: '2' },
  { n: 3, label: 'Mapeamento', short: '3' },
  { n: 4, label: 'Prévia', short: '4' },
  { n: 5, label: 'Envio', short: '5' },
]

function formatCampaignDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function aggregateEmailStatuses(rows: { email_status: string }[]) {
  const m: Record<string, number> = {}
  for (const r of rows) {
    const k = (r.email_status || 'pending').toLowerCase()
    m[k] = (m[k] ?? 0) + 1
  }
  return m
}

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

      <DatasetQualityTemplateBars dq={dq} />

      <div className="max-h-56 overflow-auto">
        <DatasetQualityColumnBars dq={dq} />
      </div>

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
  const [listIncludeInactive, setListIncludeInactive] = useState(false)
  const [listChannel, setListChannel] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
  /** Paginação por cursor (`after_row_index` na API); `stack` guarda o estado para «Anterior». */
  const [recipientsCursor, setRecipientsCursor] = useState<{
    afterRowIndex: number | null
    stack: (number | null)[]
  }>({ afterRowIndex: null, stack: [] })
  const [recipientPageSize, setRecipientPageSize] = useState(200)
  const [recipientsTotalKnown, setRecipientsTotalKnown] = useState<number | null>(null)
  const [panelTab, setPanelTab] = useState<'resumo' | 'destinatarios'>('resumo')

  useEffect(() => {
    const t = window.setTimeout(() => setListSearch(searchDraft.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchDraft])

  useEffect(() => {
    setRecipientsCursor({ afterRowIndex: null, stack: [] })
    setRecipientsTotalKnown(null)
  }, [selectedPanelId])

  useEffect(() => {
    setRecipientsCursor({ afterRowIndex: null, stack: [] })
  }, [recipientPageSize])

  useEffect(() => {
    setJsonBatchRowsState(getOutreachJsonBatchRows())
  }, [])

  const setJsonBatchRows = useCallback((n: number) => {
    const v = clampOutreachJsonBatchRows(n)
    setOutreachJsonBatchRows(v)
    setJsonBatchRowsState(v)
  }, [])

  const {
    data: campaignPages,
    isFetching: campaignsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['outreach-campaigns', listStatus, listChannel, listSearch, listIncludeInactive],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listCampaigns({
        status: listStatus || undefined,
        channel: listChannel || undefined,
        search: listSearch || undefined,
        include_inactive: listIncludeInactive || undefined,
        limit: CAMPAIGN_PAGE_LIMIT,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.results.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
    enabled: Boolean(me?.is_superuser),
  })

  const campaigns = useMemo(() => campaignPages?.pages.flatMap((p) => p.results) ?? [], [campaignPages])
  const campaignTotal = campaignPages?.pages[0]?.total ?? 0
  const statusCounts = campaignPages?.pages[0]?.status_counts ?? {}

  const { data: panelCampaign, isFetching: panelCampaignLoading } = useQuery({
    queryKey: ['outreach-campaign', selectedPanelId],
    queryFn: () => getCampaign(selectedPanelId!),
    enabled: Boolean(me?.is_superuser && selectedPanelId),
  })

  const { data: recipientsData, isFetching: recipientsLoading } = useQuery({
    queryKey: ['outreach-recipients', selectedPanelId, recipientsCursor.afterRowIndex, recipientPageSize],
    queryFn: () =>
      listCampaignRecipients(selectedPanelId!, {
        limit: recipientPageSize,
        after_row_index:
          recipientsCursor.afterRowIndex === null ? undefined : recipientsCursor.afterRowIndex,
        include_total: recipientsCursor.afterRowIndex === null,
      }),
    enabled: Boolean(me?.is_superuser && selectedPanelId),
  })

  useEffect(() => {
    if (recipientsData?.total != null) setRecipientsTotalKnown(recipientsData.total)
  }, [recipientsData?.total])

  /** Amostra até 500 linhas para painel de contagem no resumo (evita N pedidos). */
  const { data: recipientsSample, isFetching: recipientsSampleLoading } = useQuery({
    queryKey: ['outreach-recipients-sample', selectedPanelId],
    queryFn: () => listCampaignRecipients(selectedPanelId!, { limit: 500, offset: 0 }),
    enabled: Boolean(
      me?.is_superuser &&
        selectedPanelId &&
        panelCampaign &&
        !['draft'].includes(panelCampaign.status),
    ),
    staleTime: 20_000,
  })

  const emailStatusBreakdown = useMemo(() => {
    if (!recipientsSample?.results.length) return null
    return aggregateEmailStatuses(recipientsSample.results)
  }, [recipientsSample])

  const recipientsNavSummary = useMemo(() => {
    if (!recipientsData?.results.length) return null
    const lo = recipientsData.results[0].row_index
    const hi = recipientsData.results[recipientsData.results.length - 1].row_index
    const total = recipientsData.total ?? recipientsTotalKnown
    const pageIdx = recipientsCursor.stack.length + 1
    const pageMax =
      total != null && recipientPageSize > 0 ? Math.max(1, Math.ceil(total / recipientPageSize)) : null
    return { lo, hi, total, pageIdx, pageMax }
  }, [recipientsData, recipientsTotalKnown, recipientsCursor.stack.length, recipientPageSize])

  const [step, setStep] = useState<Step>(1)
  const [channels, setChannels] = useState<string[]>(['email'])
  const [registryTemplateId, setRegistryTemplateId] = useState('')
  const [emailTemplateId, setEmailTemplateId] = useState('')
  const [whatsappSpecId, setWhatsappSpecId] = useState('')
  type ParsedSheet = { fileName: string; columns: string[]; rows: Record<string, string>[] }
  const [parsedSheet, setParsedSheet] = useState<ParsedSheet | null>(null)
  const [csvDragOver, setCsvDragOver] = useState(false)
  const [csvConverting, setCsvConverting] = useState(false)
  const [jsonBatchRows, setJsonBatchRowsState] = useState(OUTREACH_JSON_BATCH_ROWS_DEFAULT)
  const [recipientRules, setRecipientRules] = useState<RecipientRules>(() => emptyRecipientRules())
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

  useEffect(() => {
    if (!campaign) return
    setRecipientRules(normalizeRecipientRules(campaign.recipient_rules))
  }, [campaign])

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
    setParsedSheet(null)
    setCampaign(null)
    setSampleRows([])
    setEmailColumn('')
    setPhoneColumn('')
    setColumnMapping({})
    setRecipientRules(emptyRecipientRules())
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

  /** Carrega uma campanha existente da API no assistente (passo 3) para mapeamento, regras e skip_rows. */
  const loadPanelIntoWizard = useCallback((c: OutreachCampaign) => {
    setPageError(null)
    setCampaign(c)
    setChannels(Array.isArray(c.channels) && c.channels.length > 0 ? c.channels : ['email'])
    setRegistryTemplateId((c.registry_template_id || '').trim())
    setEmailTemplateId(c.email_template || '')
    setWhatsappSpecId(c.whatsapp_spec || '')
    setEmailColumn(c.email_column || '')
    setPhoneColumn(c.phone_column || '')
    setColumnMapping(
      c.column_mapping && typeof c.column_mapping === 'object' && !Array.isArray(c.column_mapping)
        ? { ...c.column_mapping }
        : {},
    )
    setRecipientRules(normalizeRecipientRules(c.recipient_rules))
    setPixelBase((c.pixel_base_url || '').trim())
    setPreviewResult(null)
    setLgpdOk(false)
    setParsedSheet(null)
    setSampleRows([])
    setStep(3)
    window.requestAnimationFrame(() => {
      document.getElementById('outreach-main-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
    const recipient_rules = recipientRulesToApiPayload(recipientRules)
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
  }, [campaign, emailColumn, phoneColumn, columnMapping, channels, recipientRules])

  const ingestSpreadsheetOrCsv = useCallback(async (f: File | null) => {
    if (!f) {
      setParsedSheet(null)
      return
    }
    setPageError(null)
    const lower = f.name.toLowerCase()
    const okExt =
      lower.endsWith('.csv') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      f.type === 'text/csv' ||
      f.type === 'application/vnd.ms-excel'
    if (!okExt) {
      setPageError('Formato não suportado. Use .csv, .xlsx ou .xls.')
      return
    }
    try {
      setCsvConverting(true)
      const { columns, rows } = await spreadsheetFileToColumnsAndRows(f)
      if (!rows.length) {
        setPageError('O ficheiro não tem linhas de dados (só cabeçalho ou vazio).')
        setParsedSheet(null)
        return
      }
      setParsedSheet({ fileName: f.name, columns, rows })
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Não foi possível ler o ficheiro.')
      setParsedSheet(null)
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
      if (!parsedSheet?.rows.length) throw new Error('Selecione e processe um ficheiro com dados.')
      const { columns, rows } = parsedSheet
      const base = {
        channels,
        dry_run_sample_limit: 10,
        registry_template_id: registryTemplateId || undefined,
        email_template_id: emailTemplateId || null,
        whatsapp_spec_id: whatsappSpecId || null,
        email_column: '',
        phone_column: '',
        header_media_url: '',
        pixel_base_url: '',
      }
      const batch = jsonBatchRows
      const first = rows.slice(0, batch)
      const rest = rows.slice(batch)
      const firstRes = await createCampaignFromRows({
        ...base,
        columns,
        rows: first,
      })
      let campaign = firstRes.campaign
      const sampleRows = firstRes.sample_rows
      for (let i = 0; i < rest.length; i += batch) {
        const chunk = rest.slice(i, i + batch)
        campaign = await appendCampaignRows(campaign.id, chunk)
      }
      return { campaign, sample_rows: sampleRows }
    },
    onSuccess: (data) => {
      setCampaign(data.campaign)
      setSampleRows(data.sample_rows)
      setRecipientRules(emptyRecipientRules())
      setStep(3)
      setPageError(null)
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const patchMut = useMutation({
    mutationFn: async () => {
      if (!campaign) throw new Error('Sem campanha.')
      const recipient_rules = recipientRulesToApiPayload(recipientRules)
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

  const panelDeactivateMut = useMutation({
    mutationFn: async () => {
      if (!selectedPanelId) throw new Error('Sem campanha selecionada.')
      return patchCampaign(selectedPanelId, { is_active: false })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', selectedPanelId] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const panelReactivateMut = useMutation({
    mutationFn: async () => {
      if (!selectedPanelId) throw new Error('Sem campanha selecionada.')
      return patchCampaign(selectedPanelId, { is_active: true })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaign', selectedPanelId] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const panelDeleteMut = useMutation({
    mutationFn: async () => {
      const id = selectedPanelId
      if (!id) throw new Error('Sem campanha selecionada.')
      await deleteCampaign(id)
      return id
    },
    onSuccess: (deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] })
      queryClient.removeQueries({ queryKey: ['outreach-campaign', deletedId] })
      setSelectedPanelId(null)
      setPageError(null)
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

  const totalCampaigns = campaignTotal

  return (
    <AdminPageShell
      metrics={
        <AdminKpiStrip
          items={[
            { id: 'all', label: 'Campanhas', value: totalCampaigns, icon: Megaphone, tone: 'brand' },
            { id: 'draft', label: 'Rascunho', value: statusCounts.draft ?? 0 },
            { id: 'live', label: 'Enviando', value: statusCounts.sending ?? 0, tone: 'warning' },
            { id: 'done', label: 'Concluídas', value: statusCounts.completed ?? 0, tone: 'success' },
          ]}
        />
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg text-xs"
            onClick={resetWizard}
            icon={<RotateCcw className="size-3.5" />}
          >
            Novo fluxo
          </Button>
          <Link
            href="/admin/inbox"
            className="inline-flex h-9 items-center rounded-lg border border-[#dedee5] bg-white px-3 text-xs font-semibold text-[#686b82] hover:border-[#7132f5]/30 hover:text-[#7132f5]"
          >
            Inbox
          </Link>
        </>
      }
      className="mx-auto w-full max-w-[1600px]"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,56rem)_minmax(20rem,26rem)] 2xl:grid-cols-[minmax(0,58rem)_minmax(22rem,28rem)]">
        <div id="outreach-main-wizard" className="min-w-0 space-y-4">
          <div className={cn(ADMIN_PANEL, 'p-3')}>
            <AdminPanelHeader
              title="Assistente de campanha"
              meta={campaign ? `ID ${campaign.id.slice(0, 8)}…` : 'Novo fluxo'}
            />
          <nav aria-label="Etapas da campanha" className="mt-2 overflow-x-auto">
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
                        'flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                        done && 'bg-[rgba(20,158,97,0.12)] text-[#026b3f] ring-1 ring-[#dedee5]',
                        active && !done && 'bg-[#7132f5] text-white',
                        !active && !done && 'bg-white text-[#686b82] ring-1 ring-[#dedee5] hover:bg-[rgba(148,151,169,0.08)]',
                        s.n > step && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded text-[10px] sm:size-6 sm:text-[11px]',
                          done && 'bg-[#026b3f] text-white',
                          active && !done && 'bg-white/20 text-white',
                          !active && !done && 'bg-[rgba(148,151,169,0.12)] text-[#686b82]',
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
          </div>

          {pageError ? <Alert variant="error" message={pageError} /> : null}

          {step === 1 && (
            <section className={cn(ADMIN_PANEL, 'p-4 md:p-6')}>
              <AdminPanelHeader title="Canais" meta="E-mail e/ou WhatsApp" />
              <p className="mb-4 text-xs text-[#9497a9]">Selecione ao menos um canal.</p>
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
            <section className={cn(ADMIN_PANEL, 'space-y-5 p-4 md:p-6')}>
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
                <FieldLabel
                  hint={`Cada pedido leva no máximo ${OUTREACH_JSON_BATCH_ROWS_MAX} linhas (teto da API). Valores menores reduzem risco de 500 por timeout ou limite de corpo. Entre ${OUTREACH_JSON_BATCH_ROWS_MIN} e ${OUTREACH_JSON_BATCH_ROWS_MAX}; guardado neste browser.`}
                >
                  Linhas por lote (JSON)
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
                  <input
                    type="range"
                    aria-label="Linhas por pedido JSON"
                    min={OUTREACH_JSON_BATCH_ROWS_MIN}
                    max={OUTREACH_JSON_BATCH_ROWS_MAX}
                    step={25}
                    value={jsonBatchRows}
                    onChange={(e) => setJsonBatchRows(Number(e.target.value))}
                    className="h-2 min-w-[140px] flex-1 cursor-pointer accent-primary sm:max-w-md"
                  />
                  <span className="min-w-[3.25rem] text-sm font-semibold tabular-nums text-gray-900">{jsonBatchRows}</span>
                  <span className="text-xs text-gray-500">
                    {OUTREACH_JSON_BATCH_ROWS_MIN}–{OUTREACH_JSON_BATCH_ROWS_MAX}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel hint="O ficheiro é lido só no navegador (primeira folha). Os dados seguem para a API em JSON em lotes (evita limites de upload tipo Cloudflare); não é enviado multipart/ficheiro ao servidor.">
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
                      ? 'A ler ficheiro…'
                      : parsedSheet
                        ? `${parsedSheet.fileName} · ${parsedSheet.rows.length} linha(s)`
                        : 'Arraste CSV ou Excel aqui ou clique para escolher'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    .csv, .xlsx ou .xls · processamento local · envio em lotes de {jsonBatchRows} linhas (máx.{' '}
                    {OUTREACH_JSON_BATCH_ROWS_MAX})
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
                  disabled={!parsedSheet || createMut.isPending || csvConverting}
                  onClick={() => createMut.mutate()}
                  icon={
                    createMut.isPending || csvConverting ? <Loader2 className="size-4 animate-spin" /> : undefined
                  }
                >
                  {csvConverting
                    ? 'A processar…'
                    : createMut.isPending
                      ? 'A enviar lotes…'
                      : 'Criar campanha (JSON)'}
                </Button>
              </div>
            </section>
          )}

          {step === 3 && campaign && (
            <section className={cn(ADMIN_PANEL, 'relative space-y-5 p-4 md:p-6')}>
              {previewMut.isPending ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm">
                  <Loader2 className="size-10 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-gray-700">Gerando pré-visualização…</p>
                </div>
              ) : null}
              {campaign.status === 'failed' ? (
                <Alert
                  variant="warning"
                  message="Esta campanha está com estado «falhou». Ajuste colunas, regras ou linhas a ignorar (skip_rows), grave com «Pré-visualizar» e só depois volte a enviar."
                />
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

              <div className="space-y-3">
                <div>
                  <FieldLabel hint="Regras opcionais aplicadas antes da pré-visualização e do envio. O JSON bruto só aparece em «Avançado» no bloco abaixo.">
                    Regras por destinatário (opcional)
                  </FieldLabel>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Interface guiada: preenchimentos globais, correcções por linha de dados e exclusões de índice — o
                    mesmo contrato da API, sem editar JSON manualmente.
                  </p>
                </div>
                <RecipientRulesEditor
                  value={recipientRules}
                  onChange={setRecipientRules}
                  variableSuggestions={Array.from(new Set([...varsToMap, ...columns]))}
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
            <section className={cn(ADMIN_PANEL, 'space-y-5 p-4 md:p-6')}>
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Com filtro</span>
                <LayoutGrid className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">{campaignTotal}</p>
              <p className="text-[9px] text-slate-400">campanhas</p>
            </div>
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Rascunho</span>
                <BarChart3 className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">{statusCounts.draft ?? 0}</p>
            </div>
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Prévia OK</span>
                <Eye className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                {statusCounts.preview_ready ?? 0}
              </p>
            </div>
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Enviando</span>
                <RefreshCw className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-900 sm:text-xl">
                {statusCounts.sending ?? 0}
              </p>
            </div>
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Concluído</span>
                <Check className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-900 sm:text-xl">
                {statusCounts.completed ?? 0}
              </p>
            </div>
            <div className={ADMIN_KPI}>
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Falhou</span>
                <AlertTriangle className="size-3.5 shrink-0 text-slate-400" aria-hidden />
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-red-900 sm:text-xl">{statusCounts.failed ?? 0}</p>
            </div>
          </div>

          <div className={cn(ADMIN_PANEL_INTELLIGENCE, 'p-3 text-[11px] text-[#686b82]')}>
            <p className="flex items-center gap-1.5 font-bold text-[#5741d8]">
              <ShieldCheck className="size-3.5" aria-hidden />
              Checklist
            </p>
            <p className="mt-2 leading-relaxed">Sync Meta · Prévia · LGPD · Colunas CSV limpas</p>
          </div>

          <div className={cn(ADMIN_PANEL, 'p-3 md:p-4')}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#dedee5] pb-2.5">
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
                      void queryClient.invalidateQueries({ queryKey: ['outreach-recipients-sample', selectedPanelId] })
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
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                  checked={listIncludeInactive}
                  onChange={(e) => setListIncludeInactive(e.target.checked)}
                />
                Mostrar campanhas desativadas
              </label>
            </div>

            {campaigns.length > 0 ? (
              <ul className="max-h-[min(28rem,52vh)] space-y-2 overflow-y-auto pr-0.5 lg:max-h-[min(32rem,58vh)]">
                {campaigns.map((c) => {
                  const selected = selectedPanelId === c.id
                  const createdLbl = formatCampaignDate(c.created)
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
                          {createdLbl ? (
                            <p className="mt-0.5 text-[10px] text-slate-500">Criada {createdLbl}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                statusBadgeClass(c.status),
                              )}
                            >
                              {STATUS_LABELS[c.status] ?? c.status}
                            </span>
                            {c.is_active === false ? (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                                Desativada
                              </span>
                            ) : null}
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
                        <div className="flex shrink-0 flex-col border-l border-slate-200/80">
                          <Link
                            href={`/admin/outreach/campaigns/${c.id}`}
                            className="flex flex-1 items-center justify-center px-2.5 py-2 text-primary hover:bg-primary/[0.06]"
                            title="Editor completo (ecrã largo)"
                            scroll={false}
                          >
                            <Maximize2 className="size-3.5" aria-hidden />
                          </Link>
                          <button
                            type="button"
                            className="border-t border-slate-200/80 px-2.5 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Copiar ID"
                            onClick={() => void copyText(c.id, c.id)}
                          >
                            {copiedId === c.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma campanha neste filtro.</p>
            )}

            {hasNextPage ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-xl text-xs"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                  icon={isFetchingNextPage ? <Loader2 className="size-3.5 animate-spin" /> : undefined}
                >
                  {isFetchingNextPage
                    ? 'A carregar…'
                    : `Carregar mais (${campaigns.length} de ${campaignTotal})`}
                </Button>
              </div>
            ) : null}
          </div>

          {selectedPanelId ? (
            <div className={cn(ADMIN_PANEL, 'p-3 md:p-4')}>
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
                            {panelCampaign.is_active === false ? (
                              <span className="ml-2 text-amber-700">· desativada</span>
                            ) : null}
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
                            {formatRecipientRulesSummary(panelCampaign.recipient_rules)}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 sm:col-span-2">
                          <dt className="text-[10px] font-bold uppercase text-slate-500">Datas</dt>
                          <dd className="mt-0.5 space-y-0.5 text-[11px] text-slate-800">
                            <span className="block">
                              Criada:{' '}
                              <span className="font-medium">{formatCampaignDate(panelCampaign.created) || '—'}</span>
                            </span>
                            <span className="block">
                              Atualizada:{' '}
                              <span className="font-medium">{formatCampaignDate(panelCampaign.modified) || '—'}</span>
                            </span>
                          </dd>
                        </div>
                      </dl>

                      {outreachCampaignAllowsWizardEdit(panelCampaign) ? (
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/outreach/campaigns/${panelCampaign.id}`}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                            scroll={false}
                          >
                            <Maximize2 className="size-4 shrink-0" aria-hidden />
                            Editor em ecrã completo
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-xl text-xs font-semibold text-slate-700"
                            onClick={() => loadPanelIntoWizard(panelCampaign)}
                            icon={<PencilLine className="size-3.5" aria-hidden />}
                          >
                            Carregar no assistente (coluna esquerda)
                          </Button>
                        </div>
                      ) : panelCampaign.is_active === false ? (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-950 ring-1 ring-amber-200/80">
                          Reative a campanha (botão abaixo) para poder alterar mapeamento e regras no assistente.
                        </p>
                      ) : !CAMPAIGN_WIZARD_EDITABLE_STATUSES.has(panelCampaign.status) ? (
                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-700 ring-1 ring-slate-200/80">
                          Só é possível abrir no assistente campanhas em rascunho, com pré-visualização ou que falharam.
                          Durante o envio ou após conclusão use exportação e logs.
                        </p>
                      ) : null}

                      {['sending', 'completed', 'failed', 'preview_ready'].includes(panelCampaign.status) ? (
                        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 ring-1 ring-slate-200/70">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                              Logs de envio (e-mail)
                            </p>
                            {recipientsSampleLoading ? (
                              <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
                            ) : null}
                          </div>
                          {recipientsSample && (recipientsSample.total ?? 0) > 0 ? (
                            <>
                              <p className="mb-2 text-[11px] text-slate-600">
                                <span className="font-semibold tabular-nums">
                                  {recipientsSample.total ?? 0}
                                </span>{' '}
                                registo(s)
                                na API
                                {(recipientsSample.total ?? 0) > panelCampaign.row_count ? (
                                  <span className="text-amber-800"> · acima do row_count (revisar)</span>
                                ) : null}
                                {(recipientsSample.total ?? 0) < panelCampaign.row_count &&
                                ['sending', 'completed'].includes(panelCampaign.status) ? (
                                  <span className="block text-slate-500">
                                    Dataset: {panelCampaign.row_count} linhas — ainda a processar ou falhou a meio.
                                  </span>
                                ) : null}
                              </p>
                              {emailStatusBreakdown && Object.keys(emailStatusBreakdown).length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {Object.entries(emailStatusBreakdown).map(([k, n]) => (
                                    <div
                                      key={k}
                                      className="rounded-lg bg-white px-2 py-2 text-center ring-1 ring-slate-200/80"
                                    >
                                      <p className="text-[9px] font-bold uppercase text-slate-500">
                                        {EMAIL_STATUS_LABELS[k] ?? k}
                                      </p>
                                      <p className="text-lg font-bold tabular-nums text-slate-900">{n}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              {(recipientsSample.total ?? 0) > recipientsSample.results.length ? (
                                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                                  Contagens de estado: primeiras {recipientsSample.results.length} linhas. Use o
                                  separador Destinatários para percorrer toda a lista (até 500 por pedido).
                                </p>
                              ) : (
                                <p className="mt-2 text-[10px] text-slate-500">
                                  Contagens exactas (≤500 linhas nesta campanha).
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-[11px] leading-relaxed text-slate-600">
                              Sem logs de destinatários ainda. Se o status é «Enviando» há muito tempo, confira Celery /
                              fila ou reenfileire o envio no servidor.
                            </p>
                          )}
                        </div>
                      ) : null}

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
                      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                        {panelCampaign.is_active === false ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-xl text-xs"
                            disabled={panelReactivateMut.isPending}
                            onClick={() => void panelReactivateMut.mutate()}
                            icon={
                              panelReactivateMut.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Undo2 className="size-3.5" />
                              )
                            }
                          >
                            Reativar campanha
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-xl border-amber-200 text-xs text-amber-900 hover:bg-amber-50"
                            disabled={panelDeactivateMut.isPending}
                            onClick={() => {
                              if (
                                panelCampaign.status === 'sending' &&
                                !window.confirm(
                                  'A campanha está a enviar. Desativar interrompe o processamento (estado «falhou» na API) e oculta da lista. Continuar?',
                                )
                              ) {
                                return
                              }
                              void panelDeactivateMut.mutate()
                            }}
                            icon={
                              panelDeactivateMut.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Ban className="size-3.5" />
                              )
                            }
                          >
                            {panelCampaign.status === 'sending'
                              ? 'Desativar e parar envio'
                              : 'Desativar (oculta da lista)'}
                          </Button>
                        )}
                        {(panelCampaign.status === 'draft' || panelCampaign.status === 'preview_ready') && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-xl border-red-200 text-xs text-red-800 hover:bg-red-50"
                            disabled={panelDeleteMut.isPending}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  'Eliminar esta campanha de forma permanente? Só é permitido para rascunho ou pré-visualização.',
                                )
                              )
                                return
                              void panelDeleteMut.mutate()
                            }}
                            icon={
                              panelDeleteMut.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )
                            }
                          >
                            Eliminar rascunho
                          </Button>
                        )}
                      </div>
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
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <p className="text-[11px] text-slate-600">
                          {recipientsNavSummary ? (
                            <>
                              Linhas{' '}
                              <span className="font-semibold tabular-nums text-slate-900">
                                {recipientsNavSummary.lo}
                              </span>
                              –
                              <span className="font-semibold tabular-nums text-slate-900">
                                {recipientsNavSummary.hi}
                              </span>
                              {recipientsNavSummary.total != null ? (
                                <>
                                  {' '}
                                  de{' '}
                                  <span className="font-semibold tabular-nums">{recipientsNavSummary.total}</span>
                                </>
                              ) : null}
                              {' '}
                              · página <span className="tabular-nums">{recipientsNavSummary.pageIdx}</span>
                              {recipientsNavSummary.pageMax != null ? (
                                <>
                                  {' '}
                                  / <span className="tabular-nums">{recipientsNavSummary.pageMax}</span>
                                </>
                              ) : null}
                            </>
                          ) : null}
                        </p>
                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                          <span className="shrink-0">Linhas por página</span>
                          <SelectShell
                            className="h-9 w-[4.5rem] rounded-lg text-[11px]"
                            value={String(recipientPageSize)}
                            onChange={(e) => setRecipientPageSize(Number(e.target.value))}
                          >
                            <option value="100">100</option>
                            <option value="200">200</option>
                            <option value="500">500</option>
                          </SelectShell>
                        </label>
                      </div>
                      <div className="max-h-[min(70vh,36rem)] overflow-auto rounded-xl border border-slate-200 shadow-inner">
                        <table className="w-full min-w-[640px] text-left text-[11px]">
                          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 font-bold uppercase tracking-wide text-slate-600">
                            <tr>
                              <th className="whitespace-nowrap px-2 py-2.5">#</th>
                              <th className="min-w-[140px] px-2 py-2.5">E-mail</th>
                              <th className="min-w-[100px] px-2 py-2.5">Telefone</th>
                              <th className="whitespace-nowrap px-2 py-2.5">E-mail (estado)</th>
                              <th className="min-w-[90px] px-2 py-2.5">WhatsApp</th>
                              <th className="min-w-[160px] px-2 py-2.5">Erro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {recipientsData.results.map((r) => (
                              <tr key={r.id} className="align-top text-slate-800">
                                <td className="whitespace-nowrap px-2 py-2 font-mono tabular-nums">{r.row_index}</td>
                                <td className="max-w-[220px] break-all px-2 py-2 font-mono text-[10px]" title={r.email}>
                                  {r.email || '—'}
                                </td>
                                <td className="max-w-[120px] break-all px-2 py-2 font-mono text-[10px]" title={r.phone}>
                                  {r.phone || '—'}
                                </td>
                                <td className="whitespace-nowrap px-2 py-2">
                                  <span
                                    className={cn(
                                      'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1',
                                      (r.email_status || '').toLowerCase() === 'sent' &&
                                        'bg-emerald-50 text-emerald-900 ring-emerald-200',
                                      (r.email_status || '').toLowerCase() === 'failed' &&
                                        'bg-red-50 text-red-900 ring-red-200',
                                      (r.email_status || '').toLowerCase() === 'skipped' &&
                                        'bg-slate-100 text-slate-700 ring-slate-200',
                                      (!(r.email_status || '').toLowerCase() ||
                                        (r.email_status || '').toLowerCase() === 'pending') &&
                                        'bg-amber-50 text-amber-950 ring-amber-200/80',
                                    )}
                                  >
                                    {EMAIL_STATUS_LABELS[(r.email_status || 'pending').toLowerCase()] ??
                                      r.email_status ??
                                      '—'}
                                  </span>
                                </td>
                                <td
                                  className="max-w-[120px] break-words px-2 py-2 text-[10px]"
                                  title={r.whatsapp_msg_id || r.whatsapp_status || ''}
                                >
                                  {r.whatsapp_status || '—'}
                                </td>
                                <td className="max-w-[280px] px-2 py-2 text-[10px] text-red-900" title={r.error_message}>
                                  {r.error_message ? (
                                    <span className="line-clamp-4 whitespace-pre-wrap">{r.error_message}</span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl text-xs sm:min-w-[8rem]"
                          disabled={recipientsLoading || recipientsCursor.stack.length === 0}
                          onClick={() =>
                            setRecipientsCursor((c) => {
                              if (c.stack.length === 0) return c
                              const stack = [...c.stack]
                              const prev = stack.pop() ?? null
                              return { stack, afterRowIndex: prev }
                            })
                          }
                        >
                          Anterior
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl text-xs sm:min-w-[8rem]"
                          disabled={recipientsLoading || !recipientsData.has_more}
                          onClick={() => {
                            const next = recipientsData.next_after_row_index
                            if (next == null) return
                            setRecipientsCursor((c) => ({
                              stack: [...c.stack, c.afterRowIndex],
                              afterRowIndex: next,
                            }))
                          }}
                        >
                          Seguinte
                        </Button>
                      </div>
                    </>
                  ) : recipientsData &&
                    !recipientsData.results.length &&
                    !recipientsData.has_more &&
                    recipientsCursor.afterRowIndex === null &&
                    (recipientsData.total === 0 || recipientsTotalKnown === 0) ? (
                    <p className="text-xs leading-relaxed text-slate-500">
                      Sem registos de destinatários (envio ainda não criou logs ou campanha só em pré-visualização).
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">A carregar lista…</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </AdminPageShell>
  )
}
