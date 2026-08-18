'use client'

import { cn } from '@/utils/tailwind'
import { formatMessageStamp } from './inbox-helpers'

type Props = {
  content: string
  direction: 'in' | 'out' | 'unknown'
  createdAt?: string | null
  senderLabel?: string | null
  sendState?: 'sending' | 'sent' | 'error'
}

export function InboxMessageBubble({
  content,
  direction,
  createdAt,
  senderLabel,
  sendState = 'sent',
}: Props) {
  if (direction === 'unknown') {
    return (
      <div className="flex justify-center px-2 py-1">
        <span className="rounded-full bg-[rgba(11,27,58,0.06)] px-3 py-1 text-[11px] text-[#686b82]">
          {content}
        </span>
      </div>
    )
  }

  const outgoing = direction === 'out'

  return (
    <div
      className={cn(
        'flex w-full max-w-[82%] flex-col gap-0.5',
        outgoing ? 'ml-auto items-end' : 'items-start',
      )}
    >
      {senderLabel ? (
        <span className="px-1 text-[10px] font-medium text-[#9497a9]">{senderLabel}</span>
      ) : null}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm',
          outgoing
            ? 'rounded-tr-md bg-[#7132f5] text-white'
            : 'rounded-tl-md bg-[#F4F5FA] text-[#101114] ring-1 ring-[#ededf2]',
          sendState === 'error' && 'ring-2 ring-[#D92D20]',
          sendState === 'sending' && 'opacity-70',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content || '—'}</p>
        <p
          className={cn(
            'mt-1 text-right text-[10px]',
            outgoing ? 'text-white/70' : 'text-[#9497a9]',
          )}
        >
          {sendState === 'sending'
            ? 'Enviando…'
            : sendState === 'error'
              ? 'Falha no envio'
              : formatMessageStamp(createdAt)}
        </p>
      </div>
    </div>
  )
}
