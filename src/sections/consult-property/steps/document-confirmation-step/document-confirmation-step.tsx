'use client'
import { useEffectEvent } from 'react'
import { useFormContext } from 'react-hook-form'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import OptionCard from '@/components/option-card/option-card.tsx'
import TextTitle from '@/components/text-title'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import { useEffect } from 'react'

export function DocumentConfirmationStep() {
  const { setValue, handleNextStep, setStep, setHasDocument } =
    useFormContext() as FormContextWithSteps

  function handleSelect(value: boolean) {
    setValue('hasDocument', value, { shouldValidate: true })
    setHasDocument(true)
    handleNextStep()
    if (!value) {
      setValue('documentType', undefined)
      setValue('document', undefined)
      setValue('documentPreview', undefined)
      setStep(5)
      setHasDocument(false)
    }
  }

  const resetValue = useEffectEvent(() =>
    setValue('hasDocument', undefined, { shouldValidate: true }),
  )

  useEffect(() => {
    resetValue()
  }, [])

  return (
    <div className="relative flex-1 px-4 -mt-4">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <TextTitle>Você tem o documento do imóvel?</TextTitle>

        <div className="grid auto-rows-fr gap-4">
          <OptionCard
            icon={ThumbsUp}
            title="Sim, eu tenho"
            subtitle="Aceitamos PDF, Imagem ou Word"
            onClick={() => handleSelect(true)}
          />

          <OptionCard
            icon={ThumbsDown}
            title="Não tenho"
            subtitle="Sem problemas, você pode continuar"
            onClick={() => handleSelect(false)}
          />
        </div>
      </div>
    </div>
  )
}
