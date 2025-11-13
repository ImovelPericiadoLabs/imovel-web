'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Users, FileText, FileSignature } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import FormFooterButton from '@/components/form-footer-button'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import OptionCard from '@/components/option-card/option-card.tsx'

type DocumentType = 'contract' | 'registration' | 'deed'

export function DocumentTypeStep() {
  const [selectedOption, setSelectedOption] = useState<DocumentType | null>(
    null,
  )

  const { setValue, handleNextStep } =
    useFormContext() as FormContextWithSteps

  function handleSubmit() {
    if (!selectedOption) return

    setValue('documentType', selectedOption)
    handleNextStep()
  }

  return (
    <div className="relative flex-1">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <div className="flex flex-col gap-2">
          <TextTitle>Qual documento você tem?</TextTitle>
          <TextSubtitle>Selecione uma das opções abaixo</TextSubtitle>
        </div>

        <div className="grid auto-rows-fr gap-4">
          <OptionCard
            icon={Users}
            title="Contrato de compra e venda"
            subtitle="Acordo particular entre comprador e vendedor."
            onClick={() => setSelectedOption('contract')}
            isSelected={selectedOption === 'contract'}
          />
          <OptionCard
            icon={FileText}
            title="Matrícula"
            subtitle="Documento principal do imóvel."
            onClick={() => setSelectedOption('registration')}
            isSelected={selectedOption === 'registration'}
          />
          <OptionCard
            icon={FileSignature}
            title="Escritura"
            subtitle="Contrato oficial registrado no cartório."
            onClick={() => setSelectedOption('deed')}
            isSelected={selectedOption === 'deed'}
          />
        </div>
      </div>

      <FormFooterButton
        onClick={handleSubmit}
        disabled={!selectedOption}
        type="button"
      >
        Continuar
      </FormFooterButton>
    </div>
  )
}