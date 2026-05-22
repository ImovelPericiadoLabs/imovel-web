'use client'

import Link from 'next/link'
import { MapPin, FileText, Hash, LayoutList } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import { TutorialBanner } from '@/components/tutorial-banner'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { formatMoney } from '@/utils/text/text'
import { usePublicPlanPrice } from '@/hooks/use-public-plan-price'

export type ConsultEntryChoice = 'address' | 'document' | 'unsure'

type ConsultEntryStepProps = {
  onChoose: (choice: ConsultEntryChoice) => void
}

const ENTRY_BADGE: Record<
  ConsultEntryChoice,
  { dotClass: string; timeLabel: string }
> = {
  document: { dotClass: 'bg-green-500', timeLabel: '~5 min' },
  unsure: { dotClass: 'bg-yellow-300', timeLabel: '~10 min' },
  address: { dotClass: 'bg-red-600', timeLabel: '~20 min' },
}

const cards: {
  id: ConsultEntryChoice
  title: string
  subtitle: string
  icon: typeof MapPin
}[] = [
  {
    id: 'document',
    title: 'Tenho documento',
    subtitle: 'Envie foto ou PDF da matrícula, contrato ou escritura.',
    icon: FileText,
  },
  {
    id: 'unsure',
    title: 'Tenho matrícula',
    subtitle: 'Informe o número e o cartório, perfeito se ainda não tem o endereço no mapa.',
    icon: Hash,
  },
  {
    id: 'address',
    title: 'Tenho endereço',
    subtitle: 'Busque no mapa, o jeito mais rápido de começar sua consulta.',
    icon: MapPin,
  },
]

export function ConsultEntryStep({ onChoose }: ConsultEntryStepProps) {
  const { price } = usePublicPlanPrice()

  return (
    <div className="relative min-w-0 px-4 pb-32 pointer-events-auto md:px-6 md:pb-24 lg:pb-16 xl:px-8">
      <div className="mb-4 flex max-w-3xl flex-col gap-2 text-center lg:mx-auto lg:mb-5">
        <TextTitle className="w-full text-center text-dark md:text-xl md:leading-snug lg:text-2xl lg:leading-tight">
          Como quer começar?
        </TextTitle>
        <TextSubtitle className="w-full text-center text-gray-500 md:text-[15px] md:leading-relaxed lg:mx-auto lg:max-w-2xl lg:text-base">
          Escolha o que combina com você, todos os caminhos levam à mesma consulta completa.
        </TextSubtitle>
      </div>

      <p className="mb-4 px-1 text-center text-xs font-bold leading-relaxed text-gray-700 lg:mx-auto lg:max-w-2xl lg:text-sm">
        Com endereço, buscamos a matrícula para você. Com documento em mãos, a análise fica mais rápida.
        Só tem a matrícula? Informe número e cartório.
      </p>

      <div className="mb-4 w-full min-w-0 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm sm:px-4 lg:mx-auto lg:max-w-3xl lg:py-4">
        <p className="mx-auto max-w-full break-words text-center text-xs font-semibold leading-snug text-primary tabular-nums md:text-sm">
          Consulta completa · {formatMoney(price)}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-stretch">
        {cards.map(({ id, title, subtitle, icon: Icon }) => {
          const badge = ENTRY_BADGE[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                trackGtmEvent('consult_entry_choice', {
                  event_category: 'consult_flow',
                  event_label: id,
                  event_description: `Usuário escolheu entrada: ${id}`,
                })
                onChoose(id)
              }}
              className="flex w-full min-h-0 flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.03] sm:p-5 lg:min-h-[11.5rem] lg:hover:shadow-md"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="rounded-xl bg-primary/10 p-2.5 sm:p-3">
                  <Icon className="size-6 text-primary sm:size-7" />
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-700 sm:text-[11px]"
                  title="Tempo estimado para iniciar"
                >
                  <span className={`size-2 rounded-full ${badge.dotClass}`} aria-hidden />
                  {badge.timeLabel}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-sm font-bold leading-snug text-gray-900 lg:text-[15px]">{title}</p>
                <p className="text-xs font-semibold leading-relaxed text-gray-600 lg:text-[13px]">
                  {subtitle}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <Link
        href="/consultas"
        onClick={() => {
          trackGtmEvent('consult_entry_to_account', {
            event_category: 'consult_flow',
            event_label: 'minhas_consultas',
            event_description: 'Usuário foi para minhas consultas/conta a partir da entrada.',
          })
        }}
        className="mt-5 flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.03] hover:text-primary lg:mx-auto lg:mt-8 lg:max-w-md"
      >
        <LayoutList className="size-5 shrink-0" aria-hidden />
        Minhas consultas e conta
      </Link>

      <div className="mt-6 lg:mx-auto lg:max-w-3xl">
        <TutorialBanner />
      </div>
    </div>
  )
}
