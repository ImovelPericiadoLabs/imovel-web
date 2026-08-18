'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Phone,
  Shield,
  UserPlus,
} from 'lucide-react'
import type { SupportConversation, SupportOrderCard } from '@/services/messaging'
import { STATUS_LABELS, type SupportInboxStatus } from '@/services/messaging'
import { cn } from '@/utils/tailwind'
import {
  ADMIN_BTN_GHOST,
  ADMIN_LABEL,
  ADMIN_PANEL_INTELLIGENCE,
} from '@/components/admin/admin-styles'
import AdminStatusBadge from '@/components/admin/admin-status-badge'

type Props = {
  conversation: SupportConversation | null
  orders: SupportOrderCard[]
  className?: string
  canAssign?: boolean
  onAssignMe?: () => void
  assigning?: boolean
}

const ACTIVE = new Set([
  'PENDING',
  'SEARCHING_DOCUMENT',
  'IN_PROGRESS',
  'AWAITING_CUSTOMER_REPLY',
  'MANUAL_REVIEW_PENDING',
  'RETURNED_BY_NOTARY',
  'REJECTED_DATA',
])

function statusVariant(status: string): 'active' | 'warning' | 'neutral' | 'brand' {
  if (status === 'AWAITING_CUSTOMER_REPLY' || status === 'MANUAL_REVIEW_PENDING') return 'warning'
  if (ACTIVE.has(status)) return 'brand'
  if (status === 'FINISHED') return 'active'
  return 'neutral'
}

function convStatusVariant(
  status: SupportInboxStatus,
): 'active' | 'warning' | 'neutral' | 'brand' {
  if (status === 'resolved') return 'active'
  if (status === 'unread' || status === 'new') return 'brand'
  if (status === 'waiting_customer' || status === 'waiting_internal') return 'warning'
  return 'neutral'
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || '?'
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase()
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

function Section({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count?: number
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5">
        <span className={cn(ADMIN_LABEL, 'flex items-center gap-1 normal-case tracking-normal')}>
          {title}
          {typeof count === 'number' ? (
            <span className="rounded-md bg-[rgba(113,50,245,0.12)] px-1.5 text-[10px] font-bold text-[#5741d8]">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown className="size-3.5 text-[#9497a9] transition group-open:rotate-180" />
      </summary>
      <div className="pb-2 pt-1">{children}</div>
    </details>
  )
}

function OrderRow({ order }: { order: SupportOrderCard }) {
  const notary = (order.latest_notary_message || '').trim()

  return (
    <li className="rounded-xl border border-[rgba(113,50,245,0.1)] bg-white p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#101114]">Pedido #{order.code}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#686b82]">
            {order.formatted_address || order.registration_number || 'Sem endereço'}
          </p>
        </div>
        <AdminStatusBadge variant={statusVariant(order.status)}>{order.status}</AdminStatusBadge>
      </div>
      {notary ? (
        <p className="mt-2 line-clamp-3 rounded-lg bg-[rgba(251,191,36,0.12)] px-2 py-1.5 text-[11px] text-[#92400e]">
          Cartório: {notary}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#9497a9]">
        <span>{formatTs(order.modified || order.created)}</span>
        <Link
          href={`/consultas?order=${order.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[#5741d8] hover:underline"
        >
          Abrir
          <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>
    </li>
  )
}

function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="px-1 py-3 text-center text-xs text-[#9497a9]">{children}</p>
}

export default function AdminSupportOrdersPanel({
  conversation: c,
  orders,
  className,
  canAssign,
  onAssignMe,
  assigning,
}: Props) {
  if (!c) {
    return (
      <aside className={cn(ADMIN_PANEL_INTELLIGENCE, 'flex h-full flex-col', className)}>
        <div className="border-b border-[rgba(113,50,245,0.1)] px-3 py-3">
          <p className="text-sm font-semibold text-[#101114]">Cliente</p>
          <p className="text-[11px] text-[#9497a9]">Pedidos relacionados</p>
        </div>
        <EmptyHint>Selecione uma conversa para ver o cliente e os pedidos.</EmptyHint>
      </aside>
    )
  }

  const name = (c.customer_name || '').trim() || 'Cliente não identificado'
  const active = orders.filter((o) => ACTIVE.has(o.status))
  const history = orders.filter((o) => !ACTIVE.has(o.status))

  return (
    <aside className={cn(ADMIN_PANEL_INTELLIGENCE, 'flex h-full flex-col', className)}>
      <div className="border-b border-[rgba(113,50,245,0.1)] bg-white/70 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[rgba(113,50,245,0.14)] text-xs font-semibold text-[#5741d8]"
            aria-hidden
          >
            {initialsOf(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#101114]">{name}</p>
            <p className="flex items-center gap-1 font-mono text-[11px] text-[#9497a9]">
              <Phone className="size-3" aria-hidden />
              {c.contact_phone_e164 || '—'}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <AdminStatusBadge variant={convStatusVariant(c.status)} dot>
            {STATUS_LABELS[c.status]}
          </AdminStatusBadge>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="flex items-start gap-2 rounded-xl bg-[rgba(11,27,58,0.04)] px-2.5 py-2 text-[11px] leading-relaxed text-[#686b82]">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-[#5741d8]" aria-hidden />
          Dados mínimos para atendimento (LGPD). Não compartilhe telefone ou documentos fora do canal.
        </div>

        <Section title="Responsável">
          <div className="rounded-xl border border-[rgba(113,50,245,0.08)] bg-white/80 px-2.5 py-2">
            <p className="text-[12px] font-semibold text-[#101114]">
              {c.assignee?.name || 'Sem responsável'}
            </p>
            {c.assignee?.email ? (
              <p className="mt-0.5 truncate text-[10px] text-[#9497a9]">{c.assignee.email}</p>
            ) : null}
            {canAssign && onAssignMe ? (
              <button
                type="button"
                className={cn(ADMIN_BTN_GHOST, 'mt-2 h-8 w-full')}
                onClick={onAssignMe}
                disabled={assigning}
              >
                <UserPlus className="size-3.5" />
                Assumir conversa
              </button>
            ) : null}
          </div>
        </Section>

        <Section title="Atributos da conversa">
          <dl className="space-y-1.5 rounded-xl border border-[rgba(113,50,245,0.08)] bg-white/80 px-2.5 py-2 text-[12px]">
            <div className="flex justify-between gap-2">
              <dt className="text-[#9497a9]">Canal</dt>
              <dd className="font-medium text-[#101114]">WhatsApp</dd>
            </div>
            {c.instance_name ? (
              <div className="flex justify-between gap-2">
                <dt className="text-[#9497a9]">Instância</dt>
                <dd className="truncate font-medium text-[#101114]">{c.instance_name}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-[#9497a9]">ID</dt>
              <dd className="truncate font-mono text-[10px] text-[#686b82]">
                {c.external_conversation_id}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Pedidos em andamento" count={active.length}>
          {active.length === 0 ? (
            <EmptyHint>Nenhum pedido ativo.</EmptyHint>
          ) : (
            <ul className="space-y-2">
              {active.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </Section>

        {history.length > 0 ? (
          <Section title="Histórico de pedidos" count={history.length} defaultOpen={false}>
            <ul className="space-y-2">
              {history.slice(0, 8).map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          </Section>
        ) : null}

        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(113,50,245,0.2)] px-3 py-6 text-center">
            <ClipboardList className="mx-auto size-5 text-[#9497a9]" />
            <p className="mt-2 text-xs text-[#686b82]">
              Cliente sem pedidos vinculados a este telefone.
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
