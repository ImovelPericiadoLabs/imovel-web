'use client'

import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import { ChoiceCards } from '@/components/choice-cards'
import SelectedAddressCard from '@/components/selected-address-card'
import { trackGtmEvent } from '@/utils/analytics/gtm'

export function DocumentConfirmationStep({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const { setValue, watch, getValues } = useFormContext()
  const hasDocument = watch('hasDocument')
  const currentAddress =
    String(getValues('address') || '').trim() || String(getValues('addressHint') || '').trim()

  function handleSelect(value: boolean) {
    setValue('hasDocument', value, { shouldValidate: true })

    trackGtmEvent('document_availability_selected', {
      event_category: 'document',
      event_label: value ? 'has_document' : 'no_document',
      event_description: value
        ? 'Usuário informou que possui o documento do imóvel.'
        : 'Usuário informou que não possui o documento do imóvel.',
      has_document: value,
      address_present: Boolean(currentAddress),
    })

    if (!value) {
      setValue('documentType', undefined)
      setValue('document', undefined)
      setValue('documentPreview', undefined)
      onSkip()
    } else {
      onNext()
    }
  }

  return (
    <div className="relative flex-1 px-4">
      <div className="flex flex-col gap-4 pb-24 md:pb-0">
        <SelectedAddressCard
          address={currentAddress}
          variant={String(getValues('address') || '').trim() ? 'selected' : 'hint'}
        />
        <div className="flex flex-col gap-2 mb-2">
          <TextTitle className="text-dark">Você tem o documento do imóvel?</TextTitle>
          <TextSubtitle className="text-gray-500">Isso agiliza a análise do seu pedido</TextSubtitle>
        </div>

        <ChoiceCards
          className="mt-0"
          value={hasDocument}
          onChange={handleSelect}
          yesLabel="Tenho o documento do imóvel"
          yesSubtitle="Aceitamos PDF, Imagem ou Word"
          noLabel="Não tenho o documento do imóvel"
          noSubtitle="Sem problemas, você pode continuar"
        />
      </div>

    </div>
  )
}
