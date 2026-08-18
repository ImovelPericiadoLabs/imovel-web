'use client'

import { ArrowLeft, CheckSquare, Info, UserPlus } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { ADMIN_BTN_GHOST, ADMIN_BTN_PRIMARY, ADMIN_ICON_BTN } from '@/components/admin'
import AdminStatusBadge from '@/components/admin/admin-status-badge'
import {
  STATUS_LABELS,
  type SupportInboxStatus,
} from '@/services/messaging'
import { InboxAvatar } from './inbox-avatar'

function statusVariant(
  status: SupportInboxStatus,
): 'active' | 'inactive' | 'neutral' | 'warning' | 'brand' {
  if (status === 'resolved') return 'active'
  if (status === 'unread' || status === 'new') return 'brand'
  if (status === 'waiting_customer' || status === 'waiting_internal') return 'warning'
  return 'neutral'
}

type Props = {
  title: string
  subtitle?: string | null
  status: SupportInboxStatus
  assigneeName?: string | null
  onBack?: () => void
  onToggleDetails?: () => void
  onAssignMe?: () => void
  onResolve?: () => void
  canAssign?: boolean
  canResolve?: boolean
  assigning?: boolean
  resolving?: boolean
  showBack?: boolean
}

export function InboxThreadHeader({
  title,
  subtitle,
  status,
  assigneeName,
  onBack,
  onToggleDetails,
  onAssignMe,
  onResolve,
  canAssign,
  canResolve,
  assigning,
  resolving,
  showBack,
}: Props) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[rgba(113,50,245,0.1)] bg-white px-3 py-2.5 lg:px-4">
      {showBack ? (
        <button
          type="button"
          className={cn(ADMIN_ICON_BTN, 'lg:hidden')}
          onClick={onBack}
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onToggleDetails}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-0.5 text-left transition hover:bg-[rgba(133,91,251,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(113,50,245,0.3)]"
      >
        <InboxAvatar name={title} size="md" />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-[#101114]">{title}</p>
            <AdminStatusBadge variant={statusVariant(status)}>{STATUS_LABELS[status]}</AdminStatusBadge>
          </div>
          <p className="truncate text-[11px] text-[#9497a9]">
            {subtitle || '—'}
            {assigneeName ? ` · ${assigneeName}` : ' · Sem responsável'}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {onToggleDetails ? (
          <button
            type="button"
            className={cn(ADMIN_ICON_BTN, 'xl:hidden')}
            onClick={onToggleDetails}
            aria-label="Detalhes do cliente"
          >
            <Info className="size-4" />
          </button>
        ) : null}
        {canAssign && onAssignMe ? (
          <button
            type="button"
            className={cn(ADMIN_BTN_GHOST, 'hidden sm:inline-flex')}
            onClick={onAssignMe}
            disabled={assigning}
          >
            <UserPlus className="size-3.5" />
            Assumir
          </button>
        ) : null}
        {canResolve && onResolve && status !== 'resolved' ? (
          <button
            type="button"
            className={cn(ADMIN_BTN_PRIMARY, 'hidden h-8 sm:inline-flex')}
            onClick={onResolve}
            disabled={resolving}
          >
            <CheckSquare className="size-3.5" />
            Resolver
          </button>
        ) : null}
      </div>
    </header>
  )
}
