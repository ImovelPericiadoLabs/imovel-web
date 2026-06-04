'use client'

import { Check, ShieldCheck } from 'lucide-react'

import {
  INCLUDED_CERTIFICATES,
  INCLUDED_CERTIFICATES_COUNT,
} from '@/constants/included-certificates'
import { cn } from '@/utils/tailwind'

type Props = {
  compact?: boolean
  className?: string
}

export function IncludedCertificatesPanel({ compact = false, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/10 p-1 text-emerald-700">
          <ShieldCheck className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="text-[13px] font-bold text-gray-900 leading-snug">
            {INCLUDED_CERTIFICATES_COUNT} certidões oficiais incluídas
          </p>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            Emitidas automaticamente após a análise, com PDF anexo ao relatório final.
          </p>
        </div>
      </div>

      <ul
        className={cn(
          'grid gap-2',
          compact ? 'grid-cols-1' : 'sm:grid-cols-2',
        )}
      >
        {INCLUDED_CERTIFICATES.map((cert) => (
          <li
            key={cert.id}
            className="flex gap-2 items-start rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-900 leading-snug">{cert.name}</p>
              {!compact && (
                <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{cert.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
