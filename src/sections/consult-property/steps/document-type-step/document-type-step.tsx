'use client'
import { useEffect, useEffectEvent } from 'react'
import { useFormContext } from 'react-hook-form'
import { Users, FileText, FileSignature } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import OptionCard from '@/components/option-card/option-card.tsx'

type DocumentType = 'contract' | 'registration' | 'deed'

export function DocumentTypeStep() {
  const { setValue, handleNextStep } = useFormContext() as FormContextWithSteps

  function handleSelect(value: DocumentType) {
    setValue('documentType', value, { shouldValidate: true })
    handleNextStep()
  }

  const resetValue = useEffectEvent(() =>
    setValue('hasDocument', undefined, { shouldValidate: true }),
  )

  useEffect(() => {
    resetValue()
  }, [])

  return (
    <div className="relative flex-1 px-4 -mt-7">
      <div className="flex flex-col gap-5 pb-24 md:pb-0">
        <div className="flex flex-col gap-2">
          <TextTitle>Qual documento você tem?</TextTitle>
          <TextSubtitle>Selecione uma das opções abaixo</TextSubtitle>
        </div>

        <div className="grid auto-rows-fr gap-4">
          <OptionCard
            icon={Users}
            title="Contrato de compra e venda"
            subtitle="Acordo particular entre comprador e vendedor"
            onClick={() => handleSelect('contract')}
          />
          <OptionCard
            icon={FileText}
            title="Matrícula"
            subtitle="Documento principal do imóvel"
            onClick={() => handleSelect('registration')}
          />
          <OptionCard
            icon={FileSignature}
            title="Escritura"
            subtitle="Contrato oficial registrado no cartório"
            onClick={() => handleSelect('deed')}
          />
        </div>
      </div>
    </div>
  )
}
