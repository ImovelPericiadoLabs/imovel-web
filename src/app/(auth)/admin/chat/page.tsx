'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Users,
  CalendarClock,
  Megaphone,
  Loader2,
  Send,
  RefreshCw,
  UserRoundCog,
  Bot,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/tailwind'
import {
  AdminChatContextPanel,
  AdminEmptyState,
  AdminInboxWorkspace,
  AdminKpiStrip,
  AdminPageShell,
  AdminPanelHeader,
  AdminSegmentedControl,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_INBOX_ITEM,
  ADMIN_INBOX_ITEM_ACTIVE,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_PANEL,
  ADMIN_PANEL_HEADER,
} from '@/components/admin'
import Button from '@/components/button'
import Alert from '@/components/alert'
import Skeleton from '@/components/skeleton'
import { getMe } from '@/services/account'
import {
  listChatCampaigns,
  createChatCampaign,
  patchChatCampaign,
  listChatConversations,
  listChatMessages,
  postChatOperatorMessage,
  postChatHandoff,
  postChatToggleAi,
  postChatReplayAi,
  postChatAiPendingApprove,
  postChatAiPendingReject,
  listChatLeads,
  patchChatLead,
  listChatScheduled,
  createChatScheduled,
  cancelChatScheduled,
  type ChatCampaign,
  type ChatConversation,
  type ChatMessage,
  type ChatLead,
  type ChatScheduledMessage,
  extractWaMediaIdFromChatMessage,
} from '@/services/chat'
import { endpoint, url } from '@/constants/api'
import { getSessionDeduplicated } from '@/utils/session'

type Tab = 'campaigns' | 'inbox' | 'leads' | 'scheduled'

/** Evita martelar a API após 429 / throttle; erros de rede ainda retentam poucas vezes. */
function chatQueryRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  const msg = error instanceof Error ? error.message : String(error)
  if (/throttl|too many requests|429|rate limit/i.test(msg)) return false
  return true
}

const chatRetryDelay = (attemptIndex: number) => Math.min(40_000, 1500 * 2 ** attemptIndex)

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={ADMIN_LABEL}>{children}</label>
}

function conversationTitle(c: ChatConversation) {
  const name = (c.customer_display_name || '').trim()
  return name || c.customer_wa_id
}

function initialsFromTitle(title: string): string {
  const w = title.trim().split(/\s+/).filter(Boolean)
  if (w.length >= 2) {
    const a = (w[0]?.[0] || '').toUpperCase()
    const b = (w[1]?.[0] || '').toUpperCase()
    return (a + b) || '?'
  }
  const s = title.trim()
  if (s.length >= 2) return s.slice(0, 2).toUpperCase()
  return s.slice(0, 1).toUpperCase() || '?'
}

