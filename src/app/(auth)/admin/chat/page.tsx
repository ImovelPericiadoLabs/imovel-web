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
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-wide text-slate-500">{children}</label>
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
  })

  const { data: conversations = [], isFetching: convLoading } = useQuery({
    queryKey: ['chat-conversations', campaignFilter],
    queryFn: () =>
      listChatConversations({
        campaign: campaignFilter || undefined,
        limit: 80,
      }),
    enabled: Boolean(me?.is_superuser),
    refetchInterval: tab === 'inbox' ? 5000 : false,
  })

  const { data: messages = [], isFetching: msgLoading } = useQuery({
    queryKey: ['chat-messages', selectedConvId],
    queryFn: () => listChatMessages(selectedConvId!, { limit: 80 }),
    enabled: Boolean(me?.is_superuser && selectedConvId),
    refetchInterval: tab === 'inbox' && selectedConvId ? 3500 : false,
  })

  const { data: leads = [], isFetching: leadsLoading } = useQuery({
    queryKey: ['chat-leads'],
    queryFn: () => listChatLeads(),
    enabled: Boolean(me?.is_superuser) && tab === 'leads',
  })

  const { data: scheduled = [], isFetching: schedLoading } = useQuery({
    queryKey: ['chat-scheduled', campaignFilter],
    queryFn: () => listChatScheduled({ campaign: campaignFilter || undefined }),
    enabled: Boolean(me?.is_superuser) && tab === 'scheduled',
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

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-24">
      <div className="border-b border-slate-200/80 bg-white py-2 text-center text-[11px] font-medium text-[#6b7280]">
        Chat comercial · Meta WhatsApp + operadores (superusuário)
      </div>
      <header className="border-b border-slate-200/70 bg-white shadow-sm shadow-slate-200/40">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
              <MessageSquare className="size-7 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <TextTitle className="text-xl text-slate-900 md:text-2xl">Chat</TextTitle>
              <TextSubtitle className="mt-1 max-w-2xl text-sm text-slate-600 md:text-[15px]">
                Campanhas de chat (não confundir com outreach) recebem WhatsApp; pode exigir aprovação antes da IA
                enviar ao cliente. O estado da IA e rascunhos ficam visíveis na caixa.
              </TextSubtitle>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/outreach"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary/30 hover:text-primary"
            >
              Divulgação
            </Link>
            <Link
              href="/consultas"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary/30 hover:text-primary"
            >
              Consultas
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 lg:px-10">
        {pageError ? <Alert variant="error" message={pageError} className="mb-4" /> : null}

        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Seções">
          {(
            [
              { id: 'inbox' as const, label: 'Caixa', Icon: MessageSquare },
              { id: 'campaigns' as const, label: 'Campanhas', Icon: Megaphone },
              { id: 'leads' as const, label: 'Leads', Icon: Users },
              { id: 'scheduled' as const, label: 'Agendados', Icon: CalendarClock },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition',
                tab === id
                  ? 'bg-[#1f3a8a] text-white shadow-md shadow-[#1f3a8a]/20'
                  : 'bg-white text-[#6b7280] shadow-sm shadow-slate-200/50 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'campaigns' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-bold text-slate-900">Nova campanha</h2>
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
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Lista</h2>
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
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
            <aside className="flex flex-col overflow-hidden rounded-xl bg-white p-4 shadow-md shadow-slate-200/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">Campanha</span>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#6b7280] transition hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => void qc.invalidateQueries({ queryKey: ['chat-conversations'] })}
                  aria-label="Atualizar"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
              <SelectShell
                className="mt-2"
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
              <div className="mt-3 max-h-[min(36rem,60vh)] flex-1 space-y-0.5 overflow-y-auto scroll-smooth pr-0.5">
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
                          'flex w-full gap-3 border-l-[3px] rounded-xl px-2.5 py-2.5 text-left transition',
                          selected
                            ? 'border-l-[#1f3a8a] bg-[#eceffb] shadow-sm shadow-slate-200/40 ring-1 ring-[#1f3a8a]/15'
                            : 'border-l-transparent hover:bg-slate-50',
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1',
                            selected
                              ? 'bg-white text-[#1f3a8a] ring-[#1f3a8a]/20'
                              : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 ring-slate-200/80',
                          )}
                          aria-hidden
                        >
                          {initialsFromTitle(title)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-900">{title}</span>
                            <span className="shrink-0 tabular-nums text-[11px] text-[#6b7280]">
                              {conversationListTimestamp(c)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#6b7280]">
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
                              <span className="rounded-md bg-[#1f3a8a]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1f3a8a]">
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
            </aside>
            <section className="flex min-h-[min(32rem,70vh)] flex-col overflow-hidden rounded-xl bg-white shadow-md shadow-slate-200/50">
              {!selectedConvId ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-sm text-[#6b7280]">
                  <MessageSquare className="size-12 text-slate-300" aria-hidden />
                  <p className="max-w-xs">Escolha uma conversa na lista para ver as mensagens e responder.</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {selectedConv ? conversationTitle(selectedConv) : '—'}
                          </p>
                          {selectedConv?.state === 'open' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                              Ativa
                            </span>
                          ) : selectedConv?.state === 'handoff' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                              Handoff
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-mono text-[13px] text-[#6b7280]">{selectedConv?.customer_wa_id}</p>
                        {selectedConv?.campaign_name ? (
                          <p className="mt-1 text-xs text-[#6b7280]">{selectedConv.campaign_name}</p>
                        ) : null}
                      </div>
                      <div className="relative shrink-0" ref={actionsMenuRef}>
                        <button
                          type="button"
                          onClick={() => setActionMenuOpen((o) => !o)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
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
                  <div className="flex flex-1 flex-col overflow-hidden bg-[#f7f8fa]">
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
                                'ml-auto rounded-2xl rounded-tr-md bg-[#1f3a8a] px-3 py-2 text-white shadow-[#1f3a8a]/25',
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
                    <div className="flex gap-2">
                      <textarea
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        rows={2}
                        className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200/90 bg-[#f7f8fa] px-3 py-2 text-sm outline-none transition focus:border-[#1f3a8a] focus:bg-white focus:ring-2 focus:ring-[#1f3a8a]/15"
                        placeholder="Mensagem ao cliente (WhatsApp)…"
                      />
                      <Button
                        type="button"
                        className="h-10 shrink-0 self-end rounded-xl bg-[#1f3a8a] px-4 hover:bg-[#1a326f]"
                        onClick={() => sendMut.mutate()}
                        disabled={sendMut.isPending || !composer.trim()}
                        icon={sendMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      >
                        Enviar
                      </Button>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[#6b7280]">
                      <ShieldAlert className="size-3.5 shrink-0" />
                      Cloud API Meta; respeite a janela de 24h e as políticas da plataforma.
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
        ) : null}

        {tab === 'leads' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
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
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-bold text-slate-900">Novo envio agendado</h2>
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
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Fila</h2>
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
      </div>
    </div>
  )
}
