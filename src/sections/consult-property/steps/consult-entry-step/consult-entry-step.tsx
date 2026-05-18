'use client'

import Link from 'next/link'
import { MapPin, FileText, Hash, LayoutList } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import { trackGtmEvent } from '@/utils/analytics/gtm'
import { formatMoney } from '@/utils/text/text'
import { usePublicPlanPrice } from '@/hooks/use-public-plan-price'

export type ConsultEntryChoice = 'address' | 'document' | 'unsure'

type ConsultEntryStepProps = {
  onChoose: (choice: ConsultEntryChoice) => void
}

const cards: {
  id: ConsultEntryChoice
  title: string
  subtitle: string
  icon: typeof MapPin
}[] = [
  {
    id: 'address',
    title: 'Tenho Endereço',
    subtitle: 'Busque no mapa — o jeito mais rápido de começar sua consulta.',
    icon: MapPin,
  },
  {
    id: 'document',
    title: 'Tenho Documento do Imóvel',
    subtitle: 'Envie foto ou PDF da matrícula, contrato ou escritura.',
    icon: FileText,
  },
  {
    id: 'unsure',
    title: 'Tenho a Matrícula',
    subtitle: 'Informe o número e o cartório — perfeito se ainda não tem o endereço no mapa.',
    icon: Hash,
  },
]

export function ConsultEntryStep({ onChoose }: ConsultEntryStepProps) {
  const { price } = usePublicPlanPrice()

  return (
    <div className="relative flex-1 min-w-0 px-4 pb-28 md:px-6 lg:pb-16 xl:px-8">
      <div className="mb-3 flex max-w-3xl flex-col gap-2 lg:mx-auto lg:mb-4 lg:text-center">
        <TextTitle className="text-dark md:text-xl md:leading-snug lg:text-2xl lg:leading-tight">
          Como quer começar?
        </TextTitle>
        <TextSubtitle className="text-gray-500 md:text-[15px] md:leading-relaxed lg:mx-auto lg:max-w-2xl lg:text-base">
          Escolha o que combina com você — todos os caminhos levam à mesma consulta completa.
        </TextSubtitle>
      </div>

      {/* Fora da faixa azul do layout pai: bloco branco com borda para o preço nunca “cortar” entre fundos em telas estreitas */}
      <div className="mb-4 w-full min-w-0 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm sm:px-4 lg:mx-auto lg:max-w-3xl lg:py-4">
        <p className="mx-auto max-w-full break-words text-center text-xs font-semibold leading-snug text-primary tabular-nums md:text-sm">
          Consulta completa · {formatMoney(price)}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-stretch">
        {cards.map(({ id, title, subtitle, icon: Icon }) => (
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
            className="flex w-full min-h-0 items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.03] lg:min-h-[11.5rem] lg:flex-col lg:gap-3 lg:p-5 lg:hover:shadow-md"
          >
            <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 lg:p-3">
              <Icon className="size-6 text-primary lg:size-7" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 lg:flex-1 lg:justify-start">
              <p className="text-sm font-semibold leading-snug text-gray-900 lg:text-[15px]">{title}</p>
              <p className="text-xs leading-relaxed text-gray-500 lg:text-[13px]">{subtitle}</p>
            </div>
          </button>
        ))}
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

      <p className="mt-6 px-1 text-[11px] leading-relaxed text-gray-400 lg:mx-auto lg:mt-8 lg:max-w-2xl lg:text-center lg:text-xs">
        Com endereço, buscamos a matrícula para você. Com documento em mãos, a análise fica mais rápida.
        Só tem a matrícula? Informe número e cartório.
      </p>
    </div>
  )
}
