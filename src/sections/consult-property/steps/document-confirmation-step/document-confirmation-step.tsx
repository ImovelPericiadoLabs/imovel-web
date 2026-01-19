'use client'

import { useFormContext } from 'react-hook-form'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import { ChoiceCards } from '@/components/choice-cards'
import SelectedAddressCard from '@/components/selected-address-card'
import Button from '@/components/button'
import { ChevronRight } from 'lucide-react'

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
        <SelectedAddressCard address={currentAddress} />
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
