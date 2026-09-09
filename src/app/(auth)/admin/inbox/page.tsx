'use client'

import { Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bot, RefreshCw, Search, UserRoundCog } from 'lucide-react'
import Alert from '@/components/alert'
import {
  AdminConfirmDialog,
  AdminInboxWorkspace,
  AdminPageShell,
  AdminSegmentedControl,
  AdminSupportOrdersPanel,
  ADMIN_BTN_GHOST,
  ADMIN_ICON_BTN,
  ADMIN_INPUT,
} from '@/components/admin'
import AdminStaffGate from '@/components/admin/admin-staff-gate'
import {
  getSupportConversation,
  listSupportConversations,
  patchSupportConversation,
  postSupportHandoff,
  postSupportToggleAi,
  sendSupportMessage,
  STATUS_LABELS,
  type SupportConversation,
  type SupportInboxStatus,
  type SupportMessage,
} from '@/services/messaging'
import { cn } from '@/utils/tailwind'
import { InboxComposer } from './_components/inbox-composer'
import { InboxConversationRow } from './_components/inbox-conversation-row'
import { InboxEmptyState } from './_components/inbox-empty-state'
import { InboxMessageBubble } from './_components/inbox-message-bubble'
import { InboxListSkeleton, InboxThreadSkeleton } from './_components/inbox-skeletons'
import { InboxThreadHeader } from './_components/inbox-thread-header'
import { useChatScroll } from '@/hooks/use-chat-scroll'

function titleOf(c: SupportConversation) {
  return (c.customer_name || '').trim() || c.contact_phone_e164 || 'Conversa'
}

function previewOf(c: SupportConversation) {
  const raw = (c.last_message_preview || '').replace(/\s+/g, ' ').trim()
  if (!raw) return 'Sem mensagens'
  return raw.length > 80 ? `${raw.slice(0, 77)}…` : raw
}

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'new', label: 'Novas' },
  { id: 'unread', label: 'Não lidas' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'waiting_customer', label: 'Aguard. cliente' },
  { id: 'waiting_internal', label: 'Aguard. interno' },
  { id: 'resolved', label: 'Resolvidas' },
] as const


