'use client'

import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import { ChoiceCards } from '@/components/choice-cards'
import SelectedAddressCard from '@/components/selected-address-card'

export function DocumentConfirmationStep({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  const { setValue, watch, getValues } = useFormContext()
  const hasDocument = watch('hasDocument')
  const currentAddress = getValues('address')

  function handleSelect(value: boolean) {
    setValue('hasDocument', value, { shouldValidate: true })

    if (value) {
      setTimeout(() => onNext(), 300)
    } else {
      setValue('documentType', undefined)
      setValue('document', undefined)
      setValue('documentPreview', undefined)
      setTimeout(() => onSkip(), 300)
    }
  }

  return (
    <div className="relative flex-1 px-4">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <SelectedAddressCard address={currentAddress} />
        <TextTitle className="text-dark">Você tem o documento do imóvel?</TextTitle>

        <ChoiceCards
          value={hasDocument}
          onChange={handleSelect}
          yesLabel="Sim, eu tenho"
          yesSubtitle="Aceitamos PDF, Imagem ou Word"
          noLabel="Não tenho"
          noSubtitle="Sem problemas, você pode continuar"
        />
      </div>
    </div>
  )
}