function formatShortClock(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function conversationListTimestamp(c: ChatConversation): string {
  return formatShortClock(c.last_message_at || c.last_inbound_at || c.last_outbound_at)
}

function conversationPreviewLine(c: ChatConversation): string {
  const raw = (c.last_message_preview || '').replace(/\s+/g, ' ').trim()
  if (raw) return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
  return 'Sem mensagens ainda'
}

function systemFriendlyLine(body: string): string | null {
  if (body === 'handoff:operator') return 'Conversa transferida para o atendente.'
  if (body === 'ia_draft:discarded') return 'Rascunho da IA descartado pelo operador.'
  if (body.startsWith('handoff:')) return 'Conversa em handoff (atendimento humano).'
  return null
}

function messageChannelLabel(m: ChatMessage): string {
  if (m.direction === 'system') return 'Sistema'
  if (m.direction === 'in') return 'Cliente'
  if (!m.sender) return 'IA'
  return 'Operador'
}

type BubbleTone = 'in' | 'outDark' | 'outLight' | 'system'

function ChatWaImagePreview({ mediaId }: { mediaId: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    let created: string | null = null
    setBlobUrl(null)
    setPhase('loading')
    ;(async () => {
      try {
        const session = await getSessionDeduplicated()
        const token = session?.accessToken
        if (!token || cancelled) {
          setPhase('error')
          return
        }
        const res = await fetch(`${url}${endpoint.chat.waMedia(mediaId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return
        if (!res.ok) {
          setPhase('error')
          return
        }
        const blob = await res.blob()
        if (cancelled) return
        const u = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(u)
          return
        }
        created = u
        setBlobUrl(u)
        setPhase('ready')
      } catch {
        if (!cancelled) setPhase('error')
      }
    })()
    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [mediaId])

  if (phase === 'loading') {
    return (
      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        A carregar imagem…
      </div>
    )
  }
  if (phase === 'error' || !blobUrl) {
    return <p className="mt-2 text-[11px] text-red-600">Não foi possível carregar a imagem (Meta / sessão).</p>
  }
  return (
    <div className="mt-2 overflow-hidden rounded-xl ring-1 ring-black/10">
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL da API com Bearer */}
      <img src={blobUrl} alt="Anexo WhatsApp" className="max-h-52 w-full max-w-md object-contain" loading="lazy" />
    </div>
  )
}

function ChatMessageBody({ m, tone }: { m: ChatMessage; tone: BubbleTone }): ReactNode {
  const mediaId = useMemo(() => extractWaMediaIdFromChatMessage(m), [m])
  const typ = (m.wa_message_type || '').toLowerCase()
  const showImage = typ === 'image' && Boolean(mediaId)
  const showTypePill = Boolean(typ && typ !== 'text' && !(typ === 'image' && showImage))
  const pillClass =
    tone === 'outDark'
      ? 'bg-white/15 text-white/95 ring-white/25'
      : 'bg-black/[0.06] text-slate-600 ring-black/10'

  return (
    <>
      {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : null}
      {showImage ? <ChatWaImagePreview mediaId={mediaId!} /> : null}
      {showTypePill ? (
        <span
          className={cn(
            'mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
            pillClass,
          )}
        >
          {typ}
        </span>
      ) : null}
    </>
  )
}

function SelectShell({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
        'hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15',
        className,
      )}
      {...props}
    />
  )
}

export default function AdminChatPage() {
  const qc = useQueryClient()
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const [tab, setTab] = useState<Tab>('inbox')
  const [campaignFilter, setCampaignFilter] = useState('')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [composer, setComposer] = useState('')
  /** Texto editável antes de aprovar envio da resposta IA. */
  const [aiApproveDraft, setAiApproveDraft] = useState('')
  const [pageError, setPageError] = useState<string | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: campaigns = [], isFetching: campaignsLoading } = useQuery({
    queryKey: ['chat-campaigns'],
    queryFn: listChatCampaigns,
    enabled: Boolean(me?.is_superuser),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: conversations = [], isFetching: convLoading } = useQuery({
    queryKey: ['chat-conversations', campaignFilter],
    queryFn: () =>
      listChatConversations({
        campaign: campaignFilter || undefined,
        limit: 80,
      }),
    enabled: Boolean(me?.is_superuser),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
      if (tab !== 'inbox') return false
      return 28_000
    },
    placeholderData: (previousData) => previousData,
    retry: chatQueryRetry,
    retryDelay: chatRetryDelay,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const {
    data: messages = [],
    isFetching: msgLoading,
    isError: messagesQueryError,
    error: messagesQueryErr,
  } = useQuery({
    queryKey: ['chat-messages', selectedConvId],
    queryFn: () => listChatMessages(selectedConvId!, { limit: 80 }),
    enabled: Boolean(me?.is_superuser && selectedConvId),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
      if (tab !== 'inbox' || !query.queryKey[1]) return false
      return 22_000
    },
    placeholderData: (previousData) => previousData,
    retry: chatQueryRetry,
    retryDelay: chatRetryDelay,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: leads = [], isFetching: leadsLoading } = useQuery({
    queryKey: ['chat-leads'],
    queryFn: () => listChatLeads(),
    enabled: Boolean(me?.is_superuser) && tab === 'leads',
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const { data: scheduled = [], isFetching: schedLoading } = useQuery({
    queryKey: ['chat-scheduled', campaignFilter],
    queryFn: () => listChatScheduled({ campaign: campaignFilter || undefined }),
    enabled: Boolean(me?.is_superuser) && tab === 'scheduled',
    staleTime: 20_000,
    refetchOnWindowFocus: false,
    select: (d) => (Array.isArray(d) ? d : []),
  })

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) ?? null,
    [conversations, selectedConvId],
  )

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedConv?.campaign) ?? null,
    [campaigns, selectedConv?.campaign],
  )

  useEffect(() => {
    setAiApproveDraft((selectedConv?.ai_pending_reply_body || '').trim())
  }, [selectedConv?.id, selectedConv?.ai_pending_reply_body])

  const createCampaignMut = useMutation({
    mutationFn: (payload: Partial<ChatCampaign>) => createChatCampaign(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-campaigns'] })
      setPageError(null)
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const patchCampaignMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ChatCampaign> }) => patchChatCampaign(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-campaigns'] })
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!selectedConvId) throw new Error('Selecione uma conversa.')
      return postChatOperatorMessage(selectedConvId, composer.trim())
    },
    onSuccess: () => {
      setComposer('')
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] })
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const handoffMut = useMutation({
    mutationFn: () => (selectedConvId ? postChatHandoff(selectedConvId) : Promise.reject(new Error('Selecione'))),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const toggleAiMut = useMutation({
    mutationFn: (ai: boolean) =>
      selectedConvId ? postChatToggleAi(selectedConvId, ai) : Promise.reject(new Error('Selecione')),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['chat-conversations'] }),
    onError: (e: Error) => setPageError(e.message),
  })

  const replayAiMut = useMutation({
    mutationFn: () =>
      selectedConvId ? postChatReplayAi(selectedConvId) : Promise.reject(new Error('Selecione')),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] })
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const approveAiMut = useMutation({
    mutationFn: () =>
      selectedConvId
        ? postChatAiPendingApprove(selectedConvId, aiApproveDraft.trim() || undefined)
        : Promise.reject(new Error('Selecione')),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] })
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const rejectAiMut = useMutation({
    mutationFn: () =>
      selectedConvId ? postChatAiPendingReject(selectedConvId) : Promise.reject(new Error('Selecione')),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] })
      void qc.invalidateQueries({ queryKey: ['chat-conversations'] })
    },
    onError: (e: Error) => setPageError(e.message),
  })

  const patchLeadMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patchChatLead(id, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['chat-leads'] }),
    onError: (e: Error) => setPageError(e.message),
  })

  const createSchedMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => createChatScheduled(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['chat-scheduled'] }),
    onError: (e: Error) => setPageError(e.message),
  })

  const cancelSchedMut = useMutation({
    mutationFn: (id: string) => cancelChatScheduled(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['chat-scheduled'] }),
    onError: (e: Error) => setPageError(e.message),
  })

  const [newName, setNewName] = useState('')
  const [schedRunAt, setSchedRunAt] = useState('')
  const [schedText, setSchedText] = useState('')

  useEffect(() => {
    setPageError(null)
  }, [tab])

  useEffect(() => {
    setActionMenuOpen(false)
  }, [selectedConvId])

  useEffect(() => {
    if (!actionMenuOpen) return
    const onDown = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) setActionMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [actionMenuOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConvId, messages])

  const onCreateCampaign = useCallback(() => {
    if (!newName.trim()) {
      setPageError('Informe o nome da campanha.')
      return
    }
    createCampaignMut.mutate({
      name: newName.trim(),
      status: 'draft',
      ai_enabled: true,
      system_prompt:
        'Ajude o cliente a entender a consulta de imóvel periciado. Colete e-mail, cidade e tipo de imóvel em lead_patch.',
      playbook: { product: 'consulta_imovel', tone: 'formal_pt_br' },
      disclosure_prefix: 'Sou o assistente virtual da Imóvel Periciado.',
    })
    setNewName('')
  }, [createCampaignMut, newName])

  const onCreateScheduled = useCallback(() => {
    const cid = campaignFilter || campaigns[0]?.id
    if (!cid) {
      setPageError('Selecione uma campanha no filtro ou crie uma antes.')
      return
    }
    if (!schedRunAt || !schedText.trim()) {
      setPageError('Preencha data/hora e texto.')
      return
    }
    createSchedMut.mutate({
      campaign: cid,
      run_at: new Date(schedRunAt).toISOString(),
      kind: 'session_text',
      session_text: schedText.trim(),
    })
    setSchedText('')
  }, [campaignFilter, campaigns, createSchedMut, schedRunAt, schedText])

  if (meLoading) {
    return (
      <div className="min-h-[40vh] px-4 py-10">
        <Skeleton className="mx-auto h-10 max-w-md rounded-xl" />
      </div>
    )
  }

  if (!me?.is_superuser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Alert variant="error" message="Acesso restrito a superusuários." />
        <Link href="/consultas" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  const chatSegments = [
    { id: 'inbox' as const, label: 'Caixa', icon: MessageSquare, badge: conversations.length },
    { id: 'campaigns' as const, label: 'Campanhas', icon: Megaphone, badge: campaigns.length },
    { id: 'leads' as const, label: 'Leads', icon: Users, badge: leads.length },
    { id: 'scheduled' as const, label: 'Agendados', icon: CalendarClock, badge: scheduled.length },
  ] as const

  const openCount = conversations.filter((c) => c.state === 'open').length
  const handoffCount = conversations.filter((c) => c.state === 'handoff').length
  const pendingAi = conversations.filter((c) => (c.ai_pending_reply_body || '').trim()).length

  return (
    <AdminPageShell
      metrics={
        tab === 'inbox' ? (
          <AdminKpiStrip
            items={[
              { id: 'open', label: 'Abertas', value: openCount, tone: 'success' },
              { id: 'handoff', label: 'Handoff', value: handoffCount, tone: 'warning' },
              { id: 'draft', label: 'Rascunho IA', value: pendingAi, tone: 'brand' },
              {
                id: 'camp',
                label: 'Campanhas',
                value: campaigns.length,
                hint: campaignFilter ? 'Filtrada' : 'Todas',
              },
            ]}
          />
        ) : undefined
      }
      actions={
        <Link
          href="/admin/outreach"
          className="inline-flex h-9 items-center rounded-lg border border-[#dedee5] bg-white px-3 text-xs font-semibold text-[#686b82] hover:border-[#7132f5]/30 hover:text-[#7132f5]"
        >
          Divulgação
        </Link>
      }
      className="max-w-[1600px] mx-auto w-full"
    >
        {pageError ? <Alert variant="error" message={pageError} /> : null}

        <AdminSegmentedControl
          segments={chatSegments}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
          aria-label="Seções do chat"
        />

        {tab === 'campaigns' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={cn(ADMIN_PANEL, 'p-4 md:p-5')}>
              <h2 className="text-sm font-semibold text-[#101114]">Nova campanha</h2>
              <p className="mt-1 text-sm text-slate-600">Rascunho com IA e playbook padrão; ative quando estiver pronto.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <FieldLabel>Nome</FieldLabel>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="Ex.: Campanha site Q2"
                  />
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-xl"
                  onClick={onCreateCampaign}
                  disabled={createCampaignMut.isPending}
                  icon={createCampaignMut.isPending ? <Loader2 className="size-4 animate-spin" /> : undefined}
                >
                  Criar rascunho
                </Button>
              </div>
            </section>
            <section className={cn(ADMIN_PANEL, 'p-4 md:p-5')}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#101114]">Lista</h2>
                {campaignsLoading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
              </div>
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {campaigns.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm ring-1 ring-slate-100"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">IA: {c.ai_enabled ? 'sim' : 'não'}</p>
                    <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 rounded border-slate-300"
                        checked={Boolean(c.ai_send_requires_approval)}
                        onChange={(e) =>
                          patchCampaignMut.mutate({ id: c.id, body: { ai_send_requires_approval: e.target.checked } })
                        }
                      />
                      <span>
                        <span className="font-semibold text-slate-900">Aprovar IA antes de enviar</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          A resposta da IA fica em rascunho até o operador enviar no painel.
                        </span>
                      </span>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SelectShell
                        className="h-9 max-w-[11rem] text-xs"
                        value={c.status}
                        onChange={(e) => patchCampaignMut.mutate({ id: c.id, body: { status: e.target.value } })}
                      >
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="paused">paused</option>
                        <option value="archived">archived</option>
                      </SelectShell>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg text-xs"
                        onClick={() => patchCampaignMut.mutate({ id: c.id, body: { ai_enabled: !c.ai_enabled } })}
                      >
                        Alternar IA
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === 'inbox' ? (
          <AdminInboxWorkspace
            intelligence={
              selectedConvId && selectedConv ? (
                <AdminChatContextPanel
                  conversation={selectedConv}
                  campaign={selectedCampaign}
                  className="h-full"
                />
              ) : undefined
            }
            rail={
              <>
              <AdminPanelHeader
                title="Inbox"
                meta={`${conversations.length} conversas`}
                actions={
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[#686b82] transition hover:bg-[rgba(148,151,169,0.08)]"
                    onClick={() => void qc.invalidateQueries({ queryKey: ['chat-conversations'] })}
                    aria-label="Atualizar"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                }
              />
              <div className="border-b border-[#dedee5] px-3 py-2">
                <label className={ADMIN_LABEL}>Campanha</label>
              <SelectShell
                className="mt-1.5"
                value={campaignFilter}
                onChange={(e) => {
                  setCampaignFilter(e.target.value)
                  setSelectedConvId(null)
                }}
              >
                <option value="">Todas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectShell>
              </div>
              <div className="max-h-[min(36rem,62vh)] flex-1 space-y-0.5 overflow-y-auto p-2 scroll-smooth">
                {convLoading ? (
                  <Loader2 className="mx-auto size-6 animate-spin text-slate-300" />
                ) : (
                  conversations.map((c) => {
                    const title = conversationTitle(c)
                    const selected = selectedConvId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedConvId(c.id)}
                        className={cn(
                          ADMIN_INBOX_ITEM,
                          selected ? ADMIN_INBOX_ITEM_ACTIVE : 'hover:bg-[rgba(133,91,251,0.05)]',
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                            selected
                              ? 'bg-white text-[#5741d8] ring-1 ring-[#dedee5]'
                              : 'bg-[rgba(148,151,169,0.12)] text-[#686b82]',
                          )}
                          aria-hidden
                        >
                          {initialsFromTitle(title)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-[#101114]">{title}</span>
                            <span className="shrink-0 tabular-nums text-[10px] text-[#9497a9]">
                              {conversationListTimestamp(c)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#686b82]">
                            {conversationPreviewLine(c)}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {c.state === 'handoff' ? (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">
                                Handoff
                              </span>
                            ) : c.state === 'open' ? (
                              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                                Aberta
                              </span>
                            ) : (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                {c.state}
                              </span>
                            )}
                            {c.ai_active ? (
                              <span className="rounded-md bg-[rgba(133,91,251,0.12)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#5741d8]">
                                IA
                              </span>
                            ) : null}
                            {(c.ai_pending_reply_body || '').trim() ? (
                              <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
                                Rascunho
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
              </>
            }
            thread={
              <>
              {!selectedConvId ? (
                <AdminEmptyState
                  title="Nenhuma conversa selecionada"
                  description="Selecione um contato na lista para ver histórico, estados de IA, handoff e responder."
                  icon={<MessageSquare className="size-10 opacity-30" />}
                  className="m-4 flex-1 border-0 bg-transparent"
                />
              ) : (
                <>
                  {messagesQueryError ? (
                    <div className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm">
                      Não foi possível atualizar as mensagens em segundo plano.
                      {messagesQueryErr instanceof Error && messagesQueryErr.message
                        ? ` ${messagesQueryErr.message}`
                        : null}{' '}
                      A última lista carregada mantém-se visível (rede instável ou limite da API).
                    </div>
                  ) : null}
                  <div className={cn(ADMIN_PANEL_HEADER, 'px-4 py-3')}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-[#101114]">
                            {selectedConv ? conversationTitle(selectedConv) : '—'}
                          </p>
                          {selectedConv?.state === 'open' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(20,158,97,0.16)] px-2 py-0.5 text-[10px] font-bold uppercase text-[#026b3f]">
                              Ativa
                            </span>
                          ) : selectedConv?.state === 'handoff' ? (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                              Handoff
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-[#9497a9]">{selectedConv?.customer_wa_id}</p>
                        {selectedConv?.campaign_name ? (
                          <p className="mt-0.5 text-[10px] text-[#686b82]">{selectedConv.campaign_name}</p>
                        ) : null}
                      </div>
                      <div className="relative shrink-0" ref={actionsMenuRef}>
                        <button
                          type="button"
                          onClick={() => setActionMenuOpen((o) => !o)}
                          className={ADMIN_BTN_GHOST}
                        >
                          <Zap className="size-3.5" aria-hidden />
                          Ações
                          <MoreVertical className="size-3.5 opacity-60" aria-hidden />
                        </button>
                        {actionMenuOpen ? (
                          <div
                            className="absolute right-0 z-20 mt-1 min-w-[12.5rem] rounded-xl bg-white py-1 shadow-lg shadow-slate-300/40 ring-1 ring-slate-200/80"
                            role="menu"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                              disabled={handoffMut.isPending}
                              onClick={() => {
                                setActionMenuOpen(false)
                                handoffMut.mutate()
                              }}
                            >
                              <UserRoundCog className="size-3.5 shrink-0 text-slate-500" />
                              Handoff
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                              disabled={toggleAiMut.isPending}
                              onClick={() => {
                                setActionMenuOpen(false)
                                toggleAiMut.mutate(!selectedConv?.ai_active)
                              }}
                            >
                              <Bot className="size-3.5 shrink-0 text-slate-500" />
                              {selectedConv?.ai_active ? 'Desligar IA' : 'Ligar IA'}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                              disabled={replayAiMut.isPending}
                              onClick={() => {
                                setActionMenuOpen(false)
                                replayAiMut.mutate()
                              }}
                            >
                              <Sparkles className="size-3.5 shrink-0 text-slate-500" />
                              Pedir resposta IA
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[#6b7280]">
                      <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600">
                        IA conversa: {selectedConv?.ai_active ? 'ligada' : 'desligada'}
                      </span>
                      <span className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600">
                        IA campanha: {selectedCampaign?.ai_enabled ? 'sim' : 'não'}
                      </span>
                      {selectedCampaign?.ai_send_requires_approval ? (
                        <span className="rounded-lg bg-violet-50 px-2 py-1 font-medium text-violet-900">
                          Aprovação obrigatória
                        </span>
                      ) : null}
                      {(selectedConv?.ai_pending_reply_body || '').trim() ? (
                        <span className="rounded-lg bg-amber-50 px-2 py-1 font-medium text-amber-950">Rascunho pendente</span>
                      ) : null}
                    </div>
                  </div>
                  {(selectedConv?.ai_pending_reply_body || '').trim() ? (
                    <div className="border-b border-amber-100/90 bg-gradient-to-b from-amber-50/80 to-amber-50/40 px-5 py-4 shadow-inner">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
                        Aprovar antes de enviar ao WhatsApp
                      </p>
                      {selectedConv?.ai_pending_request_handoff ? (
                        <p className="mt-1 text-[11px] font-medium text-amber-950">
                          A IA pediu handoff após envio: ao aprovar, a conversa passa para handoff após a mensagem.
                        </p>
                      ) : null}
                      <textarea
                        value={aiApproveDraft}
                        onChange={(e) => setAiApproveDraft(e.target.value)}
                        rows={4}
                        className="mt-2 w-full resize-y rounded-xl border border-amber-200/60 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="h-9 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
                          disabled={approveAiMut.isPending || !aiApproveDraft.trim()}
                          onClick={() => approveAiMut.mutate()}
                          icon={
                            approveAiMut.isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )
                          }
                        >
                          Aprovar e enviar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl border-amber-200 text-amber-950 hover:bg-amber-50/80"
                          disabled={rejectAiMut.isPending}
                          onClick={() => rejectAiMut.mutate()}
                          icon={rejectAiMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                        >
                          Descartar rascunho
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(133,91,251,0.05),#F4F5FA)]">
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto scroll-smooth px-4 py-4">
                      {msgLoading ? <Loader2 className="mx-auto size-6 animate-spin text-slate-300" /> : null}
                      {messages.map((m: ChatMessage) => {
                        const friendly = m.direction === 'system' ? systemFriendlyLine(m.body) : null
                        const isAiOut = m.direction === 'out' && !m.sender
                        const tone: BubbleTone =
                          m.direction === 'in'
                            ? 'in'
                            : m.direction === 'system'
                              ? 'system'
                              : isAiOut
                                ? 'outLight'
                                : 'outDark'
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              'max-w-[min(85%,28rem)] text-[13px] leading-snug shadow-sm',
                              m.direction === 'in' && 'ml-0 rounded-2xl rounded-tl-md bg-white px-3 py-2 text-slate-900 shadow-slate-200/60',
                              m.direction === 'out' &&
                                isAiOut &&
                                'ml-auto rounded-2xl rounded-tr-md bg-[#dbe4ff] px-3 py-2 text-slate-900 shadow-slate-300/30',
                              m.direction === 'out' &&
                                !isAiOut &&
                                'ml-auto rounded-xl rounded-tr-md bg-[#7132f5] px-3 py-2 text-white shadow-[0_1px_2px_rgba(16,17,20,0.08)]',
                              m.direction === 'system' &&
                                'mx-auto max-w-[min(92%,32rem)] rounded-xl bg-amber-50/95 px-3 py-2 text-center text-amber-950 shadow-sm',
                            )}
                          >
                            {friendly ? (
                              <p className="whitespace-pre-wrap break-words">{friendly}</p>
                            ) : (
                              <ChatMessageBody m={m} tone={tone} />
                            )}
                            <p className="mt-1 text-[10px] text-[#6b7280]">
                              {messageChannelLabel(m)}
                              {m.created
                                ? ` · ${new Date(m.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                : null}
                            </p>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} aria-hidden className="h-1 shrink-0" />
                    </div>
                  </div>
                  <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <div className="flex min-w-0 flex-nowrap items-end gap-3">
                      <textarea
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        rows={2}
                        className="min-h-[2.75rem] min-w-0 flex-1 resize-y rounded-lg border border-[#dedee5] bg-[#FAFAFB] px-3 py-2 text-sm text-[#101114] outline-none transition focus:border-[#7132f5] focus:bg-white focus:ring-2 focus:ring-[rgba(133,91,251,0.15)]"
                        placeholder="Mensagem ao cliente (WhatsApp)…"
                      />
                      <button
                        type="button"
                        onClick={() => sendMut.mutate()}
                        disabled={sendMut.isPending || !composer.trim()}
                        className={cn(ADMIN_BTN_PRIMARY, 'shrink-0 disabled:pointer-events-none')}
                      >
                        {sendMut.isPending ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                        ) : (
                          <Send className="size-4 shrink-0" aria-hidden />
                        )}
                        Enviar
                      </button>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[#6b7280]">
                      <ShieldAlert className="size-3.5 shrink-0" />
                      Cloud API Meta; respeite a janela de 24h e as políticas da plataforma.
                    </p>
                  </div>
                </>
              )}
              </>
            }
          />
        ) : null}

        {tab === 'leads' ? (
          <div className={cn(ADMIN_PANEL, 'overflow-x-auto')}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Dados</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leadsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <Loader2 className="mx-auto size-6 animate-spin" />
                    </td>
                  </tr>
                ) : (
                  leads.map((L: ChatLead) => (
                    <tr key={L.id} className="bg-white">
                      <td className="px-4 py-2 font-mono text-xs">{L.customer_wa_id}</td>
                      <td className="px-4 py-2 text-xs text-slate-600">{L.campaign_id.slice(0, 8)}…</td>
                      <td className="max-w-xs truncate px-4 py-2 font-mono text-xs text-slate-700">
                        {JSON.stringify(L.payload)}
                      </td>
                      <td className="px-4 py-2 text-xs font-semibold">{L.status}</td>
                      <td className="px-4 py-2">
                        <SelectShell
                          className="h-9 max-w-[10rem] text-xs"
                          value={L.status}
                          onChange={(e) => patchLeadMut.mutate({ id: L.id, status: e.target.value })}
                        >
                          <option value="new">new</option>
                          <option value="qualified">qualified</option>
                          <option value="discarded">discarded</option>
                        </SelectShell>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'scheduled' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={cn(ADMIN_PANEL, 'p-4 md:p-5')}>
              <h2 className="text-sm font-semibold text-[#101114]">Novo envio agendado</h2>
              <p className="mt-1 text-sm text-slate-600">Texto de sessão para conversas da campanha filtrada (ou primeira da lista).</p>
              <div className="mt-4 space-y-3">
                <div>
                  <FieldLabel>Data e hora (local)</FieldLabel>
                  <input
                    type="datetime-local"
                    value={schedRunAt}
                    onChange={(e) => setSchedRunAt(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <div>
                  <FieldLabel>Texto</FieldLabel>
                  <textarea
                    value={schedText}
                    onChange={(e) => setSchedText(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-xl"
                  onClick={onCreateScheduled}
                  disabled={createSchedMut.isPending}
                >
                  Agendar
                </Button>
              </div>
            </section>
            <section className={cn(ADMIN_PANEL, 'p-4 md:p-5')}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#101114]">Fila</h2>
                {schedLoading ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
              </div>
              <ul className="max-h-[24rem] space-y-2 overflow-y-auto">
                {scheduled.map((s: ChatScheduledMessage) => (
                  <li key={s.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{new Date(s.run_at).toLocaleString('pt-BR')}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-slate-200">
                        {s.run_status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-slate-600">{s.session_text || s.template_name}</p>
                    {s.run_status === 'pending' ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-8 rounded-lg text-xs"
                        onClick={() => cancelSchedMut.mutate(s.id)}
                      >
                        Cancelar
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
    </AdminPageShell>
  )
}