function InboxPageInner() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [optimisticMsgs, setOptimisticMsgs] = useState<SupportMessage[]>([])

  const listQuery = useQuery({
    queryKey: ['support-inbox-conversations', statusFilter],
    queryFn: () =>
      listSupportConversations({
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: 20_000,
  })

  const conversations = listQuery.data?.results ?? []
  const listPerms = listQuery.data?.permissions ?? {}

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const hay =
        `${c.customer_name || ''} ${c.contact_phone_e164 || ''} ${c.last_message_preview || ''} ${c.campaign_name || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [conversations, search])

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const detailQuery = useQuery({
    queryKey: ['support-inbox-detail', selectedId],
    queryFn: () => getSupportConversation(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 12_000 : false,
  })

  const detail = detailQuery.data
  const perms = detail?.permissions ?? listPerms
  const messages = [...(detail?.messages ?? []), ...optimisticMsgs]
  const messageKey = `${messages.length}:${messages.at(-1)?.id ?? ''}`
  const { viewportRef, handleScroll, followNextMessage } = useChatScroll(selectedId, messageKey)
  const orders = detail?.orders ?? selected?.related_orders ?? []
  const activeConv = detail?.conversation ?? selected
  const showMobileThread = Boolean(selectedId)
  const isCampaign = activeConv?.source === 'campaign'

  const sendMut = useMutation({
    mutationFn: (content: string) => sendSupportMessage(selectedId!, content),
    onMutate: (content) => {
      const temp: SupportMessage = {
        id: `tmp-${Date.now()}`,
        content,
        direction: 'out',
        created_at: new Date().toISOString(),
        sendState: 'sending',
      }
      setOptimisticMsgs((prev) => [...prev, temp])
      return { tempId: temp.id }
    },
    onSuccess: async (_data, _content, ctx) => {
      setDraft('')
      setOptimisticMsgs((prev) => prev.filter((m) => m.id !== ctx?.tempId))
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
    onError: (_err, _content, ctx) => {
      setOptimisticMsgs((prev) =>
        prev.map((m) => (m.id === ctx?.tempId ? { ...m, sendState: 'error' as const } : m)),
      )
    },
  })

  const assignMut = useMutation({
    mutationFn: () => patchSupportConversation(selectedId!, { assignee_id: 'me' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
  })

  const resolveMut = useMutation({
    mutationFn: () =>
      patchSupportConversation(selectedId!, { status: 'resolved' as SupportInboxStatus }),
    onSuccess: async () => {
      setResolveOpen(false)
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
  })

  const handoffMut = useMutation({
    mutationFn: () => postSupportHandoff(selectedId!),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
  })

  const toggleAiMut = useMutation({
    mutationFn: (aiActive: boolean) => postSupportToggleAi(selectedId!, aiActive),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
  })

  const statusSegments = FILTERS.map((f) => ({
    id: f.id,
    label: f.label,
  }))

  return (
    <AdminPageShell flush>
      <AdminInboxWorkspace
        intelligence={
          <AdminSupportOrdersPanel
            conversation={activeConv}
            orders={orders}
            className="h-full min-h-0"
            canAssign={Boolean(perms.assign)}
            onAssignMe={perms.assign ? () => assignMut.mutate() : undefined}
            assigning={assignMut.isPending}
          />
        }
        rail={
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col',
              showMobileThread ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[rgba(113,50,245,0.1)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#101114]">Conversas</p>
                <p className="text-[10px] text-[#9497a9]">
                  {filtered.length} na caixa
                  {listPerms.view_all ? ' · visão ampla' : ' · seu escopo'}
                </p>
              </div>
              <button
                type="button"
                className={ADMIN_ICON_BTN}
                onClick={() => void listQuery.refetch()}
                aria-label="Atualizar"
              >
                <RefreshCw className={cn('size-3.5', listQuery.isFetching && 'animate-spin')} />
              </button>
            </div>

            <div className="shrink-0 space-y-2 border-b border-[rgba(113,50,245,0.08)] px-3 py-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9497a9]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, número ou campanha"
                  className={cn(ADMIN_INPUT, 'h-8 rounded-lg py-1.5 pl-8 text-[12px]')}
                />
              </label>
              <div className="overflow-x-auto pb-0.5">
                <AdminSegmentedControl
                  segments={statusSegments}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  aria-label="Filtrar por status"
                  className="min-w-max"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {listQuery.isError ? (
                <div className="p-3">
                  <Alert
                    variant="warning"
                    message={
                      (listQuery.error as Error)?.message ||
                      'Não foi possível carregar as conversas.'
                    }
                  />
                </div>
              ) : listQuery.isLoading ? (
                <InboxListSkeleton />
              ) : filtered.length === 0 ? (
                <InboxEmptyState
                  title="Nenhuma conversa"
                  description="Suporte (RelayHub) e campanhas (Meta) aparecem aqui no mesmo inbox."
                />
              ) : (
                <div className="space-y-0.5 p-2">
                  {filtered.map((c) => (
                    <InboxConversationRow
                      key={c.id}
                      title={titleOf(c)}
                      preview={previewOf(c)}
                      time={c.last_message_at}
                      status={c.status}
                      source={c.source || 'support'}
                      assigneeName={c.assignee?.name}
                      campaignLabel={
                        c.source === 'campaign' && c.campaign_name
                          ? c.campaign_name
                          : null
                      }
                      orderLabel={
                        c.primary_order
                          ? `Pedido #${c.primary_order.code} · ${c.primary_order.status}`
                          : null
                      }
                      selected={selectedId === c.id}
                      onSelect={() => {
                        setSelectedId(c.id)
                        setDraft('')
                        setOptimisticMsgs([])
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        }
        thread={
          <div
            className={cn(
              'relative flex min-h-0 flex-1 flex-col',
              !showMobileThread ? 'hidden lg:flex' : 'flex',
            )}
          >
            {!selectedId || !activeConv ? (
              <InboxEmptyState
                title="Selecione uma conversa"
                description="O painel direito mostra o cliente e os pedidos para resolver sem sair do atendimento."
              />
            ) : (
              <>
                <InboxThreadHeader
                  title={titleOf(activeConv)}
                  subtitle={
                    isCampaign && activeConv.campaign_name
                      ? `${activeConv.contact_phone_e164 || '—'} · ${activeConv.campaign_name}`
                      : activeConv.contact_phone_e164
                  }
                  status={activeConv.status}
                  assigneeName={activeConv.assignee?.name}
                  showBack
                  onBack={() => setSelectedId(null)}
                  onToggleDetails={() => setDetailsOpen((v) => !v)}
                  canAssign={Boolean(perms.assign)}
                  canResolve={Boolean(perms.resolve)}
                  onAssignMe={() => assignMut.mutate()}
                  onResolve={() => setResolveOpen(true)}
                  assigning={assignMut.isPending}
                  resolving={resolveMut.isPending}
                />

                {isCampaign ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[rgba(113,50,245,0.08)] bg-[rgba(113,50,245,0.03)] px-3 py-1.5">
                    <button
                      type="button"
                      className={cn(ADMIN_BTN_GHOST, 'h-7 text-[11px]')}
                      disabled={!perms.reply || toggleAiMut.isPending}
                      onClick={() => toggleAiMut.mutate(!(activeConv.ai_active ?? false))}
                    >
                      <Bot className="size-3.5" />
                      IA {activeConv.ai_active ? 'ligada' : 'desligada'}
                    </button>
                    <button
                      type="button"
                      className={cn(ADMIN_BTN_GHOST, 'h-7 text-[11px]')}
                      disabled={
                        !(perms.assign || perms.resolve) ||
                        handoffMut.isPending ||
                        activeConv.chat_state === 'handoff'
                      }
                      onClick={() => handoffMut.mutate()}
                    >
                      <UserRoundCog className="size-3.5" />
                      Handoff
                    </button>
                  </div>
                ) : null}

                <div
                  ref={viewportRef}
                  onScroll={handleScroll}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-28 pt-4 lg:px-5"
                >
                  {detailQuery.isError ? (
                    <Alert
                      variant="warning"
                      message={
                        isCampaign
                          ? 'Não foi possível carregar as mensagens da campanha.'
                          : 'Não foi possível carregar as mensagens do RelayHub.'
                      }
                    />
                  ) : null}
                  {detailQuery.isLoading && messages.length === 0 ? (
                    <InboxThreadSkeleton />
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-xs text-[#9497a9]">
                      Sem mensagens carregadas.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <InboxMessageBubble
                        key={m.id}
                        content={m.content}
                        direction={m.direction}
                        createdAt={m.created_at}
                        senderLabel={m.direction === 'out' ? 'Atendente' : undefined}
                        sendState={m.sendState}
                      />
                    ))
                  )}
                </div>

                <InboxComposer
                  draft={draft}
                  onDraftChange={setDraft}
                  onSend={() => {
                    followNextMessage()
                    sendMut.mutate(draft.trim())
                  }}
                  pending={sendMut.isPending}
                  disabled={!perms.reply}
                  error={
                    sendMut.isError
                      ? (sendMut.error as Error)?.message || 'Falha ao enviar.'
                      : null
                  }
                  onRetry={() => {
                    const text = draft.trim() || optimisticMsgs.at(-1)?.content
                    if (text) {
                      followNextMessage()
                      sendMut.mutate(text)
                    }
                  }}
                />
              </>
            )}

            {detailsOpen && activeConv ? (
              <div className="absolute inset-0 z-20 xl:hidden">
                <button
                  type="button"
                  className="absolute inset-0 bg-[#0b1b3a]/35"
                  aria-label="Fechar detalhes"
                  onClick={() => setDetailsOpen(false)}
                />
                <div className="absolute inset-y-0 right-0 w-[min(100%,20rem)] shadow-2xl">
                  <AdminSupportOrdersPanel
                    conversation={activeConv}
                    orders={orders}
                    className="h-full rounded-none border-0"
                    canAssign={Boolean(perms.assign)}
                    onAssignMe={perms.assign ? () => assignMut.mutate() : undefined}
                    assigning={assignMut.isPending}
                  />
                </div>
              </div>
            ) : null}
          </div>
        }
      />

      <AdminConfirmDialog
        open={resolveOpen}
        title="Resolver conversa?"
        description={`Marcar como “${STATUS_LABELS.resolved}”. O cliente ainda pode reabrir ao enviar nova mensagem.`}
        confirmLabel="Resolver"
        variant="primary"
        loading={resolveMut.isPending}
        onConfirm={() => resolveMut.mutate()}
        onClose={() => setResolveOpen(false)}
      />
    </AdminPageShell>
  )
}

export default function AdminSupportInboxPage() {
  return (
    <AdminStaffGate>
      <Suspense fallback={null}>
        <InboxPageInner />
      </Suspense>
    </AdminStaffGate>
  )
}
