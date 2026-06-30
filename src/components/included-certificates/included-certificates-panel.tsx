'use client'

import { useId, useState } from 'react'
import { Check, ChevronDown, ShieldCheck } from 'lucide-react'

import {
  INCLUDED_CERTIFICATES,
  INCLUDED_CERTIFICATES_COUNT,
} from '@/constants/included-certificates'
import { cn } from '@/utils/tailwind'

type Props = {
  /** Só uma linha de resumo — sem accordion (ex.: bottom-sheet PIX). */
  summaryOnly?: boolean
  /** Sem borda/fundo próprio — integrado a um card pai (ex.: resumo da compra). */
  embedded?: boolean
  /** Quando false, certidões não estão incluídas no pedido. */
  included?: boolean
  defaultOpen?: boolean
  className?: string
}

export function IncludedCertificatesPanel({
  summaryOnly = false,
  embedded = false,
  included = true,
  defaultOpen = false,
  className,
}: Props) {
  const panelId = useId()
  const [open, setOpen] = useState(defaultOpen)

  if (!included) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-3 py-2.5',
          className,
        )}
      >
        <p className="text-[12px] leading-snug text-gray-600">
          Certidões oficiais não incluídas neste pedido. Você pode ativá-las no resumo antes de pagar.
        </p>
      </div>
    )
  }

  if (summaryOnly) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2',
          className,
        )}
      >
        <ShieldCheck className="size-4 shrink-0 text-emerald-700" strokeWidth={2.25} aria-hidden />
        <p className="text-[12px] leading-snug text-gray-700">
          <span className="font-semibold text-gray-900">
            {INCLUDED_CERTIFICATES_COUNT} certidões oficiais
          </span>
          {' '}
          incluídas no relatório final (PDF).
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden',
        !embedded && 'rounded-xl border border-gray-100 bg-white',
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-start gap-2.5 text-left transition-colors',
          embedded
            ? 'rounded-lg px-0 py-2 hover:bg-gray-50/70'
            : 'px-3 py-3 hover:bg-gray-50/80',
        )}
      >
        <span className="mt-0.5 shrink-0 rounded-full bg-emerald-500/10 p-1 text-emerald-700">
          <ShieldCheck className="size-4" strokeWidth={2.25} aria-hidden />
        </span>

        <span className="min-w-0 flex flex-1 flex-col gap-0.5">
          <span className="text-[13px] font-bold leading-snug text-gray-900">
            {INCLUDED_CERTIFICATES_COUNT} certidões oficiais incluídas
          </span>
          <span className="text-[12px] leading-relaxed text-gray-600">
            Emitidas automaticamente após a análise, com PDF anexo ao relatório final.
          </span>
        </span>

        <ChevronDown
          className={cn(
            'mt-1 size-4 shrink-0 text-gray-400 transition-transform duration-300 ease-out',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <ul
            className={cn(
              'grid gap-2 pt-2 sm:grid-cols-2',
              embedded ? 'pb-0' : 'border-t border-gray-100 px-3 pb-3',
            )}
          >
            {INCLUDED_CERTIFICATES.map((cert) => (
              <li
                key={cert.id}
                className={cn(
                  'flex items-start gap-2 px-3 py-2.5',
                  embedded
                    ? 'rounded-lg bg-gray-50/70'
                    : 'rounded-xl border border-gray-100 bg-gray-50/80',
                )}
              >
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-snug text-gray-900">
                    {cert.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-600">
                    {cert.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
