'use client'

import type { ReactNode } from 'react'
import { Bot, Clock, MessageSquare, Radio, Shield, UserRound, Zap } from 'lucide-react'
import type { ChatCampaign, ChatConversation } from '@/services/chat'
import { cn } from '@/utils/tailwind'
import { ADMIN_LABEL, ADMIN_PANEL_INTELLIGENCE } from './admin-styles'
import AdminPanelHeader from './admin-panel-header'
import AdminStatusBadge from './admin-status-badge'

type Props = {
  conversation: ChatConversation
  campaign?: ChatCampaign | null
  className?: string
}

function formatTs(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function IntelRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className={cn(ADMIN_LABEL, 'flex items-center gap-1 normal-case tracking-normal')}>
        {Icon && <Icon className="size-3 text-[#7132f5]" aria-hidden />}
        {label}
      </span>
      <span className="text-right text-xs font-semibold text-[#101114]">{value}</span>
    </div>
  )
}

export default function AdminChatContextPanel({ conversation: c, campaign, className }: Props) {
  const stateVariant =
    c.state === 'open' ? 'active' : c.state === 'handoff' ? 'warning' : 'neutral'

  return (
    <aside className={cn(ADMIN_PANEL_INTELLIGENCE, 'flex h-full flex-col', className)}>
      <AdminPanelHeader title="Intelligence" meta="Contexto operacional" />

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/80 p-2.5 ring-1 ring-[rgba(113,50,245,0.12)]">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(113,50,245,0.15)] text-[#5741d8]">
            <UserRound className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#101114]">
              {(c.customer_display_name || '').trim() || 'Sem nome'}
            </p>
            <p className="font-mono text-[10px] text-[#9497a9]">{c.customer_wa_id}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <AdminStatusBadge variant={stateVariant} dot>
            {c.state}
          </AdminStatusBadge>
          {c.ai_active && (
            <AdminStatusBadge variant="brand" dot>
              IA ativa
            </AdminStatusBadge>
          )}
          {(c.ai_pending_reply_body || '').trim() && (
            <AdminStatusBadge variant="warning">Rascunho</AdminStatusBadge>
          )}
        </div>

        <div className="divide-y divide-[rgba(113,50,245,0.1)] rounded-lg bg-white/60 px-2 ring-1 ring-[rgba(113,50,245,0.08)]">
          <IntelRow label="Campanha" value={c.campaign_name || campaign?.name || '—'} icon={Radio} />
          <IntelRow label="Entrada" value={formatTs(c.last_inbound_at)} icon={Clock} />
          <IntelRow label="Saída" value={formatTs(c.last_outbound_at)} icon={Zap} />
          <IntelRow label="Última msg" value={formatTs(c.last_message_at)} icon={MessageSquare} />
        </div>

        <div className="rounded-lg bg-[rgba(11,27,58,0.04)] px-2.5 py-2 text-xs text-[#686b82]">
          <p className={cn(ADMIN_LABEL, 'mb-2')}>Campanha</p>
          <p className="flex items-center gap-1.5">
            <Bot className="size-3.5 text-[#7132f5]" aria-hidden />
            IA {campaign?.ai_enabled ? 'ligada' : 'desligada'}
          </p>
          {campaign?.ai_send_requires_approval && (
            <p className="mt-1 font-semibold text-[#5741d8]">Aprovação obrigatória</p>
          )}
          {c.ai_disclosure_sent && (
            <p className="mt-1 flex items-center gap-1 text-[#026b3f]">
              <Shield className="size-3" aria-hidden />
              Disclosure OK
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
