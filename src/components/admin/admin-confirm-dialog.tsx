'use client'

import { useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'

type Props = {
  open: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, loading, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#101114]/40"
        aria-label="Fechar"
        disabled={loading}
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl border border-[#dedee5] bg-white',
          'shadow-[rgba(0,0,0,0.08)_0px_16px_48px]',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#dedee5] px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                variant === 'danger'
                  ? 'bg-[#FEF3F2] text-[#D92D20]'
                  : 'bg-[rgba(133,91,251,0.12)] text-[#7132f5]',
              )}
            >
              <AlertTriangle className="size-5" aria-hidden />
            </span>
            <h2 id="admin-confirm-title" className="text-base font-semibold text-[#101114]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-[#9497a9] hover:bg-[rgba(148,151,169,0.08)] disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm leading-relaxed text-[#686b82]">{description}</div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#dedee5] px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="!w-auto min-w-[7rem] px-5"
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              'inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60',
              variant === 'danger'
                ? 'bg-[#D92D20] hover:bg-[#b42318]'
                : 'bg-[#7132f5] hover:bg-[#5741d8]',
            )}
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
