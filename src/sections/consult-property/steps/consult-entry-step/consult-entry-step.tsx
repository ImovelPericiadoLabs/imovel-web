'use client'

import Link from 'next/link'
import { MapPin, FileText, HelpCircle, LayoutList } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import { trackGtmEvent } from '@/utils/analytics/gtm'

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
    title: 'Sei o endereço do imóvel',
    subtitle: 'Busca pelo Google: a forma mais rápida e precisa.',
    icon: MapPin,
  },
  {
    id: 'document',
    title: 'Tenho documento (foto ou PDF)',
    subtitle: 'Matrícula, contrato ou escritura — depois você pode complementar o local.',
    icon: FileText,
  },
  {
    id: 'unsure',
    title: 'Não sei o endereço exato',
    subtitle: 'Informe matrícula e cartório — o jeito mais preciso quando você não tem o endereço no mapa.',
    icon: HelpCircle,
  },
]

export function ConsultEntryStep({ onChoose }: ConsultEntryStepProps) {
  return (
    <div className="relative flex-1 px-4 pb-28">
      <div className="flex flex-col gap-3 mb-6">
        <TextTitle className="text-dark">Como quer começar?</TextTitle>
        <TextSubtitle className="text-gray-500">
          Escolha o que combina com você — todos os caminhos levam à mesma consulta completa.
        </TextSubtitle>
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
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-white px-4 py-3.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/[0.04] touch-manipulation"
      >
        <LayoutList className="size-5 shrink-0" aria-hidden />
        Minhas consultas e conta
      </Link>

      <div className="flex flex-col gap-3">
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
            className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex gap-4 items-start hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
          >
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <Icon className="size-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-snug">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-gray-400 leading-relaxed px-1">
        Se você já tiver matrícula ou contrato em mãos, enviar o arquivo agiliza a análise. Sem endereço no mapa,
        use matrícula e cartório. Com endereço, também podemos buscar a matrícula para você.
      </p>
    </div>
  )
}
