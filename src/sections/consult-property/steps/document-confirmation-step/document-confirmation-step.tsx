'use client'

import { useFormContext } from 'react-hook-form'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import OptionCard from '@/components/option-card/option-card.tsx'
import TextTitle from '@/components/text-title'
import Button from '@/components/button'
import type { FormContextWithSteps } from '@/sections/consult-property/types'

export function DocumentConfirmationStep() {
  const {
    setValue,
    handleNextStep,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext() as FormContextWithSteps

  const hasDocument = watch('hasDocument')

  async function handleSubmit() {
    const isValid = await trigger('hasDocument')

    if (isValid) {
      handleNextStep()
    }
  }

  function handleSelect(value: boolean) {
    setValue('hasDocument', value, { shouldValidate: true })
  }

  return (
    <div className="relative flex-1">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <TextTitle>Você tem o documento do imóvel?</TextTitle>

        <div className="grid auto-rows-fr gap-4">
          <OptionCard
            icon={ThumbsUp}
            title="Sim, eu tenho"
            subtitle="Aceitamos PDF, Imagem ou Word"
            onClick={() => handleSelect(true)}
            isSelected={hasDocument === true}
          />

          <OptionCard
            icon={ThumbsDown}
            title="Não tenho"
            subtitle="Sem problemas, você pode continuar"
            onClick={() => handleSelect(false)}
            isSelected={hasDocument === false}
          />
        </div>

        {errors.hasDocument && (
          <p className="mt-2 text-sm text-red-600">
            {String(errors.hasDocument.message)}
          </p>
        )}
      </div>

      <div
        className="
          fixed bottom-0 left-0 right-0 z-10 px-4 py-4
          md:static md:mt-6 md:p-0
        "
      >
        <Button
          onClick={handleSubmit}
          type="button"
          className="h-13 md:w-auto md:px-10"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}