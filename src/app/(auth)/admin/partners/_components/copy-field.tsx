'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utils/tailwind'

export function CopyField({
  label,
  value,
  mono = true,
  sensitive = false,
}: {
  label: string
  value: string
  mono?: boolean
  sensitive?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border px-3 py-2',
          sensitive ? 'border-amber-300 bg-amber-50' : 'border-border bg-muted/40',
        )}
      >
        <code
          className={cn(
            'min-w-0 flex-1 break-all text-sm leading-relaxed text-foreground',
            mono && 'font-mono',
          )}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
