'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import OptionCard from '@/components/option-card/option-card.tsx'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
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
      <div className="flex flex-col gap-5 pb-32">
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

      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="w-full"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}