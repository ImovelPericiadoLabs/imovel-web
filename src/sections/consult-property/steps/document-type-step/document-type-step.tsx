'use client'

import { useFormContext } from 'react-hook-form'
import { Users, FileText, FileSignature } from 'lucide-react'
import TextTitle from '@/components/text-title'
import TextSubtitle from '@/components/text-subtitle'
import Button from '@/components/button'
import type { FormContextWithSteps } from '@/sections/consult-property/types'
import OptionCard from '@/components/option-card/option-card.tsx'

type DocumentType = 'contract' | 'registration' | 'deed'

export function DocumentTypeStep() {
  const {
    setValue,
    handleNextStep,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext() as FormContextWithSteps

  const documentType = watch('documentType')

  async function handleSubmit() {
    const isValid = await trigger('documentType')

    if (isValid) {
      handleNextStep()
    }
  }

  function handleSelect(value: DocumentType) {
    setValue('documentType', value, { shouldValidate: true })
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
            onClick={() => handleSelect('contract')}
            isSelected={documentType === 'contract'}
          />
          <OptionCard
            icon={FileText}
            title="Matrícula"
            subtitle="Documento principal do imóvel."
            onClick={() => handleSelect('registration')}
            isSelected={documentType === 'registration'}
          />
          <OptionCard
            icon={FileSignature}
            title="Escritura"
            subtitle="Contrato oficial registrado no cartório."
            onClick={() => handleSelect('deed')}
            isSelected={documentType === 'deed'}
          />
        </div>

        {errors.documentType && (
          <p className="mt-2 text-sm text-red-600">
            {String(errors.documentType.message)}
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