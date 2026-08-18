'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquare, RefreshCw, Send } from 'lucide-react'
import {
  AdminEmptyState,
  AdminInboxWorkspace,
  AdminPageShell,
  AdminPanelHeader,
  AdminSupportOrdersPanel,
  ADMIN_BTN_PRIMARY,
  ADMIN_INBOX_ITEM,
  ADMIN_INBOX_ITEM_ACTIVE,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '@/components/admin'
import AdminStaffGate from '@/components/admin/admin-staff-gate'
import {
  getSupportConversation,
  listSupportConversations,
  sendSupportMessage,
  type SupportConversation,
} from '@/services/messaging'
import { cn } from '@/utils/tailwind'

function titleOf(c: SupportConversation) {
  return (c.customer_name || '').trim() || c.contact_phone_e164 || 'Conversa'
}

function formatClock(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function previewOf(c: SupportConversation) {
  const raw = (c.last_message_preview || '').replace(/\s+/g, ' ').trim()
  if (!raw) return 'Sem mensagens'
  return raw.length > 72 ? `${raw.slice(0, 69)}…` : raw
}

function InboxPageInner() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const { data: conversations = [], isFetching: listLoading } = useQuery({
    queryKey: ['support-inbox-conversations'],
    queryFn: listSupportConversations,
    refetchInterval: 20_000,
  })

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const { data: detail, isFetching: detailLoading } = useQuery({
    queryKey: ['support-inbox-detail', selectedId],
    queryFn: () => getSupportConversation(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 12_000 : false,
  })

  const sendMut = useMutation({
    mutationFn: (content: string) => sendSupportMessage(selectedId!, content),
    onSuccess: async () => {
      setDraft('')
      await qc.invalidateQueries({ queryKey: ['support-inbox-detail', selectedId] })
      await qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })
    },
  })

  const messages = detail?.messages ?? []
  const orders = detail?.orders ?? selected?.related_orders ?? []

  return (
    <AdminPageShell
      title="Inbox suporte"
      description="Conversas WhatsApp (RelayHub) com pedidos do cliente — sem tags/automações."
    >
      <AdminInboxWorkspace
        intelligence={
          <AdminSupportOrdersPanel
            conversation={selected}
            orders={orders}
            className="h-full min-h-[28rem]"
          />
        }
        rail={
          <>
            <AdminPanelHeader
              title="Caixa"
              meta={`${conversations.length} conversas`}
              actions={
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#686b82] transition hover:bg-[rgba(148,151,169,0.08)]"
                  onClick={() => void qc.invalidateQueries({ queryKey: ['support-inbox-conversations'] })}
                  aria-label="Atualizar"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              }
            />
            <div className="max-h-[min(36rem,62vh)] flex-1 space-y-0.5 overflow-y-auto p-2">
              {listLoading && conversations.length === 0 ? (
                <Loader2 className="mx-auto size-6 animate-spin text-slate-300" />
              ) : conversations.length === 0 ? (
                <AdminEmptyState
                  icon={<MessageSquare className="size-6 text-[#5741d8]" />}
                  title="Nenhuma conversa"
                  description="Quando o RelayHub receber mensagens, elas aparecem aqui vinculadas ao cliente."
                />
              ) : (
                conversations.map((c) => {
                  const active = selectedId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        ADMIN_INBOX_ITEM,
                        active ? ADMIN_INBOX_ITEM_ACTIVE : 'hover:bg-[rgba(133,91,251,0.05)]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#101114]">
                          {titleOf(c)}
                        </span>
                        <span className="shrink-0 text-[10px] text-[#9497a9]">
                          {formatClock(c.last_message_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#686b82]">{previewOf(c)}</p>
                      {c.primary_order ? (
                        <p className="mt-1 text-[10px] font-medium text-[#5741d8]">
                          Pedido #{c.primary_order.code} · {c.primary_order.status}
                        </p>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          </>
        }
        thread={
          <>
            <AdminPanelHeader
              title={selected ? titleOf(selected) : 'Conversa'}
              meta={selected?.contact_phone_e164 || 'Selecione na lista'}
            />
            {!selectedId ? (
              <AdminEmptyState
                icon={<MessageSquare className="size-6 text-[#5741d8]" />}
                title="Selecione uma conversa"
                description="O painel direito mostra os pedidos do cliente para resolver no atendimento."
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {detailLoading && messages.length === 0 ? (
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-300" />
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#9497a9]">
                      Sem mensagens carregadas do RelayHub.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.direction === 'out'
                      return (
                        <div
                          key={m.id}
                          className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                              mine
                                ? 'bg-[#5741d8] text-white'
                                : 'bg-[rgba(11,27,58,0.06)] text-[#101114]',
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.content || '—'}</p>
                            <p
                              className={cn(
                                'mt-1 text-[10px]',
                                mine ? 'text-white/70' : 'text-[#9497a9]',
                              )}
                            >
                              {formatClock(m.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                <form
                  className="border-t border-[#dedee5] p-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const text = draft.trim()
                    if (!text || sendMut.isPending) return
                    sendMut.mutate(text)
                  }}
                >
                  <label className={ADMIN_LABEL} htmlFor="support-draft">
                    Resposta ao cliente
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="support-draft"
                      className={cn(ADMIN_INPUT, 'flex-1')}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Escreva a mensagem…"
                      disabled={sendMut.isPending}
                    />
                    <button
                      type="submit"
                      className={cn(ADMIN_BTN_PRIMARY, 'inline-flex items-center gap-1.5 px-3')}
                      disabled={sendMut.isPending || !draft.trim()}
                    >
                      {sendMut.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Enviar
                    </button>
                  </div>
                  {sendMut.isError ? (
                    <p className="mt-2 text-xs text-red-600">
                      {(sendMut.error as Error)?.message || 'Falha ao enviar.'}
                    </p>
                  ) : null}
                </form>
              </div>
            )}
          </>
        }
      />
    </AdminPageShell>
  )
}

export default function AdminSupportInboxPage() {
  return (
    <AdminStaffGate requireSuperuser>
      <InboxPageInner />
    </AdminStaffGate>
  )
}
