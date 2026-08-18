'use client'

import { useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import { ADMIN_BTN_PRIMARY } from '@/components/admin'

type Props = {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  pending?: boolean
  disabled?: boolean
  error?: string | null
  onRetry?: () => void
}

export function InboxComposer({
  draft,
  onDraftChange,
  onSend,
  pending,
  disabled,
  error,
  onRetry,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!draft.trim() || pending || disabled) return
    onSend()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white to-transparent px-3 pb-3 pt-6 lg:px-4">
      <form
        onSubmit={submit}
        className="mx-auto max-w-[48rem] rounded-xl border border-[rgba(113,50,245,0.14)] bg-white p-2.5 shadow-[0_8px_28px_rgba(11,27,58,0.08)]"
      >
        <textarea
          ref={ref}
          rows={2}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || pending}
          placeholder={disabled ? 'Sem permissão para responder' : 'Escreva uma resposta…'}
          className={cn(
            'w-full resize-none bg-transparent px-2 py-1.5 text-[13.5px] text-[#101114]',
            'placeholder:text-[#9497a9] outline-none',
          )}
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="px-1 text-[10px] text-[#9497a9]">Enter envia · Shift+Enter quebra linha</p>
          <button
            type="submit"
            className={cn(ADMIN_BTN_PRIMARY, 'h-9 gap-1.5 px-4')}
            disabled={pending || disabled || !draft.trim()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar
          </button>
        </div>
        {error ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#FEF3F2] px-2.5 py-2 text-xs text-[#D92D20]">
            <span className="min-w-0 flex-1">{error}</span>
            {onRetry ? (
              <button type="button" className="shrink-0 font-semibold underline" onClick={onRetry}>
                Tentar de novo
              </button>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  )
}
