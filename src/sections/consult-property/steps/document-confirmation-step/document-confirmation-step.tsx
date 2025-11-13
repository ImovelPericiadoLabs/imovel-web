'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import OptionCard from '@/components/option-card/option-card.tsx'
import TextTitle from '@/components/text-title'
import FormFooterButton from '@/components/form-footer-button' // Importa o novo componente
import type { FormContextWithSteps } from '@/sections/consult-property/types'

type Selection = 'yes' | 'no'

export function DocumentConfirmationStep() {
  const [selectedOption, setSelectedOption] = useState<Selection | null>(null)

  const { setValue, handleNextStep } =
    useFormContext() as FormContextWithSteps

  function handleSubmit() {
    if (!selectedOption) return
    const hasDocument = selectedOption === 'yes'
    setValue('hasDocument', hasDocument)
    handleNextStep()
  }

  return (
    <div className="relative flex-1">
      {/* Padding-bottom no mobile (pb-24) para o conteúdo não ficar
        atrás do botão fixo. No desktop (md:pb-0) é removido.
      */}
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <TextTitle>Você tem o documento do imóvel?</TextTitle>

        <div className="grid auto-rows-fr gap-4">
          <OptionCard
            icon={ThumbsUp}
            title="Sim, eu tenho"
            subtitle="Aceitamos PDF, Imagem ou Word"
            onClick={() => setSelectedOption('yes')}
            isSelected={selectedOption === 'yes'}
          />

          <OptionCard
            icon={ThumbsDown}
            title="Não tenho"
            subtitle="Sem problemas, você pode continuar"
            onClick={() => setSelectedOption('no')}
            isSelected={selectedOption === 'no'}
          />
        </div>
      </div>

      {/* Usa o novo componente de botão */}
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