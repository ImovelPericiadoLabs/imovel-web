'use client'

import Link from 'next/link'
import { MapPin, FileText, Hash, LayoutList } from 'lucide-react'
import { TutorialBanner } from '@/components/tutorial-banner'
import { CenteredContent } from '@/components/ui/layout'
import { Surface } from '@/components/ui/surfaces'
import { GradientText, HeroDescription, HeroTitle, LeadText } from '@/components/ui/typography'
import { cardSurface } from '@/styles/surfaces'
import { cn } from '@/utils/tailwind'
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
  unsure: { dotClass: 'bg-yellow-300', timeLabel: '~20 min' },
  address: { dotClass: 'bg-red-600', timeLabel: '~72 horas úteis' },
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
    subtitle: 'Informe o número e o cartório para começar sua consulta.',
    icon: Hash,
  },
  {
    id: 'address',
    title: 'Tenho endereço',
    subtitle: 'Busque diretamente no mapa para começar sua consulta.',
    icon: MapPin,
  },
]

export function ConsultEntryStep({ onChoose }: ConsultEntryStepProps) {
  const { price } = usePublicPlanPrice()

  return (
    <div className="relative mx-auto min-w-0 w-full max-w-3xl px-4 pb-12 pointer-events-auto md:px-6 md:pb-14 xl:px-8">
      <Surface variant="dark" className="mb-3 pt-0 sm:mb-4 md:mb-5">
        <CenteredContent variant="hero" className="gap-2 sm:gap-2.5">
          <HeroTitle variant="primary">
            Escolha o que combina com você. Todos os caminhos levam à mesma consulta completa.
          </HeroTitle>

          <HeroTitle variant="secondary">Como quer começar?</HeroTitle>

          <HeroDescription kind="body">
            <LeadText>O endereço ou matrícula:</LeadText>
            <GradientText> menos burocracia, mais agilidade.</GradientText>
          </HeroDescription>
        </CenteredContent>
      </Surface>

      <div className={cn(cardSurface, 'mb-4 w-full min-w-0 px-3 py-3 sm:px-4 lg:py-4')}>
        <p className="mx-auto max-w-full break-words text-center text-xs font-semibold leading-snug text-primary tabular-nums md:text-sm">
          Consulta completa · {formatMoney(price)}
        </p>
      </div>

      <div className="mx-auto flex w-full flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-stretch">
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
        className="mx-auto mt-5 flex w-full max-w-md touch-manipulation items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.03] hover:text-primary lg:mt-8"
      >
        <LayoutList className="size-5 shrink-0" aria-hidden />
        Minhas consultas e conta
      </Link>

      <div className="mx-auto mt-6 w-full">
        <TutorialBanner />
      </div>
    </div>
  )
}
