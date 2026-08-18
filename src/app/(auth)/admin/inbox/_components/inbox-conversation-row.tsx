'use client'

import { cn } from '@/utils/tailwind'
import { ADMIN_INBOX_ITEM, ADMIN_INBOX_ITEM_ACTIVE } from '@/components/admin'
import AdminStatusBadge from '@/components/admin/admin-status-badge'
import {
  STATUS_LABELS,
  type SupportInboxStatus,
} from '@/services/messaging'
import { InboxAvatar } from './inbox-avatar'
import { formatRelativePt } from './inbox-helpers'

function statusVariant(
  status: SupportInboxStatus,
): 'active' | 'inactive' | 'neutral' | 'warning' | 'brand' {
  if (status === 'resolved') return 'active'
  if (status === 'unread' || status === 'new') return 'brand'
  if (status === 'waiting_customer' || status === 'waiting_internal') return 'warning'
  if (status === 'in_progress') return 'neutral'
  return 'neutral'
}

type Props = {
  title: string
  preview: string
  time?: string | null
  status: SupportInboxStatus
  source?: 'support' | 'campaign'
  assigneeName?: string | null
  orderLabel?: string | null
  campaignLabel?: string | null
  selected?: boolean
  onSelect: () => void
}

export function InboxConversationRow({
  title,
  preview,
  time,
  status,
  source = 'support',
  assigneeName,
  orderLabel,
  campaignLabel,
  selected,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        ADMIN_INBOX_ITEM,
        'items-start',
        selected ? ADMIN_INBOX_ITEM_ACTIVE : 'hover:bg-[rgba(133,91,251,0.05)]',
      )}
    >
      <InboxAvatar name={title} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-[#101114]">{title}</p>
          <span className="shrink-0 text-[10px] text-[#9497a9]">{formatRelativePt(time)}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[12px] text-[#686b82]">{preview}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <AdminStatusBadge variant={source === 'campaign' ? 'brand' : 'neutral'}>
            {source === 'campaign' ? 'Campanha' : 'Suporte'}
          </AdminStatusBadge>
          <AdminStatusBadge variant={statusVariant(status)} dot>
            {STATUS_LABELS[status]}
          </AdminStatusBadge>
          {assigneeName ? (
            <span className="truncate text-[10px] font-medium text-[#686b82]">{assigneeName}</span>
          ) : (
            <span className="text-[10px] font-medium text-[#9497a9]">Sem responsável</span>
          )}
        </div>
        {campaignLabel ? (
          <p className="mt-1 truncate text-[10px] font-medium text-[#5741d8]">{campaignLabel}</p>
        ) : orderLabel ? (
          <p className="mt-1 truncate text-[10px] font-medium text-[#5741d8]">{orderLabel}</p>
        ) : null}
      </div>
    </button>
  )
}
