'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ClipboardList, ExternalLink, Phone, UserRound } from 'lucide-react'
import type { SupportConversation, SupportOrderCard } from '@/services/messaging'
import { cn } from '@/utils/tailwind'
import { ADMIN_LABEL, ADMIN_PANEL_INTELLIGENCE } from './admin-styles'
import AdminPanelHeader from './admin-panel-header'
import AdminStatusBadge from './admin-status-badge'

type Props = {
  conversation: SupportConversation | null
  orders: SupportOrderCard[]
  className?: string
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

function OrderRow({ order }: { order: SupportOrderCard }) {
  const notary = (order.latest_notary_message || '').trim()

  return (
    <li className="rounded-lg bg-white/80 p-2.5 ring-1 ring-[rgba(113,50,245,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#101114]">#{order.code}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#686b82]">
            {order.formatted_address || order.registration_number || 'Sem endereço'}
          </p>
        </div>
        <AdminStatusBadge variant={statusVariant(order.status)}>{order.status}</AdminStatusBadge>
      </div>
      {notary ? (
        <p className="mt-2 line-clamp-3 rounded-md bg-[rgba(251,191,36,0.12)] px-2 py-1.5 text-[11px] text-[#92400e]">
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
  return <p className="px-1 py-4 text-center text-xs text-[#9497a9]">{children}</p>
}

export default function AdminSupportOrdersPanel({ conversation: c, orders, className }: Props) {
  if (!c) {
    return (
      <aside className={cn(ADMIN_PANEL_INTELLIGENCE, 'flex h-full flex-col', className)}>
        <AdminPanelHeader title="Cliente" meta="Pedidos relacionados" />
        <EmptyHint>Selecione uma conversa para ver o cliente e os pedidos.</EmptyHint>
      </aside>
    )
  }

  const active = orders.filter((o) => ACTIVE.has(o.status))
  const history = orders.filter((o) => !ACTIVE.has(o.status))

  return (
    <aside className={cn(ADMIN_PANEL_INTELLIGENCE, 'flex h-full flex-col', className)}>
      <AdminPanelHeader title="Cliente" meta="Pedidos · LGPD" />

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/80 p-2.5 ring-1 ring-[rgba(113,50,245,0.12)]">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(113,50,245,0.15)] text-[#5741d8]">
            <UserRound className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#101114]">
              {(c.customer_name || '').trim() || 'Cliente não identificado'}
            </p>
            <p className="flex items-center gap-1 font-mono text-[10px] text-[#9497a9]">
              <Phone className="size-3" aria-hidden />
              {c.contact_phone_e164 || '—'}
            </p>
          </div>
        </div>

        <p className="rounded-lg bg-[rgba(11,27,58,0.04)] px-2.5 py-2 text-[11px] leading-relaxed text-[#686b82]">
          Use apenas dados necessários ao atendimento. Não copie telefone/documentos para canais
          externos sem base legal.
        </p>

        <section>
          <p className={cn(ADMIN_LABEL, 'mb-2 flex items-center gap-1')}>
            <ClipboardList className="size-3" aria-hidden />
            Em andamento ({active.length})
          </p>
          {active.length === 0 ? (
            <EmptyHint>Nenhum pedido ativo.</EmptyHint>
          ) : (
            <ul className="space-y-2">
              {active.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </section>

        {history.length > 0 ? (
          <section>
            <p className={cn(ADMIN_LABEL, 'mb-2')}>Histórico ({history.length})</p>
            <ul className="space-y-2">
              {history.slice(0, 8).map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
