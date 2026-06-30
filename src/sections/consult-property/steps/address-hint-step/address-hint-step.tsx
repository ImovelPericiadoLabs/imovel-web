'use client'

import { useFormContext } from 'react-hook-form'
import { HeroDescription, HeroTitle } from '@/components/ui/typography'
import {
  consultFlowHeroBlockClass,
  consultFlowHeroTitleSizeLargeClass,
} from '@/constants/consult-flow-hero-text'
import { cn } from '@/utils/tailwind'
import Button from '@/components/button'
import SelectedAddressCard from '@/components/selected-address-card'
import { FormTypes } from '@/sections/consult-property/validations'
import { trackGtmEvent } from '@/utils/analytics/gtm'

type AddressHintStepProps = {
  onNext: () => void
  onBack: () => void
  /** Quando true, texto reforça que documento já foi enviado */
  afterDocument?: boolean
}

export function AddressHintStep({ onNext, onBack, afterDocument }: AddressHintStepProps) {
  const { watch, setValue, register, formState } = useFormContext<FormTypes>()
  const address = watch('address')
  const addressHint = watch('addressHint')
  const hintErr = formState.errors.addressHint?.message

  return (
    <div className="relative flex-1 px-4 pb-28 md:px-6 lg:pb-16 xl:px-8">
      <div className={consultFlowHeroBlockClass}>
        <HeroTitle
          variant="large"
          surface="dark"
          className={cn(consultFlowHeroTitleSizeLargeClass)}
        >
          {afterDocument ? 'Localização do imóvel' : 'Referência do imóvel'}
        </HeroTitle>
        <HeroDescription surface="dark" kind="subtitle" className="text-white/85">
          {afterDocument
            ? 'Informe endereço, bairro ou município para identificar o imóvel no pedido.'
            : 'Indique o que souber sobre o endereço. Ou busque no mapa.'}
        </HeroDescription>
      </div>

      <SelectedAddressCard
        address={(address || '').trim() || (addressHint || '').trim()}
        variant={(address || '').trim() ? 'selected' : 'hint'}
      />

      <label className="flex flex-col gap-1 mt-2">
        <span className="text-xs font-medium text-gray-600">Referência de localização (opcional)</span>
        <textarea
          className="w-full min-h-[100px] border border-gray-200 rounded-xl px-3 py-2 text-sm resize-y"
          placeholder="Ex.: Rua das Flores, bairro Centro, Florianópolis/SC"
          {...register('addressHint')}
        />
        {hintErr ? <span className="text-xs text-red-600">{hintErr}</span> : null}
      </label>

      <div className="flex flex-col gap-2 mt-6">
        <Button
          type="button"
          className="rounded-xl h-11 w-full"
          onClick={() => {
            trackGtmEvent('address_hint_continue', {
              event_category: 'consult_flow',
              event_label: afterDocument ? 'after_document' : 'unsure',
              event_description: 'Continuou após dica de endereço',
              hint_length: (addressHint || '').trim().length,
            })
            onNext()
          }}
        >
          Continuar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl h-11 w-full"
          onClick={() => {
            setValue('addressHint', '', { shouldValidate: true })
            trackGtmEvent('address_hint_skip', {
              event_category: 'consult_flow',
              event_label: afterDocument ? 'after_document' : 'unsure',
            })
            onNext()
          }}
        >
          Pular — buscar no mapa
        </Button>
        <Button type="button" variant="outline" className="rounded-xl h-11 w-full" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
