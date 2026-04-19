'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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

function ChatMessageBody({ m }: { m: ChatMessage }): ReactNode {
  const mediaId = useMemo(() => extractWaMediaIdFromChatMessage(m), [m])
  const typ = (m.wa_message_type || '').toLowerCase()
  const showImage = typ === 'image' && Boolean(mediaId)
  const showTypePill = Boolean(typ && typ !== 'text' && !(typ === 'image' && showImage))
  const pillClass =
    m.direction === 'out'
      ? 'bg-white/15 text-white/95 ring-white/25'
      : 'bg-black/5 text-slate-600 ring-black/10'

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
  const [pageError, setPageError] = useState<string | null>(null)

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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['chat-messages', selectedConvId] }),
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(11,27,58,0.07),transparent)] pb-24">
      <div className="border-b border-slate-800/10 bg-[#0b1b3a] py-1.5 text-center text-[11px] font-medium text-slate-300">
        Chat comercial · Meta WhatsApp + operadores (superusuário)
      </div>
      <header className="border-b border-slate-200/90 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
              <MessageSquare className="size-7 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <TextTitle className="text-xl text-slate-900 md:text-2xl">Chat</TextTitle>
              <TextSubtitle className="mt-1 max-w-2xl text-sm text-slate-600 md:text-[15px]">
                Campanhas ativas recebem mensagens do webhook WhatsApp; operadores respondem aqui. IA opcional por
                campanha.
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
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition',
                tab === id ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <aside className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Filtro campanha</span>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  onClick={() => void qc.invalidateQueries({ queryKey: ['chat-conversations'] })}
                  aria-label="Atualizar"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>
              <SelectShell
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
              <div className="max-h-[min(32rem,55vh)] space-y-1 overflow-y-auto pt-2">
                {convLoading ? (
                  <Loader2 className="mx-auto size-6 animate-spin text-slate-300" />
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConvId(c.id)}
                      className={cn(
                        'flex w-full flex-col rounded-xl border px-3 py-2.5 text-left text-xs transition',
                        selectedConvId === c.id
                          ? 'border-primary bg-primary/[0.06] ring-2 ring-primary/20'
                          : 'border-transparent hover:bg-slate-50',
                      )}
                    >
                      <span className="line-clamp-2 text-left text-[12px] font-semibold leading-tight text-slate-900">
                        {conversationTitle(c)}
                      </span>
                      <span className="mt-0.5 font-mono text-[10px] text-slate-500">{c.customer_wa_id}</span>
                      <span className="mt-1 text-[10px] font-bold uppercase text-slate-500">{c.state}</span>
                    </button>
                  ))
                )}
              </div>
            </aside>
            <section className="flex min-h-[28rem] flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              {!selectedConvId ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
                  <MessageSquare className="size-10 text-slate-300" />
                  Selecione uma conversa
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedConv ? conversationTitle(selectedConv) : '—'}
                      </p>
                      <p className="font-mono text-xs text-slate-600">{selectedConv?.customer_wa_id}</p>
                      <p className="text-xs text-slate-500">{selectedConv?.campaign_name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg text-xs"
                        onClick={() => handoffMut.mutate()}
                        disabled={handoffMut.isPending}
                        icon={<UserRoundCog className="size-3.5" />}
                      >
                        Handoff
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg text-xs"
                        onClick={() => toggleAiMut.mutate(!selectedConv?.ai_active)}
                        disabled={toggleAiMut.isPending}
                        icon={<Bot className="size-3.5" />}
                      >
                        IA {selectedConv?.ai_active ? 'off' : 'on'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-lg text-xs"
                        onClick={() => replayAiMut.mutate()}
                        disabled={replayAiMut.isPending}
                        icon={<Sparkles className="size-3.5" />}
                      >
                        Fila IA
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50/50 p-4">
                    {msgLoading ? <Loader2 className="mx-auto size-6 animate-spin text-slate-300" /> : null}
                    {messages.map((m: ChatMessage) => (
                      <div
                        key={m.id}
                        className={cn(
                          'max-w-[92%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                          m.direction === 'in' && 'ml-0 bg-white text-slate-900 ring-1 ring-slate-200',
                          m.direction === 'out' && 'ml-auto bg-primary text-white',
                          m.direction === 'system' && 'mx-auto bg-amber-50 text-amber-950 ring-1 ring-amber-200/80',
                        )}
                      >
                        <ChatMessageBody m={m} />
                        <p className="mt-1 text-[10px] opacity-70">{m.direction}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 p-3">
                    <div className="flex gap-2">
                      <textarea
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        rows={2}
                        className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        placeholder="Mensagem ao cliente (WhatsApp)…"
                      />
                      <Button
                        type="button"
                        className="h-11 shrink-0 self-end rounded-xl px-4"
                        onClick={() => sendMut.mutate()}
                        disabled={sendMut.isPending || !composer.trim()}
                        icon={sendMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      >
                        Enviar
                      </Button>
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                      <ShieldAlert className="size-3.5 shrink-0" />
                      Mensagens reais via Cloud API; respeite janela de 24h e políticas Meta.
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
