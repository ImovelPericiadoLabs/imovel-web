'use client'

import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
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
      <div className="mb-4 mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <TextTitle className="w-full text-center text-dark md:text-xl lg:text-2xl">
          {afterDocument ? 'Onde fica o imóvel?' : 'O que você sabe sobre o local?'}
        </TextTitle>
        <TextSubtitle className="mx-auto w-[80%] max-w-2xl text-center text-gray-500 md:text-[15px] lg:text-base">
          {afterDocument
            ? 'Mesmo com o documento, um endereço ou referência (bairro, cidade, condomínio) ajuda a geolocalizar e agilizar o pedido. Nossa IA também lê o arquivo quando possível.'
            : 'Escreva bairro, cidade, condomínio ou trechos do endereço. Se preferir, pule e busque pelo mapa na próxima tela.'}
        </TextSubtitle>
      </div>

      <SelectedAddressCard
        address={(address || '').trim() || (addressHint || '').trim()}
        variant={(address || '').trim() ? 'selected' : 'hint'}
      />

      <label className="flex flex-col gap-1 mt-2">
        <span className="text-xs font-medium text-gray-600">Descrição do local (opcional)</span>
        <textarea
          className="w-full min-h-[100px] border border-gray-200 rounded-xl px-3 py-2 text-sm resize-y"
          placeholder="Ex.: Condomínio X, Florianópolis / próximo à praça central / Rua das Flores sem número"
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
          Pular — prefiro buscar no mapa
        </Button>
        <Button type="button" variant="outline" className="rounded-xl h-11 w-full" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
