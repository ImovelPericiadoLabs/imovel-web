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
    }
  }

  return (
    <div className="relative flex-1 px-4">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <SelectedAddressCard address={currentAddress} />
        <div className="flex flex-col gap-2">
          <TextTitle className="text-dark">Você tem o documento do imóvel?</TextTitle>
          <TextSubtitle>Isso agiliza a análise do seu pedido</TextSubtitle>
        </div>

        <ChoiceCards
          value={hasDocument}
          onChange={handleSelect}
          yesLabel="Tenho o documento do imóvel"
          yesSubtitle="Aceitamos PDF, Imagem ou Word"
          noLabel="Não tenho o documento do imóvel"
          noSubtitle="Sem problemas, você pode continuar"
        />
      </div>

      {hasDocument === true && (
        <div className="
          fixed bottom-0 left-0 right-0 
          px-4 pt-5 pb-7 
          bg-white mt-auto 
          border-t border-gray-100 
          z-10
          supports-[-webkit-touch-callout:none]:pb-10
        ">
          <Button 
            className="w-full h-12 text-base rounded-xl" 
            onClick={() => onNext()}
            icon={<ChevronRight className="size-5" />}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  )
}
